import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CoreConfig } from '../core.config';
import { CookieUtil } from '../utils/cookie.util';
import { RefreshPayload } from '../../modules/auth/types/payload.refresh';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private coreConfig: CoreConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Extract refresh token from cookies
    const refreshToken = CookieUtil.extractRefreshToken(request.headers.cookie);
    
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token not found', field: 'refreshToken' }]
      });
    }

    try {
      // Verify refresh token
      const payload: RefreshPayload & { iat: number; exp: number } =
        this.jwtService.verify(refreshToken, {
          secret: this.coreConfig.refreshTokenSecret,
        });

      // Attach refresh token and payload to request for use in controller
      request.refreshToken = refreshToken;
      request.refreshTokenPayload = payload;
      
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          errorsMessages: [{ message: 'Refresh token has expired', field: 'refreshToken' }]
        });
      }
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token', field: 'refreshToken' }]
      });
    }
  }
}
