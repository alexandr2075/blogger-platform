import { Injectable, NotFoundException } from "@nestjs/common";
import { UsersRepository } from "../../users/infrastructure/users.repository";
import { UsersQueryRepository } from "../../users/infrastructure/users.query-repository";
import { GetUsersQueryParams } from "../../users/api/get-users-query-params.input-dto";
import { CreateUserInputDto } from "../../users/api/input-dto/users.input-dto";
import { AdminUsersRepository } from "./admin.users.repository";

@Injectable()
export class AdminUsersService {
  constructor(private usersRepository: UsersRepository,
    private usersQueryRepository: UsersQueryRepository,
    private adminUsersRepository: AdminUsersRepository) {}

  async getAll(query: GetUsersQueryParams) {
    const [users, totalCount] = await this.usersQueryRepository.getAllAndCount(query);
    
    const mappedUsers = users.map(user => ({
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt
    }));

    return {
      pagesCount: Math.ceil(totalCount / query.pageSize),
      page: query.pageNumber,
      pageSize: query.pageSize,
      totalCount,
      items: mappedUsers
    };
  }

  async addUser(user: CreateUserInputDto) {
    return this.adminUsersRepository.createUser(user);
  }

  async deleteUser(id: string) {
    const userExists = await this.usersRepository.findById(id);
    if (!userExists) {
      throw new NotFoundException('User not found');
    }
    
    const deleted = await this.usersRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
    
    return;
  }
}