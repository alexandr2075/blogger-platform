import type { User } from '../../domain/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString } from 'class-validator';

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

@IsOptional()
  createdAt: string;

  static mapToView(user: User): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt!;
    return dto;
  }
}
