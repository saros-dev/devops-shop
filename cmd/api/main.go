package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/saros-dev/devops-shop/internal/db"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/trace"
	"github.com/saros-dev/devops-shop/internal/metrics"



)

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
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
	r.Use(metrics.Middleware)

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
	r.Get("/api/products", func(w http.ResponseWriter, r *http.Request) {
		productsHandler(w, r, conn)
	})

	r.Get("/api/products/search", func(w http.ResponseWriter, r *http.Request) {
		productSearchHandler(w, r, conn)
	})

	r.Get("/api/products/{id}", func(w http.ResponseWriter, r *http.Request) {
		productHandler(w, r, conn)
	})

	// Orders
	r.Get("/api/orders", func(w http.ResponseWriter, r *http.Request) {
		ordersHandler(w, r, conn)
	})

	r.Get("/api/orders/{id}", func(w http.ResponseWriter, r *http.Request) {
		orderHandler(w, r, conn)
	})

	// Inventory
	r.Get("/api/inventory", func(w http.ResponseWriter, r *http.Request) {
		inventoryHandler(w, r, conn)
	})

	// Testing endpoints
	r.Get("/api/slow", slowHandler)
	r.Get("/api/error", errorHandler)

	log.Println("API listening on :8080")

	handler := otelhttp.NewHandler(
		r,
		"devops-shop",
	)

	if err := http.ListenAndServe(":8080", handler); err != nil {
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

func createUserHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	var user User

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON",
		})

		return
	}

	if strings.TrimSpace(user.Name) == "" ||
		strings.TrimSpace(user.Email) == "" {
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

		log.Printf("CreateUser failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to create user",
		})

		return
	}

	writeJSON(w, http.StatusCreated, dbUser)
}

func productsHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	products, err := db.GetProducts(r.Context(), conn)
	if err != nil {
		log.Printf("GetProducts failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get products",
		})

		return
	}

	if products == nil {
		products = []db.Product{}
	}

	writeJSON(w, http.StatusOK, products)
}

func productHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid product id",
		})

		return
	}

	product, err := db.GetProduct(
		r.Context(),
		conn,
		id,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "product not found",
			})

			return
		}

		log.Printf("GetProduct failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get product",
		})

		return
	}

	writeJSON(w, http.StatusOK, product)
}

func productSearchHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	query := strings.TrimSpace(
		r.URL.Query().Get("q"),
	)

	if query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "query parameter q is required",
		})

		return
	}

	products, err := db.SearchProducts(
		r.Context(),
		conn,
		query,
	)

	if err != nil {
		log.Printf("SearchProducts failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to search products",
		})

		return
	}

	if products == nil {
		products = []db.Product{}
	}

	writeJSON(w, http.StatusOK, products)
}

func ordersHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	orders, err := db.GetOrders(
		r.Context(),
		conn,
	)

	if err != nil {
		log.Printf("GetOrders failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get orders",
		})

		return
	}

	if orders == nil {
		orders = []db.Order{}
	}

	writeJSON(w, http.StatusOK, orders)
}

func orderHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	id, err := strconv.Atoi(
		chi.URLParam(r, "id"),
	)

	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid order id",
		})

		return
	}

	order, items, err := db.GetOrder(
		r.Context(),
		conn,
		id,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			writeJSON(w, http.StatusNotFound, map[string]string{
				"error": "order not found",
			})

			return
		}

		log.Printf("GetOrder failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get order",
		})

		return
	}

	if items == nil {
		items = []db.OrderItem{}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"order": order,
		"items": items,
	})
}

func inventoryHandler(
	w http.ResponseWriter,
	r *http.Request,
	conn *pgx.Conn,
) {
	items, err := db.GetInventory(
		r.Context(),
		conn,
	)

	if err != nil {
		log.Printf("GetInventory failed: %v", err)

		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "failed to get inventory",
		})

		return
	}

	if items == nil {
		items = []db.InventoryItem{}
	}

	writeJSON(w, http.StatusOK, items)
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

func writeJSON(
	w http.ResponseWriter,
	status int,
	data interface{},
) {
	w.Header().Set(
		"Content-Type",
		"application/json",
	)

	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf(
			"failed to encode JSON response: %v",
			err,
		)
	}
}
