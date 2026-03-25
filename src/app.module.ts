import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot(), ProductsModule, CommonModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
