import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../../core/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../../core/guards/jwt-auth.guard";
import { AnswerRequestDto } from "../dto/answer.request-dto";
import { GamePublicService } from "./game.service";


@Controller('pair-game-quiz')
export class GamePublicController {
    constructor(
        private readonly gamePublicService: GamePublicService,
    ) {}
    @UseGuards(JwtAuthGuard)
    @Get('pairs/my-current')
    async myCurrentPair(@CurrentUser() userId: string) {
        return this.gamePublicService.getCurrentPair(userId);
    }
    @UseGuards(JwtAuthGuard)
    @Get('pairs/my')
    async myGames(
        @CurrentUser() userId: string,
        @Query('pageNumber') pageNumber?: string,
        @Query('pageSize') pageSize?: string,
        @Query('sortBy') sortBy?: string,
        @Query('sortDirection') sortDirection?: 'asc' | 'desc',
    ) {
        return this.gamePublicService.getMyGames(
            userId,
            Number(pageNumber),
            Number(pageSize),
            sortBy,
            sortDirection,
        );
    }
    @UseGuards(JwtAuthGuard)
    @Post('pairs/my-current/answers')
    @HttpCode(200)
    async submitAnswer(@Body() answerDto: AnswerRequestDto, @CurrentUser() userId: string) {
        return this.gamePublicService.submitAnswer(answerDto.answer, userId);
    }
    @UseGuards(JwtAuthGuard)
    @Get('users/my-statistic')
    async myStatistic(@CurrentUser() userId: string) {
        return this.gamePublicService.getMyStatistic(userId);
    }

    @Get('users/top')
    async usersTop(
        @Query('sort') sort?: string[] | string,
        @Query('pageNumber') pageNumber?: string,
        @Query('pageSize') pageSize?: string,
    ) {
        const sortArray = Array.isArray(sort) ? sort : (sort ? [sort] : undefined);
        return this.gamePublicService.getUsersTop(sortArray, Number(pageNumber), Number(pageSize));
    }
    @UseGuards(JwtAuthGuard)
    @Get('pairs/:id')
    async getPairById(@Param('id') id: string, @CurrentUser() userId: string) {
        return this.gamePublicService.getPairById(id, userId);
    }
    @UseGuards(JwtAuthGuard)
    @Post('pairs/connection')
    @HttpCode(200)
    async connection(@CurrentUser() userId: string) {
        return this.gamePublicService.connection(userId);
    }
}