import { NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { User, UserModelType } from '../domain/user.entity';
import { Types } from 'mongoose';

export class UsersQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.UserModel.findOne({
      _id: new Types.ObjectId(id),
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
    let filter: any = { deletedAt: null };

    if (query.searchLoginTerm || query.searchEmailTerm) {
      filter = {
        deletedAt: null,
        $or: [
          {
            login: {
              $regex: query.searchLoginTerm,
              $options: 'i',
            },
          },
          {
            email: {
              $regex: query.searchEmailTerm,
              $options: 'i',
            },
          },
        ],
      };
    }
    const typedQuery = Object.assign(new GetUsersQueryParams(), query);

    const [items, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .sort({
          [typedQuery.sortBy]: typedQuery.sortDirection === 'asc' ? 1 : -1,
        })
        .skip(typedQuery.calculateSkip())
        .limit(typedQuery.pageSize)
        .exec(),
      this.UserModel.countDocuments(filter),
    ]);

    return PaginatedViewDto.mapToView({
      items: items.map((user) => UserViewDto.mapToView(user)),
      page: +typedQuery.pageNumber,
      size: +typedQuery.pageSize,
      totalCount,
    });
  }
}
