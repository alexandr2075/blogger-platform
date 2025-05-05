import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
   
  }

  async sendRegistrationConfirmation(
    email: string,
    confirmationCode: string,
  ): Promise<void> {
    // const confirmationLink = `${this.configService.get(
    //   'API_URL',
    // )}/auth/registration-confirmation?code=${confirmationCode}`;

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER') as string,
      to: email,
      subject: 'Подтверждение регистрации',
      html: `
        <h1>Спасибо за регистрацию</h1>
        <p>Для подтверждения email перейдите по ссылке:</p>
        <a href="https://it-incubator.io/confirm-email?code=${confirmationCode}">complete registration</a>
      `,
    });
  }

  async sendPasswordRecovery(
    email: string,
    recoveryCode: string,
  ): Promise<void> {
    const recoveryLink = `${this.configService.get(
      'API_URL',
    )}/auth/password-recovery?code=${recoveryCode}`;

    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Восстановление пароля',
      html: `
        <h1>Восстановление пароля</h1>
        <p>Для восстановления пароля перейдите по ссылке:</p>
        <a href="${recoveryLink}">${recoveryLink}</a>
      `,
    });
  }
} 