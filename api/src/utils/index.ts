export * from './password';
export * from './jwt';
export * from './invite-code';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
