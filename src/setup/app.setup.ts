import { INestApplication } from '@nestjs/common';
import { globalPrefixSetup } from './global-prefix.setup';
import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from './swagger.setup';

export function appSetup(app: INestApplication) {
  pipesSetup(app);
  // globalPrefixSetup(app);
  swaggerSetup(app);
  //...
}

// Alias for appSetup to maintain compatibility with e2e tests
export const setupApp = appSetup;
