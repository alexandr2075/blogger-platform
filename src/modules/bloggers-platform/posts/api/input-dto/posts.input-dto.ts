import { IsString, IsNotEmpty, Length, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostInputDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  title: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  shortDescription: string;

  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @IsString()
  @IsNotEmpty()
  blogId: string;
}

export class CreatePostInputDtoWithBlogName {
  @IsString()
  @IsNotEmpty()
  @Length(1, 30)
  title: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  shortDescription: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1000)
  content: string;

  @IsString()
  @IsNotEmpty()
  blogId: string;

  @IsString()
  @IsNotEmpty()
  blogName: string;
}
