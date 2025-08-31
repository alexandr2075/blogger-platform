import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsString,
  IsUrl,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class BlogViewDto {
  @ApiProperty({
    description: 'ID блога',
    example: '659c5e9a6b858c4b4a3b8b9f',
  })
  @IsString()
  @Matches(/^[0-9a-fA-F]{24}$/, {
    message: 'ID должен быть в формате MongoDB ObjectId',
  })
  id: string;

  @ApiProperty({
    description: 'Название блога',
    example: 'Мой технический блог',
    minLength: 1,
    maxLength: 15,
  })
  @IsString()
  @Length(1, 15, {
    message: 'Название блога должно быть от 1 до 15 символов',
  })
  name: string;

  @ApiProperty({
    description: 'Описание блога',
    example: 'Блог о программировании и технологиях',
    minLength: 1,
    maxLength: 500,
  })
  @IsString()
  @Length(1, 500, {
    message: 'Описание блога должно быть от 1 до 500 символов',
  })
  description: string;

  @ApiProperty({
    description: 'URL сайта блога',
    example: 'https://my-tech-blog.example.com',
  })
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: 'websiteUrl должен быть валидным URL с протоколом http/https',
    },
  )
  websiteUrl: string;

  @ApiProperty({
    description: 'Дата создания блога',
    example: '2024-01-09T12:34:56.789Z',
  })
  @IsDate()
  @Transform(({ value }) => new Date(value))
  createdAt: Date;

  @ApiProperty({
    description: 'Флаг членства',
    example: false,
  })
  @IsBoolean()
  isMembership: boolean;

  static mapToView(blog): BlogViewDto {
    const dto = new BlogViewDto();
    dto.id = blog._id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.createdAt = blog.createdAt;
    dto.isMembership = blog.isMembership;
    return dto;
  }
}
