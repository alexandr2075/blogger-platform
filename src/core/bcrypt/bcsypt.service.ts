import bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BcryptService {
  constructor() {}

  async makePasswordHash(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }
}
