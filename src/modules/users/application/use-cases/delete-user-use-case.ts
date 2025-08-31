import { BadRequestException } from '@nestjs/common';
import { UsersQueryRepository } from '../../infrastructure/users.query-repository';
import { CommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserViewDto } from '../../api/view-dto/users.view-dto';

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserUseCase {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: DeleteUserCommand) {
    const user: UserViewDto = await this.usersQueryRepository.getOneById(
      command.id,
    );

    if (!user) {
      throw new BadRequestException('user not found');
    }

    await this.usersRepository.deleteById(user.id);
  }
}
