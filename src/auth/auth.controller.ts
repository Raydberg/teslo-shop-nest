import {
  Controller,
  Post,
  Body,
  Get,
  Res,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import type { Request, Response } from 'express';
import { generateCsrfToken } from 'src/config/csrf.config';
import { UserAuthResponseDto } from 'src/auth/dto/user-auth.dto';
import { plainToInstance } from 'class-transformer';
import type { User } from 'src/generated/prisma/client';

interface AuthResponse {
  user: UserAuthResponseDto;
  csrfToken: string;
}

@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) resp: Response,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const { user, accessToken, refreshToken } = await this.authService.register(
      createUserDto,
      req.headers['user-agent'] ?? '',
      req.ip ?? '',
    );
    this.setCookies(resp, accessToken, refreshToken);
    return this.createAuthResponse(req, resp, user);
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginDto,
    @Res({ passthrough: true }) resp: Response,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const { user, accessToken, refreshToken } = await this.authService.login(
      loginUserDto,
      req.headers['user-agent'] ?? '',
      req.ip ?? '', // Configuracion extra al usar proxy
    );
    this.setCookies(resp, accessToken, refreshToken);
    return this.createAuthResponse(req, resp, user);
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const csrfToken = generateCsrfToken(req, res);
    return { csrfToken };
  }

  @Get('check-status')
  async checkStatus(
    // @GetUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) resp: Response,
  ): Promise<AuthResponse> {
    const payload = req.cookies['access_token'] as string;
    const user = await this.authService.checkUserFromCookies(payload);
    if (!user) {
      const refreshCookie = req.cookies['refresh_cookie'] as string;
      if (!refreshCookie) {
        return this.createAuthResponse(req, resp, null);
      }
      const { user, accessToken, refreshToken } =
        await this.authService.refreshToken(
          refreshCookie,
          req.headers['user-agent'] ?? '',
          req.ip ?? '', // Configuracion extra al usar proxy
        );
      this.setCookies(resp, accessToken, refreshToken);
      return this.createAuthResponse(req, resp, user);
    }
    return this.createAuthResponse(req, resp, user);
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) resp: Response,
  ): Promise<AuthResponse> {
    const refreshCookie = req.cookies['refresh_cookie'] as string;
    if (!refreshCookie) {
      throw new UnauthorizedException('No session found');
    }

    const { user, accessToken, refreshToken } =
      await this.authService.refreshToken(
        refreshCookie,
        req.headers['user-agent'] ?? '',
        req.ip ?? '', // Configuracion extra al usar proxy
      );
    this.setCookies(resp, accessToken, refreshToken);
    return this.createAuthResponse(req, resp, user);
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const refreshToken = req.cookies['refresh_cookie'] as string;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
      resp.clearCookie('access_token', { path: '/' });
      resp.clearCookie('refresh_cookie', { path: '/' });
      resp.clearCookie('x-csrf-token', { path: '/' });
    }

    return { message: 'Logged out succesfuly' };
  }
  private setCookies(
    resp: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    resp.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 3600000, // 1 hora en milisegundos
      // secure:true //prod
    });

    resp.cookie('refresh_cookie', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax',
    });
  }

  private createAuthResponse(
    req: Request,
    resp: Response,
    user: User | null,
  ): AuthResponse {
    const safeUser = plainToInstance(UserAuthResponseDto, user, {
      excludeExtraneousValues: true,
    });
    return {
      user: safeUser,
      csrfToken: generateCsrfToken(req, resp),
    };
  }

  // @Get('private')
  // @UseGuards(AuthGuard())
  // testingPrivateRoute(
  //   @GetUser('email') user: SafeUser,
  //   @RawHeaders() raw: string[],
  // ) {
  //   // console.log(user);
  //   return {
  //     ok: true,
  //     message: 'Hola Mundo private',
  //     user,
  //     raw,
  //   };
  // }

  // @Get('private2')
  // // @SetMetadata('roles', ['ADMIN', 'USER'])
  // @RoleProtected(ValidRole.ADMIN)
  // @UseGuards(AuthGuard(), UserRoleGuard)
  // testingPrivateRoute2(@GetUser('email') user: SafeUser) {
  //   // console.log(user);
  //   return {
  //     ok: true,
  //     message: 'Hola Mundo private',
  //     user,
  //   };
  // }
  // /**
  //  *
  //  * @param user
  //  * @returns Solo para Admin
  //  */
  // @Get('private3')
  // @Auth(ValidRole.ADMIN)
  // testingPrivateRoute3(@GetUser('email') user: SafeUser) {
  //   return {
  //     ok: true,
  //     message: 'Hola Mundo private',
  //     user,
  //   };
  // }
  // /**
  //  *
  //  * @param user
  //  * @returns Para admin y users
  //  */
  // @Get('private3')
  // @Auth()
  // testingPrivateRoute4(@GetUser('email') user: SafeUser) {
  //   return {
  //     ok: true,
  //     message: 'Hola Mundo private',
  //     user,
  //   };
  // }
  // /**
  //  *
  //  * @param user
  //  * @returns Para solo users
  //  */
  // @Get('private5')
  // @Auth(ValidRole.USER)
  // testingPrivateRoute5(@GetUser('email') user: SafeUser) {
  //   return {
  //     ok: true,
  //     message: 'Hola Mundo private',
  //     user,
  //   };
  // }
}
