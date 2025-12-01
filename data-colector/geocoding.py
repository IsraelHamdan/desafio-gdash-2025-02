import requests
BRAZIL_STATE_MAP = {
    "AC": "Acre",
    "AL": "Alagoas",
    "AP": "Amapá",
    "AM": "Amazonas",
    "BA": "Bahia",
    "CE": "Ceará",
    "DF": "Distrito Federal",
    "ES": "Espírito Santo",
    "GO": "Goiás",
    "MA": "Maranhão",
    "MT": "Mato Grosso",
    "MS": "Mato Grosso do Sul",
    "MG": "Minas Gerais",
    "PA": "Pará",
    "PB": "Paraíba",
    "PR": "Paraná",
    "PE": "Pernambuco",
    "PI": "Piauí",
    "RJ": "Rio de Janeiro",
    "RN": "Rio Grande do Norte",
    "RS": "Rio Grande do Sul",
    "RO": "Rondônia",
    "RR": "Roraima",
    "SC": "Santa Catarina",
    "SP": "São Paulo",
    "SE": "Sergipe",
    "TO": "Tocantins",
}


def get_lat_lon_from_address(location: dict):
    city = location["city"]
    state = location.get("state")
    country_code = location.get("countryCode", "BR")
    url = "https://geocoding-api.open-meteo.com/v1/search"

    print(city)
    print(state)
    print(country_code)

    resp = requests.get(url, params={
        "name": city,
        "count": 10,
        "language": "pt",
        "format": "json",
        "country_code": country_code,
    }, timeout=10)

    # Boa prática: checar status
    resp.raise_for_status()

    data = resp.json()
    # 👇 AQUI estava o erro
    results = data.get("results") or []

    print(results)

    if not results:
        raise ValueError(
            f"Localização não encontrada: city={city}, state={state}, country={country_code}"
        )

    expected_admin1 = None

    if state:
        # Se tiver esse mapa em algum lugar
        expected_admin1 = BRAZIL_STATE_MAP.get(state.upper(), state)

    best_match = None 

    if expected_admin1:
        for r in results:
            if r.get("admin1") == expected_admin1 and r.get("country_code") == country_code:
                best_match = r
                break

    if best_match is None:
        best_match = results[0]

    return {
        **location,
        "lat": best_match["latitude"],
        "lon": best_match["longitude"],
    }
