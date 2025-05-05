import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}
//базовый класс для query параметров с пагинацией
//значения по-умолчанию применятся автоматически при настройке глобального ValidationPipe в main.ts

export class BaseQueryParams {
  @IsOptional()
  @Type(() => Number)
  pageNumber: number = 1;

  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10;

  @IsOptional()
  @IsEnum(SortDirection)
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
