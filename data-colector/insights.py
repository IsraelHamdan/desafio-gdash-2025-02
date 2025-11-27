
from typing import Dict, Any, List


def generate_clothing_insight(hourly: List[Dict[str, Any]]) -> Dict[str, Any]:
    temps = [h["temperature"] for h in hourly]
    winds = [h["windspeed"] for h in hourly]
    precs = [h["precipitation"] for h in hourly]

    min_temp = min(temps)
    max_temp = max(temps)
    avg_temp = sum(temps) / len(temps)
    temp_amplitude = max_temp - min_temp
    max_wind = max(winds)
    will_rain = any(p > 0.1 for p in precs)

    tags = []
    details = []

    # classificação por temperatura máxima
    if max_temp <= 15:
        tags.append("frio")
        details.append("Use roupas quentes (casaco pesado, calça, meias grossas).")
    elif max_temp <= 22:
        tags.append("ameno")
        details.append("Use um casaco leve ou moletom, com camiseta por baixo.")
    elif max_temp <= 28:
        tags.append("quente")
        details.append("Prefira roupas leves (camiseta, calça leve ou bermuda).")
    else:
        tags.append("muito_quente")
        details.append("Roupas bem leves, tecidos respiráveis e bastante hidratação.")

    # amplitude térmica
    if temp_amplitude >= 8:
        tags.append("amplitude_alta")
        details.append("A temperatura muda bastante ao longo do dia; vista-se em camadas.")

    # chuva
    if will_rain:
        tags.append("chuva")
        details.append("Leve guarda-chuva ou capa de chuva.")

    # vento
    if max_wind >= 25:
        tags.append("vento_forte")
        details.append("Considere um corta-vento ou jaqueta que proteja do vento.")

    summary = (
        f"Dia com mínima de {min_temp:.1f}°C e máxima de {max_temp:.1f}°C"
        f"{', com chance de chuva.' if will_rain else '.'}"
    )

    clothing_advice = "Sugestão de vestimenta: " + " ".join(details)

    return {
        "metrics": {
            "minTemp": min_temp,
            "maxTemp": max_temp,
            "avgTemp": avg_temp,
            "tempAmplitude": temp_amplitude,
            "willRain": will_rain,
            "maxWindspeed": max_wind,
        },
        "summary": summary,
        "clothingAdvice": clothing_advice,
        "clothingDetails": details,
        "tags": tags,
    }
