import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { Type } from 'class-transformer';

export enum BlogsSortBy {
  Name = 'name',
  Description = 'description',
  WebsiteUrl = 'websiteUrl',
  CreatedAt = 'createdAt',
}

export class GetBlogsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  @Type(() => String) // Явное указание трансформации
  searchNameTerm: string | null = null;

  @IsOptional() // Добавьте, если параметр не обязательный
  @IsEnum(BlogsSortBy)
  @Type(() => String) // Для enum тоже нужна трансформация
  sortBy: BlogsSortBy = BlogsSortBy.CreatedAt;
}
