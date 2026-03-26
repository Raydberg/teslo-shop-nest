import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from 'src/auth/interfaces/jwt-payload.interface';
import { PrismaService } from 'src/common/prisma.service';
import { User } from 'src/generated/prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException('Token is not valid');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive, talk with an admin');
    }

    return user;
  }
}
