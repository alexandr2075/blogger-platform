import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class MigrationRunnerService implements OnApplicationBootstrap {
  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'testing') {
      await this.dataSource.runMigrations();
    }
  }
}


