import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../dto/create-user.dto';
import { User, UserModelType } from '../../domain/user.entity';
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
    @InjectModel(User.name)
    private UserModel: UserModelType,
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
    const passwordHash = await bcrypt.hash(command.dto.password, 10);
    const user = this.UserModel.createInstance({
      login: command.dto.login,
      passwordHash,
      email: command.dto.email,
      confirmationCode: command.confirmationCode,
    });
    try {
      await this.usersRepository.save(user);
    } catch (e) {
      if (e.code === 11000) {
        throw new BadRequestException(
          'Пользователь с таким логином или email уже существует',
        );
      }
      throw e;
    }
    return user;
  }
}
