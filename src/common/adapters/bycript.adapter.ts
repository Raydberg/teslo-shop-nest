import { compare, genSalt, hashSync } from 'bcrypt';

/**
 * Sync -> Muchos usaurio servidor lento
 */
export const bcryptAdapter = {
  hash: async (password: string) => {
    const salt = await genSalt(10);
    return hashSync(password, salt);
  },
  compare: async (password: string, hashed: string) => {
    return await compare(password, hashed);
  },
};
