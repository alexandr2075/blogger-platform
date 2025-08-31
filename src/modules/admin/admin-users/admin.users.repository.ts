import { Injectable } from "@nestjs/common";
import { CreateUserInputDto } from "../../users/api/input-dto/users.input-dto";
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { UsersRepository } from '../../users/infrastructure/users.repository';

@Injectable()   
export class AdminUsersRepository {
    constructor(  @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly usersRepository: UsersRepository,
) {}

    async createUser(user: CreateUserInputDto) {
        try {
            const result = await this.usersRepository.create(user);
            return this.mapRowToUser(result);
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    private mapRowToUser(row: any) {
      const id = row.id;
      const login = row.login;
      const email = row.email;
      const createdAt = row.createdAt; 
     
      return {id, login, email, createdAt};
    }
}