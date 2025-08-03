import { BadRequestException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../dto/create-user.dto';
import { User } from '../../domain/user.entity';
import { UsersRepositoryPostgres } from '../../infrastructure/users.repository-postgres';
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
    private usersRepository: UsersRepositoryPostgres,
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
    const passwordHash = await bcrypt.hash(command.dto.password, 10);
    const user: User = User.createInstance({
      login: command.dto.login,
      passwordHash,
      email: command.dto.email,
      confirmationCode: command.confirmationCode,
    });

    const createdUser = await this.usersRepository.insert(user);
    return createdUser;
  }
}
