import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { EmailModule } from '@core/email/email.module';
import { DevicesModule } from '@modules/devices/devices.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CqrsModule } from '@nestjs/cqrs';
import { RefreshTokenGuard } from '@core/guards/refresh-token.guard';

@Module({
  imports: [
    CqrsModule,
    EmailModule,
    UsersModule,
    DevicesModule,
    JwtModule.register({}),
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     {
    //       ttl: 10000,
    //       limit: 5,
    //     },
    //   ],
    // }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenGuard],
})
export class AuthModule {}
