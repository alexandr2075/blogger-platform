import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CoreConfig } from '../core/core.config';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.BEARER_AUTH_JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
  ],
  exports: [JwtModule, CoreConfig],
  providers: [CoreConfig],
})
export class CoreModule {}
