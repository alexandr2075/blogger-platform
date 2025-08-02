import { UserDocument } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
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
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: UpdateUserCommand) {
    const user: UserDocument = await this.usersRepository.findOrNotFoundFail(
      command.id,
    );

    user.update(command.dto);

    await this.usersRepository.save(user);

    return user._id.toString();
  }
}
