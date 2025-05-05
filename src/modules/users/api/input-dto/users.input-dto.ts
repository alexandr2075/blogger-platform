import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class CreateUserInputDto {
  @ApiProperty({
    description:
      'User login (3-10 characters, letters, numbers, underscores, hyphens)',
    example: 'john_doe123',
    maxLength: 10,
    minLength: 3,
  })
  @IsString()
  @Length(3, 10, {
    message: 'Login must be between 3 and 10 characters',
  })
  @Matches(/^[a-zA-Z0-9_-]*$/, {
    message: 'Login can only contain letters, numbers, underscores and hyphens',
  })
  login: string;

  @ApiProperty({
    description: 'User password (6-20 characters)',
    example: 'strongPassword123',
    maxLength: 20,
    minLength: 6,
  })
  @IsString()
  @Length(6, 20, {
    message: 'Password must be between 6 and 20 characters',
  })
  password: string;

  @ApiProperty({
    description: 'User email',
    example: 'example@example.com',
  })
  @IsEmail()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email format',
  })
  email: string;
}
