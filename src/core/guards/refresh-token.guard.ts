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
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      // Verify refresh token
      const payload: { sub: string; deviceId: string; iat: number; exp: number } =
        this.jwtService.verify(refreshToken, {
          secret: this.coreConfig.refreshTokenSecret,
        });

      if (payload.exp < Date.now() / 1000) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Attach refresh token and payload to request for use in controller
      request.refreshToken = refreshToken;
      request.refreshTokenPayload = payload;
      
      return true;
    } catch (error) {
      console.log('[REFRESH_TOKEN_GUARD] Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
