import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';

@Injectable()
export class CryptoService {
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  generateVerificationToken(): string {
    return this.generateToken(32);
  }

  generateResetToken(): string {
    return this.generateToken(32);
  }
}
