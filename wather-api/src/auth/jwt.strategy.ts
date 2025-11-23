import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'user';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const key = config.get<string>('JWT_KEY')
    if (!key) throw new Error('JWT_SECRET is not defined in environment variables');
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: FastifyRequest) => {
          return req.cookies?.['access_token'] ?? null
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Somente com Postman/Thunder Client
      ]),
      ignoreExpiration: false,
      secretOrKey: key,
    });
  }

  async validate(payload: JwtPayload) {
    // isso vira req.user
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
