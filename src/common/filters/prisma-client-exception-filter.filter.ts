import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';

interface PrismaDriverError {
  cause?: {
    constraint?: {
      fields: string[];
    };
  };
}

@Catch(Prisma.PrismaClientKnownRequestError) //-> Solo atrapara los errores
export class PrismaClientExceptionFilterFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaError');
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');
    this.logger.error(`Code: ${exception.code} - ${message}`);
    switch (exception.code) {
      //Valor duplicado
      case 'P2002': {
        const status = HttpStatus.CONFLICT; //409 O 400
        const meta = exception.meta;
        let target = meta?.target as string[] | string | undefined;

        if (!target && meta?.driverAdapterError) {
          const adapterError = meta.driverAdapterError as PrismaDriverError;
          target = adapterError.cause?.constraint?.fields;
        }

        const fieldName = Array.isArray(target)
          ? target.join(', ')
          : typeof target === 'string'
            ? target
            : 'campo';

        response.status(status).json({
          message: [
            `El valor del campo [${fieldName}] ya existe. Por favor usa otro`,
          ],
          error: 'Conflic',
          statusCode: status,
        });
        break;
      }
      //Registro no encontrado
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          message: [
            (exception.meta?.cause as string) || 'Registro no encontrado',
          ],
          error: 'Not Found',
          statusCode: status,
        });
        break;
      }
      //Error de llave foranea // borrar una categoria de productos
      case '2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          message: [
            'No se puede realizar la operacion por la restriccion de relacion (FK)',
          ],
          error: 'Bad Request',
          statusCode: status,
        });

        break;
      }
      default:
        response.status(HttpStatus.BAD_REQUEST).json({
          message: ['Error de base de datos no controlado'],
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        });
    }
  }
}
