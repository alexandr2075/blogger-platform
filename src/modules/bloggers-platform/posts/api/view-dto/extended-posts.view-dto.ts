import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum LikeStatus {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

@Schema({ _id: false })
export class LikeDetails {
  @Prop({ default: Date.now })
  addedAt: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  login: string;
}

@Schema({ _id: false })
export class ExtendedLikesInfo {
  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  dislikesCount: number;

  @Prop({ enum: LikeStatus, default: LikeStatus.None })
  myStatus: LikeStatus;

  @Prop({ type: [LikeDetails], default: [] })
  newestLikes: LikeDetails[];
}

export const LikeDetailsSchema = SchemaFactory.createForClass(LikeDetails);
export const ExtendedLikesInfoSchema =
  SchemaFactory.createForClass(ExtendedLikesInfo);
