import { IsString, IsArray, ArrayMinSize, MinLength } from 'class-validator';

export class CreateQuestionRequestDto {
    @IsString()
    @MinLength(10, { message: 'Body must be at least 10 characters long' })
    body: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'At least one correct answer is required' })
    @IsString({ each: true })
    correctAnswers: string[];
}
