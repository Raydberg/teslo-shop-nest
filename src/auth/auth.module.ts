import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/common/prisma.service';
import { AuthService } from 'src/auth/auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/strategies/jwt,strategy';
@Module({
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, PrismaService, ConfigService],
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // console.log('Jwt secret de process', process.env.JWT_SECRET);
        // console.log(
        //   'Jwt secret config module',
        //   configService.get('JWT_SECRET'),
        // );
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '2h',
            algorithm: 'HS256',
          },
        };
      },
    }),
    // JwtModule.register({
    //   secret: process.env.JWT_SECRET,
    //   signOptions: {
    //     expiresIn: '2h',
    //     algorithm: 'HS256',
    //   },
    // }),
  ],
  exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
