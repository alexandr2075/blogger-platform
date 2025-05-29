import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../blogs/domain/blog.entity';
import { Post, PostSchema } from '../posts/domain/post.entity';
import { RemoveController } from './api/remove.controller';
import { RemoveService } from './application/remove.service';
import { RemoveRepository } from './infrastructure/remove.repository';
import { User, UserSchema } from '../../users/domain/user.entity';
import { Comment, CommentSchema } from '../comments/domain/comment.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Blog.name, schema: BlogSchema },
      { name: User.name, schema: UserSchema },
      { name: Comment.name, schema: CommentSchema },
    ]),
  ],
  controllers: [RemoveController],
  providers: [RemoveService, RemoveRepository],
})
export class RemoveModule {}
