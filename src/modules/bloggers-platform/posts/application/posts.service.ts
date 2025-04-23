import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsQueryRepository } from '../../blogs/infrastructure/blogs.query-repository';
import { PostViewDto } from '../../posts/api/view-dto/posts.view-dto';
import { CreatePostInputDto } from '../api/input-dto/posts.input-dto';
import { UpdatePostInputDto } from '../api/input-dto/update-post.input-dto';
import { Post, PostModelType } from '../domain/post.entity';
import { PostsRepository } from '../infrastructure/posts.repository';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    private postsRepository: PostsRepository,
    private blogsQueryRepository: BlogsQueryRepository,
  ) {}

  async createPost(dto: CreatePostInputDto): Promise<PostViewDto> {
    const blog = await this.blogsQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );
    const post = this.PostModel.createInstance({ ...dto, blogName: blog.name });
    await this.postsRepository.save(post);
    return PostViewDto.mapToView(post);
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
