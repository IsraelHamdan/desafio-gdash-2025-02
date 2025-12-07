/* eslint-disable prettier/prettier */
import { z } from 'zod';
import { locationWithCoordsSchema } from './location.dto';
import { currentWeatherSchema, dailyWeatherPointSchema, hourlyWeatherPointSchema } from './weather.dto';

export const weatherIntakeSchema = z.object({
  location: locationWithCoordsSchema,
  requestedAt: z.coerce.date(),
  current: currentWeatherSchema,
  hourly: z.array(hourlyWeatherPointSchema),
  daily: z.array(dailyWeatherPointSchema)
});

export type WeatherIntakeDto = z.infer<typeof weatherIntakeSchema>;
