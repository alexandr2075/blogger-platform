import { UserDocument } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CommandHandler } from '@nestjs/cqrs';

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: DeleteUserCommand) {
    const user: UserDocument = await this.usersRepository.findOrNotFoundFail(
      command.id,
    );
    user.makeDeleted();

    await this.usersRepository.save(user);
  }
}
