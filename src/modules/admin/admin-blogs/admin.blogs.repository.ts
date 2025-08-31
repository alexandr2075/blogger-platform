import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Blog } from '@modules/bloggers-platform/blogs/domain/blog.entity';
import { Post } from '@modules/bloggers-platform/posts/domain/post.entity';
import { QueryBlogsDto } from './dto/query-blogs.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class AdminBlogsRepository {
  constructor(
    @InjectRepository(Blog)
    private readonly blogRepository: Repository<Blog>,
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAllBlogs(query: QueryBlogsDto) {
    const {
      searchNameTerm,
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.blogRepository
      .createQueryBuilder('blog')
      .where('blog.deletedAt IS NULL');

    if (searchNameTerm) {
      queryBuilder.andWhere('blog.name ILIKE :searchTerm', {
        searchTerm: `%${searchNameTerm}%`,
      });
    }

    // Apply sorting with proper column mapping
    const sortColumn = sortBy === 'createdAt' ? 'blog.createdAt' : `blog.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const offset = (pageNumber - 1) * pageSize;
    queryBuilder.skip(offset).take(pageSize);

    const [blogs, totalCount] = await queryBuilder.getManyAndCount();

    return {
      blogs,
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }

  async createBlog(dto: CreateBlogDto): Promise<Blog> {
    const blog = this.blogRepository.create({
      name: dto.name,
      description: dto.description,
      websiteUrl: dto.websiteUrl,
      isMembership: false,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      userId: null,
    });

    return await this.blogRepository.save(blog);
  }

  async findBlogById(id: string): Promise<Blog | null> {
    return await this.blogRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<boolean> {
    const result = await this.blogRepository.update(
      { id, deletedAt: IsNull() },
      {
        name: dto.name,
        description: dto.description,
        websiteUrl: dto.websiteUrl,
      }
    );

    return (result.affected ?? 0) > 0;
  }

  async deleteBlog(id: string): Promise<boolean> {
    const result = await this.blogRepository.update(
      { id, deletedAt: IsNull() },
      { deletedAt: new Date().toISOString() }
    );

    return (result.affected ?? 0) > 0;
  }

  async findPostsByBlogId(blogId: string, query: QueryPostsDto) {
    const {
      sortBy = 'createdAt',
      sortDirection = 'desc',
      pageNumber = 1,
      pageSize = 10,
    } = query;

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .where('post.blogId = :blogId', { blogId })
      .andWhere('post.deletedAt IS NULL');

    // Apply sorting
    const sortColumn = sortBy === 'createdAt' ? 'post.createdAt' : `post.${sortBy}`;
    queryBuilder.orderBy(sortColumn, sortDirection.toUpperCase() as 'ASC' | 'DESC');

    // Apply pagination
    const offset = (pageNumber - 1) * pageSize;
    queryBuilder.skip(offset).take(pageSize);

    const [posts, totalCount] = await queryBuilder.getManyAndCount();

    return {
      posts,
      totalCount,
      pagesCount: Math.ceil(totalCount / pageSize),
      page: pageNumber,
      pageSize,
    };
  }

  async createPost(blogId: string, dto: CreatePostDto): Promise<Post | null> {
    // First check if blog exists
    const blog = await this.findBlogById(blogId);
    if (!blog) {
      return null;
    }

    const post = this.postRepository.create({
      title: dto.title,
      shortDescription: dto.shortDescription,
      content: dto.content,
      blogId: blogId,
      blogName: blog.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      userId: null,
    });

    return await this.postRepository.save(post);
  }

  async findPostById(postId: string): Promise<Post | null> {
    return await this.postRepository.findOne({
      where: { id: postId, deletedAt: IsNull() },
    });
  }

  async updatePost(blogId: string, postId: string, dto: UpdatePostDto): Promise<boolean> {
    // Check if blog exists
    const blog = await this.findBlogById(blogId);
    if (!blog) {
      return false;
    }

    const result = await this.postRepository.update(
      { id: postId, blogId, deletedAt: IsNull() },
      {
        title: dto.title,
        shortDescription: dto.shortDescription,
        content: dto.content,
        updatedAt: new Date(),
      }
    );

    return (result.affected ?? 0) > 0;
  }

  async deletePost(blogId: string, postId: string): Promise<boolean> {
    // Check if blog exists
    const blog = await this.findBlogById(blogId);
    if (!blog) {
      return false;
    }

    const result = await this.postRepository.update(
      { id: postId, blogId, deletedAt: IsNull() },
      { deletedAt: new Date() }
    );

    return (result.affected ?? 0) > 0;
  }
}
