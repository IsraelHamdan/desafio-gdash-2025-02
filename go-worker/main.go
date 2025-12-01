package main

import (
	"bytes"
	"encoding/json"
	"io"
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

func connectRabbitMQ(rabbitURL string) (*amqp.Connection, error) {
	var conn *amqp.Connection
	var err error

	for i:= 0; i < 30; i++ {
		conn, err = amqp.Dial(rabbitURL)

		if err == nil {
			log.Println("Connected to RabbitMQ")
			return  conn, nil
		}

		log.Printf("⏳ Waiting for RabbitMQ... (attempt %d/30)", i+1)
		time.Sleep(1 * time.Second)

	}

	return nil, err
}

func main() {
	rabbitURL := os.Getenv("RABBITMQ_URL")
	if rabbitURL == "" {
		rabbitURL = "amqp://guest:guest@rabbitmq:5672/"
	}

	apiURL := os.Getenv("NEST_API_URL")
	if apiURL == "" {
		apiURL = "http://weather-api:3000/weather/intake"
	}

	conn, err := connectRabbitMQ(rabbitURL)

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
		defer resp.Body.Close()
		respBody, _ := io.ReadAll(resp.Body)

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				_ = delivery.Ack(false)
				log.Printf(" [x] Sent weather intake to Nest. Nest response: %s", string(respBody))
		} else if resp.StatusCode >= 400 && resp.StatusCode < 500 {
				log.Printf("Nest returned client error status %d, body: %s", resp.StatusCode, string(respBody))
				_ = delivery.Nack(false, false)
		} else {
				log.Printf("Nest returned server error status %d, body: %s", resp.StatusCode, string(respBody))
				_ = delivery.Nack(false, true)
		}


	}
}
