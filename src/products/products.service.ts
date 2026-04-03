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
import { Product, ProductImage, User } from 'src/generated/prisma/client';
import { validate as isUUID } from 'uuid';
import { CloudflareService } from 'src/common/cloudflare.service';

type ProductWithImages = Product & { images: ProductImage[] };

@Injectable()
export class ProductsService {
  private readonly logger = new Logger('ProductService');
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudflareService: CloudflareService,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    // user: Omit<User, 'password'>,
  ) {
    try {
      this.logger.debug(createProductDto);
      const slug = createProductDto.slug
        ? this.normalizeSlug(createProductDto.slug)
        : this.normalizeSlug(createProductDto.name);

      const { images = [], ...productDetails } = createProductDto;
      const newProduct = await this.prisma.product.create({
        data: {
          ...productDetails,
          slug,
          images: {
            create: images.map((key) => ({ url: key })),
          },
          user: {
            connect: { id: '6fbdd365-0d72-4aa3-a554-d3235ee4e83d' },
          },
        },
        include: {
          images: true,
        },
      });

      // return await this.withSignedImageUrls(newProduct);
      return newProduct;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      const products = await this.prisma.product.findMany({
        skip: offset,
        take: limit,
        //relaciones
        include: {
          images: true,
        },
      });

      return await Promise.all(
        products.map((product) => this.withSignedImageUrls(product)),
      );
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findOne(term: string) {
    try {
      const product = await this.findProductEntity(term);
      if (!product) return null;

      return await this.withSignedImageUrls(product);
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    try {
      const productExit = await this.findProductEntity(id);
      if (!productExit)
        throw new NotFoundException(`Product with id ${id} not found`);

      const data = { ...updateProductDto };

      if (data.slug) {
        data.slug = this.normalizeSlug(data.slug);
      } else if (data.name && productExit.name !== data.name) {
        data.slug = this.normalizeSlug(data.name);
      }
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

  private async findProductEntity(
    term: string,
  ): Promise<ProductWithImages | null> {
    if (isUUID(term)) {
      return await this.prisma.product.findFirst({
        where: { id: term },
        include: {
          images: true,
        },
      });
    }

    return await this.prisma.product.findFirst({
      where: {
        OR: [
          { slug: { equals: term, mode: 'insensitive' } },
          { name: { equals: term, mode: 'insensitive' } },
        ],
      },
      include: {
        images: true,
      },
    });
  }

  private async withSignedImageUrls(product: ProductWithImages) {
    const images = await Promise.all(
      product.images.map((image) =>
        this.cloudflareService.getDownloadUrl(image.url),
      ),
    );

    return {
      ...product,
      images,
    };
  }
}
