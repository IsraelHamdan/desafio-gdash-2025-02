/* eslint-disable prettier/prettier */
import { z } from 'zod';
import { locationWithCoordsSchema } from './location.dto';

export const currentWeatherSchema = z.object({
  temperature: z.number(),
  apparentTemperature: z.number(),
  humidity: z.number(),
  windspeed: z.number(),
  precipitation: z.number(),
  time: z.coerce.date(),
  isDay: z.boolean(),
});

export const hourlyWeatherPointSchema = z.object({
  time: z.coerce.date(),
  temperature: z.number(),
  humidity: z.number(),
  windspeed: z.number(),
  precipitation: z.number(),
});

export const weatherLogSchema = z.object({
  provider: z.string().default('open-meteo'),
  requestedAt: z.date(),
  current: currentWeatherSchema,
  hourly: z.array(hourlyWeatherPointSchema).default([]),
});

export type WeatherLogDto = z.infer<typeof weatherLogSchema>;

export const weatherRequestResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('queued'),
    log: z.never().optional(),
    location: z.never().optional()
  }),
  z.object({
    status: z.literal('cached'),
    log: weatherLogSchema,
    location: locationWithCoordsSchema
  }),
]);

export type WeatherRequestResponseDto = z.infer<
  typeof weatherRequestResponseSchema
>;
