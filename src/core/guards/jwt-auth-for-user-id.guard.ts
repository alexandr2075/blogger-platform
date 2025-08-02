import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { CoreConfig } from '@core/core.config';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuardForUserId extends AuthGuard('jwt') {
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
      return true;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.coreConfig.accessTokenSecret,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
