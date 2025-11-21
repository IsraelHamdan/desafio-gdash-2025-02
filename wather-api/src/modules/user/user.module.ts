import { Module } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { UserController } from 'src/controllers/user/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user/user.schema';
import { ArgonModule } from '../argon/argon.module';

@Module({
  providers: [UserService],
  controllers: [UserController], 
  imports: [
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema}
    ]),
    ArgonModule
  ],
  exports: [UserService]
})
export class UserModule {}
