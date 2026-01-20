// Password hashing using Web Crypto API (compatible with Cloudflare Workers)
const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hash = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_LENGTH * 8
  );

  const hashArray = new Uint8Array(hash);
  const combined = new Uint8Array(SALT_LENGTH + KEY_LENGTH);
  combined.set(salt);
  combined.set(hashArray, SALT_LENGTH);

  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHashBytes = combined.slice(SALT_LENGTH);

    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      passwordKey,
      KEY_LENGTH * 8
    );

    const hashArray = new Uint8Array(hash);

    if (hashArray.length !== storedHashBytes.length) {
      return false;
    }

    let match = true;
    for (let i = 0; i < hashArray.length; i++) {
      if (hashArray[i] !== storedHashBytes[i]) {
        match = false;
      }
    }

    return match;
  } catch {
    return false;
  }
}
