import * as jose from 'jose';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export async function generateAccessToken(
  payload: Omit<TokenPayload, 'type'>,
  secret: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return await new jose.SignJWT({ ...payload, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(secretKey);
}

export async function generateRefreshToken(
  payload: Omit<TokenPayload, 'type'>,
  secret: string
): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return await new jose.SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<TokenPayload | null> {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretKey);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

export function getRefreshTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}
