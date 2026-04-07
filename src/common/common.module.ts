import { PrismaClientExceptionFilterFilter } from './filters/prisma-client-exception-filter.filter';
import { PrismaService } from './prisma.service';
import { Module } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [],
  providers: [
    PrismaClientExceptionFilterFilter,
    PrismaService,
    CloudflareService,
    ConfigService,
  ],
  imports: [ConfigModule],
})
export class CommonModule {}
