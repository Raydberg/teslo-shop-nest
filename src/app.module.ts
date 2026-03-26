import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ProductsModule,
    CommonModule,
    AuthModule,
    UserModule,
    CategoriesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
