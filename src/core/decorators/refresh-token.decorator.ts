import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const RefreshToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.refreshToken;
  },
);

export const RefreshTokenPayload = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.refreshTokenPayload;
  },
);
