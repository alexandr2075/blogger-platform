import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { CoreConfig } from '../core.config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private jwtService: JwtService,
    private coreConfig: CoreConfig,
  ) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload: { sub: string; iat: number; exp: number } =
        this.jwtService.verify(token, {
          secret: this.coreConfig.accessTokenSecret,
        });
      if (payload.exp < Date.now() / 1000) {
        throw new UnauthorizedException('Token has expired');
      }

      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
