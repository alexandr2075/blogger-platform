import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { AuthController } from '../api/auth.controller';
import { AuthService } from '../application/auth.service';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: 'test-id',
    email: 'test@test.com',
    login: 'testuser',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ accessToken: 'token123' }),
            register: jest.fn().mockResolvedValue(undefined),
            confirmRegistration: jest.fn().mockResolvedValue(undefined),
            passwordRecovery: jest.fn().mockResolvedValue(undefined),
            newPassword: jest.fn().mockResolvedValue(undefined),
            resendRegistrationEmail: jest.fn().mockResolvedValue(undefined),
            getMe: jest.fn().mockResolvedValue(mockUser),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    authController = moduleRef.get<AuthController>(AuthController);
    authService = moduleRef.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access token', async () => {
      const loginDto = { loginOrEmail: 'test@test.com', password: 'password123' };
      const result = await authController.login(loginDto);
      expect(result).toEqual({ accessToken: 'token123' });
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('registration', () => {
    it('should register new user', async () => {
      const regDto = {
        login: 'newuser',
        password: 'password123',
        email: 'new@test.com',
      };
      await authController.registration(regDto);
      expect(authService.register).toHaveBeenCalledWith(regDto);
    });
  });

  describe('registration confirmation', () => {
    it('should confirm registration', async () => {
      const confirmDto = { code: 'code123' };
      await authController.registrationConfirmation(confirmDto);
      expect(authService.confirmRegistration).toHaveBeenCalledWith(confirmDto);
    });
  });

  describe('password recovery', () => {
    it('should initiate password recovery', async () => {
      const recoveryDto = { email: 'test@test.com' };
      await authController.passwordRecovery(recoveryDto);
      expect(authService.passwordRecovery).toHaveBeenCalledWith(recoveryDto);
    });
  });

  describe('new password', () => {
    it('should set new password', async () => {
      const newPassDto = {
        newPassword: 'newpass123',
        recoveryCode: 'recovery123',
      };
      await authController.newPassword(newPassDto);
      expect(authService.newPassword).toHaveBeenCalledWith(newPassDto);
    });
  });

  describe('getMe', () => {
    it('should return current user info', async () => {
      const result = await authController.getMe('test-id');
      expect(result).toEqual(mockUser);
      expect(authService.getMe).toHaveBeenCalledWith('test-id');
    });
  });
}); 