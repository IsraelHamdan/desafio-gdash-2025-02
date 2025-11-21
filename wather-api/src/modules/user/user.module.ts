import { Module } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { UserController } from 'src/controllers/user/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user/user.schema';
import { ArgonModule } from '../argon/argon.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [UserService],
  controllers: [UserController], 
  imports: [
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema}
    ]),
    ArgonModule,
    ConfigModule
  ],
  exports: [UserService]
})
export class UserModule {}
