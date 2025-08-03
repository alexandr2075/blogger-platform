import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input-dto';
import { User } from '../domain/user.entity';
import { UsersRepositoryPostgres } from '../infrastructure/users.repository-postgres';
import type { LoginInputDto } from '../../auth/api/input-dto/login.input-dto';

@Injectable()
export class UsersService {
  constructor(
    private usersRepository: UsersRepositoryPostgres,
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

  async createUser(dto: CreateUserDto, confirmationCode?: string) {
    const userLogin = await this.usersRepository.findByLoginOrEmail(dto.login);
    const userEmail = await this.usersRepository.findByLoginOrEmail(dto.email);

    if (userLogin) {
      throw new BadRequestException('login already exists');
    }

    if (userEmail) {
      throw new BadRequestException('email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = User.createInstance({
      login: dto.login,
      passwordHash,
      email: dto.email,
      confirmationCode,
    });
    try {
      const createdUser = await this.usersRepository.insert(user);
      return createdUser;
    } catch (e) {
      if (e.code === '23505') { // PostgreSQL unique constraint violation
        throw new BadRequestException(
          'Пользователь с таким логином или email уже существует',
        );
      }
      throw e;
    }
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.update(user);

    return user.id;
  }

  async confirmUser(id: string): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.confirm();
    await this.usersRepository.update(user);

    return user.id;
  }

  async deleteUser(id: string) {
    const user = await this.usersRepository.findNonDeletedOrNotFoundFail(id);
    user.makeDeleted();

    await this.usersRepository.update(user);
  }

  async findByConfirmationCode(code: string): Promise<User | null> {
    return this.usersRepository.findByConfirmationCode(code);
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
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
    await this.usersRepository.update(user);
  }

  async findByRecoveryCode(code: string) {
    return this.usersRepository.findByRecoveryCode(code);
  }

  async updatePassword(userId: string, newPasswordHash: string): Promise<void> {
    const user = await this.findById(userId);
    user.updatePassword(newPasswordHash);
    await this.usersRepository.update(user);
  }

  async updateConfirmationCode(userId: string, newCode: string): Promise<void> {
    const user = await this.findById(userId);
    // console.log(user, ' user')
    user.setConfirmationCode(newCode);
    await this.usersRepository.update(user);
  }
}
