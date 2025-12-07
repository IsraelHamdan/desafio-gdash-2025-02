/* eslint-disable prettier/prettier */
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';
import { BadRequestException, Body, Controller, Get, HttpException, InternalServerErrorException, Logger, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthUser, JwtPayload } from 'src/auth/jwt.strategy';
import { ZodValidationPipe } from 'src/commom/pipes/zod-validation.pipe';
import { LoginUserDto } from 'src/DTO/user/login.dto';
import { CreateUserDto, createUserSchema } from 'src/DTO/user/user.dto';
import { AuthService } from 'src/services/auth/auth.service';
import { UserService } from 'src/services/user/user.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)
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
    try { 
      const {user, accessToken} = await this.service.login(data)

      this.setCookie(res, accessToken)
      return { user, accessToken}
    } catch(err) {
      this.logger.error(`Erro ao fazer login: ${err}`)
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
      this.logger.error(`Erro ao fazer o registro: ${err}`)
      if(err instanceof BadRequestException)
        throw new BadRequestException(err.message)

      throw new InternalServerErrorException(err)
    }
  }

  @Post('logout')
  @UseGuards(Guardian)
  logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('access_token', { path: '/' });
    return  { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(Guardian)
  async me(@Req() req: FastifyRequest & { user: AuthUser }) {
    const userId = req.user.userId
    const user = await this.userService.findById(userId)

     return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
   }
  }
}

