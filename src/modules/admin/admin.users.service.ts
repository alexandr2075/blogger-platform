import { Injectable } from "@nestjs/common";
import { UsersRepositoryPostgres } from "../users/infrastructure/users.repository-postgres";
import { UsersQueryRepositoryPostgres } from "../users/infrastructure/users.query-repository-postgres";
import { GetUsersQueryParams } from "../users/api/get-users-query-params.input-dto";
import { CreateUserInputDto } from "../users/api/input-dto/users.input-dto";
import { AdminUsersRepository } from "./admin.users.repository";

@Injectable()
export class AdminUsersService {
  constructor(private usersRepository: UsersRepositoryPostgres,
    private usersQueryRepository: UsersQueryRepositoryPostgres,
    private adminUsersRepository: AdminUsersRepository) {}

  async getAll(query: GetUsersQueryParams) {
    return this.usersQueryRepository.getAll(query);
  }

  async addUser(user: CreateUserInputDto) {
    return this.adminUsersRepository.createUser(user);
  }

  async deleteUser(id: string) {
    return this.usersRepository.delete(id);
  }
}