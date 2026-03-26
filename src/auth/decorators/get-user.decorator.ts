import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/generated/prisma/client';

type SafeUser = Omit<User, 'password'>;
type UserProperty = keyof SafeUser;

export const GetUser = createParamDecorator(
  (
    data: UserProperty | undefined,
    ctx: ExecutionContext,
  ): SafeUser | SafeUser[UserProperty] => {
    const req = ctx.switchToHttp().getRequest<Request & { user?: User }>();
    const user = req.user;

    // console.log

    if (!user) {
      throw new InternalServerErrorException('User not found in request');
    }

    const { password, ...safeUser } = user;
    void password;

    return data ? safeUser[data] : safeUser;
  },
);
