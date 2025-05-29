import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Model } from 'mongoose';
import { LikeStatusEnum } from '../dto/like-status.dto';
import { CommentsInputDto } from '../dto/comments.input-dto';

@Schema({ timestamps: true })
export class Comment extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userLogin: string;

  @Prop({ required: true })
  postId: string;

  @Prop()
  likesCountArray: string[];

  @Prop()
  dislikesCountArray: string[];

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  static createInstance(dto: CommentsInputDto): CommentDocument {
    const comment = new this();
    comment.content = dto.content;
    comment.userId = dto.userId;
    comment.userLogin = dto.userLogin;
    comment.postId = dto.postId;
    comment.createdAt = new Date();
    comment.likesCountArray = [];
    comment.dislikesCountArray = [];
    return comment as CommentDocument;
  }
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
CommentSchema.loadClass(Comment);

export type CommentDocument = HydratedDocument<Comment>;
export type CommentModelType = Model<CommentDocument> & typeof Comment;
