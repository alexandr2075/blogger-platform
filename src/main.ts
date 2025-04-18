import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { SETTINGS } from './settings';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app)
  
  await app.listen(SETTINGS.PORT ?? 3000);
  console.log('Application is running on port 3000');
}
bootstrap();
