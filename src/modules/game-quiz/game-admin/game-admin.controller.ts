import { Controller, Get, Post, Put, Delete, UseGuards, Body, Query, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { BasicAuthGuard } from "@/core/guards/basic-auth.guard";
import { CreateQuestionRequestDto } from "../dto/create-question.request-dto";
import { UpdateQuestionRequestDto } from "../dto/update-question.request-dto";
import { PublishQuestionRequestDto } from "../dto/publish-question.request-dto";
import { GetQuestionsQueryDto } from "../dto/get-questions-query.dto";
import { QuestionsPaginatedResponseDto } from "../dto/questions-paginated.response-dto";
import { GameAdminService } from "./game-admin.service";

@UseGuards(BasicAuthGuard)
@Controller('sa/quiz/questions')
export class GameAdminController {
    constructor(
        private readonly gameAdminService: GameAdminService,
    ) {}

    @Post()
    async createQuestion(@Body() createQuestionDto: CreateQuestionRequestDto) {
        return this.gameAdminService.createQuestion(createQuestionDto);
    }

    @Get()
    async getAllQuestions(@Query() query: GetQuestionsQueryDto): Promise<QuestionsPaginatedResponseDto> {
        return this.gameAdminService.getAllQuestions(query);
    }

    @Put(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateQuestion(
        @Param('id') id: string,
        @Body() updateQuestionDto: UpdateQuestionRequestDto
    ): Promise<void> {
        await this.gameAdminService.updateQuestion(id, updateQuestionDto);
    }

    @Put(':id/publish')
    @HttpCode(HttpStatus.NO_CONTENT)
    async publishQuestion(
        @Param('id') id: string,
        @Body() publishQuestionDto: PublishQuestionRequestDto
    ): Promise<void> {
        await this.gameAdminService.publishQuestion(id, publishQuestionDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteQuestion(@Param('id') id: string): Promise<void> {
        await this.gameAdminService.deleteQuestion(id);
    }
}