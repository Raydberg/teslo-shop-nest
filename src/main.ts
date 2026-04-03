import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
// import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('API NestTS')
    .setDescription('The api for learning Nestjs')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const customOptions: SwaggerCustomOptions = {
    customSiteTitle: 'Mi API Documentación', // Cambia el título de la pestaña del navegador
    customfavIcon: 'https://nestjs.com/img/logo-small.svg', // Tu propio icono

    // 2. Opción A: Inyectar un archivo CSS externo (Ejemplo de un tema oscuro de la comunidad)
    customCssUrl:
      'https://cdn.jsdelivr.net/npm/swagger-ui-themes@3.0.0/themes/3.x/theme-muted.css',

    // Opción B: Escribir tu propio CSS directamente para ocultar cosas (ej. la barra superior)
    // customCss: '.swagger-ui .topbar { display: none }',

    // 3. Opciones nativas de Swagger UI
    swaggerOptions: {
      persistAuthorization: true, // Si usas tokens, no se borran al recargar la página
      docExpansion: 'none', // Mantiene todos los endpoints colapsados por defecto (útil cuando tienes muchos)
      filter: true, // Agrega una barra de búsqueda para filtrar endpoints
      tagsSorter: 'alpha', // Ordena las etiquetas (controladores) alfabéticamente
      operationsSorter: 'alpha', // Ordena las rutas dentro de cada controlador alfabéticamente
    },
  };
  SwaggerModule.setup('api', app, documentFactory, customOptions);
  // const {
  //   invalidCsrfTokenError, // This is provided purely for convenience if you plan on creating your own middleware.
  //   generateToken, // Use this in your routes to generate and provide a CSRF hash, along with a token cookie and token.
  //   validateRequest, // Also a convenience if you plan on making your own middleware.
  //   doubleCsrfProtection, // This is the default CSRF protection middleware.
  // } = doubleCsrf(doubleCsrfOptions);
  // app.use(doubleCsrfProtection);
  app.use(cookieParser());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
