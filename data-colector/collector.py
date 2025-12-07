import openmeteo_requests
import requests_cache
from retry_requests import retry
import pandas as pd
from typing import Dict, Any, List, cast
from datetime import datetime, timezone
import requests


cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)

openmeteo = openmeteo_requests.Client(session=retry_session) # type: ignore[arg-type]

def get_idx_or_scalar(value, i: int):
    """Se for array, retorna value[i]; se for escalar, retorna o próprio value."""
    try:
        return value[i]
    except TypeError:
        return value


def collect_weather_log_location(location: Dict[str, Any]) -> Dict[str, Any]:
    print("DEBUG location:", location, type(location))
    lat = location["lat"]
    lon = location["lon"]
    tz_name = location["timezone"]

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "timezone": tz_name,
        "forecast_days": 16,
        "current": [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "is_day",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "uv_index",
            "uv_index_clear_sky",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m",
        ],
        "hourly": [
            "temperature_2m",
            "relative_humidity_2m",
            "dewpoint_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "wind_speed_10m",
            "wind_speed_80m",
            "wind_speed_120m",
            "wind_direction_10m",
            "wind_direction_80m",
            "wind_direction_120m",
            "wind_gusts_10m",
            "visibility",
            "snowfall",
        ],
        "daily": [
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "uv_index_max",
            "uv_index_clear_sky_max",
            "precipitation_probability_max",
            "precipitation_sum",
            "rain_sum",
            "snowfall_sum",
            "sunrise",
            "sunset",
            "daylight_duration",
            "sunshine_duration",
            "wind_speed_10m_max",
            "wind_speed_10m_min",
            "wind_gusts_10m_max",
            "wind_gusts_10m_min",
            "wind_direction_10m_dominant",
            "relative_humidity_2m_max",
            "relative_humidity_2m_min",
            "relative_humidity_2m_mean",
        ],
    }

    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]

    # -------- CURRENT --------
    current_raw = response.Current()
    if current_raw is None:
        raise ValueError("Open-Meteo não retornou dados 'current'")
    current_raw = cast(Any, current_raw)

    wind_speed_10m = float(current_raw.Variables(10).Value())

    current = {
        "temperature": float(current_raw.Variables(0).Value()),
        "apparentTemperature": float(current_raw.Variables(1).Value()),
        "humidity": float(current_raw.Variables(2).Value()),
        "isDay": bool(current_raw.Variables(3).Value()),
        "precipitation": float(current_raw.Variables(4).Value()),
        "rain": float(current_raw.Variables(5).Value()),
        "showers": float(current_raw.Variables(6).Value()),
        "snowfall": float(current_raw.Variables(7).Value()),
        "uvIndex": float(current_raw.Variables(8).Value()),
        "uvIndexClearSky": float(current_raw.Variables(9).Value()),
        # 👇 campo que o Nest espera:
        "windspeed": wind_speed_10m,
        # 👇 campos ricos que você também quer:
        "windSpeed10m": wind_speed_10m,
        "windDirection10m": float(current_raw.Variables(11).Value()),
        "windGusts10m": float(current_raw.Variables(12).Value()),
        "time": datetime.fromtimestamp(current_raw.Time(), tz=timezone.utc).isoformat(),
    }

    # -------- HOURLY --------
    hourly_raw = response.Hourly()
    if hourly_raw is None:
        raise ValueError("Open-Meteo não retornou dados 'hourly'")
    hourly_raw = cast(Any, hourly_raw)

    hourly_times = pd.date_range(
        start=pd.to_datetime(hourly_raw.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly_raw.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly_raw.Interval()),
        inclusive="left",
    )

    # Mapear arrays em ordem:
    h_temp = hourly_raw.Variables(0).ValuesAsNumpy()
    h_rh = hourly_raw.Variables(1).ValuesAsNumpy()
    h_dew = hourly_raw.Variables(2).ValuesAsNumpy()
    h_app = hourly_raw.Variables(3).ValuesAsNumpy()
    h_pop = hourly_raw.Variables(4).ValuesAsNumpy()
    h_prec = hourly_raw.Variables(5).ValuesAsNumpy()
    h_wspd10 = hourly_raw.Variables(6).ValuesAsNumpy()
    h_wspd80 = hourly_raw.Variables(7).ValuesAsNumpy()
    h_wspd120 = hourly_raw.Variables(8).ValuesAsNumpy()
    h_wdir10 = hourly_raw.Variables(9).ValuesAsNumpy()
    h_wdir80 = hourly_raw.Variables(10).ValuesAsNumpy()
    h_wdir120 = hourly_raw.Variables(11).ValuesAsNumpy()
    h_wgust10 = hourly_raw.Variables(12).ValuesAsNumpy()
    h_vis = hourly_raw.Variables(13).ValuesAsNumpy()
    h_snowfall = hourly_raw.Variables(14).ValuesAsNumpy()

    hourly_points: List[Dict[str, Any]] = []
    for i, t in enumerate(hourly_times):
        hourly_points.append(
    {
        "time": t.isoformat(),
        "temperature": float(h_temp[i]),
        "humidity": float(h_rh[i]),
        "dewPoint": float(h_dew[i]),
        "apparentTemperature": float(h_app[i]),
        "precipitationProbability": float(h_pop[i]),
        "precipitation": float(h_prec[i]),
        "windspeed": float(h_wspd10[i]),
        "windSpeed10m": float(h_wspd10[i]),
        "windSpeed80m": float(h_wspd80[i]),
        "windSpeed120m": float(h_wspd120[i]),
        "windDirection10m": float(h_wdir10[i]),
        "windDirection80m": float(h_wdir80[i]),
        "windDirection120m": float(h_wdir120[i]),
        "windGusts10m": float(h_wgust10[i]),
        "visibility": float(h_vis[i]),
        "snowfall": float(h_snowfall[i]),
    }
)

    # -------- DAILY --------
    daily_raw = response.Daily()
    if daily_raw is None:
        raise ValueError("Open-Meteo não retornou dados 'daily'")
    daily_raw = cast(Any, daily_raw)

    daily_times = pd.date_range(
        start=pd.to_datetime(daily_raw.Time(), unit="s", utc=True),
        end=pd.to_datetime(daily_raw.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=daily_raw.Interval()),
        inclusive="left",
    )

    d_tmax = daily_raw.Variables(0).ValuesAsNumpy()
    d_tmin = daily_raw.Variables(1).ValuesAsNumpy()
    d_app_max = daily_raw.Variables(2).ValuesAsNumpy()
    d_app_min = daily_raw.Variables(3).ValuesAsNumpy()
    d_uv_max = daily_raw.Variables(4).ValuesAsNumpy()
    d_uv_clear_max = daily_raw.Variables(5).ValuesAsNumpy()
    d_pop_max = daily_raw.Variables(6).ValuesAsNumpy()
    d_prec_sum = daily_raw.Variables(7).ValuesAsNumpy()
    d_rain_sum = daily_raw.Variables(8).ValuesAsNumpy()
    d_snow_sum = daily_raw.Variables(9).ValuesAsNumpy()
    d_sunrise = daily_raw.Variables(10).ValuesAsNumpy()
    d_sunset = daily_raw.Variables(11).ValuesAsNumpy()
    d_daylight = daily_raw.Variables(12).ValuesAsNumpy()
    d_sunshine = daily_raw.Variables(13).ValuesAsNumpy()
    d_wspd_max = daily_raw.Variables(14).ValuesAsNumpy()
    d_wspd_min = daily_raw.Variables(15).ValuesAsNumpy()
    d_wgust_max = daily_raw.Variables(16).ValuesAsNumpy()
    d_wgust_min = daily_raw.Variables(17).ValuesAsNumpy()
    d_wdir_dom = daily_raw.Variables(18).ValuesAsNumpy()
    d_rh_max = daily_raw.Variables(19).ValuesAsNumpy()
    d_rh_min = daily_raw.Variables(20).ValuesAsNumpy()
    d_rh_mean = daily_raw.Variables(21).ValuesAsNumpy()

    def get_idx_or_scalar(value, i: int):
        try:
            return value[i]
        except TypeError:
            return value

    daily_points: List[Dict[str, Any]] = []
    for i, t in enumerate(daily_times):
        sunrise_ts = get_idx_or_scalar(d_sunrise, i)
        sunset_ts = get_idx_or_scalar(d_sunset, i)

        daily_points.append(
            {
                "time": t.date().isoformat(),
                "temperatureMax": float(d_tmax[i]),
                "temperatureMin": float(d_tmin[i]),
                "apparentTemperatureMax": float(d_app_max[i]),
                "apparentTemperatureMin": float(d_app_min[i]),
                "uvIndexMax": float(d_uv_max[i]),
                "uvIndexClearSkyMax": float(d_uv_clear_max[i]),
                "precipitationProbabilityMax": float(d_pop_max[i]),
                "precipitationSum": float(d_prec_sum[i]),
                "rainSum": float(d_rain_sum[i]),
                "snowfallSum": float(d_snow_sum[i]),
                "sunrise": pd.to_datetime(sunrise_ts, unit="s", utc=True).isoformat(),
                "sunset": pd.to_datetime(sunset_ts, unit="s", utc=True).isoformat(),
                "daylightDuration": float(d_daylight[i]),
                "sunshineDuration": float(d_sunshine[i]),
                "windSpeed10mMax": float(d_wspd_max[i]),
                "windSpeed10mMin": float(d_wspd_min[i]),
                "windGusts10mMax": float(d_wgust_max[i]),
                "windGusts10mMin": float(d_wgust_min[i]),
                "windDirection10mDominant": float(d_wdir_dom[i]),
                "relativeHumidity2mMax": float(d_rh_max[i]),
                "relativeHumidity2mMin": float(d_rh_min[i]),
                "relativeHumidity2mMean": float(d_rh_mean[i]),
            }
        )
        print("DEBUG daily_points len:", len(daily_points))
        if daily_points:
            print("DEBUG first daily point:", daily_points[0])


    return {
        "location": {
            "city": location["city"],
            "state": location["state"],
            "countryCode": location["countryCode"],
            "lat": location["lat"],
            "lon": location["lon"],
        },
        "requestedAt": datetime.now(timezone.utc).isoformat(),
        "current": current,
        "hourly": hourly_points,
        "daily": daily_points,
    }