import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ZodValidationPipe } from 'src/commom/pipes/zod-validation.pipe';
import { CreateUserDto, createUserSchema } from 'src/DTO/user/user.dto';
import { UserService } from 'src/services/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserDto
  ) {
    try { 
      const user = await this.userService.createUser(body)
      return user
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }

  @Get(':id')
  async findById(@Param() id: string) {
    try { 
      return await this.userService.findById(id)
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }


}
