import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { RemoveService } from '../application/remove.service';

@Controller('testing')
export class RemoveController {
  constructor(private removeService: RemoveService) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAllData(): Promise<void> {
    await this.removeService.removeAllData();
  }
}
