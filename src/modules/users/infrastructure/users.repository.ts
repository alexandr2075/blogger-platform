import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  async save(user: User): Promise<void> {
    await this.UserModel.findByIdAndUpdate(user.id, user, { upsert: true });
  }

  async findOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);

    if (!user) {
      //TODO: replace with domain exception
      throw new NotFoundException('user not found');
    }

    return user;
  }

  async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    return this.UserModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.UserModel.findOne({ email });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.UserModel.findById(id);
  }

  async findByConfirmationCode(code: string): Promise<User | null> {
    return this.UserModel.findOne({ 'EmailConfirmed.confirmationCode': code });
  }

  async findByRecoveryCode(code: string): Promise<User | null> {
    return this.UserModel.findOne({ recoveryCode: code });
  }

  async findNonDeletedOrNotFoundFail(id: string): Promise<UserDocument> {
    const user = await this.UserModel.findOne({
      _id: new Types.ObjectId(id),
      deletedAt: null,
    });

    if (!user) {
      throw new NotFoundException('user not found');
    }

    return user;
  }
}
