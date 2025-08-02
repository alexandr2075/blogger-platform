import { IsOptional, IsString } from 'class-validator';

export class DeviceInputDto {
  @IsString({ message: 'Device_name should be a string' })
  @IsOptional()
  deviceName: string | undefined;

  @IsString({ message: 'deviceId should be a string' })
  deviceId: string;

  @IsOptional()
  @IsString({ message: 'Ip should be a string' })
  ip: string | undefined;

  @IsString({ message: 'User_id should be a string' })
  userId: string;
}
