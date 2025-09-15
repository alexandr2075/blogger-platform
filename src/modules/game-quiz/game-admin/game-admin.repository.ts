import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { Questions } from "../domain/questions.entity";
import { GetQuestionsQueryDto, PublishedStatus } from "../dto/get-questions-query.dto";

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
}

@Injectable()
export class GameAdminRepository {
    constructor(
        @InjectRepository(Questions)
        private readonly questionsRepository: Repository<Questions>,
    ) {}

    async createQuestion(questionData: Partial<Questions>): Promise<Questions> {
        const question = this.questionsRepository.create(questionData);
        return this.questionsRepository.save(question);
    }

    async findQuestionsWithPagination(query: GetQuestionsQueryDto): Promise<PaginatedResult<Questions>> {
        const queryBuilder = this.questionsRepository.createQueryBuilder('q');

        // Apply filters
        this.applyFilters(queryBuilder, query);

        // Apply sorting
        const sortBy = this.getSortField(query.sortBy || 'createdAt');
        queryBuilder.orderBy(`q.${sortBy}`, (query.sortDirection || 'desc').toUpperCase() as 'ASC' | 'DESC');

        // Apply pagination
        const pageNumber = query.pageNumber || 1;
        const pageSize = query.pageSize || 10;
        const skip = (pageNumber - 1) * pageSize;
        queryBuilder.skip(skip).take(pageSize);

        // Get results and total count
        const [items, totalCount] = await queryBuilder.getManyAndCount();

        return { items, totalCount };
    }

    private applyFilters(queryBuilder: SelectQueryBuilder<Questions>, query: GetQuestionsQueryDto): void {
        // Filter by body search term
        if (query.bodySearchTerm) {
            queryBuilder.andWhere('q.body ILIKE :searchTerm', { 
                searchTerm: `%${query.bodySearchTerm}%` 
            });
        }

        // Filter by published status
        if (query.publishedStatus && query.publishedStatus !== PublishedStatus.ALL) {
            const isPublished = query.publishedStatus === PublishedStatus.PUBLISHED;
            queryBuilder.andWhere('q.published = :published', { published: isPublished });
        }
    }

    async deleteQuestion(id: string): Promise<boolean> {
        const result = await this.questionsRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }

    async findQuestionById(id: string): Promise<Questions | null> {
        return this.questionsRepository.findOne({ where: { id } });
    }

    async updateQuestion(id: string, updateData: Partial<Questions>): Promise<boolean> {
        const result = await this.questionsRepository.update(id, updateData);
        return (result.affected ?? 0) > 0;
    }

    private getSortField(sortBy: string): string {
        const allowedSortFields = ['createdAt', 'updatedAt', 'body', 'published'];
        return allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    }
}