import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Device } from '@modules/devices/domain/device.entity';
import { Blog } from '@modules/bloggers-platform/blogs/domain/blog.entity';
import { Post } from '@modules/bloggers-platform/posts/domain/post.entity';
import { Like } from '@modules/bloggers-platform/posts/domain/like.entity';
import { Comment } from '@modules/bloggers-platform/comments/domain/comment.entity';
import { ConfirmedStatus } from './email.confirmation.interface';
import { Player } from '@/modules/game-quiz/domain/player.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  login: string;

  @Column()
  email: string;

  @Column({ name: 'passwordHash' })
  passwordHash: string;

  @Column({ name: 'confirmationCode', type: 'varchar', nullable: true })
  confirmationCode: string | null;

  @Column({ name: 'isConfirmed', type: 'enum', enum: ConfirmedStatus, nullable: true })
  isConfirmed?: ConfirmedStatus;
  
  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => Blog, (blog) => blog.user)
  blogs: Blog[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];


  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @DeleteDateColumn({ name: 'deletedAt', type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date | null;

  @Column({ name: 'createdAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

}