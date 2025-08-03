import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UsersQueryRepositoryPostgres } from './infrastructure/users.query-repository-postgres';
import { UsersRepositoryPostgres } from './infrastructure/users.repository-postgres';
import { CreateUserUseCase } from './application/use-cases/create-user-use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user-use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user-use-case';
import { PostgresService } from '../../core/database/postgres.config';

const adapters = [UsersRepositoryPostgres, UsersQueryRepositoryPostgres]
const useCases = [CreateUserUseCase, DeleteUserUseCase, UpdateUserUseCase]

@Module({
  imports: [
    CqrsModule,
  ],
  controllers: [UsersController],
  providers: [PostgresService, UsersService, ...adapters, ...useCases],
  exports: [UsersService, UsersRepositoryPostgres, UsersQueryRepositoryPostgres],
})
export class UsersModule {}
