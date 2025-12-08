/* eslint-disable prettier/prettier */
import { z } from 'zod';
import { WeatherLogDto } from './weather.dto';
import { Types } from 'mongoose';

export const locationSchema = z.object({
  state: z.string().min(2, { message: 'somente a sigla do estado' }),
  countryCode: z.string().max(2, { message: 'somente a sigla do país' }),
  city: z
    .string()
    .min(3, { message: 'O nome da cidade tem que ter no mínimo 3 letras' }),
});

export type LocationDTO = z.infer<typeof locationSchema>;

export const locationWithCoordsSchema = locationSchema.extend({
  lat: z.number(),
  lon: z.number(),
});

export type LocationCoords = z.infer<typeof locationWithCoordsSchema>


export type LocationReturn = {
  status: 'cached';
  log: WeatherLogDto;
  location: {
    _id: Types.ObjectId;
    lat: number;
    lon: number;
  };
};