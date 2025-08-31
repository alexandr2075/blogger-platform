import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique, Index } from 'typeorm';
import { User } from '@modules/users/domain/user.entity';
import { Post } from '@modules/bloggers-platform/posts/domain/post.entity';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Entity('likes')
@Unique(['postId', 'userId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: LikeStatus;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  post: Post;

  @Column({ name: 'postId' })
  postId: string;

  @Column({ name: 'addedAt', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  addedAt: Date;
}
