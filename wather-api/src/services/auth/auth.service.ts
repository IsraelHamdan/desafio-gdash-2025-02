import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { LoginUserDto } from 'src/DTO/user/login.dto';
import { ArgonService } from '../argon/argon.service';
import { User } from 'src/schemas/user/user.schema';
import { UserResponse } from 'src/DTO/user/user.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService, 
    private readonly jwtService: JwtService, 
    private readonly argon: ArgonService
  ) {}


  async validateUser(data: LoginUserDto): Promise<UserResponse> {
    try { 
      const user = await this.userService.findUserByEmail(data.email)

      if (!user) {
        throw new NotFoundException(`Credenciais Inválidas`);
      }

      const isValid = await this.argon.verifyPassword(user.passwordHash, data.password)

      if(!isValid) throw new UnauthorizedException(`Credenciais inválidas`)

      return this.userService.mapToUserResponse(user)
    } catch(err) {
      throw new InternalServerErrorException(`Erro ao validar credenciais: ${err}`)
    }

  }

  async login(data: LoginUserDto) {
    try { 
      const user = await this.validateUser(data)

      const payload = {
        sub: user.id.toString(), 
        email: user.email, 
        role: user.role
      }

      const accessToken = await this.jwtService.signAsync(payload)

      return {accessToken}
    } catch(err) {
    }
  }
}
