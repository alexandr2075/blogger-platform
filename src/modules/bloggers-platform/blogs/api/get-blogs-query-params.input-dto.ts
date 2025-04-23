import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';

export enum BlogsSortBy {
  Name = 'name',
  Description = 'description',
  WebsiteUrl = 'websiteUrl',
  CreatedAt = 'createdAt',
}

export class GetBlogsQueryParams extends BaseQueryParams {
  searchNameTerm: string | null = null;
  sortBy = BlogsSortBy.CreatedAt;
}
