import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createProductDto: CreateProductDto) {
    try {
      return this.prisma.product.create({
        data: createProductDto,
      });
    } catch (error) {
      throw new InternalServerErrorException(`${error}`);
    }
  }

  async findAll() {
    return this.prisma.product.findMany();
  }

  async findOne(id: string) {
    try {
      return await this.prisma.product.findFirst({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException(
        `Error find product with id ${id} - ${error}`,
      );
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      return await this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      throw new BadRequestException(
        `Imposible update product with id ${id} - ${error}`,
      );
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      throw new BadRequestException(
        `Error delete product with id ${id} - ${error}`,
      );
    }
  }
}
