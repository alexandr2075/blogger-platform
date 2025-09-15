import { IsString, IsNotEmpty } from 'class-validator';

export class AnswerRequestDto {
    @IsString()
    @IsNotEmpty()
    answer: string;
}
