import { BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Guardian } from '$/auth/guards/auth-guard/auth-guard.guard';
import { AuthUser} from '$/auth/jwt.strategy';
import { ZodValidationPipe } from '$/commom/pipes/zod-validation.pipe';
import { UpdateUserDto, updateUserSchema } from '$/DTO/user/user.dto';
import { RolesGuard } from '$/auth/guards/role/role.guard';
import { UserService } from '$/services/user/user.service';
import { Roles } from '$/auth/decorators/roles.decorators';

type FastifyRequestWithUser = FastifyRequest & { user: AuthUser };

@UseGuards(Guardian)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService, 
  ) {}

  @Get('findById/:id')
  async findById(@Param('id') id: string) {
    try { 
      return await this.userService.findById(id)
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  @Get('by-email/:email')
  async findByEmail(
    @Param('email') email: string
  ) {
    try { 
      return this.userService.findByEmail(email)
    } catch(err) {
      throw new BadRequestException(err.message)
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
      throw new BadRequestException(err.message);
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
      throw new BadRequestException(err.message)
    }
  }

  @UseGuards(RolesGuard)
  @Delete('delete/:id')
  async delete(@Param('id') id: string, @Req() req: FastifyRequestWithUser) {
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
      return {
        message: 'Usuário desativado (isActive = false)',
        user: updated,
      };     
        
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }
}
