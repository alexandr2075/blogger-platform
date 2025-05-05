import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegistrationEmailResendingInputDto {
  @ApiProperty({
    description: 'User email for resending registration link',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  email: string;
}