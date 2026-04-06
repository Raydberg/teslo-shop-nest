import { Expose } from 'class-transformer';

export class UserAuthResponseDto {
  @Expose() id!: string;
  @Expose() email!: string;
  @Expose() fullName!: string;
  @Expose() roles!: string[];
  @Expose() isActive!: boolean;
  //Lo que no tenga expose sera ignorado por nestjs
}
