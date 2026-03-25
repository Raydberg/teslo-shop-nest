import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  //Transformar
  @Type(() => Number) //enabledImplicitConversion:true
  limit?: number;
  @IsOptional()
  @IsNumber()
  @Type(() => Number) //enabledImplicitConversion:true
  offset?: number;
}
