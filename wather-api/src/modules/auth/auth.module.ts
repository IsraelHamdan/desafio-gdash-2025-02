import { Module, forwardRef  } from '@nestjs/common';
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
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_KEY'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN')
        }
      })
    }),
    PassportModule.register({defaultStrategy: 'jwt'}), 
    forwardRef(() => UserModule),
  ], 
  providers: [ AuthService, JwtStrategy, RolesGuard, Guardian], 
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtStrategy,
    Guardian,
    RolesGuard, 
    JwtModule,
  ],
})
export class AuthModule {}
