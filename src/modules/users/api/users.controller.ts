import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiParam } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { User } from '../domain/user.entity';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { Public } from '../guards/decorators/public.decorator';
import { UsersQueryRepository } from '../infrastructure/users.query-repository';
import { GetUsersQueryParams } from './get-users-query-params.input-dto';
import { UpdateUserInputDto } from './input-dto/update-user.input-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UserViewDto } from './view-dto/users.view-dto';
import { CreateUserCommand } from '../application/use-cases/create-user-use-case';
import { UpdateUserCommand } from '../application/use-cases/update-user-use-case';
import { DeleteUserCommand } from '../application/use-cases/delete-user-use-case';

@UseGuards(BasicAuthGuard)
@ApiBasicAuth('basicAuth')
@Controller('users')
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Public()
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    const [users, totalCount] = await this.usersQueryRepository.getAllAndCount(
      query,
    );
    const items = users.map((u) => UserViewDto.mapToView(u));
    return PaginatedViewDto.mapToView<UserViewDto[]>({
      items,
      page: query.pageNumber,
      size: query.pageSize,
      totalCount,
    });
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Get(':id')
  async getById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserViewDto> {
    return this.usersQueryRepository.getOneById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const user: User = await this.commandBus.execute(
      new CreateUserCommand(body),
    );
    const created = await this.usersQueryRepository.getOneById(user.id);
    if (!created) {
      throw new NotFoundException('User not found after creation');
    }
    return created;
  }

  @ApiParam({ name: 'id', type: 'string' })
  @Put(':id')
  async updateUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateUserInputDto,
  ): Promise<UserViewDto> {
    const userId: string = await this.commandBus.execute(
      new UpdateUserCommand(body, id),
    );
    return this.usersQueryRepository.getOneById(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
