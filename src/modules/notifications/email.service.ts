import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { SETTINGS } from '@src/settings';

// @Injectable()
// export class EmailService {
//   constructor(private mailerService: MailerService) {}
//
//   async sendConfirmationEmail(email: string, code: string): Promise<void> {
//     //can add html templates, implement advertising and other logic for mailing...
//     await this.mailerService.sendMail({
//       text: `confirm registration via link https://some.com?code=${code}`,
//     });
//   }

// async sendPasswordRecovery(
//   email: string,
//   recoveryCode: string,
// ): Promise<void> {
//   const recoveryLink = `${this.configService.get(
//     'API_URL',
//   )}/auth/password-recovery?code=${recoveryCode}`;
//
//   await this.transporter.sendMail({
//     from: this.configService.get('SMTP_USER'),
//     to: email,
//     subject: 'Восстановление пароля',
//     html: `
//       <h1>Восстановление пароля</h1>
//       <p>Для восстановления пароля перейдите по ссылке:</p>
//       <a href="${recoveryLink}">${recoveryLink}</a>
//     `,
//   });
// }

export const businessService = {
  async sendConfirmationCodeToEmail(email: string, confCode: string) {
    const htmlEmail = `<h1>Thanks for your registration</h1>
                           <p>To finish registration please follow the link below:
                           <a href="https://it-incubator.io/confirm-email?code=${confCode}">complete registration</a>
                           </p>`;

    const info = await nodemailerService
      .sendEmail(
        //отправить сообщение на почту юзера с кодом подтверждения
        email,
        htmlEmail,
      )
      .catch((error) => {
        console.log('error in nodemailer:', error);
      });
  },
};

const nodemailerService = {
  async sendEmail(email: string, template: string) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: SETTINGS.SENDER_EMAIL,
          pass: SETTINGS.SENDER_PASSWORD,
        },
      });

      const info = await transporter.sendMail({
        from: `Good boy <${SETTINGS.SENDER_EMAIL}>`,
        to: email,
        subject: 'Hello ✔',
        html: template,
      });

      console.log(`Message sent: ${info.messageId}`);
      return info;
    } catch (error) {
      console.log('console', error);
    }
  },
};
