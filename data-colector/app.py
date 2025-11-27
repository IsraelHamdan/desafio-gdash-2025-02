import os
import json
import pika

from geocoding import get_lat_lon_from_address  
from collector import collect_weather_log_location


RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
INPUT_QUEUE = os.getenv("INPUT_QUEUE", "weather.locations")
OUTPUT_QUEUE = os.getenv("OUTPUT_QUEUE", "weather.jobs")


def main():
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()

    channel.queue_declare(queue=INPUT_QUEUE, durable=True)
    channel.queue_declare(queue=OUTPUT_QUEUE, durable=True)

    def on_message(ch, method, properties, body):
        try:
            msg = json.loads(body)
            location_raw = msg["location"]

            print(f"📥 Recebido pedido de clima para: {location_raw}")

           
            enriched_location = get_lat_lon_from_address(location_raw)

            weather_payload = collect_weather_log_location(enriched_location)

            ch.basic_publish(
                exchange="",
                routing_key=OUTPUT_QUEUE,
                body=json.dumps(weather_payload).encode("utf-8"),
                properties=pika.BasicProperties(delivery_mode=2),
            )

            print(f"📤 Dados climáticos enviados para {OUTPUT_QUEUE}")

            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception as e:
            print(f"[❌] Erro ao processar mensagem: {e}", flush=True)
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    print(" [*] Aguardando mensagens em weather.locations...")
    channel.basic_consume(queue=INPUT_QUEUE, on_message_callback=on_message)
    channel.start_consuming()


if __name__ == "__main__":
    main()
