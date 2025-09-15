import { QuestionResponseDto } from './question.response-dto';

export class QuestionsPaginatedResponseDto {
    pagesCount: number;
    page: number;
    pageSize: number;
    totalCount: number;
    items: QuestionResponseDto[];
}
