import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

// DTO для обновления поста
export class UpdatePostInputDto {
  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title is required' })
  @MaxLength(30, { message: 'Title must not exceed 30 characters' })
  title: string;

  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Short description must be a string' })
  @IsNotEmpty({ message: 'Short description is required' })
  @MaxLength(100, {
    message: 'Short description must not exceed 100 characters',
  })
  shortDescription: string;

  @Transform(({ value }) => value?.trim())
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;

  @IsUUID('4', { message: 'Blog ID must be a valid UUID v4' })
  @IsNotEmpty({ message: 'Blog ID is required' })
  blogId: string;
}
