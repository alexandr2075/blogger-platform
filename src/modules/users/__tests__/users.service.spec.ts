import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../application/users.service';
import { User } from '../domain/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: UsersRepository;
  let userModel: any;

  const mockUser = {
    id: 'test-id',
    login: 'testuser',
    email: 'test@test.com',
    passwordHash: 'hashed_password',
    isConfirmed: false,
    confirmationCode: 'code123',
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepository,
        {
          provide: getModelToken(User.name),
          useValue: {
            createInstance: jest.fn().mockReturnValue(mockUser),
          },
        },
      ],
    }).compile();

    usersService = moduleRef.get<UsersService>(UsersService);
    usersRepository = moduleRef.get<UsersRepository>(UsersRepository);
    userModel = moduleRef.get(getModelToken(User.name));
  });

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      jest.spyOn(usersRepository, 'findByLoginOrEmail').mockResolvedValue(null);

      const result = await usersService.validateUser('test@test.com', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      jest.spyOn(usersRepository, 'findByLoginOrEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      const result = await usersService.validateUser('test@test.com', 'wrong_password');
      expect(result).toBeNull();
    });

    it('should return user if credentials are valid', async () => {
      jest.spyOn(usersRepository, 'findByLoginOrEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await usersService.validateUser('test@test.com', 'correct_password');
      expect(result).toEqual(mockUser);
    });
  });

  describe('createUser', () => {
    it('should create user and return id', async () => {
      const dto = {
        login: 'newuser',
        password: 'password123',
        email: 'new@test.com',
        confirmationCode: 'code123',
        isConfirmed: false,
      };

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password'));
      jest.spyOn(usersRepository, 'save').mockImplementation(() => Promise.resolve());

      const result = await usersService.createUser(dto);
      expect(result).toBe(mockUser.id);
      expect(userModel.createInstance).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
    });
  });

  describe('confirmUser', () => {
    it('should confirm user registration', async () => {
      const user = { ...mockUser, confirm: jest.fn() };
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockImplementation(() => Promise.resolve());

      await usersService.confirmUser('test-id');
      expect(user.confirm).toHaveBeenCalled();
      expect(usersRepository.save).toHaveBeenCalled();
    });
  });

  describe('passwordRecovery', () => {
    it('should set recovery code for user', async () => {
      const user = { ...mockUser, setRecoveryCode: jest.fn() };
      jest.spyOn(usersRepository, 'findById').mockResolvedValue(user);
      jest.spyOn(usersRepository, 'save').mockImplementation(() => Promise.resolve());

      await usersService.setRecoveryCode('test-id', 'recovery123');
      expect(user.setRecoveryCode).toHaveBeenCalledWith('recovery123');
      expect(usersRepository.save).toHaveBeenCalled();
    });
  });
}); 