import { User } from 'src/generated/prisma/client';
import { Role } from 'src/generated/prisma/enums';

export interface UpdateRole {
  role: Role;
  userId: User['id'];
}
