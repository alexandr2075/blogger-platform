import { AllHttpExceptionsFilter } from '@core/exceptions/filters/all-exceptions.filter';
import { DevicesModule } from '@modules/devices/devices.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConf, { type DatabaseConfig } from './core/config/db.config';
import { CoreModule } from './core/core.module';
import { EmailModule } from './core/email/email.module';
import { DomainHttpExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { MigrationRunnerService } from './core/migration-runner.service';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { RemoveModule } from './modules/bloggers-platform/remove/remove.module';
import { GameQuizModule } from './modules/game-quiz/game-quiz.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env.testing', '.env'],
      load: [databaseConf],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService<DatabaseConfig>): TypeOrmModuleOptions => {
        const dbConfig = config.get('database', {
          infer: true,
        });
        if (!dbConfig) {
          throw new Error('Database configuration is missing!');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    UsersModule,
    AdminModule,
    BloggersPlatformModule,
    RemoveModule,
    AuthModule,
    EmailModule,
    CoreModule,
    DevicesModule,
    GameQuizModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MigrationRunnerService,
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
