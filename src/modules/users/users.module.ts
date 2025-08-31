import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersController } from './api/users.controller';
import { UsersService } from './application/users.service';
import { UsersQueryRepository } from './infrastructure/users.query-repository';
import { UsersRepository } from './infrastructure/users.repository';
import { CreateUserUseCase } from './application/use-cases/create-user-use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user-use-case';
import { UpdateUserUseCase } from './application/use-cases/update-user-use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './domain/user.entity';
import { BcryptService } from '../../core/bcrypt/bcsypt.service';

const adapters = [UsersRepository, UsersQueryRepository]
const useCases = [CreateUserUseCase, DeleteUserUseCase, UpdateUserUseCase]

@Module({
  imports: [TypeOrmModule.forFeature([User]), CqrsModule],
  controllers: [UsersController],
  providers: [ UsersService, BcryptService, ...adapters, ...useCases],
  exports: [UsersService, UsersRepository, UsersQueryRepository],
})
export class UsersModule {}

