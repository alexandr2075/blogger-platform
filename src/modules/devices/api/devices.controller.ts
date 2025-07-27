import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CoreConfig } from '@core/core.config';


@Controller('security')
export class DevicesController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly coreConfig: CoreConfig
    ) {}

  @Get('devices')
  async devices(@Req() request: Request) {
    try {
      // Получаем refresh token из куки
      const refreshToken = request.cookies['refreshToken']

      if(!refreshToken) {
        throw new UnauthorizedException('Refresh token not found')
      }

      // Проверяем токен и получаем payload
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.coreConfig.refreshTokenSecret
      })

      // Создаем объект на основе payload
      const deviceInfo = {
        userId: payload.userId,
        deviceId: payload.deviceId,
        lastActiveDate: payload.iat
      }

    }
  }
}
