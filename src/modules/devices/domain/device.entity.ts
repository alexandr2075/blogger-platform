import { DeviceInputDto } from '@modules/devices/dto/device.input-dto';

export class Device {
  id: string;
  userId: string;
  deviceId: string;
  iat: number;
  deviceName: string;
  ip: string;
  exp: number;
  createdAt: Date;
  updatedAt: Date;

  static createInstance(dto: DeviceInputDto): Device {
    const device = new this();
    device.userId = dto.userId;
    device.deviceId = dto.deviceId;
    device.iat = Math.floor(Date.now() / 1000);
    device.exp = Math.floor(Date.now() / 1000) + 20;
    device.deviceName = dto.deviceName || 'not specified';
    device.ip = dto.ip || 'not specified';
    return device;
  }
}
