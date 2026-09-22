package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
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

var users = []User{
	{ID: 1, Name: "Saros", Email: "saros@example.com"},
	{ID: 2, Name: "Alice", Email: "alice@example.com"},
}

var products = []Product{
	{ID: 1, Name: "MacBook Pro", Price: 1999.99},
	{ID: 2, Name: "Keyboard", Price: 99.99},
	{ID: 3, Name: "Monitor", Price: 499.99},
}

func main() {
	r := chi.NewRouter()

	r.Get("/health", healthHandler)

	r.Get("/api/users", usersHandler)
	r.Post("/api/users", createUserHandler)

	r.Get("/api/products", productsHandler)

	r.Get("/api/products/{id}", productHandler)

	r.Get("/api/orders", ordersHandler)

	r.Get("/api/slow", slowHandler)

	r.Get("/api/error", errorHandler)

	log.Println("API listening on :8080")

	err := http.ListenAndServe(":8080", r)
	if err != nil {
		log.Fatal(err)
	}
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status": "healthy",
	})
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, users)
}

func createUserHandler(w http.ResponseWriter, r *http.Request) {
	var user User

	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "invalid JSON",
		})
		return
	}

	user.ID = len(users) + 1
	users = append(users, user)

	writeJSON(w, http.StatusCreated, user)
}

func productsHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, products)
}

func productHandler(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	for _, product := range products {
		if string(rune(product.ID+'0')) == id {
			writeJSON(w, http.StatusOK, product)
			return
		}
	}

	writeJSON(w, http.StatusNotFound, map[string]string{
		"error": "product not found",
	})
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

	json.NewEncoder(w).Encode(data)
}
