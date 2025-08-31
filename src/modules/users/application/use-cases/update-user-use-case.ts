import { User } from '../../domain/user.entity';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CommandHandler } from '@nestjs/cqrs';
import { UpdateUserInputDto } from '../../api/input-dto/update-user.input-dto';
import { BadRequestException } from '@nestjs/common';
import { BcryptService } from '../../../../core/bcrypt/bcsypt.service';

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
    private bcryptService: BcryptService,
  ) {}

  async execute(command: UpdateUserCommand) {
    const user: User | null = await this.usersRepository.findById(command.id);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (typeof command.dto.login !== 'undefined') {
      user.login = command.dto.login;
    }
    if (typeof command.dto.email !== 'undefined') {
      user.email = command.dto.email;
    }
    if (typeof command.dto.password !== 'undefined') {
      user.passwordHash = await this.bcryptService.makePasswordHash(
        command.dto.password,
      );
    }

    await this.usersRepository.update(user);

    return user.id;
  }
}

