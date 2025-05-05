import { BaseQueryParams } from '../../../core/dto/base.query-params.input-dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum UsersSortBy {
  Login = 'login',
  Email = 'email',
  CreatedAt = 'createdAt',
}

export class GetUsersQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    description: 'Поле для сортировки',
    enum: UsersSortBy,
    default: UsersSortBy.CreatedAt,
  })
  @IsOptional()
  @IsEnum(UsersSortBy)
  @Type(() => String)
  sortBy: UsersSortBy = UsersSortBy.CreatedAt;

  @ApiPropertyOptional({
    description: 'Поисковый термин для логина',
    example: 'john',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  searchLoginTerm: string | null = null;

  @ApiPropertyOptional({
    description: 'Поисковый термин для email',
    example: 'example@mail.com',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  searchEmailTerm: string | null = null;
}
