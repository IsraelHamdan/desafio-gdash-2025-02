/* eslint-disable prettier/prettier */
import { z } from 'zod';
import { locationWithCoordsSchema } from './location.dto';
import { currentWeatherSchema, hourlyWeatherPointSchema } from './weather.dto';

export const weatherIntakeSchema = z.object({
  location: locationWithCoordsSchema,
  provider: z.string().default('open-meteo'),
  requestedAt: z.coerce.date(),
  current: currentWeatherSchema,
  hourly: z.array(hourlyWeatherPointSchema),
});

export type WeatherIntakeDto = z.infer<typeof weatherIntakeSchema>;
