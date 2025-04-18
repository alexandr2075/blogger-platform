import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Name {
  @Prop({ type: String })
  firstName: string;

  @Prop({ type: String })
  lastName: string;
}

export const NameSchema = SchemaFactory.createForClass(Name); 