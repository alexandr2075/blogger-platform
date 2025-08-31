import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { CoreConfig } from '@core/core.config';
import { DevicesService } from '@modules/devices/application/devices.service';
import { RefreshPayload } from '@modules/auth/types/payload.refresh';
import { DeviceViewModel } from '@modules/devices/dto/device.view-dto';

@Controller('security')
export class DevicesController {
  constructor(
    private readonly devicesService: DevicesService,
    private readonly jwtService: JwtService,
    private readonly coreConfig: CoreConfig,
  ) {}

  @Get('devices')
  async devices(@Req() request: Request) {
    const refreshTokenCookie = request.headers.cookie;
    if (!refreshTokenCookie) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token not found', field: 'refreshToken' }]
      });
    }

    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token format', field: 'refreshToken' }]
      });
    }

    const payload: RefreshPayload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: this.coreConfig.refreshTokenSecret,
      },
    );

    const devices: DeviceViewModel[] = await this.devicesService.getDevices(
      payload.userId,
    );
    return devices;
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('devices')
  async deleteDevice(@Req() request: Request) {
    const refreshTokenCookie = request.headers.cookie;
    if (!refreshTokenCookie) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token not found', field: 'refreshToken' }]
      });
    }
    await this.devicesService.deleteDevices(refreshTokenCookie);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('devices/:deviceId')
  async deleteDeviceByDeviceId(
    @Req() request: Request,
    @Param('deviceId') deviceId: string,
  ) {
    const refreshTokenCookie = request.headers.cookie;
    if (!refreshTokenCookie) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token not found', field: 'refreshToken' }]
      });
    }
    if (!deviceId) {
      throw new BadRequestException('Device id not found');
    }
    await this.devicesService.deleteDevicesByDeviceId(
      refreshTokenCookie,
      deviceId,
    );
  }
}
