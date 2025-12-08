import type { OpenMeteoGeocodingResponse, OpenMeteoResult } from "@/lib/validations/location";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const getLocation = async (query: string): Promise<OpenMeteoResult[]> => {
  try {
    if (!query || query.length < 2) return [];

    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", query);
    url.searchParams.set("count", "5");
    url.searchParams.set("language", "pt");
    url.searchParams.set("format", "json");

    const res = await axios.get<OpenMeteoGeocodingResponse>(url.toString());

    if (res.status !== 200) {
      return [];
    }

    const data = res.data;
    return data.results ?? [];
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // se quiser tratar mensagem bonitinha:
      throw new Error(err.message);
    }
    throw err;
  }
};

const weatherKeys = {
  geocoding: (query: string) => ["geocoding", query] as const,
  // ... seus outros keys como byLocation etc
};

export function useGeocodingQuery(query: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: weatherKeys.geocoding(query),
    queryFn: async () => {
      const cached = queryClient.getQueryData<OpenMeteoResult[]>(
        weatherKeys.geocoding(query)
      );

      if (cached) {
        return cached;
      }

      const results = await getLocation(query);

      queryClient.setQueryData(weatherKeys.geocoding(query), results);

      return results;
    },
    enabled: query.length >= 2
  });
}
