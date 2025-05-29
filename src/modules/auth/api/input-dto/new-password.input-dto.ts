import { IsString, IsNotEmpty, Length, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class NewPasswordInputDto {
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password should not be empty' })
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @Transform(({ value }) => value?.trim())
  newPassword: string;

  @IsString({ message: 'Recovery code must be a string' })
  @IsNotEmpty({ message: 'Recovery code should not be empty' })
  @IsUUID(4, { message: 'Recovery code must be a valid UUID v4' })
  recoveryCode: string;
}
