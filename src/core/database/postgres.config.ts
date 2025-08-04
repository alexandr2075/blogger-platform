import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: Number(process.env.POSTGRES_PORT),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });
  }

  async query(text: string, params?: any[]) {
    const client = await this.pool.connect();
    try {
      const res = await client.query(text, params);
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getClient() {
    return this.pool.connect();
  }
}
