import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../../users/application/users.service';
import { LoginInputDto } from '../api/input-dto/login.input-dto';
import { NewPasswordInputDto } from '../api/input-dto/new-password.input-dto';
import { PasswordRecoveryInputDto } from '../api/input-dto/password-recovery.input-dto';
import { RegistrationConfirmationInputDto } from '../api/input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from '../api/input-dto/registration-email-resending.input-dto';
import { RegistrationInputDto } from '../api/input-dto/registration.input-dto';
import { MeViewDto } from '../api/view-dto/me.view-dto';
import { TokensViewDto } from '../api/view-dto/tokens.view-dto';
import { ConfirmedStatus } from '../../users/domain/email.confirmated.schema';
import { EmailService } from '../../../core/email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async login(dto: LoginInputDto): Promise<TokensViewDto> {
    const user = await this.usersService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    const payload = { sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(dto: RegistrationInputDto): Promise<void> {
    const confirmationCode = uuidv4();
    const user = await this.usersService.createUser(dto, confirmationCode);

    await this.emailService.sendRegistrationConfirmation(
      dto.email,
      confirmationCode,
    );
    // await businessService.sendConfirmationCodeToEmail(
    //   dto.email,
    //   confirmationCode,
    // );
  }

  async confirmRegistration(
    dto: RegistrationConfirmationInputDto,
  ): Promise<void> {
    const user = await this.usersService.findByConfirmationCode(dto.code);
    if (!user || user.EmailConfirmed.confirmationCode !== dto.code) {
      throw new BadRequestException('code incorrect');
    }

    await this.usersService.confirmUser(user.id);
  }

  async passwordRecovery(dto: PasswordRecoveryInputDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return; // Не сообщаем о существовании пользователя

    const recoveryCode = uuidv4();
    await this.usersService.setRecoveryCode(user._id.toString(), recoveryCode);
    await this.emailService.sendPasswordRecovery(dto.email, recoveryCode);
    // await businessService.sendConfirmationCodeToEmail(dto.email, recoveryCode);
  }

  async newPassword(dto: NewPasswordInputDto): Promise<void> {
    const user = await this.usersService.findByRecoveryCode(dto.recoveryCode);
    if (!user) {
      throw new BadRequestException('Неверный код восстановления');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);
  }

  async resendRegistrationEmail(
    dto: RegistrationEmailResendingInputDto,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    // console.log('AUTH SERVICE RESEND', user)
    if (
      !user ||
      user.EmailConfirmed.isConfirmed === ConfirmedStatus.Confirmed
    ) {
      throw new BadRequestException('email невозможно переотправить');
    }

    const newConfirmationCode = uuidv4();
    await this.usersService.updateConfirmationCode(
      user.id,
      newConfirmationCode,
    );
    await this.emailService.sendRegistrationConfirmation(
      // await businessService.sendConfirmationCodeToEmail(
      dto.email,
      newConfirmationCode,
    );
  }

  async getMe(userId: string): Promise<MeViewDto> {
    const user = await this.usersService.findById(userId);
    return {
      email: user.email,
      login: user.login,
      userId: user.id,
    };
  }
}
