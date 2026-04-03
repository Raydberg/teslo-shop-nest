import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from 'src/common/prisma.service';
import { CloudflareService } from 'src/common/cloudflare.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, CloudflareService, ConfigService],
})
export class ProductsModule {}
