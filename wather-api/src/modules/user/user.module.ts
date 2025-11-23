import { Module, forwardRef } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { UserController } from 'src/controllers/user/user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user/user.schema';
import { ArgonModule } from '../argon/argon.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';

@Module({
  providers: [UserService],
  controllers: [UserController], 
  imports: [
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema}
    ]),
    ArgonModule,
    forwardRef(() => AuthModule),
  ],
  exports: [UserService]
})
export class UserModule {}
