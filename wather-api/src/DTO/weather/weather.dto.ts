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

export const dailyWeatherPointSchema = z.object({
  time: z.coerce.date(),

  temperatureMax: z.number(),
  temperatureMin: z.number(),
  apparentTemperatureMax: z.number(),
  apparentTemperatureMin: z.number(),

  uvIndexMax: z.number(),
  uvIndexClearSkyMax: z.number(),

  precipitationProbabilityMax: z.number(),
  precipitationSum: z.number(),
  rainSum: z.number(),
  snowfallSum: z.number(),

  sunrise: z.coerce.date(),
  sunset: z.coerce.date(),
  daylightDuration: z.number(),
  sunshineDuration: z.number(),

  windSpeed10mMax: z.number(),
  windSpeed10mMin: z.number(),
  windGusts10mMax: z.number(),
  windGusts10mMin: z.number(),
  windDirection10mDominant: z.number(),

  relativeHumidity2mMax: z.number(),
  relativeHumidity2mMin: z.number(),
  relativeHumidity2mMean: z.number(),
})

export const weatherLogSchema = z.object({
  requestedAt: z.coerce.date(),
  current: currentWeatherSchema,
  hourly: z.array(hourlyWeatherPointSchema).default([]),
  daily: z.array(dailyWeatherPointSchema).default([])
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


export const exportDataSchema = z.object({
  log: weatherLogSchema.extend({requestedAt: z.coerce.date()}),
  location: locationWithCoordsSchema,
})

export type ExportDataDTO = z.infer<typeof exportDataSchema>