import { BadRequestException, Body, Controller, HttpException, InternalServerErrorException, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyError, FastifyReply } from 'fastify';
import { JwtPayload } from 'src/auth/jwt.strategy';
import { ZodValidationPipe } from 'src/commom/pipes/zod-validation.pipe';
import { LoginUserDto } from 'src/DTO/user/login.dto';
import { CreateUserDto, createUserSchema, UserResponse } from 'src/DTO/user/user.dto';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly userService: UserService, 
    private readonly jwt: JwtService,
    private readonly config: ConfigService
  ) {}

  private setCookie(res: FastifyReply, accessToken: string) {
    
    res.setCookie('access_token', accessToken, {
      httpOnly: true, 
      sameSite: 'strict', 
      path: '/', 
      maxAge: 60 * 60, 
      secure: this.config.get('NODE_ENV') === 'production'
    })
  }

  @Post('/login')
  async login(
      @Body() data: LoginUserDto, 
      @Res({passthrough: true}) res: FastifyReply 
  ) {
      console.log("🚀 ~ AuthController ~ login ~ data:", data)
    try { 
      const {user, accessToken} = await this.service.login(data)

      this.setCookie(res, accessToken)
      return {user, accessToken}
    } catch(err) {
      if(err instanceof HttpException) {throw err}

      console.error(`Erro no login: ${err}`)
      throw new InternalServerErrorException(`Falha ao realizar login`)
    }
  }

  @Post('/register')
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDto, 
    @Res({passthrough: true}) res: FastifyReply
  ) {
    try { 
      const user = await this.userService.createUser(body)

      const payload: JwtPayload = {
        sub: user.id, 
        email: user.email, 
        role: user.role ?? "user"
      }

      const accessToken = this.jwt.sign(payload)

      this.setCookie(res, accessToken)

      return {user,accessToken}
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('access_token', { path: '/' });
    return { message: 'Logged out' };
  }

}
