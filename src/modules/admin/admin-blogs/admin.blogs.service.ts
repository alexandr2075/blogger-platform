import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminBlogsRepository } from './admin.blogs.repository';
import { QueryBlogsDto } from './dto/query-blogs.dto';
import { QueryPostsDto } from './dto/query-posts.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class AdminBlogsService {
  constructor(private readonly adminBlogsRepository: AdminBlogsRepository) {}

  async getAllBlogs(query: QueryBlogsDto) {
    const result = await this.adminBlogsRepository.findAllBlogs(query);
    
    return {
      pagesCount: result.pagesCount,
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      items: result.blogs.map(blog => ({
        id: blog.id,
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      })),
    };
  }

  async createBlog(dto: CreateBlogDto) {
    const blog = await this.adminBlogsRepository.createBlog(dto);
    
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  async updateBlog(id: string, dto: UpdateBlogDto): Promise<void> {
    const updated = await this.adminBlogsRepository.updateBlog(id, dto);
    
    if (!updated) {
      throw new NotFoundException('Blog not found');
    }
  }

  async deleteBlog(id: string): Promise<void> {
    const deleted = await this.adminBlogsRepository.deleteBlog(id);
    
    if (!deleted) {
      throw new NotFoundException('Blog not found');
    }
  }

  async getBlogPosts(blogId: string, query: QueryPostsDto) {
    // First check if blog exists
    const blog = await this.adminBlogsRepository.findBlogById(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const result = await this.adminBlogsRepository.findPostsByBlogId(blogId, query);
    
    return {
      pagesCount: result.pagesCount,
      page: result.page,
      pageSize: result.pageSize,
      totalCount: result.totalCount,
      items: result.posts.map(post => ({
        id: post.id,
        title: post.title,
        shortDescription: post.shortDescription,
        content: post.content,
        blogId: post.blogId,
        blogName: post.blogName,
        createdAt: post.createdAt,
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: 'None',
          newestLikes: [],
        },
      })),
    };
  }

  async createBlogPost(blogId: string, dto: CreatePostDto) {
    const post = await this.adminBlogsRepository.createPost(blogId, dto);
    
    if (!post) {
      throw new NotFoundException('Blog not found');
    }
    
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: 'None',
        newestLikes: [],
      },
    };
  }

  async updateBlogPost(blogId: string, postId: string, dto: UpdatePostDto): Promise<void> {
    const updated = await this.adminBlogsRepository.updatePost(blogId, postId, dto);
    
    if (!updated) {
      throw new NotFoundException('Blog or post not found');
    }
  }

  async deleteBlogPost(blogId: string, postId: string): Promise<void> {
    const deleted = await this.adminBlogsRepository.deletePost(blogId, postId);
    
    if (!deleted) {
      throw new NotFoundException('Blog or post not found');
    }
  }
}
