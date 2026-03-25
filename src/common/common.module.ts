import { PrismaService } from './prisma.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [],
  providers: [PrismaService],
})
export class CommonModule {}
