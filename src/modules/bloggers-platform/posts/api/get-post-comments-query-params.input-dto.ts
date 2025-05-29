import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum PostCommentsSortBy {
  Content = 'content',
  CreatedAt = 'createdAt',
}

export class GetPostCommentsQueryParams extends BaseQueryParams {
  @ApiPropertyOptional({
    enum: PostCommentsSortBy,
    description: 'Поле для сортировки комментариев',
    default: PostCommentsSortBy.CreatedAt,
  })
  @IsEnum(PostCommentsSortBy)
  sortBy = PostCommentsSortBy.CreatedAt;
}
