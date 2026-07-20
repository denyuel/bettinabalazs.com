import { appendRowToGoogleSheet } from "../_helpers/googleSheets";
import { verifyStripeSignature } from "../_helpers/stripeSignature";

interface Env {
  STRIPE_WEBHOOK_SECRET?: string;
  GOOGLE_SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  EVENT_NAME?: string;
  EVENT_DATE?: string;
  EVENT_LOCATION?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const {
    STRIPE_WEBHOOK_SECRET,
    GOOGLE_SPREADSHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY,
    RESEND_API_KEY,
    EMAIL_FROM = "Esemény Szervező <no-reply@resend.dev>",
    EVENT_NAME = "Esemény Jegy",
    EVENT_DATE = "Hamarosan...",
    EVENT_LOCATION = "Hamarosan...",
  } = context.env;

  const rawBody = await request.text();
  const signatureHeader = request.headers.get("Stripe-Signature");

  // 1. Verify Stripe Webhook Signature if secret is configured
  if (STRIPE_WEBHOOK_SECRET && signatureHeader) {
    const isValid = await verifyStripeSignature(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      console.warn("Invalid Stripe signature on webhook.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (STRIPE_WEBHOOK_SECRET) {
    console.warn("Missing Stripe-Signature header while Stripe webhook secret is configured.");
    return new Response(JSON.stringify({ error: "Missing signature header" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    console.info("Stripe Webhook Secret not configured, bypassing signature verification.");
  }

  // 2. Parse payload
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType = payload.type;
  if (eventType !== "checkout.session.completed") {
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const session = payload.data?.object;
  if (!session) {
    return new Response(JSON.stringify({ error: "Missing session data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Ensure payment is successful (could be paid, or for trial etc., but we check if paid)
  if (session.payment_status !== "paid") {
    console.info(`Session payment status is ${session.payment_status}, not writing registry.`);
    return new Response(JSON.stringify({ received: true, status: session.payment_status }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 3. Extract buyer details
  const name = session.metadata?.name || session.customer_details?.name || "Vendég";
  const email = session.metadata?.email || session.customer_details?.email;
  const sessionId = session.id;

  if (!email) {
    console.error("No customer email found in webhook session.");
    return new Response(JSON.stringify({ error: "No email found in session" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Format Hungarian timezone or simple UTC date string
  // Let's do simple ISO-like string in UTC+2 (Hungary)
  const dateOptions: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const purchaseDate = new Intl.DateTimeFormat("hu-HU", dateOptions).format(new Date());

  // 4. Save to Google Sheets
  if (GOOGLE_SPREADSHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
    try {
      await appendRowToGoogleSheet(
        {
          spreadsheetId: GOOGLE_SPREADSHEET_ID,
          serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
          privateKey: GOOGLE_PRIVATE_KEY,
        },
        "Sheet1!A2",
        [name, email, purchaseDate, "successful", sessionId]
      );
      console.log(`Successfully added registry to Google Sheets: ${email}`);
    } catch (err) {
      console.error("Error writing registry to Google Sheet:", err);
      // We do not fail the webhook, because payment was already successful!
      // We should still try to send the email and log the failure.
    }
  } else {
    console.warn("Google Sheets credentials are not fully configured in environment.");
  }

  // 5. Send Confirmation Email via Resend
  if (RESEND_API_KEY) {
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; color: #333;">
          <h2 style="color: #6366f1; text-align: center;">Köszönjük a vásárlást!</h2>
          <p>Kedves <strong>${name}</strong>,</p>
          <p>Sikeresen megvásároltad a jegyedet az alábbi eseményre:</p>
          
          <div style="background-color: #f9fafb; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #111827;">${EVENT_NAME}</h3>
            <p style="margin: 5px 0;"><strong>Időpont:</strong> ${EVENT_DATE}</p>
            <p style="margin: 5px 0;"><strong>Helyszín:</strong> ${EVENT_LOCATION}</p>
            <p style="margin: 5px 0;"><strong>Jegyazonosító:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 0.9em;">${sessionId}</code></p>
          </div>
          
          <h4 style="margin: 20px 0 10px 0; color: #111827;">Fontos tudnivalók:</h4>
          <ul style="padding-left: 20px; line-height: 1.6;">
            <li><strong>Kapunyitás:</strong> Kérjük, érkezz legalább 15 perccel a kezdés előtt.</li>
            <li><strong>Parkolás:</strong> A helyszín környezetében ingyenes/fizetős parkolási lehetőség áll rendelkezésre.</li>
            <li><strong>Belépés:</strong> Belépéskor elegendő bemutatnod ezt az e-mailt a telefonodon.</li>
          </ul>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 30px 0;" />
          <p style="font-size: 0.85em; color: #6b7280; text-align: center;">
            Ez egy automatikus visszaigazoló e-mail, kérjük, ne válaszolj rá. Találkozunk az eseményen!
          </p>
        </div>
      `;

      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [email],
          subject: `Sikeres jegyvásárlás - ${EVENT_NAME}`,
          html: emailHtml,
        }),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error("Resend API error response:", errText);
      } else {
        console.log(`Confirmation email sent successfully to ${email}`);
      }
    } catch (err) {
      console.error("Error sending confirmation email via Resend:", err);
    }
  } else {
    console.warn("Resend API Key is not configured, skipping email delivery.");
  }

  return new Response(JSON.stringify({ received: true, processed: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
