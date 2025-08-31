import { Module } from '@nestjs/common';
import { RemoveController } from './api/remove.controller';
import { RemoveService } from './application/remove.service';
import { RemoveRepository } from './infrastructure/remove.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../../devices/domain/device.entity';
import { User } from '../../users/domain/user.entity';
import { Blog } from '../blogs/domain/blog.entity';
import { Post } from '../posts/domain/post.entity';
import { Like } from '../posts/domain/like.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Device,
      User,
      Blog,
      Post,
      Like,
    ]),
  ],
  controllers: [RemoveController],
  providers: [RemoveService, RemoveRepository],
})
export class RemoveModule {}
