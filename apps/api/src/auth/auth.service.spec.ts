import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { CryptoService } from './crypto.service';
import { TwoFactorService } from './two-factor.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

describe('AuthService', () => {
  let service: AuthService;
  let _usersRepository: UsersRepository;
  let _jwtService: JwtService;

  const mockUsersRepository = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockCryptoService = {
    hashPassword: jest.fn().mockImplementation((password: string) => argon2.hash(password)),
    verifyPassword: jest.fn().mockImplementation((hash: string, password: string) => argon2.verify(hash, password)),
  };

  const mockTwoFactorService = {
    verify2FACode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CryptoService,
          useValue: mockCryptoService,
        },
        {
          provide: TwoFactorService,
          useValue: mockTwoFactorService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    _usersRepository = module.get<UsersRepository>(UsersRepository);
    _jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockResolvedValue({
        id: '1',
        email: registerDto.email,
        role: 'USER',
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email
      );
      expect(mockUsersRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'existing@example.com',
        password: 'SecurePassword123!',
        firstName: 'Existing',
        lastName: 'User',
      };

      mockUsersRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(mockUsersRepository.create).not.toHaveBeenCalled();
    });

    it('should hash password using argon2', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(null);
      mockUsersRepository.create.mockImplementation(async (data) => ({
        id: '1',
        ...data,
        createdAt: new Date(),
      }));

      await service.register(registerDto);

      const createCallArgs = mockUsersRepository.create.mock.calls[0][0];
      expect(createCallArgs.passwordHash).toBeDefined();
      expect(createCallArgs.passwordHash).not.toBe(registerDto.password);

      // Verify it's a valid argon2 hash
      const isValid = await argon2.verify(
        createCallArgs.passwordHash,
        registerDto.password
      );
      expect(isValid).toBe(true);
    });
  });

  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const passwordHash = await argon2.hash(loginDto.password);
      const mockUser = {
        id: '1',
        email: loginDto.email,
        passwordHash,
        role: 'USER',
        name: 'Test User',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock.jwt.token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'mock.jwt.token');
      expect(result).toHaveProperty('user');
      if ('user' in result && result.user) {
        expect(result.user.email).toBe(loginDto.email);
      }
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
    });

    it('should throw UnauthorizedException for non-existent email', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword!',
      };

      const correctPasswordHash = await argon2.hash('CorrectPassword123!');
      const mockUser = {
        id: '1',
        email: loginDto.email,
        passwordHash: correctPasswordHash,
        role: 'USER',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid JWT payload', async () => {
      const payload = {
        sub: '1',
        email: 'test@example.com',
        role: 'USER',
      };

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(payload.email, 'password123');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findByEmail).toHaveBeenCalledWith(payload.email);
    });

    it('should return null for invalid user', async () => {
      const payload = {
        sub: '999',
        email: 'invalid@example.com',
        role: 'USER',
      };

      mockUsersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(payload.email, 'wrongpass');

      expect(result).toBeNull();
    });
  });
});
