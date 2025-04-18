import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';

export enum PostsSortBy {
  Title = 'title',
  ShortDescription = 'shortDescription',
  Content = 'content',
  BlogId = 'blogId',
  BlogName = 'blogName',
  CreatedAt = 'createdAt'
}

export class GetPostsQueryParams extends BaseQueryParams {
  blogId?: string;
  sortBy = PostsSortBy.CreatedAt;
}