import { configModule } from './config-dynamic-module';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { EmailModule } from './core/email/email.module';
import { AuthModule } from './modules/auth/auth.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { RemoveModule } from './modules/bloggers-platform/remove/remove.module';
import { UsersModule } from './modules/users/users.module';
import { APP_FILTER } from '@nestjs/core';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { AllHttpExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { NotificationsModule } from '@modules/notifications/notifications.module';

@Module({
  imports: [
    configModule,
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017',
    ),
    UsersModule,
    BloggersPlatformModule,
    RemoveModule,
    AuthModule,
    EmailModule,
    CoreModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    //регистрация глобальных exception filters
    //важен порядок регистрации! Первым сработает DomainHttpExceptionsFilter!

    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
  ],
})
export class AppModule {}
