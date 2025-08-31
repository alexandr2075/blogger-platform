import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../domain/user.entity';
import { EntityManager } from 'typeorm';
import { InjectEntityManager } from '@nestjs/typeorm';
import { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';


@Injectable()
export class UsersQueryRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  public async getOneById(id: string): Promise<UserViewDto> {
    const result = await this.entityManager
      .createQueryBuilder(User, 'u')
      .where('u.id = :id', { id })
      .andWhere('u.deletedAt IS NULL')
      .getOne();

    if (!result) {
      throw new NotFoundException('User not found');
    }

    return UserViewDto.mapToView(result);
  }

  public async getAllAndCount(query: GetUsersQueryParams): Promise<[User[], number]> {
    try {
      const qb = this.entityManager
        .createQueryBuilder(User, 'u')
        .where('u.deletedAt IS NULL');

      // Handle search terms with OR logic
      const searchConditions: string[] = [];
      const searchParams: any = {};

      if (query.searchLoginTerm) {
        searchConditions.push('u.login ILIKE :loginTerm');
        searchParams.loginTerm = `%${query.searchLoginTerm}%`;
      }
      
      if (query.searchEmailTerm) {
        searchConditions.push('u.email ILIKE :emailTerm');
        searchParams.emailTerm = `%${query.searchEmailTerm}%`;
      }

      if (searchConditions.length > 0) {
        qb.andWhere(`(${searchConditions.join(' OR ')})`, searchParams);
      }

      // Sorting
      const sortBy = query.sortBy ?? 'createdAt';
      const sortDirection = (query.sortDirection || 'desc').toUpperCase() as 'ASC' | 'DESC';
      
      // Use case-sensitive sorting with proper ASCII byte-order
      if (sortBy === 'login' || sortBy === 'email') {
        qb.orderBy(`u.${sortBy} COLLATE "C"`, sortDirection);
      } else {
        qb.orderBy(`u.${sortBy}`, sortDirection);
      }

      // Pagination
      qb.skip(query.calculateSkip()).take(query.pageSize);

      return await qb.getManyAndCount();
    } catch (error) {
      console.log(error);
      return [[], 0];
    }
  }

  // private mapRowToUser(row: any): User {
  //   const user = new User();
  //   user.id = row.id;
  //   user.login = row.login;
  //   user.email = row.email;
  //   user.passwordHash = row.password_hash;
  //   user.createdAt = row.created_at;
  //   user.updatedAt = row.updated_at;
  //   user.deletedAt = row.deleted_at;
  //   user.name = {
  //     firstName: row.name_first_name,
  //     lastName: row.name_last_name,
  //   };
  //   user.emailConfirmation = {
  //     confirmationCode: row.confirmation_code,
  //     expirationDate: row.confirmation_code_expiration_date,
  //     isConfirmed: row.is_confirmed,
  //   };
  //   return user;
  // }
}
