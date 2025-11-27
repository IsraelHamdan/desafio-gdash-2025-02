/* eslint-disable prettier/prettier */
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  collection: 'locations',
  timestamps: true,
})
export class Location {
  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  neighborhood: string;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  lon: number;
}

export type LocationDocument = Location & Document;
