import { IsString, IsNotEmpty, IsUrl, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateBlogInputDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @Length(1, 15, { message: 'Name must be between 1 and 15 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description should not be empty' })
  @Length(1, 500, {
    message: 'Description must be between 1 and 500 characters',
  })
  @Transform(({ value }) => value?.trim())
  description: string;

  @IsUrl({}, { message: 'Website URL must be a valid URL' })
  @IsNotEmpty({ message: 'Website URL should not be empty' })
  @Length(1, 100, {
    message: 'Website URL must be between 1 and 100 characters',
  })
  @Matches(
    /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z0-9-]+(\/[a-zA-Z0-9-._~:?#[\]@!$&'()*+,;=]*)?$/,
    {
      message: 'Website URL must be a valid HTTP/HTTPS URL',
    },
  )
  @Transform(({ value }) => value?.trim())
  websiteUrl: string;
}
