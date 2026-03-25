import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name?: string;
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;
  @IsString()
  @IsOptional()
  description?: string;
  @IsOptional()
  @IsString()
  slug?: string;

  @IsNumber()
  @IsPositive()
  @MinLength(1)
  @IsOptional()
  stock?: number;
  @IsString({ each: true })
  @IsArray()
  sizes: string[];

  @IsIn(['MEN', 'WOMEN'])
  gender: 'MEN' | 'WOMEN';
}
