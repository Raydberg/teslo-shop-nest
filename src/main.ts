import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { doubleCsrfProtection } from 'src/config/csrf.config';
import { swaggerConfig } from 'src/config/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const { documentFactory, customOptions } = swaggerConfig(app);
  SwaggerModule.setup('api', app, documentFactory, customOptions);

  app.use(cookieParser());
  app.use(doubleCsrfProtection);
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
