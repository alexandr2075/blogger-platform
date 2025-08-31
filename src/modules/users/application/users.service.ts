import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input-dto';
import { User } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import type { LoginInputDto } from '../../auth/api/input-dto/login.input-dto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepository,
  ) {}

  async validateUser(dto: LoginInputDto): Promise<User | null> {
    const user = await this.usersRepository.findByLoginOrEmail(
      dto.loginOrEmail,
    );

    if (!user) return null;

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) return null;

    return user;
  }

  async findByConfirmationCode(code: string): Promise<User | null> {
    return this.usersRepository.findByConfirmationCode(code);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async setConfirmationCode(userId: string, code: string): Promise<void> {
    await this.usersRepository.setConfirmationCode(code, userId);
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    await this.usersRepository.updatePassword(userId, newPasswordHash);
  }

  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    await this.usersRepository.updateConfirmationCode(userId, newCode);
  }
}
