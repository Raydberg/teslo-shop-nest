import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { bcryptAdapter } from 'src/common/adapters/bycript.adapter';
import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from 'src/generated/prisma/client';

// interface AuthResponse {}

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto, userAgent: string, ip: string) {
    try {
      const { password, email, ...userCreate } = createUserDto;

      const user = await this.prisma.user.create({
        data: {
          ...userCreate,
          email: email.toLocaleLowerCase().trim(),
          password: bcryptAdapter.hash(password),
        },
      });

      const slug = crypto.randomUUID();
      const { token } = await this.prisma.refreshToken.create({
        data: {
          token: bcryptAdapter.hash(slug),
          userId: user.id,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      // delete user.password;
      return {
        id: user.id,
        email: user.email,
        fullName: user.email,
        roles: user.roles,
        token: this.getJwtToken({ id: user.id }),
        refreshToken: token,
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async login(loginUserDto: LoginDto, userAgent: string, ip: string) {
    try {
      const { password, email } = loginUserDto;

      const user = await this.prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          roles: true,
          fullName: true,
          isActive: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Credenciales are not valid');
      }

      if (!bcryptAdapter.compare(password, user.password)) {
        throw new UnauthorizedException('Credenciales are not valid');
      }

      const slug = crypto.randomUUID();
      const { token } = await this.prisma.refreshToken.create({
        data: {
          token: bcryptAdapter.hash(slug),
          userId: user.id,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          ipAddress: ip,
          userAgent: userAgent,
        },
      });
      this.logger.debug(token);

      return {
        id: user.id,
        fullName: user.fullName,
        isActive: user.isActive,
        email: user.email,
        roles: user.roles,
        token: this.getJwtToken({ id: user.id }),
        refreshToken: token,
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  // checkStatus() {}

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
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
