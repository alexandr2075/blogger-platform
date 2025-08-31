import { Injectable } from '@nestjs/common';
import { CreateBlogInputDto } from '../api/input-dto/blogs.input-dto';
import { UpdateBlogInputDto } from '../api/input-dto/update-blog.input-dto';
import { BlogsRepository } from '../infrastructure/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    private blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogInputDto): Promise<string> {
    return this.blogsRepository.insert({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
  }

  async updateBlog(id: string, dto: UpdateBlogInputDto): Promise<void> {
    await this.blogsRepository.update(id, {
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
    });
  }

  async deleteBlog(id: string): Promise<void> {
    await this.blogsRepository.softDelete(id);
  }
}
