import { User } from '../../domain/user.entity';
import { UsersRepositoryPostgres } from '../../infrastructure/users.repository-postgres';
import { CommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase {
  constructor(
    private usersRepository: UsersRepositoryPostgres,
  ) {}

  async execute(command: DeleteUserCommand) {
    const user: User = await this.usersRepository.findOrNotFoundFail(
      command.id,
    );
    user.makeDeleted();

    await this.usersRepository.update(user);
  }
}
