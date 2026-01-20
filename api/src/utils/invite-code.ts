const INVITE_CODE_LENGTH = 8;
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes ambiguous chars: I, O, 0, 1

export function generateInviteCode(): string {
  const array = crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH));
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += CHARSET[array[i] % CHARSET.length];
  }
  return code;
}
