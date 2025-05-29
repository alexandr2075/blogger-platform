import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CommentsInputDto {
  @IsNotEmpty({ message: 'Content should not be empty' })
  @IsString({ message: 'Content should be a string' })
  @Length(20, 300, { message: 'Content must be between 20 and 300 characters' })
  content: string;

  @IsNotEmpty({ message: 'UserId should not be empty' })
  @IsString({ message: 'UserId should be a string' })
  userId: string;

  @IsNotEmpty({ message: 'UserLogin should not be empty' })
  @IsString({ message: 'UserLogin should be a string' })
  @Length(3, 10, { message: 'UserLogin must be between 3 and 10 characters' })
  userLogin: string;

  @IsNotEmpty({ message: 'PostId should not be empty' })
  @IsString({ message: 'PostId should be a string' })
  postId: string;
}
