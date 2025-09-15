import { Controller, Get, Post, UseGuards, Param, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../../../core/guards/jwt-auth.guard";
import { GamePublicService } from "./game.service";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { AnswerRequestDto } from "../dto/answer.request-dto";

@UseGuards(JwtAuthGuard)
@Controller('pair-game-quiz/pairs')
export class GamePublicController {
    constructor(
        private readonly gamePublicService: GamePublicService,
    ) {}

    @Get('my-current')
    async myCurrentPair(@CurrentUser() userId: string) {
        return this.gamePublicService.getCurrentPair(userId);
    }

    @Post('my-current/answers')
    async submitAnswer(@Body() answerDto: AnswerRequestDto, @CurrentUser() userId: string) {
        return this.gamePublicService.submitAnswer(answerDto.answer, userId);
    }

    @Get(':id')
    async getPairById(@Param('id') id: string, @CurrentUser() userId: string) {
        return this.gamePublicService.getPairById(id, userId);
    }

    @Post('connection')
    async connection(@CurrentUser() userId: string) {
        return this.gamePublicService.connection(userId);
    }
}