import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export enum PublishedStatus {
    ALL = 'all',
    PUBLISHED = 'published',
    NOT_PUBLISHED = 'notPublished'
}

export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc'
}

export class GetQuestionsQueryDto {
    @IsOptional()
    @IsString()
    bodySearchTerm?: string;

    @IsOptional()
    @IsEnum(PublishedStatus)
    publishedStatus?: PublishedStatus = PublishedStatus.ALL;

    @IsOptional()
    @IsString()
    sortBy?: string = 'createdAt';

    @IsOptional()
    @IsEnum(SortDirection)
    sortDirection?: SortDirection = SortDirection.DESC;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @Min(1)
    pageNumber?: number = 1;

    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsInt()
    @Min(1)
    @Max(100)
    pageSize?: number = 10;
}
