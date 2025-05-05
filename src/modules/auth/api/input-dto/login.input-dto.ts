import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LoginInputDto {
  @ApiProperty({
    description: 'Логин или email пользователя',
    example: 'john_doe или john.doe@example.com',
  })
  @IsString()
  loginOrEmail: string;

  @ApiProperty({
    description: 'Пароль пользователя (6-20 символов)',
    example: 'strongPassword123',
    minLength: 6,
    maxLength: 20,
  })
  @IsString()
  password: string;
}
