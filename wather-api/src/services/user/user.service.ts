import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError } from 'mongoose';
import { CreateUserDto, UpdateUserDto, userResponse, UserResponse } from 'src/DTO/user/user.dto';
import { User, UserDocument } from 'src/schemas/user/user.schema';
import { ArgonService } from '../argon/argon.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly argon: ArgonService
  ) {}
async createUser(data: CreateUserDto): Promise<UserResponse> {
  try {
    const exists = await this.userModel.findOne({ email: data.email }).exec();
    if (exists) {
      throw new ConflictException('Esse email já esta em uso');
    }

    const passwordHash = await this.argon.hashPassowrd(data.passwordHash); // (tem um typo aqui: hashPassowrd)

    const user = new this.userModel({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'user',
      phone: data.phone,
    });

    const saved = await user.save();

    return this.mapToUserResponse(saved);
  } catch (err) {
    if (err instanceof MongooseError) {
      throw new MongooseError(`Erro do Mongo ao criar um usuário: ${err}`);
    }
    throw new InternalServerErrorException(
      `Erro interno do servidor ao crirar usuário: ${err}`,
    );
  }
}

  async findByEmail(email: string): Promise<UserResponse> {
    try { 
      const user = await this.userModel.findOne({email}).exec()

      if(!user) throw new NotFoundException(`Não foi possivel encontrar o usuário`)
      return this.mapToUserResponse(user)
    } catch(err) {
      if(err instanceof MongooseError) {
        throw new MongooseError(`Erro ao buscar usuário: ${err}`)
      }
      throw new InternalServerErrorException(`Erro interno do servidor ao buscar usuário: ${err}`)
    }
  }
    async findUserByEmail(email: string): Promise<UserDocument | null>{
    try { 
      const user = await this.userModel.findOne({email}).exec()

      if(!user) throw new NotFoundException(`Não foi possivel encontrar o usuário`)
      return user
    } catch(err) {
      if(err instanceof MongooseError) {
        throw new MongooseError(`Erro ao buscar usuário: ${err}`)
      }
      throw new InternalServerErrorException(`Erro interno do servidor ao buscar usuário: ${err}`)
    }
  }

  async findById(id: string): Promise<UserResponse> {
    try { 
      const user = await this.userModel.findOne({id}).exec()
      if(!user) throw new NotFoundException(`Não foi possivel encontrar o usuário`)
      return this.mapToUserResponse(user)
    } catch(err) {
      if(err instanceof MongooseError) {
        throw new MongooseError(`Erro ao buscar usuário: ${err}`)
      }
      throw new InternalServerErrorException(`Erro interno do servidor ao buscar usuário: ${err}`)
    }
  }
  

  async update(data: UpdateUserDto, id: string): Promise<UserResponse> {
    try { 
      const updatedUser = await this.userModel.findByIdAndUpdate({id}, {$set: data}, {new: true})
      if (!updatedUser) {
        throw new NotFoundException('Não é possivel encontrar o usuári');
      }
      return this.mapToUserResponse(updatedUser)
    } catch(err) {
       if(err instanceof MongooseError) {
        throw new MongooseError(`Erro ao buscar usuário: ${err}`)
      }
      throw new InternalServerErrorException(`Erro interno do servidor ao buscar usuário: ${err}`)
    }
  }

   mapToUserResponse(user: UserDocument): UserResponse {
    const plain = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
    };

    return userResponse.parse(plain);
  }

}
