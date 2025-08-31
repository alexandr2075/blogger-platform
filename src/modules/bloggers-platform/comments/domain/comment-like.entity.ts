import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Comment } from './comment.entity';
import { User } from '@modules/users/domain/user.entity';

@Entity('comment_likes')
@Unique(['commentId', 'userId'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  commentId: string;

  @Column()
  userId: string;

  @Column({ type: 'varchar', length: 10 })
  status: 'Like' | 'Dislike';

  @CreateDateColumn({ name: 'addedAt', type: 'timestamp with time zone' })
  addedAt: Date;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE' })
  comment: Comment;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
