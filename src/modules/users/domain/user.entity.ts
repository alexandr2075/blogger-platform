import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import type { UpdateUserInputDto } from '../api/input-dto/update-user.input-dto';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import {
  ConfirmedStatus,
  EmailConfirmation,
  EmailConfirmationSchema,
} from './email.confirmated.schema';
import { Name, NameSchema } from './name.schema';
import type { UUID } from 'crypto';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
};

//флаг timestemp автоматичеки добавляет поля upatedAt и createdAt
/**
 * User Entity Schema
 * This class represents the schema and behavior of a User entity.
 */
@Schema({ timestamps: true })
export class User {
  /**
   * Login of the user (must be uniq)
   * @type {string}
   * @required
   */
  @Prop({
    type: String,
    required: true,
    unique: true,
    ...loginConstraints,
  })
  login: string;

  // @Prop(NameSchema) this variant from docdoesn't make validation for inner object
  @Prop({ type: NameSchema })
  name: Name;

  /**
   * Password hash for authentication
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true })
  passwordHash: string;

  /**
   * Email of the user
   * @type {string}
   * @required
   */
  @Prop({ type: String, required: true, ...emailConstraints })
  email: string;

  /**
   * Email confirmation status (if not confirmed in 2 days account will be deleted)
   * @type {boolean}
   * @default false
   */
  @Prop({ type: EmailConfirmationSchema })
  EmailConfirmed: EmailConfirmation;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Deletion timestamp, nullable, if date exist, means entity soft deleted
   * @type {Date | null}
   */
  @Prop({ type: Date, nullable: true })
  deletedAt: Date | null;

  /**
   * Virtual property to get the stringified ObjectId
   * @returns {string} The string representation of the ID
   * если ипсльзуете по всей системе шв айди как string, можете юзать, если id
   */
  get id() {
    // @ts-ignore
    return this._id.toString();
  }

  /**
   * Factory method to create a User instance
   * @param {CreateUserDto} dto - The data transfer object for user creation
   * @returns {UserDocument} The created user document
   * DDD started: как создать сущность, чтобы она не нарушала бизнес-правила? Делегируем это создание статическому методу
   */
  static createInstance(dto: CreateUserDomainDto): UserDocument {
    const user = new this();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.deletedAt = null;
    user.EmailConfirmed = {
      confirmationCode: dto.confirmationCode,
      expirationDate: new Date(),
      isConfirmed: ConfirmedStatus.Unconfirmed,
    };

    user.name = {
      firstName: 'firstName xxx',
      lastName: 'lastName yyy',
    };

    return user as UserDocument;
  }

  /**
   * Marks the user as deleted
   * Throws an error if already deleted
   * @throws {Error} If the entity is already deleted
   * DDD сontinue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
   */
  makeDeleted() {
    if (this.deletedAt !== null) {
      throw new Error('Entity already deleted');
    }
    this.deletedAt = new Date();
  }

  setConfirmationCode(code: string) {
    this.EmailConfirmed.confirmationCode = code;
    // this.EmailConfirmed.isConfirmed = ConfirmedStatus.Confirmed;
  }

  /**
   * Updates the user instance with new data
   * Resets email confirmation if email is updated
   * @param {UpdateUserDto} dto - The data transfer object for user updates
   * DDD сontinue: инкапсуляция (вызываем методы, которые меняют состояние\св-ва) объектов согласно правилам этого объекта
   */
  update(dto: UpdateUserInputDto) {
    if (dto.email && dto.email !== this.email) {
      this.EmailConfirmed.isConfirmed = ConfirmedStatus.Unconfirmed;
      this.email = dto.email;
    }
  }

  confirm(id: string) {
    this.EmailConfirmed.isConfirmed = ConfirmedStatus.Confirmed;
    this.EmailConfirmed.confirmationCode = undefined;
  }

  updatePassword(newPasswordHash: string) {
    this.passwordHash = newPasswordHash;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
