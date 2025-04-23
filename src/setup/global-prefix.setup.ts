import { INestApplication } from '@nestjs/common';

export function globalPrefixSetup(app: INestApplication) {
  app.setGlobalPrefix('api');
}
