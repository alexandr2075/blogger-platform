import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CoreConfig } from '../core.config';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private coreConfig: CoreConfig) {
    this.transporter = nodemailer.createTransport({
      host: this.coreConfig.smtpHost,
      port: this.coreConfig.smtpPort,
      secure: false,
      auth: {
        user: this.coreConfig.smtpUser,
        pass: this.coreConfig.smtpPassword,
      },
    });
  }

  async sendRegistrationConfirmation(
    email: string,
    confirmationCode: string,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.coreConfig.smtpUser,
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
    const recoveryLink = `${this.coreConfig.apiUrl}/auth/password-recovery?code=${recoveryCode}`;

    await this.transporter.sendMail({
      from: this.coreConfig.smtpUser,
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
