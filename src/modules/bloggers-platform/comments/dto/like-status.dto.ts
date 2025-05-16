import { IsEnum, IsNotEmpty } from 'class-validator';

export enum LikeStatusEnum {
  None = 'None',
  Like = 'Like',
  Dislike = 'Dislike',
}

export class LikeStatusDto {
  @IsNotEmpty()
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}