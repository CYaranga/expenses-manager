import * as jose from 'jose';

const GOOGLE_JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

export async function verifyGoogleToken(
  credential: string,
  clientId: string
): Promise<GoogleTokenPayload> {
  const JWKS = jose.createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

  const { payload } = await jose.jwtVerify(credential, JWKS, {
    audience: clientId,
    issuer: GOOGLE_ISSUERS,
  });

  if (!payload.email || !payload.sub) {
    throw new Error('Invalid Google token: missing required claims');
  }

  return {
    sub: payload.sub as string,
    email: payload.email as string,
    email_verified: payload.email_verified as boolean,
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
  };
}
