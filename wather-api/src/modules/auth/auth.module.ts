/* eslint-disable prettier/prettier */
import { Module, forwardRef } from '@nestjs/common';
import { ArgonModule } from '../argon/argon.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/services/auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { RolesGuard } from '$/auth/guards/role/role.guard';
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';

@Module({
  imports: [
    ArgonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        global: true,
        secret: config.get<string>('JWT_KEY') || 'my-super-strong-kewy',
        signOptions: {
          expiresIn: config.get<number>('JWT_EXPIRES_IN') || '1h',
        },
        httpOnly: true,
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    forwardRef(() => UserModule),
  ],
  providers: [AuthService, JwtStrategy, RolesGuard, Guardian],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, Guardian, RolesGuard, JwtModule],
})
export class AuthModule {}
