import type { UserDocument } from '../../domain/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEmail, IsString } from 'class-validator';

export class UserViewDto {
  @ApiProperty({
    description: 'Уникальный идентификатор пользователя',
    example: '65a7b4c8f10d1c2e8f4e3b2a',
  })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Логин пользователя',
    example: 'john_doe',
    minLength: 3,
    maxLength: 10,
  })
  @Expose()
  @IsString()
  @Transform(({ value }) => value?.trim())
  login: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john.doe@example.com',
  })
  @Expose()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Дата создания пользователя',
    example: '2024-01-15T12:34:56.789Z',
  })
  @Expose()
  @IsDate()
  @Transform(({ value }) => (value instanceof Date ? value : new Date(value)))
  createdAt: Date;

  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt;
    return dto;
  }
}
