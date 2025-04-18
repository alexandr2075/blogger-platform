import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreatePostInputDto } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private blogsQueryRepository: BlogsQueryRepository
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<PostDocument> {
    const blog = await this.blogsQueryRepository.getByIdOrNotFoundFail(dto.blogId)
    const post = Post.createInstance({...dto, blogName: blog.name});
    await this.postsRepository.save(post);
    return post
  }

  async updatePost(id: string, dto: UpdatePostInputDto): Promise<void> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(id);
    post.update(dto);
    await this.postsRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postsRepository.findNonDeletedOrNotFoundFail(id);
    post.makeDeleted();
    await this.postsRepository.save(post);
  }
} 