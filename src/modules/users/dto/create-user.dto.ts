import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User login (3-10 chars, a-z, 0-9, _, -)',
    example: 'john_doe',
    minLength: 3,
    maxLength: 10,
  })
  @IsString()
  @Length(3, 10)
  @Matches(/^[a-z0-9_-]+$/i)
  login: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password (6-20 chars)',
    example: 'strongPass123',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  @Length(6, 20)
  password: string;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'New user email',
    example: 'new.email@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
