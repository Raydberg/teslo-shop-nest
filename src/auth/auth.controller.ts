import { Controller, Post, Body, Get, UseGuards, Res } from '@nestjs/common';
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
import type { Response } from 'express';

export type SafeUser = Omit<User, 'password'>;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const { token, ...res } = await this.authService.register(createUserDto);
    resp.cookie('access_token', token);
    return res;
  }

  @Post('login')
  async login(
    @Body() loginUserDto: LoginDto,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const { token, ...rest } = await this.authService.login(loginUserDto);
    resp.cookie('access_token', token);
    return rest;
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
