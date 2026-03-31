import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/common/prisma.service';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger('CategoryService');
  constructor(private readonly prisma: PrismaService) {}
  async create(createCategoryDto: CreateCategoryDto) {
    const categorySlug = createCategoryDto.slug
      ? this.normalizeSlug(createCategoryDto.slug)
      : this.normalizeSlug(createCategoryDto.name);

    try {
      const categoryDB = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          slug: categorySlug,
        },
      });
      return categoryDB;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async findAll() {
    try {
      const categoriesDB = await this.prisma.category.findMany({
        omit: { updatedAt: true, createdAt: true },
      });
      return categoriesDB;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async findOne(id: string) {
    try {
      const categoryDB = await this.prisma.category.findFirst({
        where: { id },
        omit: { createdAt: true, updatedAt: true },
      });

      if (!categoryDB)
        throw new BadRequestException(`Category with id ${id} not found`);
      return categoryDB;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      await this.findOne(id);
      const categoryUpdate = await this.prisma.category.update({
        where: { id },
        data: {
          ...updateCategoryDto,
          updatedAt: Date.now().toString(),
        },
      });
      return categoryUpdate;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id);
      const categoryDelete = await this.prisma.category.delete({
        where: { id },
      });
      return categoryDelete;
    } catch (error) {
      this.logger.error(error);
      this.handleExceptions(error);
    }
  }
  private handleExceptions(error: unknown): never {
    this.logger.error(error);
    throw new BadRequestException('Unexpected error , check server logs');
  }
  private normalizeSlug(value: string): string | undefined {
    if (!value) return;
    return value.toLowerCase().trim().replaceAll(' ', '_').replaceAll("'", '');
  }
}
