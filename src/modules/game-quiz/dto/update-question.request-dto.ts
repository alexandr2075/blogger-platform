import { IsString, IsArray, ArrayMinSize, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateQuestionRequestDto {
    @IsString()
    @MinLength(10, { message: 'Body must be at least 10 characters long' })
    @MaxLength(500, { message: 'Body must be at most 500 characters long' })
    body: string;

    @IsArray()
    @IsString({ each: true })
    correctAnswers: string[];

    @IsOptional()
    published?: boolean;
}
