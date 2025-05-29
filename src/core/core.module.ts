import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30m' },
    }),
  ],
  exports: [JwtModule],
  providers: [],
})
export class CoreModule {}
