import os
import json
import pika
import time
from geocoding import get_lat_lon_from_address  
from collector import collect_weather_log_location
from pika.exceptions import AMQPConnectionError


RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672/")
INPUT_QUEUE = os.getenv("INPUT_QUEUE", "weather.locations")
OUTPUT_QUEUE = os.getenv("OUTPUT_QUEUE", "weather.jobs")

def connect_rabbitmq(): 
    for attempt in range(30): 
        try :
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            print("Conectado ao Rabbit")
            return connection
        except AMQPConnectionError as e:
            print(f"⏳ Waiting for RabbitMQ... (attempt {attempt + 1}/30)")
            time.sleep(1)
    raise Exception("Falha ao conectar o Rabbit")


def main():
    print("🚀 Iniciando data-collector...")
    print(f"📋 RABBITMQ_URL: {RABBITMQ_URL}")
    print(f"📋 INPUT_QUEUE: {INPUT_QUEUE}")
    print(f"📋 OUTPUT_QUEUE: {OUTPUT_QUEUE}")
    
    connection = connect_rabbitmq()
    channel = connection.channel()

    channel.queue_declare(queue=INPUT_QUEUE, durable=True)
    channel.queue_declare(queue=OUTPUT_QUEUE, durable=True)

    print(f"✅ Filas declaradas: {INPUT_QUEUE} e {OUTPUT_QUEUE}")

    def on_message(ch, method, properties, body):
        try:
            print("\n" + "="*60)
            print("📥 NOVA MENSAGEM RECEBIDA")
            print("="*60)
            
            msg = json.loads(body)
            print(f"📦 Payload completo: {json.dumps(msg, indent=2)}")
            
            
            location_raw = msg["location"]
            print(f"📥 Recebido pedido de clima para: {location_raw}")

           
            enriched_location = get_lat_lon_from_address(location_raw)
            print(f"🌍 Location enriquecido: {enriched_location}")

            weather_payload = collect_weather_log_location(enriched_location)
            print(f"🌤️  Weather payload: {json.dumps(weather_payload, indent=2)[:200]}...")

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
    
    try:
        channel.start_consuming()
    except: 
        print("🛑 Encerrando com segurança...")
        channel.close(), 
        connection.close()

if __name__ == "__main__":
    main()
