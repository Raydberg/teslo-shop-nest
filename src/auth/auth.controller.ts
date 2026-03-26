import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
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

type SafeUser = Omit<User, 'password'>;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginDto) {
    return this.authService.login(loginUserDto);
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
}
