import { Injectable } from '@nestjs/common';
import { RemoveRepository } from '../infrastructure/remove.repository';

@Injectable()
export class RemoveService {
  constructor(private removeRepository: RemoveRepository) {}

  async removeAllData(): Promise<void> {
    await this.removeRepository.removeAllData();
  }
} 