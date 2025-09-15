import { IsBoolean } from 'class-validator';

export class PublishQuestionRequestDto {
    @IsBoolean()
    published: boolean;
}
