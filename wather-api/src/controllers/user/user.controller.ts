/* eslint-disable prettier/prettier */
import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, InternalServerErrorException, Logger, Param, Patch, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';
import { AuthUser} from '$/auth/jwt.strategy';
import { ZodValidationPipe } from '$/commom/pipes/zod-validation.pipe';
import { UpdateUserDto, updateUserSchema, UserResponse } from '$/DTO/user/user.dto';
import { RolesGuard } from '$/auth/guards/role/role.guard';
import { UserService } from '$/services/user/user.service';
import { Roles } from '$/auth/decorators/roles.decorators';

type FastifyRequestWithUser = FastifyRequest & { user: AuthUser };

@UseGuards(Guardian)
@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name)
  constructor(
    private readonly userService: UserService, 
  ) {}

  @Get('findById/:id')
  async findById(@Param('id') id: string) {
    try { 
      return await this.userService.findById(id)
    } catch(err) {
      this.logger.error(`Erro ao buscar pelo Id: ${err}`)
      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)

    }
  }

  @Get('by-email/:email')
  async findByEmail(
    @Param('email') email: string
  ) {
    try { 
      return this.userService.findByEmail(email)
    } catch(err) {
      this.logger.error(`Erro ao buscar pelo email: ${err}`)
      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)
    }
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('/findAll')
  async findAll(@Req() req: FastifyRequestWithUser) {
    try {
      const user = req.user 

      if(user.role !== 'admin') {
        throw new ForbiddenException(`Você não tem permissão para isso`)
      }
      return await this.userService.findAll()
    } catch(err) {
      this.logger.error(`Erro ao buscar todos os usuários: ${err}`)
      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)
    }
  }


  @Patch('update/:id')
  async update(
    @Param('id') id: string, 
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserDto
  ) {
    try { 
      return await this.userService.update(body, id)
    } catch(err) {
      this.logger.error(`Erro ao atualizar o usuário: ${err}`)
      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)
    }
  }

  @UseGuards(RolesGuard)
  @Delete('delete/:id')
  async delete(
      @Param('id') id: string, 
      @Req() req: FastifyRequestWithUser,
      @Res({passthrough: true}) res: FastifyReply
  ) {
    try { 
      const user = req.user 

      if (user.role === 'admin') {
        if (user.userId === id) {
          throw new ForbiddenException('Admin não pode deletar a si mesmo');
        }

        await this.userService.hardDelete(id);
        
        return { message: 'Usuário deletado permanentemente (admin)' };
      }


      if (user.userId !== id) {
        throw new ForbiddenException('Você só pode desativar a sua própria conta');
      }

      const updated = await this.userService.deactivate(id);
      res.clearCookie('acess_token', {
        path:'/',
        httpOnly: true
      })
      return {
        message: 'Usuário desativado (isActive = false)',
        user: updated,
      };     
        
    } catch(err) {
      this.logger.error(`Erro ao deletar o usuário: ${err}`)
      
      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)
    }
  }

  @UseGuards(RolesGuard)
  @Patch('reactivate/:id')
  async reactivate(
    @Param('id') id: string
  ): Promise<UserResponse> {
    try { 
      return await this.userService.reactivate(id)
    } catch(err) {
      this.logger.error(`Erro ao reativar usuário: ${err}`)

      if(err instanceof BadRequestException)
        throw new BadRequestException(err)

      throw new InternalServerErrorException(err)

    }
  }
}
