import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  Req,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import type { User } from 'src/generated/prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { RawHeaders } from 'src/auth/decorators/raw-headers.decorator';
import { UserRoleGuard } from 'src/auth/guards/user-role.guard';
import { RoleProtected } from 'src/auth/decorators/role-protected.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { Auth } from 'src/auth/decorators/auth.decorator';
import type { Request, Response } from 'express';
import { generateCsrfToken } from 'src/config/csrf.config';

export type SafeUser = Omit<User, 'password'>;

@Controller('auth')
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) resp: Response,
    @Req() req: Request,
  ) {
    const { token, id, refreshToken, ...res } = await this.authService.register(
      createUserDto,
      req.headers['user-agent'] ?? '',
      req.ip ?? '',
    );
    this.setCookies(resp, token, refreshToken, id);
    return res;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginDto,
    @Res({ passthrough: true }) resp: Response,
    @Req() req: Request,
  ) {
    const { token, id, refreshToken, ...rest } = await this.authService.login(
      loginUserDto,
      req.headers['user-agent'] ?? '',
      req.ip ?? '', // Configuracion extra al usar proxy
    );
    this.setCookies(resp, token, refreshToken, id);
    return { id, ...rest };
  }

  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = generateCsrfToken(req, res);
    this.logger.debug('Token', token);
    return { token };
  }

  @UseGuards(AuthGuard())
  @Get('check-status')
  checkStatus(
    @GetUser() user: SafeUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = generateCsrfToken(req, res);

    return { user, token };
  }

  @Post('refresh')
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const refreshCookie = req.cookies['refresh_cookie'] as string;
    const userId = req.cookies.userId as string;

    if (!refreshCookie || !userId) {
      throw new UnauthorizedException('No session found');
    }

    const { token, refreshToken, id } = await this.authService.refreshToken(
      refreshCookie,
      userId,
      req.headers['user-agent'] ?? '',
      req.ip ?? '', // Configuracion extra al usar proxy
    );
    this.setCookies(resp, token, refreshToken, id);
    return { status: 'Refreshed' };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const refreshToken = req.cookies['refresh_cookie'] as string;
    const userId = req.cookies.userId as string;

    if (refreshToken && userId) {
      await this.authService.logout(refreshToken, userId);
      resp.clearCookie('access_token', { path: '/' });
      resp.clearCookie('userId', { path: '/' });
      resp.clearCookie('refresh_cookie', { path: '/' });
      resp.clearCookie('x-csrf-token', { path: '/' });
    }

    return { message: 'Logged out succesfuly' };
  }
  private setCookies(
    resp: Response,
    token: string,
    refreshToken: string,
    userId: string,
  ) {
    resp.cookie('access_token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hora en milisegundos
      // secure:true //prod
    });
    resp.cookie('userId', userId, {
      httpOnly: true,
    });
    resp.cookie('refresh_cookie', refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
      sameSite: 'lax',
    });
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(
    @GetUser('email') user: SafeUser,
    @RawHeaders() raw: string[],
  ) {
    // console.log(user);
    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
      raw,
    };
  }

  @Get('private2')
  // @SetMetadata('roles', ['ADMIN', 'USER'])
  @RoleProtected(ValidRole.ADMIN)
  @UseGuards(AuthGuard(), UserRoleGuard)
  testingPrivateRoute2(@GetUser('email') user: SafeUser) {
    // console.log(user);
    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
    };
  }
  /**
   *
   * @param user
   * @returns Solo para Admin
   */
  @Get('private3')
  @Auth(ValidRole.ADMIN)
  testingPrivateRoute3(@GetUser('email') user: SafeUser) {
    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
    };
  }
  /**
   *
   * @param user
   * @returns Para admin y users
   */
  @Get('private3')
  @Auth()
  testingPrivateRoute4(@GetUser('email') user: SafeUser) {
    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
    };
  }
  /**
   *
   * @param user
   * @returns Para solo users
   */
  @Get('private5')
  @Auth(ValidRole.USER)
  testingPrivateRoute5(@GetUser('email') user: SafeUser) {
    return {
      ok: true,
      message: 'Hola Mundo private',
      user,
    };
  }
}
