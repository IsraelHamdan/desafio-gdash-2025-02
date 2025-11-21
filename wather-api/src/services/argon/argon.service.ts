import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class ArgonService {
  async hashPassowrd(password: string): Promise<string> {
    return argon2.hash(password)
  }

  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain)
  }
}
