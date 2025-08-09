import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as UUID } from 'uuid';
import { UsersService } from '../../users/application/users.service';
import { LoginInputDto } from '../api/input-dto/login.input-dto';
import { NewPasswordInputDto } from '../api/input-dto/new-password.input-dto';
import { PasswordRecoveryInputDto } from '../api/input-dto/password-recovery.input-dto';
import { RegistrationConfirmationInputDto } from '../api/input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from '../api/input-dto/registration-email-resending.input-dto';
import { RegistrationInputDto } from '../api/input-dto/registration.input-dto';
import { MeViewDto } from '../api/view-dto/me.view-dto';
import { TokensViewDto } from '../api/view-dto/tokens.view-dto';
import { ConfirmedStatus } from '../../users/domain/email.confirmation.interface';
import { EmailService } from '@core/email/email.service';
import { ConfigService } from '@nestjs/config';
import { CoreConfig } from '@core/core.config';
import { ClientInfoDto } from '@core/dto/client.info.dto';
import { Device } from '@modules/devices/domain/device.entity';
import { DevicesRepositoryPostgres } from '@modules/devices/infrastructure/devices.repository-postgres';
import { DevicesService } from '@modules/devices/application/devices.service';
import { AccessPayload } from '@modules/auth/types/payload.access';
import { RefreshPayload } from '@modules/auth/types/payload.refresh';
import { UsersRepositoryPostgres } from '@/modules/users/infrastructure/users.repository-postgres';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private usersRepository: UsersRepositoryPostgres,
    private emailService: EmailService,
    private configService: ConfigService,
    private coreConfig: CoreConfig,
    private devicesService: DevicesService,
    private devicesRepository: DevicesRepositoryPostgres,
  ) {}

  async login(
    dto: LoginInputDto,
    clientInfo?: ClientInfoDto,
  ): Promise<TokensViewDto> {
    const user =
      (await this.usersRepository.findByLogin(dto.loginOrEmail)) ||
      (await this.usersRepository.findByEmail(dto.loginOrEmail));

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Create a payload for accessToken
    const payloadAccess = {
      sub: user.id,
    };

    // Create an access token
    const accessToken = this.jwtService.sign(payloadAccess, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.coreConfig.accessTokenExpire,
    });

    // Create a payload for refreshToken
    const newDeviceId = UUID();
    const refreshTokenIat = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const payloadRefresh = {
      userId: user.id,
      deviceId: newDeviceId,
      deviceName: clientInfo?.userAgent,
      ip: clientInfo?.ip,
      iat: refreshTokenIat,
    };

    // Create a refresh token
    const refreshToken = this.jwtService.sign(payloadRefresh, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.coreConfig.refreshTokenExpire,
    });

    // Create device object
    const device = new Device();
    device.userId = user.id;
    device.deviceId = newDeviceId;
    device.deviceName = clientInfo?.userAgent || 'Unknown';
    device.ip = clientInfo?.ip || 'Unknown';
    device.iat = refreshTokenIat;
    device.exp = refreshTokenIat + this.parseTokenExpiration(this.coreConfig.refreshTokenExpire);

    await this.devicesRepository.create(device);

    return {
      accessToken,
      refreshToken,
    };
  }

  private parseTokenExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid token expiration format: ${expiration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value; // seconds
      case 'm': return value * 60; // minutes to seconds
      case 'h': return value * 60 * 60; // hours to seconds
      case 'd': return value * 24 * 60 * 60; // days to seconds
      default:
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }

  async register(dto: RegistrationInputDto): Promise<void> {
    const confirmationCode = UUID();
    await this.usersService.createUser(dto, confirmationCode);

    this.emailService.sendRegistrationConfirmation(dto.email, confirmationCode);
  }

  async confirmRegistration(
    dto: RegistrationConfirmationInputDto,
  ): Promise<void> {
    const user = await this.usersService.findByConfirmationCode(dto.code);
    if (!user || user.emailConfirmation.confirmationCode !== dto.code) {
      throw new BadRequestException('code incorrect');
    }

    await this.usersService.confirmUser(user.id);
  }

  async passwordRecovery(dto: PasswordRecoveryInputDto): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) return; // Не сообщаем о существовании пользователя

    const recoveryCode = UUID();
    await this.usersService.setRecoveryCode(user.id, recoveryCode);
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

    if (
      !user ||
      user.emailConfirmation.isConfirmed === ConfirmedStatus.Confirmed
    ) {
      throw new BadRequestException('email невозможно переотправить');
    }

    const newConfirmationCode = UUID();
    await this.usersService.updateConfirmationCode(
      user.id,
      newConfirmationCode,
    );

    this.emailService
      .sendRegistrationConfirmation(dto.email, newConfirmationCode)
      .catch((error) => {
        console.log('[updateConfirmationCode] Error:', error);
      });
  }

  async refreshToken(refreshToken: string): Promise<TokensViewDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Refresh token expired');
      }
      throw new UnauthorizedException('Invalid refresh token', error);
    }
    // get all devicesDocuments by user id
    const devices = await this.devicesService.getDevicesDocuments(
      payload.userId,
    );

    // find a device by deviceId and iat
    const foundDevice = devices.find(
      (device) =>
        device.deviceId === payload.deviceId &&
        Number(device.iat) === payload.iat,
    );

    if (!foundDevice) {
      throw new UnauthorizedException('Device not found');
    }

    // Check if refresh token expired (20 seconds after device creation)
    if (Number(foundDevice.exp) < Date.now() / 1000) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Create an access token
    const payloadAccess: AccessPayload = {
      sub: payload.userId,
    };

    const accessToken = this.jwtService.sign(payloadAccess, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.coreConfig.accessTokenExpire,
    });

    // wait 700 ms to new iat become different from old iat
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Create a payload for refreshToken
    const newRefreshTokenIat = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    const payloadRefresh = {
      userId: payload.userId,
      deviceId: payload.deviceId,
      deviceName: payload.deviceName,
      ip: payload.ip,
      iat: newRefreshTokenIat,
    };

    // Create a refresh token
    const newRefreshToken = this.jwtService.sign(payloadRefresh, {
      secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      expiresIn: this.coreConfig.refreshTokenExpire,
    });

    // Update iat device
    await this.devicesRepository.updateIat(
      payload.userId,
      payload.deviceId,
      newRefreshTokenIat,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token111', error);
    }

    const devices = await this.devicesService.getDevicesDocuments(
      payload.userId,
    );

    const foundDevice = devices.find(
      (device) =>
        device.deviceId === payload.deviceId &&
        Number(device.iat) === payload.iat,
    );

    if (!foundDevice) {
      throw new UnauthorizedException('Device not found');
    }

    if (Number(foundDevice.exp) < Date.now() / 1000) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.devicesRepository.deleteByUserIdAndDeviceId(
      payload.userId,
      payload.deviceId,
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
