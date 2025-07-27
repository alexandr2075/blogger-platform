import { IsString } from 'class-validator';

export class DeviceInputDto {
  @IsString({ message: 'Device_name should be a string' })
  device_name: string;

  @IsString({ message: 'Ip should be a string' })
  ip: string;

  @IsString({ message: 'User_id should be a string' })
  user_id: string;
}
