import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBasicAuth, ApiParam } from '@nestjs/swagger';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { User } from '../domain/user.entity';
import { UsersService } from '../application/users.service';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { Public } from '../guards/decorators/public.decorator';
import { UsersQueryRepositoryPostgres } from '../infrastructure/users.query-repository-postgres';
import { GetUsersQueryParams } from './get-users-query-params.input-dto';
import { UpdateUserInputDto } from './input-dto/update-user.input-dto';
import { CreateUserInputDto } from './input-dto/users.input-dto';
import { UserViewDto } from './view-dto/users.view-dto';
import { CreateUserCommand } from '../application/use-cases/create-user-use-case';
// UserDocument no longer needed for PostgreSQL
import { UpdateUserCommand } from '../application/use-cases/update-user-use-case';
import { DeleteUserCommand } from '../application/use-cases/delete-user-use-case';

@UseGuards(BasicAuthGuard)
@ApiBasicAuth('basicAuth')
@Controller('users')
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepositoryPostgres,
    private usersService: UsersService,
    private commandBus: CommandBus,
  ) {}

  @Public()
  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @ApiParam({ name: 'id' }) //для сваггера
  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<UserViewDto> {
    return this.usersQueryRepository.getByIdOrNotFoundFail(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const user: User = await this.commandBus.execute(
      new CreateUserCommand(body),
    );
    return this.usersQueryRepository.getByIdOrNotFoundFail(user.id);
  }

  @ApiParam({ name: 'id', type: 'string' })
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserInputDto,
  ): Promise<UserViewDto> {
    const userId: string = await this.commandBus.execute(
      new UpdateUserCommand(body, id),
    );
    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id') id: string): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id));
  }
}
