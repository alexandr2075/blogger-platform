import { CreateUserDomainDto } from "./dto/create-user.domain.dto";
import { ConfirmedStatus, EmailConfirmation } from "./email.confirmation.interface";
import { Name } from "./name.interface";

export class User {
    id: string;
    login: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    name: Name;
    emailConfirmation: EmailConfirmation;

    static createInstance(dto: CreateUserDomainDto): User{
        const user = new this();
        user.login = dto.login;
        user.email = dto.email;
        user.passwordHash = dto.passwordHash;
        user.deletedAt = null;
        user.emailConfirmation = {
          confirmationCode: dto.confirmationCode,
          expirationDate: new Date(),
          isConfirmed: ConfirmedStatus.Unconfirmed,
        };
        user.name = {
          firstName: 'firstName xxx',
          lastName: 'lastName yyy',
        };
        return user;
    }

    makeDeleted() {
      if (this.deletedAt !== null) {
        throw new Error('Entity already deleted');
      }
      this.deletedAt = new Date();
    }

    update(dto: any) {
      if (dto.email && dto.email !== this.email) {
        this.emailConfirmation.isConfirmed = ConfirmedStatus.Unconfirmed;
        this.email = dto.email;
      }
    }

    confirm() {
      this.emailConfirmation.isConfirmed = ConfirmedStatus.Confirmed;
      this.emailConfirmation.confirmationCode = undefined;
    }

    updatePassword(newPasswordHash: string) {
      this.passwordHash = newPasswordHash;
    }

    setConfirmationCode(code: string) {
      this.emailConfirmation.confirmationCode = code;
    }
}
