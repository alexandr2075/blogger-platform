import { User } from '../../domain/user.entity';
import { UsersRepositoryPostgres } from '../../infrastructure/users.repository-postgres';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateUserInputDto } from '../../api/input-dto/update-user.input-dto';

export class UpdateUserCommand {
  constructor(
    public dto: UpdateUserInputDto,
    public id: string,
  ) {}
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserUseCase {
  constructor(
    private usersRepository: UsersRepositoryPostgres,
  ) {}

  async execute(command: UpdateUserCommand) {
    const user: User = await this.usersRepository.findOrNotFoundFail(
      command.id,
    );

    user.update(command.dto);

    await this.usersRepository.update(user);

    return user.id;
  }
}
