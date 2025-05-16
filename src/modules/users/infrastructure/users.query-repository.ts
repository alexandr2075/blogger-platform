import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { User, UserModelType } from '../domain/user.entity';
import { Types } from 'mongoose';

@Injectable()
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

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // Базовый фильтр (не удаленные пользователи)
    const filter: any = { deletedAt: null };

    // Собираем условия для поиска
    const searchConditions: any[] = [];

    // Добавляем поиск по логину, если указан параметр
    if (query.searchLoginTerm) {
      searchConditions.push({
        login: {
          $regex: query.searchLoginTerm,
          $options: 'i', // Регистронезависимый поиск
        },
      });
    }

    // Добавляем поиск по email, если указан параметр
    if (query.searchEmailTerm) {
      searchConditions.push({
        email: {
          $regex: query.searchEmailTerm,
          $options: 'i', // Регистронезависимый поиск
        },
      });
    }

    // Если есть условия поиска - добавляем их в фильтр
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }

    // Выполняем запрос с пагинацией и сортировкой
    const [items, totalCount] = await Promise.all([
      this.UserModel.find(filter)
        .sort({ [query.sortBy]: query.sortDirection })
        .skip(query.calculateSkip())
        .limit(query.pageSize)
        .exec(),

      this.UserModel.countDocuments(filter),
    ]);

    // Возвращаем результат в стандартном формате
    return PaginatedViewDto.mapToView({
      items: items.map((user) => UserViewDto.mapToView(user)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
    // return {
    //   items: items.map(user => UserViewDto.mapToView(user)),
    //   totalCount,
    //   pagesCount: Math.ceil(totalCount / query.pageSize),
    //   page: query.pageNumber,
    //   pageSize: query.pageSize,
    // };
  }
}
