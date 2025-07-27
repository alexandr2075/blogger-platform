import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { DeviceInputDto } from '@modules/bloggers-platform/devices/dto/device.input-dto';
import { HydratedDocument, Model } from 'mongoose';
import { v4 as UUID } from 'uuid';

@Schema()
export class Device extends Document {
  @Prop({ type: String })
  user_id;

  @Prop({ type: String })
  device_id;

  @Prop({ type: Date })
  iat;

  @Prop({ type: String })
  device_name;

  @Prop({ type: String })
  ip;

  @Prop({ type: Date })
  exp;

  static createInstance(dto: DeviceInputDto): DeviceDocument {
    const device = new this();
    device.user_id = dto.user_id;
    device.device_id = UUID();
    device.iat = new Date();
    device.exp = new Date(
      new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 10,
    );
    device.device_name = dto.device_name;
    device.ip = dto.ip;
    return device as DeviceDocument;
  }
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
DeviceSchema.loadClass(Device);

export type DeviceDocument = HydratedDocument<Device>;
export type DeviceModelType = Model<DeviceDocument> & typeof Device;
