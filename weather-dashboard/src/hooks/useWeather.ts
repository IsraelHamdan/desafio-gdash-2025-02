import { api } from "@/lib/api";
import type { LocationDTO } from "@/lib/validations/location";
import type {  WeatherRequestResponseDto } from "@/lib/validations/weather";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type GetWeatherOptions = {
  maxAttempts?: number;
  delayMs?: number;
};


const getWeather = async (
    data: LocationDTO,
    options: GetWeatherOptions = {}
): Promise<WeatherRequestResponseDto> => {
  const {maxAttempts = 10, delayMs = 1000} = options

  let attempt = 0
  let lastResponse: WeatherRequestResponseDto | null =  null 

  while (attempt < maxAttempts) {
    const res = await api.post<WeatherRequestResponseDto>('/weather/requestWeather', data)

    if (res.status !== 200 || !res.data) {
      throw new Error('Erro ao buscar dados climáticos');
    }

    lastResponse = res.data
    console.log("🚀 ~ getWeather ~ lastResponse:", lastResponse)

    if(lastResponse.status === 'cached') return lastResponse

    attempt +=1;
    await sleep(delayMs)
  }

  if (lastResponse) {
    return lastResponse;
  }
  throw new Error('Não foi possível obter os dados climáticos');

}

export const weatherKeys = {
  all: ['weather'] as const,
  byLocation: (location: LocationDTO) => [ 
      'weather', 
      location.countryCode, 
      location.state, 
      location.city
  ] as const,
};


export default function useWeather() {
  const queryClient = useQueryClient()

  const createDashboard = useMutation<
    WeatherRequestResponseDto, 
    Error, 
    LocationDTO
  >({
    mutationFn: (location) => getWeather(
      location, 
      {maxAttempts: 10, delayMs:1000}
    ),
    onSuccess: (data, location) => {
      if (data.status === 'cached') {
        queryClient.setQueryData(weatherKeys.byLocation(location), data);
      }
    },
  })

  const getCachedWeather = (location: LocationDTO) =>
    queryClient.getQueryData(weatherKeys.byLocation(location));

  return {
    getData: createDashboard.mutateAsync, 
    data: createDashboard.data,
    isError: createDashboard.isError, 
    isIdle: createDashboard.isIdle, 
    isSuccess: createDashboard.isSuccess,
    isPending: createDashboard.isPending
  }
}