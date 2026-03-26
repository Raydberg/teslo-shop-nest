import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

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
  testingPrivateRoute(@Req() request: Express.Request) {
    console.log(request);
    return {
      ok: true,
      message: 'Hola Mundo private',
    };
  }
}
