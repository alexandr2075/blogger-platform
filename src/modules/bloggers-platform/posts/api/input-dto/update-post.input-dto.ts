import { IsString, IsNotEmpty, MaxLength, IsMongoId } from 'class-validator';

// DTO для обновления поста
export class UpdatePostInputDto {
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(30, { message: 'Title must not exceed 30 characters' })
  title: string;

  @IsString({ message: 'Short description must be a string' })
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(100, { message: 'Short description must not exceed 100 characters' })
  shortDescription: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;

  @IsMongoId({ message: 'Blog ID must be a valid MongoDB ObjectId' })
  @IsNotEmpty({ message: 'Blog ID is required' })
  blogId: string;
}
