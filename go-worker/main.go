package main

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

type WeatherIntake struct {
	Location  map[string]any `json:"location"`
	Provider  string         `json:"provider"`
	RequestedAt string       `json:"requestedAt"`
	Current   map[string]any `json:"current"`
	Hourly    []map[string]any `json:"hourly"`
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	apiURL := os.Getenv("NEST_API_URL")
	if apiURL == "" {
		apiURL = "http://weather-api:3000/api/weather/intake"
	}

	conn, err := amqp.Dial(rabbitURL)
	if err != nil {
		log.Fatalf("failed to connect to RabbitMQ: %v", err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatalf("failed to open channel: %v", err)
	}
	defer ch.Close()

	queue, err := ch.QueueDeclare(
		"weather.jobs",
		true,
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("failed to declare queue: %v", err)
	}

	msgs, err := ch.Consume(
		queue.Name,
		"",
		false, // autoAck = false (a gente que decide quando ack)
		false,
		false,
		false,
		nil,
	)
	if err != nil {
		log.Fatalf("failed to register consumer: %v", err)
	}

	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	log.Println(" [*] Waiting for weather jobs...")

	for delivery := range msgs {
		var intake WeatherIntake

		if err := json.Unmarshal(delivery.Body, &intake); err != nil {
			log.Printf("failed to unmarshal message: %v", err)
			_ = delivery.Nack(false, false) // descarta mensagem inválida
			continue
		}

		body, err := json.Marshal(intake)
		if err != nil {
			log.Printf("failed to marshal intake: %v", err)
			_ = delivery.Nack(false, false)
			continue
		}

		req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(body))
		if err != nil {
			log.Printf("failed to create request: %v", err)
			_ = delivery.Nack(false, true) // erro transiente, pode tentar de novo
			continue
		}
		req.Header.Set("Content-Type", "application/json")

		resp, err := client.Do(req)
		if err != nil {
			log.Printf("failed to call Nest API: %v", err)
			_ = delivery.Nack(false, true)
			continue
		}
		resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			_ = delivery.Ack(false)
			log.Println(" [x] Sent weather intake to Nest")
		} else {
			log.Printf("Nest returned status %d", resp.StatusCode)
			_ = delivery.Nack(false, true)
		}
	}
}
