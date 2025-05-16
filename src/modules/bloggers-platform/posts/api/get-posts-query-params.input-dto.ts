import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum PostsSortBy {
  Title = 'title',
  ShortDescription = 'shortDescription',
  Content = 'content',
  BlogId = 'blogId',
  BlogName = 'blogName',
  CreatedAt = 'createdAt',
}

export class GetPostsQueryParams extends BaseQueryParams {
  @IsOptional()
  @IsString()
  blogId?: string;

  @ApiPropertyOptional({
    enum: PostsSortBy,
    description: 'Field for sorting posts',
    default: PostsSortBy.CreatedAt
  })
  @IsEnum(PostsSortBy)
  sortBy = PostsSortBy.CreatedAt;
}
