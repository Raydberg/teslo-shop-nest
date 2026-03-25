import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/common/prisma.service';
import { PaginationDto } from 'src/common/dtos/pagination.dto';
import { Product } from 'src/generated/prisma/client';
import { validate as isUUID } from 'uuid';
@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');
  constructor(private readonly prisma: PrismaService) {}
  async create(createProductDto: CreateProductDto) {
    try {
      const slug = createProductDto.slug
        ? this.normalizeSlug(createProductDto.slug)
        : this.normalizeSlug(createProductDto.name);

      const { images = [], ...productDetails } = createProductDto;
      const newProduct = await this.prisma.product.create({
        data: {
          ...productDetails,
          slug,
          images: {
            create: images.map((url) => ({ url })),
          },
        },
      });

      return { ...newProduct, images };
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      return await this.prisma.product.findMany({
        skip: offset,
        take: limit,
        //relaciones
        include: {
          images: true,
        },
      });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      let product: Product | null;
      if (isUUID(term)) {
        product = await this.prisma.product.findFirst({
          where: { id: term },
        });
      } else {
        product = await this.prisma.product.findFirst({
          where: {
            OR: [
              { slug: { equals: term, mode: 'insensitive' } },
              { name: { equals: term, mode: 'insensitive' } },
            ],
          },
        });
      }
      return product;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const productExit = await this.findOne(id);
      if (!productExit)
        throw new NotFoundException(`Product with id ${id} not found`);

      const data = { ...updateProductDto };

      if (data.slug) {
        data.slug = this.normalizeSlug(data.slug);
      } else if (data.name && productExit.name !== data.name) {
        data.slug = this.normalizeSlug(data.name);
      }

      // return await this.prisma.product.update({
      // where: { id },
      // data: { ...data, images: { create: images.map((url) => ({ url })) } },
      // });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.product.delete({
        where: { id },
      });
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: unknown): never {
    this.logger.error(error);
    throw new BadRequestException('Unexpected error , check server logs');
  }

  private normalizeSlug(value: string): string {
    return value.toLowerCase().trim().replaceAll(' ', '_').replaceAll("'", '');
  }
}
