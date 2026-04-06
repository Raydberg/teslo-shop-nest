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
import { createHash256 } from 'src/config/sha-246';
import { Prisma } from 'src/generated/prisma/client';

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
          token: createHash256(slug),
          userId: user.id,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      // delete user.password;
      return {
        user,
        accessToken: this.getJwtToken({ id: user.id }),
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
          token: createHash256(slug),
          userId: user.id,
          expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          ipAddress: ip,
          userAgent: userAgent,
        },
      });

      return {
        user,
        accessToken: this.getJwtToken({ id: user.id }),
        refreshToken: slug,
      };
    } catch (error) {
      this.handleDbErrors(error);
    }
  }

  async refreshToken(refreshToken: string, userAgent: string, ip: string) {
    const activeSession = await this.prisma.refreshToken.findFirst({
      where: {
        token: createHash256(refreshToken),
        isRevoked: false,
        // Esto lo que dice es que el expiryDate sea mayor a la fecha de hoy
        expiryDate: { gt: new Date() },
      },
    });

    if (!activeSession) {
      throw new UnauthorizedException('ActiveSession Not Found');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: activeSession.userId },
    });

    if (!user) {
      throw new BadRequestException('User not found ');
    }

    await this.prisma.refreshToken.update({
      where: { id: activeSession.id },
      data: {
        isRevoked: true,
      },
    });

    const newSlug = crypto.randomUUID();

    await this.prisma.refreshToken.create({
      data: {
        token: createHash256(newSlug),
        userId: activeSession.userId,
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        userAgent: userAgent,
        ipAddress: ip,
      },
    });

    return {
      user,
      accessToken: this.getJwtToken({ id: activeSession.userId }),
      refreshToken: newSlug,
    };
  }

  async checkUserFromCookies(accessToken?: string) {
    if (!accessToken) return null;

    try {
      const payload = this.jwtService.verify<JwtPayload>(accessToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
      });
      return user && user.isActive ? user : null;
    } catch (error) {
      this.logger.error('Error', error);
      return null;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    const activeSession = await this.prisma.refreshToken.findFirst({
      where: { token: createHash256(refreshToken), isRevoked: false },
    });
    if (!activeSession) {
      throw new UnauthorizedException('Inalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: activeSession.id },
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
