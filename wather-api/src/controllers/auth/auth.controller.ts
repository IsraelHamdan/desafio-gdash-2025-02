import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { LoginUserDto } from 'src/DTO/user/login.dto';
import { AuthService } from 'src/services/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post()
  async login(@Body() data: LoginUserDto) {
    try { 
      return await this.service.login(data)
    }  catch(err) {
      throw new BadRequestException(`Falha ao fazer login: ${err}`)
    }
  }
}
