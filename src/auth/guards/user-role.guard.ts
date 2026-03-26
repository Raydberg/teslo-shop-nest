import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators/role-protected.decorator';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly refector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('UseRoleGuard');

    const validRoles: string[] = this.refector.get(
      META_ROLES,
      context.getHandler(),
    );
    if (!validRoles) return true;
    if (validRoles.length === 0) return true;
    const req = context.switchToHttp().getRequest<Request & { user?: User }>();
    const user = req.user;

    if (!user) {
      throw new BadRequestException('User not found ');
    }

    for (const role of user.roles) {
      if (validRoles.includes(role)) {
        return true;
      }
    }

    throw new ForbiddenException(`User ${user.fullName} need a valid role`);
  }
}
