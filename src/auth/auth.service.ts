import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { bcryptAdapter } from 'src/common/adapters/bycript.adapter';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(private readonly prisma: PrismaService) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const { password, ...userCreate } = createUserDto;

      const user = await this.prisma.user.create({
        data: {
          ...userCreate,
          password: bcryptAdapter.hash(password),
        },
      });
      this.logger.debug(user);

      // delete user.password;
      return {
        email: user.email,
        fullName: user.email,
        roles: user.roles,
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async login(loginUserDto: LoginDto) {
    try {
      const { password, email } = loginUserDto;

      const user = await this.prisma.user.findFirst({
        where: { email },
        select: { email: true, password: true },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales are not valid');
      }

      if (bcryptAdapter.compare(password, user.password)) {
        throw new UnauthorizedException('Credenciales are not valid');
      }
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  private handleDbErrors(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Has register value exist with unique value',
        );
      }
    }

    this.logger.error(error);
    throw new InternalServerErrorException('Please check server logs');
  }
}
