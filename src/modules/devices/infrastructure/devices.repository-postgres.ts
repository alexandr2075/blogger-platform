import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../domain/device.entity';

@Injectable()
export class DevicesRepositoryPostgres {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}

  async create(device: Device): Promise<Device> {
    return this.deviceRepository.save(device);
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    return this.deviceRepository.findOneBy({ deviceId });
  }

  async findByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<Device | null> {
    return this.deviceRepository.findOneBy({ userId, deviceId });
  }

  async findAllByUserId(userId: string): Promise<Device[]> {
    return this.deviceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteByDeviceId(deviceId: string): Promise<void> {
    await this.deviceRepository.delete({ deviceId });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.deviceRepository.delete({ userId });
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentDeviceId: string,
  ): Promise<void> {
    await this.deviceRepository
      .createQueryBuilder()
      .delete()
      .from(Device)
      .where('userId = :userId', { userId })
      .andWhere('deviceId != :currentDeviceId', { currentDeviceId })
      .execute();
  }

  async updateIat(
    userId: string,
    deviceId: string,
    newIat: number,
    newExp: number,
  ): Promise<void> {
    await this.deviceRepository.update({ userId, deviceId }, { iat: newIat, exp: newExp });
  }

  async deleteByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<void> {
    await this.deviceRepository.delete({ userId, deviceId });
  }

  async deleteAll(): Promise<void> {
    await this.deviceRepository.clear();
  }
}
