// JWT signing helper for RS256 in Web Crypto API
async function getGoogleAuthToken(serviceAccountEmail: string, privateKeyPem: string): Promise<string> {
  // Parse private key PEM
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  
  // Clean PEM: remove headers, footers, newlines, spaces, and quotes
  let pemContents = privateKeyPem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\\n/g, "")
    .replace(/\n/g, "")
    .replace(/\s/g, "")
    .replace(/["']/g, "");

  // Convert base64 to ArrayBuffer
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  
  // Import private key
  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    false,
    ["sign"]
  );

  // Create JWT Header & Payload
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const stringifyAndBase64Url = (obj: any) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const encodedHeader = stringifyAndBase64Url(header);
  const encodedPayload = stringifyAndBase64Url(payload);
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign JWT
  const messageBytes = new TextEncoder().encode(unsignedToken);
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    messageBytes
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binarySignature = "";
  for (let i = 0; i < signatureBytes.byteLength; i++) {
    binarySignature += String.fromCharCode(signatureBytes[i]);
  }
  const encodedSignature = btoa(binarySignature)
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const signedJwt = `${unsignedToken}.${encodedSignature}`;

  // Request OAuth access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${signedJwt}`,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to get Google OAuth token: ${errText}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

/**
 * Appends a row to a specified range in a Google Sheet.
 */
export async function appendRowToGoogleSheet(
  config: GoogleSheetsConfig,
  range: string,
  rowValues: any[]
): Promise<any> {
  const token = await getGoogleAuthToken(config.serviceAccountEmail, config.privateKey);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append row to Google Sheet: ${errText}`);
  }

  return response.json();
}

/**
 * Reads values from a specified range in a Google Sheet.
 */
export async function getGoogleSheetValues(
  config: GoogleSheetsConfig,
  range: string
): Promise<any[][]> {
  const token = await getGoogleAuthToken(config.serviceAccountEmail, config.privateKey);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // If sheet is empty or not found, handle gracefully
    if (response.status === 404) {
      return [];
    }
    const errText = await response.text();
    throw new Error(`Failed to read from Google Sheet: ${errText}`);
  }

  const data = (await response.json()) as { values?: any[][] };
  return data.values || [];
}
