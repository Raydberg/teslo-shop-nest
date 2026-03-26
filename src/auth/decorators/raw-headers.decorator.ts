import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RawHeaders = createParamDecorator(
  (data: string[] | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.rawHeaders;
  },
);
