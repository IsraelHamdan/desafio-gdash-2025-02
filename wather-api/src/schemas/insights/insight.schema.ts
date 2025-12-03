/* eslint-disable prettier/prettier */
// src/schemas/weather-insight.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Location } from '../weather/locations.schema';

@Schema({
  collection: 'weather_insights',
  timestamps: true,
})
export class WeatherInsight {
  @Prop({ type: Types.ObjectId, ref: Location.name, required: true })
  location: Types.ObjectId | Location;

  @Prop({ required: true })
  date: Date;

  @Prop({
    type: {
      minTemp: Number,
      maxTemp: Number,
      avgTemp: Number,
      willRain: Boolean,
      maxWindspeed: Number,
      tempAmplitude: Number,
    },
    required: true,
  })
  metrics: {
    minTemp: number;
    maxTemp: number;
    avgTemp: number;
    willRain: boolean;
    maxWindspeed: number;
    tempAmplitude: number;
  };

  @Prop({ required: true })
  summary: string; // ex: "Manhã fria, tarde quente e possibilidade de chuva leve."

  @Prop({ type: [String], default: [] })
  tags: string[]; // ex: ["frio_manha", "calor_tarde", "chuva_fraca"]

  @Prop({ required: true })
  clothingAdvice: string; // dica principal de vestimenta, estilo "IA"

  @Prop({ type: [String], default: [] })
  clothingDetails: string[]; // vários bullets: "leve casaco leve", "atenção ao vento", etc.
}

export type WeatherInsightDocument = WeatherInsight & Document;
export const WeatherInsightSchema =
  SchemaFactory.createForClass(WeatherInsight);
