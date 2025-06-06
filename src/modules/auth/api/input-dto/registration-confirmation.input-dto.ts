import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class RegistrationConfirmationInputDto {
  @ApiProperty({
    description: 'Email confirmation code (UUID format)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: true,
  })
  @IsUUID(4, { message: 'Invalid UUID format' }) // Validates UUID v4
  @IsNotEmpty({ message: 'Confirmation code cannot be empty' })
  code: string;
}
