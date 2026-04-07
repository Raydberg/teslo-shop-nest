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

    const categoryDB = await this.prisma.category.create({
      data: {
        name: createCategoryDto.name,
        slug: categorySlug,
      },
    });
    // if()
    return categoryDB;
  }

  async findAll() {
    const categoriesDB = await this.prisma.category.findMany({
      omit: { updatedAt: true, createdAt: true },
    });
    return categoriesDB;
  }

  async findOne(id: string) {
    const categoryDB = await this.prisma.category.findFirst({
      where: { id },
      omit: { createdAt: true, updatedAt: true },
    });

    if (!categoryDB)
      throw new BadRequestException(`Category with id ${id} not found`);
    return categoryDB;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(id);
    const categoryUpdate = await this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        updatedAt: Date.now().toString(),
      },
    });
    return categoryUpdate;
  }

  async remove(id: string) {
    await this.findOne(id);
    const categoryDelete = await this.prisma.category.delete({
      where: { id },
    });
    return categoryDelete;
  }

  private normalizeSlug(value: string): string | undefined {
    if (!value) return;
    return value.toLowerCase().trim().replaceAll(' ', '_').replaceAll("'", '');
  }
}
