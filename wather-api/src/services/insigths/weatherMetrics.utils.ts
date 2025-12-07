/* eslint-disable prettier/prettier */
import { WeatherMetrics } from "$/DTO/insights/insights.dto";
import { WeatherIntakeDto } from "$/DTO/weather/weatherIntake.dto";

;

const round1 = (n: number): number =>
  Number.isFinite(n) ? Math.round(n * 10) / 10 : 0;

const average = (values: number[]): number => {
  if (!values.length) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
};


function computeTemperatureMetrics(
  daily: WeatherIntakeDto['daily'],
): WeatherMetrics['temperature'] {
  if (!daily.length) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      amplitude: 0,
      apparentMin: 0,
      apparentMax: 0,
    };
  }

  const minTemps = daily.map((d) => d.temperatureMin);
  const maxTemps = daily.map((d) => d.temperatureMax);
  const avgTemps = daily.map(
    (d) => (d.temperatureMax + d.temperatureMin) / 2
  );

  const apparentMinTemps = daily.map((d) => d.apparentTemperatureMin);
  const apparentMaxTemps = daily.map((d) => d.apparentTemperatureMax);

  const minTemp = Math.min(...minTemps);
  const maxTemp = Math.max(...maxTemps);
  const avgTemp = average(avgTemps);

  const apparentMin = Math.min(...apparentMinTemps);
  const apparentMax = Math.max(...apparentMaxTemps);

  return {
    min: round1(minTemp),
    max: round1(maxTemp),
    avg: round1(avgTemp),
    amplitude: round1(maxTemp - minTemp),
    apparentMin: round1(apparentMin),
    apparentMax: round1(apparentMax),
  };
}

function computeHumidityMetrics(
  daily: WeatherIntakeDto['daily'],
): WeatherMetrics['humidity'] {
  if (!daily.length) {
    return { min: 0, max: 0, mean: 0 };
  }

  const rhMean = daily.map((d) => d.relativeHumidity2mMean);
  const rhMax = daily.map((d) => d.relativeHumidity2mMax);
  const rhMin = daily.map((d) => d.relativeHumidity2mMin);

  return {
    min: round1(Math.min(...rhMin)),
    max: round1(Math.max(...rhMax)),
    mean: round1(average(rhMean)),
  };
}

function computePrecipitationMetrics(
  daily: WeatherIntakeDto['daily'],
): WeatherMetrics['precipitation'] {
  if (!daily.length) {
    return {
      willRain: false,
      totalPrecipitation: 0,
      totalRain: 0,
      totalSnow: 0,
      maxPrecipitationProbability: 0,
    };
  }

  const precipSums = daily.map((d) => d.precipitationSum);
  const rainSums = daily.map((d) => d.rainSum);
  const snowSums = daily.map((d) => d.snowfallSum);
  const precipProbMax = daily.map((d) => d.precipitationProbabilityMax);

  const totalPrecipitation = precipSums.reduce((a, b) => a + b, 0);
  const totalRain = rainSums.reduce((a, b) => a + b, 0);
  const totalSnow = snowSums.reduce((a, b) => a + b, 0);
  const maxPrecipitationProbability = Math.max(...precipProbMax);

  const willRain =
    maxPrecipitationProbability >= 30 ||
    totalPrecipitation > 0.1 ||
    totalRain > 0.1;

  return {
    willRain,
    totalPrecipitation: round1(totalPrecipitation),
    totalRain: round1(totalRain),
    totalSnow: round1(totalSnow),
    maxPrecipitationProbability: round1(maxPrecipitationProbability),
  };
}

function computeWindMetrics(
  daily: WeatherIntakeDto['daily'],
): WeatherMetrics['wind'] {
  if (!daily.length) {
    return {
      maxSpeed10m: 0,
      minSpeed10m: 0,
      maxGusts10m: 0,
    };
  }

  const windMax = daily.map((d) => d.windSpeed10mMax);
  const windMin = daily.map((d) => d.windSpeed10mMin);
  const gustsMax = daily.map((d) => d.windGusts10mMax);

  return {
    maxSpeed10m: round1(Math.max(...windMax)),
    minSpeed10m: round1(Math.min(...windMin)),
    maxGusts10m: round1(Math.max(...gustsMax)),
  };
}

function computeRadiationMetrics(
  daily: WeatherIntakeDto['daily'],
): WeatherMetrics['radiation'] {
  if (!daily.length) {
    return {
      uvIndexMax: 0,
      uvIndexClearSkyMax: 0,
      avgDaylightHours: 0,
      avgSunshineHours: 0,
    };
  }

  const uvMax = daily.map((d) => d.uvIndexMax);
  const uvClearMax = daily.map((d) => d.uvIndexClearSkyMax);
  const daylightDurations = daily.map((d) => d.daylightDuration);
  const sunshineDurations = daily.map((d) => d.sunshineDuration);

  const avgDaylightSeconds = average(daylightDurations);
  const avgSunshineSeconds = average(sunshineDurations);

  return {
    uvIndexMax: round1(Math.max(...uvMax)),
    uvIndexClearSkyMax: round1(Math.max(...uvClearMax)),
    avgDaylightHours: round1(avgDaylightSeconds / 3600),
    avgSunshineHours: round1(avgSunshineSeconds / 3600),
  };
}


function computeFallbackFromHourly(
  hourly: WeatherIntakeDto['hourly'],
): WeatherMetrics {
  if (!hourly.length) {
    return {
      periodDays: 0,
      temperature: {
        min: 0,
        max: 0,
        avg: 0,
        amplitude: 0,
        apparentMin: 0,
        apparentMax: 0,
      },
      humidity: {
        min: 0,
        max: 0,
        mean: 0,
      },
      precipitation: {
        willRain: false,
        totalPrecipitation: 0,
        totalRain: 0,
        totalSnow: 0,
        maxPrecipitationProbability: 0,
      },
      wind: {
        maxSpeed10m: 0,
        minSpeed10m: 0,
        maxGusts10m: 0,
      },
      radiation: {
        uvIndexMax: 0,
        uvIndexClearSkyMax: 0,
        avgDaylightHours: 0,
        avgSunshineHours: 0,
      },
    };
  }

  const temps = hourly.map((h) => h.temperature);
  const windspeeds = hourly.map((h) => h.windspeed);
  const precipitations = hourly.map((h) => h.precipitation);

  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const avgTemp = average(temps);
  const willRain = precipitations.some((p) => p > 0.1);
  const maxWindspeed = Math.max(...windspeeds);

  return {
    periodDays: 0,
    temperature: {
      min: round1(minTemp),
      max: round1(maxTemp),
      avg: round1(avgTemp),
      amplitude: round1(maxTemp - minTemp),
      apparentMin: round1(minTemp),
      apparentMax: round1(maxTemp),
    },
    humidity: {
      min: 0,
      max: 0,
      mean: 0,
    },
    precipitation: {
      willRain,
      totalPrecipitation: 0,
      totalRain: 0,
      totalSnow: 0,
      maxPrecipitationProbability: 0,
    },
    wind: {
      maxSpeed10m: round1(maxWindspeed),
      minSpeed10m: 0,
      maxGusts10m: 0,
    },
    radiation: {
      uvIndexMax: 0,
      uvIndexClearSkyMax: 0,
      avgDaylightHours: 0,
      avgSunshineHours: 0,
    },
  };
}

export function calculateWeatherMetrics(
  weatherData: WeatherIntakeDto,
): WeatherMetrics {
  const { daily, hourly } = weatherData;

  if (daily && daily.length > 0) {
    return {
      periodDays: daily.length,
      temperature: computeTemperatureMetrics(daily),
      humidity: computeHumidityMetrics(daily),
      precipitation: computePrecipitationMetrics(daily),
      wind: computeWindMetrics(daily),
      radiation: computeRadiationMetrics(daily),
    };
  }

  // fallback pro modelo antigo baseado só em hourly
  return computeFallbackFromHourly(hourly);
}
