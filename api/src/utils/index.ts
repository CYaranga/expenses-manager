export * from './jwt';
export * from './invite-code';
export * from './google-auth';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
