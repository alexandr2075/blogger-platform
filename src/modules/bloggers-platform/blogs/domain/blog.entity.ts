import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '@modules/users/domain/user.entity';
import { Post } from '@modules/bloggers-platform/posts/domain/post.entity';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ name: 'websiteUrl' })
  websiteUrl: string;

  @Column({ name: 'isMembership', default: false })
  isMembership: boolean;

  @Column({ name: 'createdAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: string;

  @Column({ name: 'deletedAt', type: 'timestamp with time zone', nullable: true })
  deletedAt: string | null;

  @OneToMany(() => Post, (post: Post) => post.blog)
  posts: Post[];

  @ManyToOne(() => User, (user) => user.blogs, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId: string | null;
}
