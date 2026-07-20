import { getGoogleSheetValues } from "../_helpers/googleSheets";

interface Env {
  GOOGLE_SPREADSHEET_ID: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL: string;
  GOOGLE_PRIVATE_KEY: string;
  MAX_TICKETS?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const {
      GOOGLE_SPREADSHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY,
      MAX_TICKETS,
    } = context.env;

    if (!GOOGLE_SPREADSHEET_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing Google Sheets configuration on server." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const maxTickets = parseInt(MAX_TICKETS || "30", 10);

    // Read the sheet. We assume column headers are in row 1.
    // Row content starts at A2.
    // We fetch columns A to D (Name, Email, Date, Status).
    const rows = await getGoogleSheetValues(
      {
        spreadsheetId: GOOGLE_SPREADSHEET_ID,
        serviceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: GOOGLE_PRIVATE_KEY,
      },
      "Sheet1!A2:E"
    );

    // Count rows where the payment status is successful
    // Assuming structure:
    // A: Name, B: Email, C: Purchase Date, D: Payment Status, E: Stripe Session ID (optional)
    // We check if Status (column index 3) is "successful" or "paid"
    const successfulTickets = rows.filter((row) => {
      const status = (row[3] || "").toLowerCase();
      return status === "successful" || status === "paid";
    });

    const soldCount = successfulTickets.length;
    const isSoldOut = soldCount >= maxTickets;

    return new Response(
      JSON.stringify({
        soldCount,
        maxTickets,
        isSoldOut,
        ticketsRemaining: Math.max(0, maxTickets - soldCount),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Failed to fetch event status." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
