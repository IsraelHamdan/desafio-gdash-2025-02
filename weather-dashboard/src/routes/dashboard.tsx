/* eslint-disable @typescript-eslint/no-unused-vars */
import InsightsComponent from "@/components/Insigts";
import SearchComponent from "@/components/searchBar";
import HourlyTable from "@/components/Table/HourlyTable";
import Tipography from "@/components/Tipography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import useWeather from "@/hooks/useWeather";
import type { WeatherIntakeDto } from "@/lib/validations/weather";

export default function DashboardPage() {
  const { getData, weatherData, isPending } = useWeather();

  const isCached = weatherData?.status === "cached";
  const current = isCached ? weatherData.log.current : null;
  const location = isCached ? weatherData.location : null;
  const daily = isCached ? weatherData.log.daily : null;
  const hourly = isCached ? weatherData.log.hourly : null;

  const intake: WeatherIntakeDto | null =
    isCached && location && current && daily && hourly
      ? {
        location: {
          state: location.state,
          countryCode: location.countryCode,
          city: location.city,
          lat: location.lat,
          lon: location.lon,
        },
        requestedAt: weatherData.log.requestedAt, // se existir no log
        current,
        hourly,
        daily,
      }
      : null;


  const round = (value: number, decimals = 0) =>
    Number(value.toFixed(decimals));

  const isDay = current?.isDay;


  return (
    <div className="flex flex-col gap-6">
      <SearchComponent onSelect={getData} />
      {!isPending && isCached && current && daily && hourly && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* COLUNA PRINCIPAL (cards de clima) */}
          <section className="flex-1 flex flex-col gap-5">
            <Card className={isDay ? "bg-slate-200" : "bg-gray-900"}>
              <CardHeader className="flex flex-col items-center">
                <Tipography
                  variant="h1"
                  className={isDay ? "text-gray-900" : "text-slate-200"}
                >
                  {round(current.temperature)}°C
                </Tipography>

                <Tipography
                  className={isDay ? "text-blue-600" : "text-blue-200"}
                  variant="h2"
                >
                  {location?.city}
                </Tipography>
              </CardHeader>

              <CardContent
                className="
            grid 
            grid-cols-1 
            sm:grid-cols-2 
            md:grid-cols-4 
            gap-6
          "
              >
                {/* Sensação térmica */}
                <div className="flex flex-col items-center">
                  <Tipography
                    variant="p"
                    className={`text-2xl font-semibold ${isDay ? "text-gray-900" : "text-slate-200"
                      }`}
                  >
                    {round(current.apparentTemperature)}°C
                  </Tipography>
                  <Tipography
                    variant="p"
                    className={`text-xs uppercase tracking-wide ${isDay ? "text-gray-700" : "text-slate-400"
                      }`}
                  >
                    Sensação térmica
                  </Tipography>
                </div>

                {/* Umidade */}
                <div className="flex flex-col items-center">
                  <Tipography
                    variant="p"
                    className={`text-2xl font-semibold ${isDay ? "text-gray-900" : "text-slate-200"
                      }`}
                  >
                    {round(current.humidity)}%
                  </Tipography>
                  <Tipography
                    variant="p"
                    className={`text-xs uppercase tracking-wide ${isDay ? "text-gray-700" : "text-slate-400"
                      }`}
                  >
                    Umidade do ar
                  </Tipography>
                </div>

                {/* Probabilidade de chuva */}
                <div className="flex flex-col items-center">
                  <Tipography
                    variant="p"
                    className={`text-2xl font-semibold ${isDay ? "text-gray-900" : "text-slate-200"
                      }`}
                  >
                    {round(current.precipitation)}%
                  </Tipography>
                  <Tipography
                    variant="p"
                    className={`text-xs uppercase tracking-wide ${isDay ? "text-gray-700" : "text-slate-400"
                      }`}
                  >
                    Prob. de chuva
                  </Tipography>
                </div>

                {/* Vento */}
                <div className="flex flex-col items-center">
                  <Tipography
                    variant="p"
                    className={`text-2xl font-semibold ${isDay ? "text-gray-900" : "text-slate-200"
                      }`}
                  >
                    {round(current.windspeed)} kts
                  </Tipography>
                  <Tipography
                    variant="p"
                    className={`text-xs uppercase tracking-wide ${isDay ? "text-gray-700" : "text-slate-400"
                      }`}
                  >
                    Velocidade do vento
                  </Tipography>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-5">
              <HourlyTable
                data={hourly}
                currentTime={new Date(current.time)}
              />
            </Card>
          </section>

          {/* ASIDE (insights) */}

          <Card className={isDay ? "bg-slate-100" : "bg-slate-900"}>
            <CardHeader>
              <Tipography
                variant="h2"
                className={isDay ? "text-blue-600" : "text-blue-200"}
              >
                Geração de energia solar
              </Tipography>
            </CardHeader>
            <CardContent>
              {isCached && intake && (
                <InsightsComponent data={intake} />
              )}
            </CardContent>
          </Card>

        </div>
      )}

    </div>

  );
};