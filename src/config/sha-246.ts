import { createHash } from 'node:crypto';
export const createHash256 = (token: string) => {
  return createHash('sha256').update(token).digest('hex');
};
