/* eslint-disable prettier/prettier */
import { z } from 'zod';

export const locationSchema = z.object({
  state: z.string().max(2, { message: 'somente a sigla do estado' }),
  city: z
    .string()
    .min(3, { message: 'O nome da cidade tem que ter no mínimo 3 letras' }),
  neighborhood: z
    .string()
    .min(2, { message: 'O bairro tem que ter no minimo duas letras' }),
});

export type LocationDTO = z.infer<typeof locationSchema>;

export const locationWithCoordsSchema = locationSchema.extend({
  lat: z.number(),
  lon: z.number,
});
