import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { User } from 'src/generated/prisma/client';
import { PrismaService } from 'src/common/prisma.service';
import { UpdateRole } from 'src/user/interface/update-role.interface';

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');
  constructor(private readonly prisma: PrismaService) {}
  async getUser(user: Omit<User, 'password'>) {
    try {
      const userDB = await this.prisma.user.findFirst({
        where: { id: user.id },
        omit: { createdAt: true, updatedAt: true },
      });
      return userDB;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async findAllUser() {
    try {
      const users = await this.prisma.user.findMany({
        omit: { password: true },
      });
      return users;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async findUserById(userId: string) {
    try {
      const userDB = await this.prisma.user.findFirst({
        where: { id: userId },
      });

      if (!userDB) throw new InternalServerErrorException('User not found');

      return userDB;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async setRole(updateRole: UpdateRole) {
    try {
      const userDB = await this.findUserById(updateRole.userId);
      if (userDB.roles.length === 1 && userDB.roles.includes(updateRole.role)) {
        return userDB;
      }
      const updatedRoles = [updateRole.role];

      const updateUser = await this.prisma.user.update({
        where: { id: updateRole.userId },
        data: { roles: updatedRoles },
      });

      return updateUser;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async setStatus(userId: string) {
    try {
      const userDB = await this.findUserById(userId);
      const userUpdate = await this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: !userDB.isActive,
        },
      });

      return userUpdate;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: unknown): never {
    this.logger.error(error);
    throw new BadRequestException('Unexpected error , check server logs');
  }
}
