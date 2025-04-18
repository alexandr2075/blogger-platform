import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import type { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { User, UserModelType } from '../domain/user.entity';
 
export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}
 
  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
 
    if (!user) {
      throw new NotFoundException('user not found');
    }
 
    return UserViewDto.mapToView(user);
  }
 
   //TODO: add pagination and filters
  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const [items, totalCount] = await Promise.all([
      this.UserModel.find()
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),
      this.UserModel.countDocuments()
    ]);

    return PaginatedViewDto.mapToView({
      items: items.map(user => UserViewDto.mapToView(user)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount
    });
  }
}