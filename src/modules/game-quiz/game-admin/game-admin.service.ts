import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { GameAdminRepository } from "./game-admin.repository";
import { CreateQuestionRequestDto } from "../dto/create-question.request-dto";
import { UpdateQuestionRequestDto } from "../dto/update-question.request-dto";
import { PublishQuestionRequestDto } from "../dto/publish-question.request-dto";
import { QuestionResponseDto } from "../dto/question.response-dto";
import { Questions } from "../domain/questions.entity";
import { GetQuestionsQueryDto } from "../dto/get-questions-query.dto";
import { QuestionsPaginatedResponseDto } from "../dto/questions-paginated.response-dto";

@Injectable()
export class GameAdminService {
    constructor(
        private readonly gameAdminRepository: GameAdminRepository,
    ) {}

    async createQuestion(createQuestionDto: CreateQuestionRequestDto): Promise<QuestionResponseDto> {
        const createdAt = new Date();
        const questionData: Partial<Questions> = {
            body: createQuestionDto.body,
            correctAnswers: createQuestionDto.correctAnswers,
            published: false,
            createdAt: createdAt,
            updatedAt: createdAt, // Set to same as createdAt for new questions
        };

        const savedQuestion = await this.gameAdminRepository.createQuestion(questionData);

        return {
            id: savedQuestion.id,
            body: savedQuestion.body,
            correctAnswers: savedQuestion.correctAnswers,
            published: savedQuestion.published,
            createdAt: savedQuestion.createdAt.toISOString(),
            updatedAt: savedQuestion.updatedAt.getTime() === savedQuestion.createdAt.getTime() ? null : savedQuestion.updatedAt.toISOString(),
        };
    }

    async getAllQuestions(query: GetQuestionsQueryDto): Promise<QuestionsPaginatedResponseDto> {
        const { items, totalCount } = await this.gameAdminRepository.findQuestionsWithPagination(query);
        
        const pageNumber = query.pageNumber || 1;
        const pageSize = query.pageSize || 10;
        const pagesCount = Math.ceil(totalCount / pageSize);

        return {
            pagesCount,
            page: pageNumber,
            pageSize,
            totalCount,
            items: items.map(question => this.mapToResponseDto(question))
        };
    }

    async updateQuestion(id: string, updateQuestionDto: UpdateQuestionRequestDto): Promise<void> {
        try {
            const existingQuestion = await this.gameAdminRepository.findQuestionById(id);
            if (!existingQuestion) {
                throw new NotFoundException('Question not found');
            }
        } catch (error) {
            // Handle PostgreSQL UUID validation error
            if (error.code === '22P02') {
                throw new NotFoundException('Question not found');
            }
            throw error;
        }

        // Validate business rules
        if (updateQuestionDto.published === true && (!updateQuestionDto.correctAnswers || updateQuestionDto.correctAnswers.length === 0)) {
            throw new BadRequestException({
                errorsMessages: [
                    {
                        message: 'correctAnswers are required when published is true',
                        field: 'correctAnswers'
                    }
                ]
            });
        }

        const updateData: Partial<Questions> = {
            body: updateQuestionDto.body,
            correctAnswers: updateQuestionDto.correctAnswers,
            updatedAt: new Date(),
        };

        // Only update published if it's provided
        if (updateQuestionDto.published !== undefined) {
            updateData.published = updateQuestionDto.published;
        }

        const updated = await this.gameAdminRepository.updateQuestion(id, updateData);
        if (!updated) {
            throw new NotFoundException('Question not found');
        }
    }

    async publishQuestion(id: string, publishQuestionDto: PublishQuestionRequestDto): Promise<void> {
        let existingQuestion;
        try {
            existingQuestion = await this.gameAdminRepository.findQuestionById(id);
            if (!existingQuestion) {
                throw new NotFoundException('Question not found');
            }
        } catch (error) {
            // Handle PostgreSQL UUID validation error
            if (error.code === '22P02') {
                throw new NotFoundException('Question not found');
            }
            throw error;
        }

        // Validate business rules - when publishing, question must have correct answers
        if (publishQuestionDto.published === true && (!existingQuestion.correctAnswers || existingQuestion.correctAnswers.length === 0)) {
            throw new BadRequestException({
                errorsMessages: [
                    {
                        message: 'Question must have correct answers to be published',
                        field: 'correctAnswers'
                    }
                ]
            });
        }

        const updateData: Partial<Questions> = {
            published: publishQuestionDto.published,
            updatedAt: new Date(),
        };

        const updated = await this.gameAdminRepository.updateQuestion(id, updateData);
        if (!updated) {
            throw new NotFoundException('Question not found');
        }
    }

    async deleteQuestion(id: string): Promise<void> {
        try {
            const question = await this.gameAdminRepository.findQuestionById(id);
            if (!question) {
                throw new NotFoundException('Question not found');
            }

            const deleted = await this.gameAdminRepository.deleteQuestion(id);
            if (!deleted) {
                throw new NotFoundException('Question not found');
            }
        } catch (error) {
            // Handle PostgreSQL UUID validation error
            if (error.code === '22P02') {
                throw new NotFoundException('Question not found');
            }
            throw error;
        }
    }

    private mapToResponseDto(question: Questions): QuestionResponseDto {
        return {
            id: question.id,
            body: question.body,
            correctAnswers: question.correctAnswers,
            published: question.published,
            createdAt: question.createdAt.toISOString(),
            updatedAt: question.updatedAt.getTime() === question.createdAt.getTime() ? null : question.updatedAt.toISOString(),
        };
    }
}