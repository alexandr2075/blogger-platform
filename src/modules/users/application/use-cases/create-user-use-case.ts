import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../dto/create-user.dto';
import { UsersRepository } from '../../infrastructure/users.repository';
import { CommandHandler } from '@nestjs/cqrs';

export class CreateUserCommand {
  constructor(
    public dto: CreateUserDto,
    public confirmationCode?: string,
  ) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase {
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async execute(command: CreateUserCommand) {
    const userLogin = await this.usersRepository.findByLoginOrEmail(
      command.dto.login,
    );
    const userEmail = await this.usersRepository.findByLoginOrEmail(
      command.dto.email,
    );

    if (userLogin) {
      throw new BadRequestException('login already exists');
    }

    if (userEmail) {
      throw new BadRequestException('email already exists');
    }

    const createdUser = await this.usersRepository.create(command.dto, command.confirmationCode);
    return createdUser;
  }
}
