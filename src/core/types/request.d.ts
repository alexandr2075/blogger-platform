import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      refreshToken?: string;
      refreshTokenPayload?: {
        sub: string;
        deviceId: string;
        iat: number;
        exp: number;
      };
    }
  }
}
