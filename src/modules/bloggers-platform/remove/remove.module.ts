import { Module } from '@nestjs/common';
import { RemoveController } from './api/remove.controller';
import { RemoveService } from './application/remove.service';
import { RemoveRepository } from './infrastructure/remove.repository';
import { UsersRepositoryPostgres } from '../../users/infrastructure/users.repository-postgres';
import { DevicesRepositoryPostgres } from '../../devices/infrastructure/devices.repository-postgres';
import { PostgresService } from '../../../core/database/postgres.config';

@Module({
  imports: [],
  controllers: [RemoveController],
  providers: [
    RemoveService,
    RemoveRepository,
    UsersRepositoryPostgres,
    DevicesRepositoryPostgres,
    PostgresService,
  ],
})
export class RemoveModule {}
