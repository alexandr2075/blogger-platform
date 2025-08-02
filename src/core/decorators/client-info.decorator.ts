import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface IClientInfo {
  ip: string | undefined;
  userAgent: string | undefined;
}

export const ClientInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): IClientInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };
  },
);
