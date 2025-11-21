import { BadRequestException, Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Guardian } from 'src/auth-guard/auth-guard.guard';
import { UserService } from 'src/services/user/user.service';


@UseGuards(Guardian)
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService, 
  ) {}

  @Get(':id')
  async findById(@Param('id') id: string, @Req() req: Request) {
    try { 
      return await this.userService.findById(id)
    } catch(err) {
      throw new BadRequestException(err.message)
    }
  }


}
