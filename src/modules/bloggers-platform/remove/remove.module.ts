import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Blog, BlogSchema } from '../blogs/domain/blog.entity';
import { Post, PostSchema } from '../posts/domain/post.entity';
import { RemoveController } from './api/remove.controller';
import { RemoveService } from './application/remove.service';
import { RemoveRepository } from './infrastructure/remove.repository';
import { User, UserSchema } from '../../user-accounts/domain/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Blog.name, schema: BlogSchema },
      { name: Post.name, schema: PostSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RemoveController],
  providers: [RemoveService, RemoveRepository],
})
export class RemoveModule {}
