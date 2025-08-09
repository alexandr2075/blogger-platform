import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresService } from '../../../core/database/postgres.config';

export interface AdminCreateBlogDto {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface AdminUpdateBlogDto {
  name: string;
  description: string;
  websiteUrl: string;
}

@Injectable()
export class AdminBlogsRepository {
  constructor(private readonly postgres: PostgresService) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  async getByIdOrNotFoundFail(id: string) {
    if (!this.isUuid(id)) throw new NotFoundException('blog not found');
    const rows = await this.postgres.query(
      `SELECT * FROM blogs WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('blog not found');
    return rows[0];
  }

  async create(dto: AdminCreateBlogDto): Promise<string> {
    const rows = await this.postgres.query(
      `INSERT INTO blogs (name, description, website_url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [dto.name, dto.description, dto.websiteUrl],
    );
    return rows[0].id as string;
  }

  async update(id: string, dto: AdminUpdateBlogDto): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('blog not found');
    const rows = await this.postgres.query(
      `UPDATE blogs
       SET name = $1, description = $2, website_url = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND deleted_at IS NULL
       RETURNING id`,
      [dto.name, dto.description, dto.websiteUrl, id],
    );
    if (rows.length === 0) throw new NotFoundException('blog not found');
  }

  async delete(id: string): Promise<void> {
    if (!this.isUuid(id)) throw new NotFoundException('blog not found');
    const rows = await this.postgres.query(
      `UPDATE blogs SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    );
    if (rows.length === 0) throw new NotFoundException('blog not found');
  }
}
