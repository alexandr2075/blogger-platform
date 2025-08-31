import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      refreshToken?: string;
      refreshTokenPayload?: {
        userId: string;
        deviceId: string;
        deviceName?: string;
        ip?: string;
        iat: number;
        exp: number;
      };
    }
  }
}
