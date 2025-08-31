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
import { UsersRepository } from '@modules/users/infrastructure/users.repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateUserCommand } from '@modules/users/application/use-cases/create-user-use-case';
import { User } from '@modules/users/domain/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private usersRepository: UsersRepository,
    private emailService: EmailService,
    private configService: ConfigService,
    private coreConfig: CoreConfig,
    private devicesService: DevicesService,
    private devicesRepository: DevicesRepositoryPostgres,
    private commandBus: CommandBus,
  ) {}

  async login(
    dto: LoginInputDto,
    clientInfo?: ClientInfoDto,
  ): Promise<TokensViewDto> {
    const user =
      (await this.usersRepository.findByLoginOrEmail(dto.loginOrEmail)) ||
      (await this.usersRepository.findByLoginOrEmail(dto.loginOrEmail));

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Неверные учетные данные', field: 'credentials' }]
      });
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
    device.title = clientInfo?.userAgent || 'Unknown';
    device.ip = clientInfo?.ip || 'Unknown';
    device.iat = refreshTokenIat;
    device.exp = refreshTokenIat + this.parseTokenExpiration(this.coreConfig.refreshTokenExpire);
    device.lastActiveDate = new Date();
    device.createdAt = new Date().toISOString();

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
    await this.commandBus.execute(
          new CreateUserCommand(dto, confirmationCode),
        );

    this.emailService.sendRegistrationConfirmation(dto.email, confirmationCode);
  }

  async registrationConfirmation(
    dto: RegistrationConfirmationInputDto,
  ): Promise<void> {
    const user = await this.usersService.findByConfirmationCode(dto.code);
    if (!user) {
      throw new BadRequestException('code incorrect');
    }

    // Check if user is already confirmed
    if (user.isConfirmed === ConfirmedStatus.Confirmed) {
      throw new BadRequestException('code incorrect');
    }

    await this.usersRepository.updateIsConfirmed(user.id, ConfirmedStatus.Confirmed);
  }

  async passwordRecovery(dto: PasswordRecoveryInputDto): Promise<void> {
    const user = await this.usersRepository.findByLoginOrEmail(dto.email);
    if (!user) return; // Не сообщаем о существовании пользователя

    const recoveryCode = UUID();
    await this.usersRepository.setConfirmationCode(recoveryCode, user.id);
    await this.emailService.sendPasswordRecovery(dto.email, recoveryCode);
  }

  async newPassword(dto: NewPasswordInputDto): Promise<void> {
    const user = await this.usersRepository.findByConfirmationCode(dto.recoveryCode);
    if (!user) {
      throw new BadRequestException('Неверный код восстановления');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);
  }

  async resendRegistrationEmail(
    dto: RegistrationEmailResendingInputDto,
  ): Promise<void> {
    const user = await this.usersRepository.findByLoginOrEmail(dto.email);

    if (
      !user ||
      user.isConfirmed === ConfirmedStatus.Confirmed
    ) {
      throw new BadRequestException({
        message: 'email невозможно переотправить',
        errorsMessages: [{ message: 'email невозможно переотправить', field: 'email' }]
      });
    }

    const newConfirmationCode = UUID();
    await this.usersRepository.setConfirmationCode(
      newConfirmationCode,
      user.id,
    );

    this.emailService
      .sendRegistrationConfirmation(dto.email, newConfirmationCode)
      .catch((error) => {
        console.log('[updateConfirmationCode] Error:', error);
      });
  }

  async refreshToken(refreshToken: string): Promise<TokensViewDto> {
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token format', field: 'refreshToken' }]
      });
    }

    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          errorsMessages: [{ message: 'Refresh token expired', field: 'refreshToken' }]
        });
      }
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token', field: 'refreshToken' }]
      });
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
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Device not found', field: 'refreshToken' }]
      });
    }

    // Check if refresh token expired (20 seconds after device creation)
    if (Number(foundDevice.exp) < Date.now() / 1000) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token expired', field: 'refreshToken' }]
      });
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

    // Update iat and exp device
    const newRefreshTokenExp = newRefreshTokenIat + this.parseTokenExpiration(this.coreConfig.refreshTokenExpire);
    await this.devicesRepository.updateIat(
      payload.userId,
      payload.deviceId,
      newRefreshTokenIat,
      newRefreshTokenExp,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string, payload?: RefreshPayload) {
    // If payload is provided (from guard), validate it against device records
    if (payload) {
      const devices = await this.devicesService.getDevicesDocuments(payload.userId);
      
      const foundDevice = devices.find(
        (device) =>
          device.deviceId === payload.deviceId &&
          Number(device.iat) === payload.iat,
      );

      if (!foundDevice) {
        throw new UnauthorizedException({
          errorsMessages: [{ message: 'Refresh token has been invalidated', field: 'refreshToken' }]
        });
      }

      if (Number(foundDevice.exp) < Date.now() / 1000) {
        throw new UnauthorizedException({
          errorsMessages: [{ message: 'Refresh token has expired', field: 'refreshToken' }]
        });
      }

      await this.devicesRepository.deleteByUserIdAndDeviceId(
        payload.userId,
        payload.deviceId,
      );
      return;
    }

    // Fallback for direct service calls without guard
    if (!refreshToken) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token format', field: 'refreshToken' }]
      });
    }

    let tokenPayload: RefreshPayload;
    try {
      tokenPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Invalid refresh token', field: 'refreshToken' }]
      });
    }

    const devices = await this.devicesService.getDevicesDocuments(
      tokenPayload.userId,
    );

    const foundDevice = devices.find(
      (device) =>
        device.deviceId === tokenPayload.deviceId &&
        Number(device.iat) === tokenPayload.iat,
    );

    if (!foundDevice) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Device not found', field: 'refreshToken' }]
      });
    }

    if (Number(foundDevice.exp) < Date.now() / 1000) {
      throw new UnauthorizedException({
        errorsMessages: [{ message: 'Refresh token expired', field: 'refreshToken' }]
      });
    }

    await this.devicesRepository.deleteByUserIdAndDeviceId(
      tokenPayload.userId,
      tokenPayload.deviceId,
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
