import { BaseQueryParams } from "../../../core/dto/base.query-params.input-dto";

export enum UsersSortBy {
    CreatedAt = 'createdAt',
    Login = 'login',
    Email = 'email'
}
 
//dto для запроса списка юзеров с пагинацией, сортировкой, фильтрами
export class GetUsersQueryParams extends BaseQueryParams {
    sortBy = UsersSortBy.CreatedAt;
    searchLoginTerm: string | null = null;
    searchEmailTerm: string | null = null;
  }