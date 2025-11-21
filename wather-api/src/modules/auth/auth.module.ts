import { Module } from '@nestjs/common';
import { ArgonModule } from '../argon/argon.module';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from 'src/services/auth/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { AuthController } from 'src/controllers/auth/auth.controller';

@Module({
  imports: [
    ArgonModule, 
    ConfigModule, 
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
    UserModule,
  ], 
  providers: [ AuthService, JwtStrategy ], 
  controllers: [AuthController],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
