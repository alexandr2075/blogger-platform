import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { EmailModule } from '@core/email/email.module';
import { DevicesModule } from '@modules/devices/devices.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from '@modules/devices/domain/device.entity';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    EmailModule,
    UsersModule,
    DevicesModule,
    // NotificationsModule,
    JwtModule.register({}),
    // JwtModule.registerAsync({
    //   // Используйте registerAsync для асинхронной конфигурации
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     secret: configService.get<string>('BEARER_AUTH_JWT_SECRET'),
    //     signOptions: {
    //       expiresIn: configService.get<string>(
    //         'BEARER_AUTH_JWT_EXPIRATION_TIME',
    //       ),
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 10000,
          limit: 5,
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
