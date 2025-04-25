import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import type { UpdateUserInputDto } from '../api/input-dto/update-user.input-dto';
import { User, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';


@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
    private usersRepository: UsersRepository,
  ) {}

  async validateUser(loginOrEmail: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return null;

    return user;
  }

  async createUser(dto: CreateUserDto): Promise<string> {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.UserModel.createInstance({
      login: dto.login,
      passwordHash,
      email: dto.email,
    });

    await this.usersRepository.save(user);
    return user.id;
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findNonDeletedOrNotFoundFail(id);

    user.makeDeleted();

    await this.usersRepository.save(user);
  }

  async findByConfirmationCode(code: string): Promise<User | null> {
    return this.usersRepository.findByConfirmationCode(code);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  // async confirmUser(userId: string): Promise<void> {
  //   const user = await this.findById(userId);
  //   user.setConfirmationCode();
  //   await this.usersRepository.save(user);
  // }

  async setRecoveryCode(userId: string, recoveryCode: string): Promise<void> {
    const user = await this.findById(userId);
    user.setConfirmationCode(recoveryCode);
    await this.usersRepository.save(user);
  }

  async findByRecoveryCode(code: string): Promise<User | null> {
    return this.usersRepository.findByRecoveryCode(code);
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    const user = await this.findById(userId);
    user.updatePassword(newPasswordHash);
    await this.usersRepository.save(user);
  }

  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    const user = await this.findById(userId);
    user.setConfirmationCode(newCode);
    await this.usersRepository.save(user);
  }
} 