import { z } from 'zod';

export const weatherMetricsSchema = z.object({
  minTemp: z.number(),
  maxTemp: z.number(),
  avgTemp: z.number(),
  tempAmplitude: z.number(),
  willRain: z.boolean(),
  maxWindspeed: z.number(),
});

export const weatherInsightSchema = z.object({
  date: z.iso.datetime(),
  metrics: weatherMetricsSchema,
  summary: z.string(),
  clothingAdvice: z.string(),
  clothingDetails: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export type WeatherInsightDto = z.infer<typeof weatherInsightSchema>;
