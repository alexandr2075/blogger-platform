import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@modules/users/domain/user.entity';
import { Blog } from '@modules/bloggers-platform/blogs/domain/blog.entity';
import { Like } from '@modules/bloggers-platform/posts/domain/like.entity';
import { Comment } from '@modules/bloggers-platform/comments/domain/comment.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ name: 'shortDescription' })
  shortDescription: string;

  @Column()
  content: string;

  @Column({ name: 'createdAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updatedAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ name: 'deletedAt', type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => Blog, (blog: Blog) => blog.posts, { onDelete: 'CASCADE' })
  blog: Blog;

  @Column({ name: 'blogId' })
  blogId: string;

  @Column({ name: 'blogName' })
  blogName: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'userId', nullable: true })
  userId: string | null;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];
}

