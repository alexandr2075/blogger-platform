import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, IsNull } from 'typeorm';
import { Blog } from '../domain/blog.entity';

export interface CreateBlogDtoPg {
  name: string;
  description: string;
  websiteUrl: string;
}

export interface UpdateBlogDtoPg {
  name: string;
  description: string;
  websiteUrl: string;
}

@Injectable()
export class BlogsRepository {
  constructor(
    @InjectEntityManager()
        private readonly entityManager: EntityManager,
  ) {}

  private isUuid(id: string): boolean {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(id);
  }

  async findOrNotFoundFail(id: string): Promise<any> {
    try {
      const blog = await this.entityManager.findOne(Blog, {
        where: { id, deletedAt: IsNull() },
      });
      if (!blog) throw new NotFoundException('blog not found');
      return blog;
    } catch (error) {
      throw new NotFoundException('blog not found');
    }
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<any> {
    return this.findOrNotFoundFail(id);
  }

  async insert(dto: CreateBlogDtoPg): Promise<string> {
    const blog = this.entityManager.create(Blog, {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
    const saved = await this.entityManager.save(blog);
    return saved.id;
  }

  async update(id: string, dto: UpdateBlogDtoPg): Promise<void> {
    try {
      const result = await this.entityManager.update(
        Blog,
        { id, deletedAt: IsNull() },
        { name: dto.name, description: dto.description, websiteUrl: dto.websiteUrl },
      );
      if (!result.affected) throw new NotFoundException('blog not found');
    } catch (error) {
      throw new NotFoundException('blog not found');
    }
  }

  async softDelete(id: string): Promise<void> {
    try {
      const result = await this.entityManager.update(
        Blog,
        { id, deletedAt: IsNull() },
        { deletedAt: new Date().toISOString() },
      );
      if (!result.affected) throw new NotFoundException('blog not found');
    } catch (error) {
      throw new NotFoundException('blog not found');
    }
  }
}
