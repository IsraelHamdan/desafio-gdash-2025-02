import { Module } from '@nestjs/common';
import { ArgonModule } from '../argon/argon.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/services/auth/auth.service';
import { AuthController } from 'src/controllers/auth/auth.controller';

@Module({
  providers: [ AuthService ], 
  exports: [AuthService, AuthController], 
  imports: [ArgonModule, UserModule, JwtModule]
})
export class AuthModule {}
