import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/generated/prisma/client';
import { ApiResponse } from '@nestjs/swagger';
import { CloudflareService } from 'src/common/cloudflare.service';
import { ImageMetadata } from 'src/products/interfaces/image-metadata.interface';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  @Post()
  // @ApiResponse({ status: 201, description: 'Product was created' , type })
  @ApiResponse({ status: 400, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden token realed' })
  create(
    @Body() createProductDto: CreateProductDto,
    // @GetUser() user: Omit<User, 'password'>,
  ) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.productsService.findOne(term);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post('signed-url')
  getUploadUrl(@Body('imageMetadata') imageMetadata: ImageMetadata[]) {
    console.log('Controller Image', imageMetadata);
    return this.cloudflareService.getUploadUrl(imageMetadata);
  }
}
