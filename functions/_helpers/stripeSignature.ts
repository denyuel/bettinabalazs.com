/**
 * Verifies the Stripe Webhook signature using Web Crypto API.
 */
export async function verifyStripeSignature(
  bodyText: string,
  signatureHeader: string,
  webhookSecret: string
): Promise<boolean> {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",");
  let timestamp = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, val] = part.split("=");
    if (key?.trim() === "t") timestamp = val?.trim();
    else if (key?.trim() === "v1") signatures.push(val?.trim());
  }

  if (!timestamp || signatures.length === 0) return false;

  // Stripe signature payload format: t.body
  const signedPayload = `${timestamp}.${bodyText}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(webhookSecret);
  const messageData = encoder.encode(signedPayload);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"]
  );

  const sigBuffer = await crypto.subtle.sign("HMAC", key, messageData);
  const sigBytes = new Uint8Array(sigBuffer);
  const hexSignature = Array.from(sigBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return signatures.includes(hexSignature);
}
