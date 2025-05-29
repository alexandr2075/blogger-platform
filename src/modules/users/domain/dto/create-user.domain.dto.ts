import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateUserDomainDto {
  @ApiProperty({
    description: 'User login (3-10 characters)',
    example: 'john_doe',
    required: true,
  })
  @IsString({ message: 'Login must be a string' })
  @IsNotEmpty({ message: 'Login cannot be empty' })
  @Length(3, 10, { message: 'Login must be between 3 and 10 characters' })
  login: string;

  @ApiProperty({
    description: 'Valid user email',
    example: 'user@example.com',
    required: true,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  email: string;

  @ApiProperty({
    description: 'Pre-hashed password (handled by application layer)',
    example: '$2a$10$hashedString...', // bcrypt example
    required: true,
  })
  @IsString({ message: 'Password hash must be a string' })
  @IsNotEmpty({ message: 'Password hash cannot be empty' })
  passwordHash: string;

  @ApiProperty({
    description: 'Optional UUID confirmation code (v4)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'confirmationCode hash must be a string' })
  confirmationCode?: string;
}
