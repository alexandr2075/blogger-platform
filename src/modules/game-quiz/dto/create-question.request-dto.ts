import { IsString, IsArray, ArrayMinSize, MinLength, MaxLength } from 'class-validator';

export class CreateQuestionRequestDto {
    @IsString()
    @MinLength(10, { message: 'Body must be at least 10 characters long' })
    @MaxLength(500, { message: 'Body must be at most 500 characters long' })
    body: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one correct answer is required' })
    @IsString({ each: true })
    correctAnswers: string[];
}
