import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { GetUsersQueryParams } from '../api/get-users-query-params.input-dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { User } from '../domain/user.entity';
import { PostgresService } from '../../../core/database/postgres.config';

@Injectable()
export class UsersQueryRepositoryPostgres {
  constructor(
    private readonly postgresService: PostgresService,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<UserViewDto> {
    const query = `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`;
    const result = await this.postgresService.query(query, [id]);

    if (result.length === 0) {
      throw new NotFoundException('user not found');
    }

    const user = this.mapRowToUser(result[0]);
    return UserViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // Строим WHERE условие
    const whereConditions: string[] = ['deleted_at IS NULL'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // Добавляем поиск по логину, если указан параметр
    if (query.searchLoginTerm) {
      whereConditions.push(`login ILIKE $${paramIndex}`);
      queryParams.push(`%${query.searchLoginTerm}%`);
      paramIndex++;
    }

    // Добавляем поиск по email, если указан параметр
    if (query.searchEmailTerm) {
      whereConditions.push(`email ILIKE $${paramIndex}`);
      queryParams.push(`%${query.searchEmailTerm}%`);
      paramIndex++;
    }

    // Если есть поиск по логину И email, объединяем через OR
    let whereClause = whereConditions[0]; // deleted_at IS NULL
    if (whereConditions.length > 1) {
      const searchConditions = whereConditions.slice(1);
      if (searchConditions.length > 1) {
        whereClause += ` AND (${searchConditions.join(' OR ')})`;
      } else {
        whereClause += ` AND ${searchConditions[0]}`;
      }
    }

    // Определяем сортировку
    const sortDirection = query.sortDirection === 'asc' ? 'ASC' : 'DESC';
    const sortByField = query.sortBy || 'createdAt';
    
    // Маппинг camelCase полей в snake_case колонки PostgreSQL
    const fieldToColumnMap: { [key: string]: string } = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'login': 'login',
      'email': 'email'
    };
    
    const sortBy = fieldToColumnMap[sortByField] || 'created_at';
    
    // Основной запрос с пагинацией
    const itemsQuery = `
      SELECT * FROM users 
      WHERE ${whereClause}
      ORDER BY ${sortBy === 'login' || sortBy === 'email' ? `LOWER(${sortBy})` : sortBy} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    // Запрос для подсчета общего количества
    const countQuery = `
      SELECT COUNT(*) as total FROM users 
      WHERE ${whereClause}
    `;

    // Добавляем параметры пагинации
    const paginationParams = [...queryParams, query.pageSize, query.calculateSkip()];

    // Выполняем оба запроса параллельно
    const [itemsResult, countResult] = await Promise.all([
      this.postgresService.query(itemsQuery, paginationParams),
      this.postgresService.query(countQuery, queryParams),
    ]);

    const users = itemsResult.map(row => this.mapRowToUser(row));
    const totalCount = parseInt(countResult[0].total);

    // Возвращаем результат в стандартном формате
    return PaginatedViewDto.mapToView({
      items: users.map((user) => UserViewDto.mapToView(user)),
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }

  private mapRowToUser(row: any): User {
    const user = new User();
    user.id = row.id;
    user.login = row.login;
    user.email = row.email;
    user.passwordHash = row.password_hash;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    user.deletedAt = row.deleted_at;
    user.name = {
      firstName: row.name_first_name,
      lastName: row.name_last_name,
    };
    user.emailConfirmation = {
      confirmationCode: row.confirmation_code,
      expirationDate: row.confirmation_code_expiration_date,
      isConfirmed: row.is_confirmed,
    };
    return user;
  }
}
