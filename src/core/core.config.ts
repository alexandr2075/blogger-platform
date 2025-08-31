import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number;

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongoURI: string;

  @IsEnum(Environments, {
    message:
      'Set correct NODE_ENV value, available values: development, staging, production, testing',
  })
  env: string;

  @IsNotEmpty({
    message: 'Set Env variable REFRESH_TOKEN_SECRET, dangerous for security!',
  })
  refreshTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, dangerous for security!',
  })
  accessTokenSecret: string;

  @IsString({
    message: 'Set Env variable REFRESH_TOKEN_EXPIRE, example: 30d',
  })
  refreshTokenExpire: string;

  @IsString({
    message: 'Set Env variable ACCESS_TOKEN_EXPIRE_IN, example: 10m',
  })
  accessTokenExpire: string;

  @IsString()
  smtpHost: string;

  @IsNumber()
  @Min(0)
  @Max(65535)
  smtpPort: number;

  @IsEmail()
  smtpUser: string;

  @IsString()
  smtpPassword: string;

  @IsString()
  apiUrl: string;

  constructor(private configService: ConfigService<any, true>) {
    this.port = Number(this.configService.get('PORT'));
    this.mongoURI = this.configService.get('MONGO_URI');
    const rawEnv = this.configService.get<string>('NODE_ENV');
    // Normalize Jest default 'test' to our accepted 'testing'
    this.env = rawEnv === 'test' ? Environments.TESTING : rawEnv;
    this.refreshTokenSecret = this.configService.get('REFRESH_TOKEN_SECRET');
    this.accessTokenSecret = this.configService.get('ACCESS_TOKEN_SECRET');
    this.refreshTokenExpire = this.configService.get('REFRESH_TOKEN_EXPIRE_IN') || '30d';
    this.accessTokenExpire = this.configService.get('ACCESS_TOKEN_EXPIRE_IN') || '10m';
    this.smtpPort = Number(this.configService.get('SMTP_PORT'));
    this.smtpUser = this.configService.get('SMTP_USER');
    this.smtpPassword = this.configService.get('SMTP_PASSWORD');
    this.smtpHost = this.configService.get('SMTP_HOST');
    this.apiUrl = this.configService.get('API_URL');

    configValidationUtility.validateConfig(this);
  }
}
