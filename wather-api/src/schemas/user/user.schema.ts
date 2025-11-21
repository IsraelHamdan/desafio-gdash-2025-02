import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


@Schema({
  collection: 'user',
  timestamps: true
})
export class User {


  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'user' })
  role: 'admin' | 'user';

  @Prop({ default: true })
  isActive: boolean;

  @Prop({required: true})
  phone: string
}

export type UserDocument = User & Document

export const UserSchema = SchemaFactory.createForClass(User)