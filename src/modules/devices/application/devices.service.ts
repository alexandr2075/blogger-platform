import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Device } from '@modules/devices/domain/device.entity';
import { DeviceViewModel } from '@modules/devices/dto/device.view-dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DevicesRepositoryPostgres } from '../infrastructure/devices.repository-postgres';
import { RefreshPayload } from '@modules/auth/types/payload.refresh';

@Injectable()
export class DevicesService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly devicesRepository: DevicesRepositoryPostgres,
  ) {}

  async getDevices(userId: string): Promise<DeviceViewModel[]> {
    try {
      const devices: Device[] = await this.devicesRepository.findAllByUserId(userId);
      return devices.map(
        (device: Device): DeviceViewModel => ({
          ip: device.ip,
          title: device.deviceName,
          lastActiveDate: new Date(device.iat * 1000).toISOString(),
          deviceId: device.deviceId,
        }),
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDevicesDocuments(userId: string) {
    try {
      const devices: Device[] = await this.devicesRepository.findAllByUserId(userId);
      return devices;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDeviceDocument(userId: string, deviceId: string) {
    try {
      const device: Device | null = await this.devicesRepository.findByUserIdAndDeviceId(userId, deviceId);
      return device ? [device] : [];
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteDevices(refreshTokenCookie: string) {
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token format', field: 'refreshToken' }]
      });
    }

    const payload: RefreshPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    await this.devicesRepository.deleteAllExceptCurrent(
      payload.userId,
      payload.deviceId,
    );
  }

  async deleteDevicesByDeviceId(refreshTokenCookie: string, deviceId: string) {
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token format', field: 'refreshToken' }]
      });
    }

    const payload: RefreshPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    // First check if device exists at all
    const deviceExists = await this.devicesRepository.findByDeviceId(deviceId);

    if (!deviceExists) {
      throw new NotFoundException('Device not found');
    }

    // Then check if it belongs to current user
    const userDevice = await this.devicesRepository.findByUserIdAndDeviceId(
      payload.userId,
      deviceId,
    );

    if (!userDevice) {
      throw new ForbiddenException('Access denied');
    }

    await this.devicesRepository.deleteByDeviceId(deviceId);
  }
}
