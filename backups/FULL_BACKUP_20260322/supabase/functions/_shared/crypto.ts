export async function encryptToken(text: string): Promise<string> {
  const password = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!password) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is missing.");
  }
  
  // Create an AES-GCM key derived from the password via PBKDF2
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Use a static salt purely for derivation to ensure the key is 256-bit (AES-256)
  const salt = encoder.encode("sparkle-content-co-salt"); 
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // Generate an Initialization Vector (IV)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedBuf = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  // Combine IV and cipher text and base64 encode
  const combined = new Uint8Array(iv.length + encryptedBuf.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuf), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptToken(encryptedBase64: string): Promise<string> {
  const password = Deno.env.get("TOKEN_ENCRYPTION_KEY");
  if (!password) {
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is missing.");
  }

  // Same key derivation as above
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = encoder.encode("sparkle-content-co-salt");
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // Decode Base64 string to original buffer
  const binaryStr = atob(encryptedBase64);
  const combined = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    combined[i] = binaryStr.charCodeAt(i);
  }

  // Extract IV and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  try {
    const decryptedBuf = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decryptedBuf);
  } catch (e) {
    console.error("Decryption failed. This might happen if the token is completely unencrypted plain text.", e);
    // If decryption fails, we assume it's an old plaintext token we need to gracefully handle
    return encryptedBase64; 
  }
}
