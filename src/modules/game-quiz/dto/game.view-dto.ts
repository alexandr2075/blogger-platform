export type GameStatus = 'PendingSecondPlayer' | 'Active' | 'Finished';
export type AnswerStatus = 'Correct' | 'Incorrect';

export class PlayerDto {
  id: string;
  login: string;
}

export class AnswerDto {
  questionId: string;
  answerStatus: AnswerStatus;
  addedAt: string;
}

export class PlayerProgressDto {
  answers: AnswerDto[];
  player: PlayerDto;
  score: number;
}

export class QuestionDto {
  id: string;
  body: string;
}

export class GameViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressDto;
  secondPlayerProgress: PlayerProgressDto | null;
  questions: QuestionDto[];
  status: GameStatus;
  pairCreatedDate: string;
  startGameDate: string | null;
  finishGameDate: string | null;
}