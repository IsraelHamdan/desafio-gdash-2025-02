/* eslint-disable prettier/prettier */
// src/schemas/weather-log.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Location } from './locations.schema';

@Schema({
  collection: 'weather_logs',
  timestamps: true,
})
export class WeatherLog {
  @Prop({ type: Types.ObjectId, ref: Location.name, required: true })
  location: Types.ObjectId | Location;

  @Prop({ required: true, default: 'open-meteo' })
  provider: string;

  @Prop({ required: true })
  requestedAt: Date;

  @Prop({
    type: {
      temperature: Number,
      apparentTemperature: Number,
      humidity: Number,
      windspeed: Number,
      time: Date,
      isDay: Boolean,
      precipitation: Number,
    },
    required: true,
  })
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windspeed: number;
    time: Date;
    isDay: boolean;
    precipitation: number;
  };

  @Prop({
    type: [
      {
        time: Date,
        temperature: Number,
        humidity: Number,
        windspeed: Number,
        precipitation: Number,
      },
    ],
    default: [],
  })
  hourly: Array<{
    time: Date;
    temperature: number;
    humidity: number;
    windspeed: number;
    precipitation: number;
  }>;
}

export type WeatherLogDocument = WeatherLog & Document;
export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);
