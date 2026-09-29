package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/saros-dev/devops-shop/internal/db"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/trace"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Product struct {
	ID    int     `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

var products = []Product{
	{ID: 1, Name: "MacBook Pro", Price: 1999.99},
	{ID: 2, Name: "Keyboard", Price: 99.99},
	{ID: 3, Name: "Monitor", Price: 499.99},
}

func initTracer() (*trace.TracerProvider, error) {

	exporter, err := otlptracehttp.New(context.Background())
	if err != nil {
		return nil, err
	}

	tp := trace.NewTracerProvider(
		trace.WithBatcher(exporter),
	)

	otel.SetTracerProvider(tp)

	return tp, nil
}

func main() {

	tp, err := initTracer()
	if err != nil {
		log.Fatal(err)
	}

	defer func() {
		if err := tp.Shutdown(context.Background()); err != nil {
			log.Printf("failed to shutdown tracer provider: %v", err)
		}
	}()

	conn, err := db.Connect()
	if err != nil {
		log.Fatal(err)
	}

	defer conn.Close(context.Background())

	log.Println("Connected to PostgreSQL")


	r := chi.NewRouter()


	// Health
	r.Get("/health", healthHandler)


	// Prometheus metrics
	r.Handle("/metrics", promhttp.Handler())


	// Users
	r.Get("/api/users", func(w http.ResponseWriter, r *http.Request) {
		usersHandler(w, r, conn)
	})


	r.Post("/api/users", func(w http.ResponseWriter, r *http.Request) {
		createUserHandler(w, r, conn)
	})


	// Products
	r.Get("/api/products", productsHandler)

	r.Get("/api/products/search", productSearchHandler)
	r.Get("/api/products/{id}", productHandler)


	// Orders
	r.Get("/api/orders", ordersHandler)


	// Testing endpoints
	r.Get("/api/slow", slowHandler)

	r.Get("/api/error", errorHandler)


	log.Println("API listening on :8080")


	// OpenTelemetry instrumentation
	handler := otelhttp.NewHandler(
		r,
		"devops-shop",
	)


	err = http.ListenAndServe(":8080", handler)

	if err != nil {
		log.Fatal(err)
	}
}



func healthHandler(w http.ResponseWriter, r *http.Request) {

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "healthy",
	})
}



func usersHandler(w http.ResponseWriter, r *http.Request, conn *pgx.Conn) {

	users, err := db.GetUsers(r.Context(), conn)

	if err != nil {

		log.Printf("GetUsers failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get users",
		})

		return
	}


	writeJSON(w, http.StatusOK, users)
}



func createUserHandler(w http.ResponseWriter, r *http.Request, conn *pgx.Conn) {

	var user User


	err := json.NewDecoder(r.Body).Decode(&user)

	if err != nil {

		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON",
		})

		return
	}


	if user.Name == "" || user.Email == "" {

		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "name and email are required",
		})

		return
	}



	dbUser, err := db.CreateUser(
		r.Context(),
		conn,
		user.Name,
		user.Email,
	)


	if err != nil {

		if errors.Is(err, db.ErrEmailExists) {

			writeJSON(w, http.StatusConflict, map[string]string{
				"error": "email already exists",
			})

			return
		}


		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to create user",
		})

		return
	}



	user.ID = dbUser.ID
	user.Name = dbUser.Name
	user.Email = dbUser.Email


	writeJSON(w, http.StatusCreated, user)
}



func productsHandler(w http.ResponseWriter, r *http.Request) {

	writeJSON(w, http.StatusOK, products)
}



func productHandler(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid product id",
		})
		return
	}

	for _, product := range products {
		if product.ID == id {
			writeJSON(w, http.StatusOK, product)
			return
		}
	}

	writeJSON(w, http.StatusNotFound, map[string]string{
		"error": "product not found",
	})
}


func productSearchHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")

	if query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "query parameter q is required",
		})
		return
	}

	var results []Product

	for _, product := range products {
		if strings.Contains(
			strings.ToLower(product.Name),
			strings.ToLower(query),
		) {
			results = append(results, product)
		}
	}

	if results == nil {
		results = []Product{}
	}

	writeJSON(w, http.StatusOK, results)
}


func ordersHandler(w http.ResponseWriter, r *http.Request) {

	orders := []map[string]interface{}{

		{
			"id":         1,
			"user_id":    1,
			"product_id": 2,
			"quantity":   2,
		},

		{
			"id":         2,
			"user_id":    2,
			"product_id": 1,
			"quantity":   1,
		},
	}


	writeJSON(w, http.StatusOK, orders)
}



func slowHandler(w http.ResponseWriter, r *http.Request) {

	time.Sleep(3 * time.Second)


	writeJSON(w, http.StatusOK, map[string]string{
		"message": "slow request completed",
	})
}



func errorHandler(w http.ResponseWriter, r *http.Request) {

	writeJSON(w, http.StatusInternalServerError, map[string]string{
		"error": "intentional test error",
	})
}



func writeJSON(w http.ResponseWriter, status int, data interface{}) {

	w.Header().Set("Content-Type", "application/json")

	w.WriteHeader(status)


	if err := json.NewEncoder(w).Encode(data); err != nil {

		log.Printf("failed to encode JSON response: %v", err)

	}
}