import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBlogInputDto } from '../api/input-dto/blogs.input-dto';
import { UpdateBlogInputDto } from '../api/input-dto/update-blog.input-dto';
import { Blog, BlogModelType } from '../domain/blog.entity';
import { BlogsRepository } from '../infrastructure/blogs.repository';

@Injectable()
export class BlogsService {
  constructor(
    @InjectModel(Blog.name)
    private BlogModel: BlogModelType,
    private blogsRepository: BlogsRepository,
  ) {}

  async createBlog(dto: CreateBlogInputDto): Promise<string> {
    const blog = this.BlogModel.createInstance(dto);
    await this.blogsRepository.save(blog);
    return blog._id.toString();
  }

  async updateBlog(id: string, dto: UpdateBlogInputDto): Promise<void> {
    const blog = await this.blogsRepository.findOrNotFoundFail(id);
    blog.update(dto);
    await this.blogsRepository.save(blog);
  }

  async deleteBlog(id: string): Promise<void> {
    const blog = await this.blogsRepository.findNonDeletedOrNotFoundFail(id);
    blog.makeDeleted();
    await this.blogsRepository.save(blog);
  }
}
