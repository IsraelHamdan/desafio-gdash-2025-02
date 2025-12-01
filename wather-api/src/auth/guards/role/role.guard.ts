/* eslint-disable prettier/prettier */
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { Role, ROLES_KEY } from 'src/auth/decorators/roles.decorators';
import { AuthUser } from 'src/auth/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const requiredRoles = this.reflector.getAllAndMerge<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context
      .switchToHttp()
      .getRequest<FastifyRequest & { user?: AuthUser }>();

    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('Usuário não autenticado');
    }

    if (!requiredRoles.includes(user.role))
      throw new ForbiddenException('Você não tem permissão para essa ação');

    return true;
  }
}
