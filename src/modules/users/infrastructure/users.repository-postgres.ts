import { Injectable, NotFoundException } from "@nestjs/common";
import { PostgresService } from "../../../core/database/postgres.config";
import { User } from "../domain/user.entity";

@Injectable()
export class UsersRepositoryPostgres {
    constructor(
        private readonly postgresService: PostgresService,
    ) {}

    async createUser(user: User): Promise<User> {
      const query = `INSERT INTO users (
      login, email, password_hash, confirmation_code, 
      confirmation_code_expiration_date, is_confirmed,
       name_first_name, name_last_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`;

      const values = [
        user.login,
        user.email,
        user.passwordHash,
        user.emailConfirmation.confirmationCode,
        user.emailConfirmation.expirationDate,
        user.emailConfirmation.isConfirmed,
        user.name.firstName,
        user.name.lastName,
      ];

      console.log('CreateUser query:', query);
      console.log('CreateUser values:', values);
      
      try {
        const result = await this.postgresService.query(query, values);
        console.log('CreateUser result:', result.length > 0 ? 'SUCCESS' : 'FAILED');
        if (result.length > 0) {
          console.log('Created user ID:', result[0].id);
        }
        return this.mapRowToUser(result[0]);
      } catch (error) {
        console.log('CreateUser error:', error);
        throw error;
      }
}

async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`;
    const values = [email];
    console.log('FindByEmail query:', query, 'values:', values);
    try {
        const result = await this.postgresService.query(query, values);
        console.log('FindByEmail result count:', result.length);
        return result.length > 0 ? this.mapRowToUser(result[0]) : null;
    } catch (error) {
        console.log('FindByEmail error:', error);
        throw error;
    }
}

async findByLogin(login: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE login = $1 AND deleted_at IS NULL`;
    const values = [login];
    console.log('FindByLogin query:', query, 'values:', values);
    try {
        const result = await this.postgresService.query(query, values);
        console.log('FindByLogin result count:', result.length);
        return result.length > 0 ? this.mapRowToUser(result[0]) : null;
    } catch (error) {
        console.log('FindByLogin error:', error);
        throw error;
    }
}

async findById(id: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL`;
    const values = [id];
    const result = await this.postgresService.query(query, values);
    return result.length > 0 ? this.mapRowToUser(result[0]) : null;
}

async findAll(): Promise<User[]> {
    const query = `SELECT * FROM users WHERE deleted_at IS NULL`;
    const result = await this.postgresService.query(query);
    return result.map(this.mapRowToUser);
}

async delete(id: string): Promise<void> {
    const query = `DELETE FROM users WHERE id = $1`;
    await this.postgresService.query(query, [id]);
}

async deleteAll(): Promise<void> {
    const query = `DELETE FROM users`;
    await this.postgresService.query(query, []);
}

// Methods expected by users.service.ts
async insert(user: User): Promise<User> {
    console.log('Insert method called for user:', user.login);
    
    const query = `INSERT INTO users (
        login, email, password_hash, confirmation_code, 
        confirmation_code_expiration_date, is_confirmed,
        name_first_name, name_last_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`;
    
    const values = [
        user.login,
        user.email,
        user.passwordHash,
        user.emailConfirmation.confirmationCode,
        user.emailConfirmation.expirationDate,
        user.emailConfirmation.isConfirmed,
        user.name.firstName,
        user.name.lastName,
    ];
    
    try {
        const result = await this.postgresService.query(query, values);
        console.log('User inserted successfully with ID:', result[0].id);
        return this.mapRowToUser(result[0]);
    } catch (error) {
        console.log('Error inserting user:', error);
        throw error;
    }
}

async update(user: User): Promise<void> {
    console.log('Update method called for user:', user.login, 'ID:', user.id);
    
    const query = `
        UPDATE users 
        SET email = $1, password_hash = $2, confirmation_code = $3, 
            confirmation_code_expiration_date = $4, is_confirmed = $5,
            name_first_name = $6, name_last_name = $7, updated_at = CURRENT_TIMESTAMP
        WHERE id = $8
    `;
    
    const values = [
        user.email,
        user.passwordHash,
        user.emailConfirmation.confirmationCode,
        user.emailConfirmation.expirationDate,
        user.emailConfirmation.isConfirmed,
        user.name.firstName,
        user.name.lastName,
        user.id
    ];
    
    try {
        await this.postgresService.query(query, values);
        console.log('User updated successfully');
    } catch (error) {
        console.log('Error updating user:', error);
        throw error;
    }
}

async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const query = `
      SELECT * FROM users 
      WHERE (login = $1 OR email = $1) AND deleted_at IS NULL
    `;
    const result = await this.postgresService.query(query, [loginOrEmail]);
    return result.length > 0 ? this.mapRowToUser(result[0]) : null;
}

async findOrNotFoundFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
}

async findNonDeletedOrNotFoundFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return user;
}

async findByConfirmationCode(code: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE confirmation_code = $1 AND deleted_at IS NULL`;
    const result = await this.postgresService.query(query, [code]);
    return result.length > 0 ? this.mapRowToUser(result[0]) : null;
}

async findByRecoveryCode(code: string): Promise<User | null> {
    const query = `SELECT * FROM users WHERE confirmation_code = $1 AND deleted_at IS NULL`;
    const result = await this.postgresService.query(query, [code]);
    return result.length > 0 ? this.mapRowToUser(result[0]) : null;
}

private mapRowToUser(row: any): User {
  const user = new User();
  user.id = row.id;
  user.login = row.login;
  user.email = row.email;
  user.passwordHash = row.password_hash;
  user.createdAt = row.created_at;
  user.updatedAt = row.updated_at;
  user.deletedAt = row.deleted_at;
  user.name = {
      firstName: row.name_first_name,
      lastName: row.name_last_name,
  };
  user.emailConfirmation = {
      confirmationCode: row.confirmation_code,
      expirationDate: row.confirmation_code_expiration_date,
      isConfirmed: row.is_confirmed,
  };
  return user;
  }
}