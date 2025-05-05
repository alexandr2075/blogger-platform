import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { UUID } from 'crypto';

export enum ConfirmedStatus {
    Confirmed = 'confirmed',
    Unconfirmed = 'unconfirmed',
  }

@Schema({
  _id: false,
})
export class EmailConfirmation {
  @Prop()
  confirmationCode?: string;

  @Prop()
  expirationDate: Date;

  @Prop()
  isConfirmed: ConfirmedStatus.Confirmed | ConfirmedStatus.Unconfirmed
}

export const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation);
   