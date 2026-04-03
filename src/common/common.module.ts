import { PrismaService } from './prisma.service';
import { Module } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [],
  providers: [PrismaService, CloudflareService, ConfigService],
  imports: [ConfigModule],
})
export class CommonModule {}
