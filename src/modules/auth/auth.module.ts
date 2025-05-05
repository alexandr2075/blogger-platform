import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
// import { EmailModule } from '../../core/email/email.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { EmailModule } from '../../core/email/email.module';


@Module({
  imports: [
    EmailModule,
    UsersModule,
    NotificationsModule,
    JwtModule.registerAsync({ // Используйте registerAsync для асинхронной конфигурации
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME', '60s'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
