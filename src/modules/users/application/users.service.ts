import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcrypt';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserInputDto } from '../api/input-dto/update-user.input-dto';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import type { UUID } from 'crypto';
import type { LoginInputDto } from '../../auth/api/input-dto/login.input-dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
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
    // console.log('isPasswordValid:', isPasswordValid);
    if (!isPasswordValid) return null;

    return user;
  }

  async createUser(
    dto: CreateUserDto,
    confirmationCode?: string,
  ) {
    const userLogin = await this.usersRepository.findByLoginOrEmail(dto.login);
    const userEmail = await this.usersRepository.findByLoginOrEmail(dto.email);

    if (userLogin) {
      throw new BadRequestException('login already exists');
    }

    if (userEmail) {
      throw new BadRequestException('email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.UserModel.createInstance({
      login: dto.login,
      passwordHash,
      email: dto.email,
      confirmationCode,
    });
    try {
      await this.usersRepository.save(user);
    } catch (e) {
      if (e.code === 11000) {
        throw new BadRequestException('Пользователь с таким логином или email уже существует');
      }
      throw e;
    }
    return user;
  }

  async updateUser(id: string, dto: UpdateUserInputDto): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.update(dto);

    await this.usersRepository.save(user);

    return user._id.toString();
  }

  async confirmUser(id: string): Promise<string> {
    const user = await this.usersRepository.findOrNotFoundFail(id);

    user.confirm();
    console.log('confirmUser:', user);
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

  async findById(id: string): Promise<UserDocument> {
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
    // console.log(user, ' user')
    user.setConfirmationCode(newCode);
    await this.usersRepository.save(user);
  }
}
