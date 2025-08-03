import { DevicesController } from '@modules/devices/api/devices.controller';
import { Module } from '@nestjs/common';
import { DevicesService } from '@modules/devices/application/devices.service';
import { DevicesRepositoryPostgres } from './infrastructure/devices.repository-postgres';
import { PostgresService } from '../../core/database/postgres.config';

@Module({
  imports: [],
  controllers: [DevicesController],
  providers: [PostgresService, DevicesService, DevicesRepositoryPostgres],
  exports: [DevicesService, DevicesRepositoryPostgres],
})
export class DevicesModule {}
