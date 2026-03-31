import {
  Controller,
  Get,
  Body,
  Patch,
  ParseUUIDPipe,
  Param,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/generated/prisma/client';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import type { UpdateRole } from 'src/user/interface/update-role.interface';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth()
  getUser(@GetUser() user: Omit<User, 'password'>) {
    return this.userService.getUser(user);
  }

  @Get('all')
  @Auth(ValidRole.ADMIN)
  findAllUsers() {
    return this.userService.findAllUser();
  }

  @Patch('role')
  @Auth(ValidRole.ADMIN)
  setRole(@Body() params: UpdateRole) {
    return this.userService.setRole(params);
  }

  @Patch('status')
  @Auth(ValidRole.ADMIN)
  setStatus(@Body('userId') userId: string) {
    return this.userService.setStatus(userId);
  }

  @Get(':userId')
  @Auth()
  getUserById(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userService.findUserById(userId);
  }
}
