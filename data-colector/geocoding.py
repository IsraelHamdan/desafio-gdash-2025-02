import requests

def get_lat_lon_from_address(location: dict):
    query = f"{location['neighborhood']}, {location['city']}, {location['state']}, Brazil"

    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query, "count": 1, "language": "pt", "format": "json"}

    response = requests.get(url, params=params).json()

    if not response.get("results"):
        raise ValueError(f"Localização não encontrada: {query}")

    best_match = response["results"][0]

    return {
        **location,
        "lat": best_match["latitude"],
        "lon": best_match["longitude"],
    }
