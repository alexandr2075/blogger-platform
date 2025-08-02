import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Device, DeviceModelType } from '@modules/devices/domain/device.entity';
import { DeviceViewModel } from '@modules/devices/dto/device.view-dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshPayload } from '@modules/auth/types/payload.refresh';

@Injectable()
export class DevicesService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectModel('Device')
    private readonly deviceModel: DeviceModelType,
  ) {}

  async getDevices(userId: string): Promise<DeviceViewModel[]> {
    try {
      const devices: Device[] = await this.deviceModel.find({ userId }).lean();
      return devices.map(
        (device: Device): DeviceViewModel => ({
          ip: device.ip,
          title: device.deviceName,
          lastActiveDate: device.iat,
          deviceId: device.deviceId,
        }),
      );
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDevicesDocuments(userId: string) {
    try {
      const devices: Device[] = await this.deviceModel.find({ userId }).lean();
      return devices;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getDeviceDocument(userId: string, deviceId: string) {
    try {
      const device: Device[] = await this.deviceModel.find({ userId, deviceId }).lean();
      return device;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteDevices(refreshTokenCookie: string) {
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const payload: RefreshPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    await this.deviceModel.deleteMany({
      userId: payload.userId,
      deviceId: { $ne: payload.deviceId },
    });
  }

  async deleteDevicesByDeviceId(refreshTokenCookie: string, deviceId: string) {
    const refreshToken = refreshTokenCookie.split(';')[0].split('=')[1];
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const payload: RefreshPayload = this.jwtService.verify(refreshToken, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    });

    // Сначала проверяем, существует ли устройство вообще
    const deviceExists = await this.deviceModel
      .findOne({ deviceId })
      .lean();

    if (!deviceExists) {
      throw new NotFoundException('Device not found');
    }

    // Затем проверяем, принадлежит ли оно текущему пользователю
    const userDevice = await this.deviceModel
      .findOne({ userId: payload.userId, deviceId })
      .lean();

    if (!userDevice) {
      throw new ForbiddenException('Access denied');
    }

    await this.deviceModel.deleteOne({
      userId: payload.userId,
      deviceId: deviceId,
    });
  }
}
