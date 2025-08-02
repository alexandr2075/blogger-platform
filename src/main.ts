import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
// import { ConfigService } from '@nestjs/config';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);

  const coreConfig: CoreConfig = app.get<CoreConfig>(CoreConfig);
  // const configService = app.get(ConfigService);
  const port: number = coreConfig.port;

  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
bootstrap();
