/* eslint-disable prettier/prettier */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto } from 'src/DTO/user/login.dto';
import { ArgonService } from '../argon/argon.service';
import { UserDocument } from 'src/schemas/user/user.schema';
import { UserResponse } from 'src/DTO/user/user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly argon: ArgonService,
  ) {}

  async validateUser(data: LoginUserDto): Promise<UserDocument> {
    try {
      const user = await this.userService.findUserByEmail(data.email);

      if (!user) {
        throw new NotFoundException(`Credenciais Inválidas`);
      }

      const isValid = await this.argon.verifyPassword(
        user.password,
        data.password,
      );

      if (!isValid) throw new UnauthorizedException(`Credenciais inválidas`);

      return user;
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new InternalServerErrorException(
        `Erro ao validar credenciais: ${err}`,
      );
    }
  }

  async login(
    data: LoginUserDto,
  ): Promise<{ user: UserResponse; accessToken: string }> {
    try {
      const userEntity = await this.validateUser(data);
      const user = this.userService.mapToUserResponse(userEntity);
     
      if(user.isActive === false) {
        throw new UnauthorizedException('Usuário não autorizado')
      } 
      
      const payload = {
        sub: user.id.toString(),
        email: user.email,
        role: user.role,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      return { user, accessToken };
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw new UnauthorizedException(`Login não autorizado: ${err.message}`);
      }
      throw new InternalServerErrorException(
        `Erro interno do Servidor: ${err}`,
      );
    }
  }
}
