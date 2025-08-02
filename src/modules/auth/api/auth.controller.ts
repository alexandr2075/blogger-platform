import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Response } from 'express';
import { CurrentUser } from '../../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { AuthService } from '../application/auth.service';
import { LoginInputDto } from './input-dto/login.input-dto';
import { NewPasswordInputDto } from './input-dto/new-password.input-dto';
import { PasswordRecoveryInputDto } from './input-dto/password-recovery.input-dto';
import { RegistrationConfirmationInputDto } from './input-dto/registration-confirmation.input-dto';
import { RegistrationEmailResendingInputDto } from './input-dto/registration-email-resending.input-dto';
import { RegistrationInputDto } from './input-dto/registration.input-dto';
import { MeViewDto } from './view-dto/me.view-dto';
import { ClientInfo } from '@core/decorators/client-info.decorator';
import { ClientInfoDto } from '@core/dto/client.info.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CookieUtil } from '@core/utils/cookie.util';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 10000 } }) // 5 requests per 10 seconds
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginInputDto,
    @Res({ passthrough: true }) res: Response,
    @ClientInfo() clientInfo?: ClientInfoDto,
  ): Promise<{ accessToken: string }> {
    const tokens = await this.authService.login(dto, clientInfo);
    this.setRefreshTokenCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(@Body() dto: PasswordRecoveryInputDto): Promise<void> {
    await this.authService.passwordRecovery(dto);
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() dto: NewPasswordInputDto): Promise<void> {
    await this.authService.newPassword(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmation(
    @Body() dto: RegistrationConfirmationInputDto,
  ): Promise<void> {
    await this.authService.confirmRegistration(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() dto: RegistrationInputDto): Promise<void> {
    await this.authService.register(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 10000 } })
  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationEmailResending(
    @Body() dto: RegistrationEmailResendingInputDto,
  ): Promise<void> {
    // console.log('resending')
    await this.authService.resendRegistrationEmail(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = this.extractRefreshToken(request);
    const tokens = await this.authService.refreshToken(refreshToken);

    this.setRefreshTokenCookie(response, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request) {
    const refreshToken = this.extractRefreshToken(request);
    await this.authService.logout(refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() userId: string): Promise<MeViewDto> {
    return this.authService.getMe(userId);
  }

  private extractRefreshToken(request: Request): string {
    const refreshToken = CookieUtil.extractRefreshToken(request.headers.cookie);
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return refreshToken;
  }

  private setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
  ): void {
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 20 * 1000, // 20 seconds for tests
    });
  }
}
