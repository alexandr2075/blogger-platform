import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    description: 'Контент комментария',
    example: 'Это обновленный комментарий',
    minLength: 20,
    maxLength: 300,
  })
  @IsString()
  @IsNotEmpty()
  @Length(20, 300, { message: 'Контент должен быть от 20 до 300 символов' })
  content: string;
}
