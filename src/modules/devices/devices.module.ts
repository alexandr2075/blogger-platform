import { DevicesController } from '@modules/devices/api/devices.controller';
import { Module } from '@nestjs/common';
import { DevicesService } from '@modules/devices/application/devices.service';
import { DevicesRepositoryPostgres } from './infrastructure/devices.repository-postgres';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './domain/device.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  controllers: [DevicesController],
  providers: [DevicesService, DevicesRepositoryPostgres],
  exports: [DevicesService, DevicesRepositoryPostgres],
})
export class DevicesModule {}

