import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, Length, Matches } from 'class-validator';

export class CreateBlogInputDto {
  @ApiProperty({
    description: 'Название блога (1-15 символов)',
    example: 'Мой технический блог',
  })
  @IsNotEmpty({ message: 'Name should not be empty' })
  @IsString({ message: 'Name must be a string' })
  @Transform(({ value }) => value?.trim())
  @Length(1, 15, {
    message: 'Название блога должно содержать от 1 до 15 символов',
  })
  @Matches(/^[a-zA-Zа-яА-Я0-9\s]+$/, {
    message: 'Название может содержать только буквы, цифры и пробелы',
  })
  name: string;

  @ApiProperty({
    description: 'Описание блога (1-500 символов)',
    example: 'Блог о программировании и новых технологиях',
  })
  @IsString()
  @Length(1, 500, {
    message: 'Описание должно содержать от 1 до 500 символов',
  })
  description: string;

  @ApiProperty({
    description: 'URL сайта блога (должен начинаться с http/https)',
    example: 'https://my-tech-blog.example.com',
  })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
      require_valid_protocol: true,
    },
    {
      message: 'Неверный формат URL. Должен начинаться с http:// или https://',
    },
  )
  @Length(10, 100, {
    message: 'websiteUrl must be longer than or equal to 10 characters',
  })
  websiteUrl: string;
}

export class BlogPostInputDto {
  @ApiProperty({
    description: 'Заголовок поста (1-30 символов)',
    example: 'Новые тенденции в разработке',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 30, {
    message: 'Заголовок должен содержать от 1 до 30 символов',
  })
  @Matches(/^[a-zA-Zа-яА-Я0-9\s.,!?-]+$/, {
    message: 'Заголовок содержит недопустимые символы',
  })
  title: string;

  @ApiProperty({
    description: 'Краткое описание (1-100 символов)',
    example: 'Обзор новых технологий 2024 года',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 100, {
    message: 'Краткое описание должно содержать от 1 до 100 символов',
  })
  shortDescription: string;

  @ApiProperty({
    description: 'Содержание поста (1-1000 символов)',
    example: 'В этой статье мы рассмотрим основные тренды...',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @Length(1, 1000, {
    message: 'Содержание должно быть от 1 до 1000 символов',
  })
  content: string;
}
