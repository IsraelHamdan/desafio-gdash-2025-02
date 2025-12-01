import openmeteo_requests
import requests_cache
from retry_requests import retry
import pandas as pd
from typing import Dict, Any, cast
from datetime import datetime, timezone
import requests


cache_session = requests_cache.CachedSession(".cache", expire_after=3600)
retry_session = retry(cache_session, retries=5, backoff_factor=0.2)

openmeteo = openmeteo_requests.Client(session=retry_session) # type: ignore[arg-type]

def collect_weather_log_location(location: Dict[str, Any]) -> Dict[str, Any]:
    lat = location["lat"]
    lon = location["lon"]

    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        # ordem IMPORTA pq vamos acessar por índice
        "hourly": [
                "temperature_2m",
                "relative_humidity_2m",
                "wind_speed_10m",  # 👈 aqui estava "windspeed_10m"
                "precipitation",
        ],       
        "current": [
            "temperature_2m", 
            "relative_humidity_2m", 
            "apparent_temperature", 
            "is_day", 
            "precipitation"
        ],
        "timezone": "auto",
    }


    responses = openmeteo.weather_api(url, params=params)
    response = responses[0]

    # Dados atuais
    current_raw = response.Current()
    if current_raw is None:
        raise ValueError("Erro: Open-Meteo não retornou dados 'current'")
    
    current_raw = cast(Any, current_raw)

    temp_var          = current_raw.Variables(0).Value()  # temperature_2m
    humidity_var      = current_raw.Variables(1).Value()  # relative_humidity_2m
    apparent_var      = current_raw.Variables(2).Value()  # apparent_temperature
    is_day_var        = current_raw.Variables(3).Value()  # is_day (0/1)
    precipitation_var = current_raw.Variables(4).Value()

    current = {
        "temperature": float(temp_var),
        "apparentTemperature": float(apparent_var),
        "humidity": float(humidity_var),
        "windspeed": float(response.Current().Variables(0).Value()) if False else float(0),  # se quiser puxar wind_speed via current também, adiciona na lista
        "precipitation": float(precipitation_var),
        "time": datetime.fromtimestamp(current_raw.Time(), tz=timezone.utc).isoformat(),
        "isDay": bool(is_day_var),
    }

    # Dados horários
    hourly = response.Hourly()
    if hourly is None:
        raise ValueError("Erro: Open-Meteo não retornou dados 'hourly'")
    hourly = cast(Any, hourly)
    times = pd.date_range(
        start=pd.to_datetime(hourly.Time(), unit="s", utc=True),
        end=pd.to_datetime(hourly.TimeEnd(), unit="s", utc=True),
        freq=pd.Timedelta(seconds=hourly.Interval()),
        inclusive="left",
    )

    hourly_points = []
    for i, time_val in enumerate(times):
        hourly_points.append(
            {
                "time": time_val.isoformat(),
                "temperature": float(hourly.Variables(0).ValuesAsNumpy()[i]),
                "humidity": float(hourly.Variables(1).ValuesAsNumpy()[i]),
                "windspeed": float(hourly.Variables(2).ValuesAsNumpy()[i]),
                "precipitation": float(hourly.Variables(3).ValuesAsNumpy()[i]),
            }
        )

    # Payload FINAL — pronto pra fila
    return {
        "location": location,  # ainda é objeto, Nest vai transformar em ObjectId na hora de salvar
        "provider": "open-meteo",
        "requestedAt": datetime.now(timezone.utc).isoformat(),
        "current": current,
        "hourly": hourly_points,
    }