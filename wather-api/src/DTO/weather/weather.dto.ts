/* eslint-disable prettier/prettier */
import { z } from 'zod';

export const currentWeatherSchema = z.object({
  temperature: z.number(),
  apparentTemperature: z.number(),
  humidity: z.number(),
  windspeed: z.number(),
  precipitation: z.number(),
  time: z.iso.datetime(),
  isDay: z.boolean(),
});

export const hourlyWeatherPointSchema = z.object({
  time: z.iso.datetime(),
  temperature: z.number(),
  humidity: z.number(),
  windspeed: z.number(),
  precipitation: z.number(),
});

export const weatherLogSchema = z.object({
  provider: z.string().default('open-meteo'),
  requestedAt: z.iso.datetime(),
  current: currentWeatherSchema,
  hourly: z.array(hourlyWeatherPointSchema).default([]),
});

export type WeatherLogDto = z.infer<typeof weatherLogSchema>;

export const weatherRequestResponseSchema = z.object({
  status: z.enum(['queued', 'cached']),
  // quando for cached, você pode mandar o log
  log: weatherLogSchema.optional(),
});

export type WeatherRequestResponseDto = z.infer<
  typeof weatherRequestResponseSchema
>;
