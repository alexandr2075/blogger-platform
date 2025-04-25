import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum ConfirmedStatus {
    Confirmed = 'confirmed',
    Unconfirmed = 'unconfirmed',
  }

@Schema({
  _id: false,
})
export class EmailConfirmation {
  @Prop()
  confirmationCode: string;

  @Prop()
  expirationDate: Date;

  @Prop()
  isConfirmed: ConfirmedStatus.Confirmed | ConfirmedStatus.Unconfirmed
}

export const EmailConfirmationSchema = SchemaFactory.createForClass(EmailConfirmation);
   