import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { DeviceInputDto } from '@modules/devices/dto/device.input-dto';

@Schema({ timestamps: true })
export class Device {
  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  deviceId: string;

  @Prop({ type: String, required: true })
  iat: string;

  @Prop({ type: String })
  deviceName: string;

  @Prop({ type: String })
  ip: string;

  @Prop({ type: String, required: true })
  exp: string;

  createdAt: Date;
  updatedAt: Date;

  static createInstance(dto: DeviceInputDto): DeviceDocument {
    const device = new this();
    device.userId = dto.userId;
    device.deviceId = dto.deviceId;
    device.iat = new Date().toISOString();
    device.exp = new Date(Date.now() + 20 * 1000).toISOString();
    device.deviceName = dto.deviceName || 'not specified';
    device.ip = dto.ip || 'not specified';
    return device as DeviceDocument;
  }
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.loadClass(Device);

export type DeviceDocument = HydratedDocument<Device>;
export type DeviceModelType = Model<DeviceDocument> & typeof Device;
