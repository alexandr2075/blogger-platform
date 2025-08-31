import { Injectable }          from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import type { EntityManager }  from 'typeorm';
import { User }                from '../domain/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserViewDto } from '../api/view-dto/users.view-dto';
import { ConfirmedStatus } from '../domain/email.confirmation.interface';
import * as bcrypt from 'bcrypt';


@Injectable()
export class UsersRepository {
  public constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  public async findByName(name: string): Promise<User[] | null> {
    try {
      const result = await this.entityManager
        .createQueryBuilder()
        .select('u')
        .from(User, 'u')
        .where('u.login LIKE :name', { name: `${name}%` })
        // .printSql()
        .getMany();

      return result;
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  public async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    try {
      const result = await this.entityManager
        .createQueryBuilder()
        .select('u')
        .from(User, 'u')
        .where('u.login = :loginOrEmail', { loginOrEmail })
        .orWhere('u.email = :loginOrEmail', { loginOrEmail })
        .andWhere('u.deletedAt IS NULL')
        .getOne();

      return result;
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  public async findByConfirmationCode(code: string): Promise<User | null> {
    try {
      const result = await this.entityManager
        .createQueryBuilder()
        .select('u')
        .from(User, 'u')
        .where('u.confirmationCode = :code', { code })
        .andWhere('u.confirmationCode IS NOT NULL')
        .andWhere('u.deletedAt IS NULL')
        .getOne();

      return result;
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  public async setConfirmationCode(code: string, id: string): Promise<void> {
    try {
      await this.entityManager.update(User, { id }, { confirmationCode: code });
    } catch (error) {
      console.log(error);
    }
  }

  public async updatePassword(id: string, passwordHash: string): Promise<void> {
    try {
      await this.entityManager.update(User, { id }, { passwordHash });
    } catch (error) {
      console.log(error);
    }
  }

  public async findById(id: string): Promise<User | null> {
    try {
      const result = await this.entityManager
        .createQueryBuilder()
        .select('u')
        .from(User, 'u')
        .where('u.id = :id', { id })
        .getOne();

      return result;
    } catch (error) {
      console.log(error);

      return null;
    }
  }

  public async update(user: User): Promise<void> {
    try {
      await this.entityManager.save(user);
    } catch (error) {
      console.log(error);
    }
  }

  public async updateConfirmationCode(id: string, confirmationCode: string): Promise<void> {
    try {
      await this.entityManager.update(User, { id }, { confirmationCode });
    } catch (error) {
      console.log(error);
    }
  }

  public async updateIsConfirmed(id: string, isConfirmed: ConfirmedStatus): Promise<void> {
    try {
      await this.entityManager.update(User, { id }, { isConfirmed });
      await this.entityManager.update(User, { id }, { confirmationCode: null });
    } catch (error) {
      console.log(error);
    }
  }

  public async deleteById(id: string): Promise<boolean> {
    try {
      const result = await this.entityManager.softDelete(User, id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async create(data: CreateUserDto, confirmationCode?: string): Promise<User | null> {
    try {
      const user = new User();
      user.login = data.login;
      user.email = data.email;
      // Hash the incoming plain password to be compatible with bcrypt.compare on login
      user.passwordHash = await bcrypt.hash(data.password, 10);
      user.confirmationCode = confirmationCode ?? null;

      return await this.entityManager.save(user);
    } catch (error) {
      console.log(error);

      return null;
    }
  }
}