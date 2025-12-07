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

  @Prop({
    type: [
      {
        time: Date,
        temperatureMax: Number,
        temperatureMin: Number,
        apparentTemperatureMax: Number,
        apparentTemperatureMin: Number,
        uvIndexMax: Number,
        uvIndexClearSkyMax: Number,
        precipitationProbabilityMax: Number,
        precipitationSum: Number,
        rainSum: Number,
        snowfallSum: Number,
        sunrise: Date,
        sunset: Date,
        daylightDuration: Number,
        sunshineDuration: Number,
        windSpeed10mMax: Number,
        windSpeed10mMin: Number,
        windGusts10mMax: Number,
        windGusts10mMin: Number,
        windDirection10mDominant: Number,
        relativeHumidity2mMax: Number,
        relativeHumidity2mMin: Number,
        relativeHumidity2mMean: Number,
      },
    ],
    default: [],
  })
  daily: Array<{
    time: Date;
    temperatureMax: number;
    temperatureMin: number;
    apparentTemperatureMax: number;
    apparentTemperatureMin: number;
    uvIndexMax: number;
    uvIndexClearSkyMax: number;
    precipitationProbabilityMax: number;
    precipitationSum: number;
    rainSum: number;
    snowfallSum: number;
    sunrise: Date;
    sunset: Date;
    daylightDuration: number;
    sunshineDuration: number;
    windSpeed10mMax: number;
    windSpeed10mMin: number;
    windGusts10mMax: number;
    windGusts10mMin: number;
    windDirection10mDominant: number;
    relativeHumidity2mMax: number;
    relativeHumidity2mMin: number;
    relativeHumidity2mMean: number;
  }>;
}

export type WeatherLogDocument = WeatherLog & Document;
export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);

