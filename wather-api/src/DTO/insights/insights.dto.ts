/* eslint-disable prettier/prettier */
import { z } from 'zod';

export const weatherMetricsSchema = z.object({
  periodDays: z.number(),

  temperature: z.object({
    min: z.number(),
    max: z.number(),
    avg: z.number(),
    amplitude: z.number(),
    apparentMin: z.number(),
    apparentMax: z.number(),
  }),

  humidity: z.object({
    min: z.number(),
    max: z.number(),
    mean: z.number(),
  }),

  precipitation: z.object({
    willRain: z.boolean(),
    totalPrecipitation: z.number(),
    totalRain: z.number(),
    totalSnow: z.number(),
    maxPrecipitationProbability: z.number(),
  }),

  wind: z.object({
    maxSpeed10m: z.number(),
    minSpeed10m: z.number(),
    maxGusts10m: z.number(),
  }),

  radiation: z.object({
    uvIndexMax: z.number(),
    uvIndexClearSkyMax: z.number(),
    avgDaylightHours: z.number(),
    avgSunshineHours: z.number(),
  }),
});


export type WeatherMetrics = z.infer<typeof weatherMetricsSchema>

export const weatherInsightSchema = z.object({
  date: z.date(),
  summary: z.string(),
  productionForecast: z.string(), // Ex: "Alta (80-100%)"
  consumerAdvice: z.string(),
  technicalNote: z.string(),
  tags: z.array(z.string()).default([]),
});

export type WeatherInsightDto = z.infer<typeof weatherInsightSchema>;


export const AIResponseSchema = z.object({
  summary: z.string().min(1),
  productionForecast: z.union([
    z.literal('Muito Alta'),
    z.literal('Média'), 
    z.literal('Baixa')
  ]),
  consumerAdvice: z.string().min(1),
  technicalNote: z.string().min(1),
  tags: z.array(z.string()).default([]).optional(),
})

export type AIResponse = z.infer<typeof AIResponseSchema>