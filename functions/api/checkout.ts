import { getGoogleSheetValues } from "../_helpers/googleSheets";

interface Env {
  STRIPE_SECRET_KEY: string;
  GOOGLE_SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  MAX_TICKETS?: string;
  EVENT_NAME?: string;
  TICKET_PRICE_HUF?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request } = context;
    const body = (await request.json()) as { name?: string; email?: string };
    const name = body.name?.trim();
    const email = body.email?.trim();

    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Kérjük, adja meg a nevét és az e-mail címét!" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const {
      STRIPE_SECRET_KEY,
      GOOGLE_SPREADSHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      MAX_TICKETS,
      EVENT_NAME = "OHANA",
      TICKET_PRICE_HUF = "18000",
    } = context.env;

    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: "Hiányzó Stripe konfiguráció a szerveren." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Double check ticket availability before redirecting to Stripe
    const maxTickets = parseInt(MAX_TICKETS || "30", 10);
    let soldCount = 0;

    if (GOOGLE_SPREADSHEET_ID && GOOGLE_SERVICE_ACCOUNT_EMAIL && GOOGLE_PRIVATE_KEY) {
      try {
        const rows = await getGoogleSheetValues(
          {
            spreadsheetId: GOOGLE_SPREADSHEET_ID,
            serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
            privateKey: GOOGLE_PRIVATE_KEY,
          },
          "Sheet1!A2:E"
        );
        const successfulTickets = rows.filter((row) => {
          const status = (row[3] || "").toLowerCase();
          return status === "successful" || status === "paid";
        });
        soldCount = successfulTickets.length;
      } catch (err) {
        console.error("Error checking ticket count in checkout:", err);
        // Fallback: we don't block the purchase if Sheets is temporarily down,
        // but it's safer to alert in logs.
      }
    }

    if (soldCount >= maxTickets) {
      return new Response(
        JSON.stringify({ error: "Sajnáljuk, az esemény megtelt, a jegyek elfogytak!" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Generate URLs for Stripe Redirect
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}?cancel=true`;

    // 3. Create Stripe Checkout Session using REST API (lightweight fetch)
    const priceAmount = parseInt(TICKET_PRICE_HUF, 10);

    const stripeParams = new URLSearchParams();
    stripeParams.append("payment_method_types[0]", "card");
    stripeParams.append("mode", "payment");
    stripeParams.append("success_url", successUrl);
    stripeParams.append("cancel_url", cancelUrl);
    stripeParams.append("customer_email", email);
    stripeParams.append("line_items[0][price_data][currency]", "huf");
    stripeParams.append("line_items[0][price_data][product_data][name]", EVENT_NAME);
    stripeParams.append("line_items[0][price_data][unit_amount]", (priceAmount * 100).toString()); // HUF in cents/fillér is HUF * 100 for Stripe
    stripeParams.append("line_items[0][quantity]", "1");
    stripeParams.append("metadata[name]", name);
    stripeParams.append("metadata[email]", email);
    
    // We can also allow automatic payment methods like Google Pay/Apple Pay or local methods
    stripeParams.append("payment_method_collection", "always");

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeParams.toString(),
    });

    if (!stripeResponse.ok) {
      const errText = await stripeResponse.text();
      console.error("Stripe error response:", errText);
      return new Response(
        JSON.stringify({ error: "Nem sikerült elindítani a fizetést. Próbálja újra később!" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = (await stripeResponse.json()) as { url: string };

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Belső szerverhiba történt." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
