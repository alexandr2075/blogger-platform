import { Injectable } from "@nestjs/common";
import { PostgresService } from "../../../core/database/postgres.config";
import { CreateUserInputDto } from "../../users/api/input-dto/users.input-dto";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()   
export class AdminUsersRepository {
    constructor(private readonly postgresService: PostgresService) {}

    async createUser(user: CreateUserInputDto) {
        // Hash the password
        const passwordHash = await bcrypt.hash(user.password, 10);
        
        // Generate confirmation code and expiration
        const confirmationCode = uuidv4();
        const expirationDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
        
        const query = `INSERT INTO users (
            login, email, password_hash, confirmation_code, 
            confirmation_code_expiration_date, is_confirmed,
             name_first_name, name_last_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`;

        const values = [
            user.login,
            user.email,
            passwordHash,
            confirmationCode,
            expirationDate,
            false, // is_confirmed starts as false
            'Admin', // default first name
            'User', // default last name
        ];
        
        try {
            const result = await this.postgresService.query(query, values);
            return this.mapRowToUser(result[0]);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    private mapRowToUser(row: any) {

      const id = row.id;
      const login = row.login;
      const email = row.email;
      const createdAt = row.created_at; 
     
      return {id, login, email, createdAt};
      }
}