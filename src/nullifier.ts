import { createHash } from 'crypto';

export function generateNullifier(secret: string, context: string) {
  return createHash('sha256').update(secret + '|' + context).digest('hex');
}
