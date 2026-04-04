import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Res,
  Req,
  Logger,
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
  ) {
    const { token, id, ...res } =
      await this.authService.register(createUserDto);
    resp.cookie('access_token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hora en milisegundos
      // secure:true //prod
    });
    resp.cookie('userId', id, {
      httpOnly: true,
    });

    return res;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginDto,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const { token, id, ...rest } = await this.authService.login(loginUserDto);
    resp.cookie('access_token', token, {
      httpOnly: true,
      maxAge: 3600000, // 1 hora en milisegundos
      // secure:true //prod
    });
    resp.cookie('userId', id, {
      httpOnly: true,
    });
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
