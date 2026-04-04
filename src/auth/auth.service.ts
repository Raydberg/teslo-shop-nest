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
          password: await bcryptAdapter.hash(password),
        },
      });

      const slug = crypto.randomUUID();
      await this.prisma.refreshToken.create({
        data: {
          token: await bcryptAdapter.hash(slug),
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
        fullName: user.fullName,
        roles: user.roles,
        token: this.getJwtToken({ id: user.id }),
        refreshToken: slug,
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

      if (!user.isActive) {
        throw new UnauthorizedException('User is not active account');
      }
      if (!(await bcryptAdapter.compare(password, user.password))) {
        throw new UnauthorizedException('Credenciales are not valid');
      }

      const slug = crypto.randomUUID();
      await this.prisma.refreshToken.create({
        data: {
          token: await bcryptAdapter.hash(slug),
          userId: user.id,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      return {
        id: user.id,
        fullName: user.fullName,
        isActive: user.isActive,
        email: user.email,
        roles: user.roles,
        token: this.getJwtToken({ id: user.id }),
        refreshToken: slug,
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async refreshToken(
    refreshToken: string,
    userId: string,
    userAgent: string,
    ip: string,
  ) {
    const activeSessions = await this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
    });

    let validSessionId: string | null = null;

    for (const session of activeSessions) {
      const isMatch = await bcryptAdapter.compare(refreshToken, session.token);
      if (isMatch) {
        validSessionId = session.id;
        break;
      }
    }

    if (!validSessionId) {
      throw new UnauthorizedException('Inalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: validSessionId },
      data: {
        isRevoked: true,
      },
    });

    const newSlug = crypto.randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        token: await bcryptAdapter.hash(newSlug),
        userId: userId,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        userAgent: userAgent,
        ipAddress: ip,
      },
    });

    return {
      token: this.getJwtToken({ id: userId }),
      refreshToken: newSlug,
      id: userId,
    };
  }

  async logout(refreshToken: string, userId: string): Promise<void> {
    const activeSessions = await this.prisma.refreshToken.findMany({
      where: { userId, isRevoked: false },
    });

    let validSessionId: string | null = null;

    for (const session of activeSessions) {
      const isMatch = await bcryptAdapter.compare(refreshToken, session.token);
      if (isMatch) {
        validSessionId = session.id;
        break;
      }
    }
    if (!validSessionId) {
      throw new UnauthorizedException('Inalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: validSessionId },
      data: {
        isRevoked: true,
      },
    });
  }

  private getJwtToken(payload: JwtPayload): string {
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
