package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type Product struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Category    string  `json:"category"`
	Price       float64 `json:"price"`
}

func GetProducts(ctx context.Context, conn *pgx.Conn) ([]Product, error) {
	rows, err := conn.Query(ctx, `
		SELECT id, name, description, category, price
		FROM products
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product

	for rows.Next() {
		var p Product

		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Category,
			&p.Price,
		); err != nil {
			return nil, err
		}

		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func GetProduct(
	ctx context.Context,
	conn *pgx.Conn,
	id int,
) (Product, error) {
	var product Product

	err := conn.QueryRow(ctx, `
		SELECT id, name, description, category, price
		FROM products
		WHERE id = $1
	`, id).Scan(
		&product.ID,
		&product.Name,
		&product.Description,
		&product.Category,
		&product.Price,
	)

	if err != nil {
		return Product{}, err
	}

	return product, nil
}

func SearchProducts(
	ctx context.Context,
	conn *pgx.Conn,
	query string,
) ([]Product, error) {
	rows, err := conn.Query(ctx, `
		SELECT id, name, description, category, price
		FROM products
		WHERE
			name ILIKE '%' || $1 || '%'
			OR description ILIKE '%' || $1 || '%'
			OR category ILIKE '%' || $1 || '%'
		ORDER BY id
		LIMIT 100
	`, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product

	for rows.Next() {
		var product Product

		if err := rows.Scan(
			&product.ID,
			&product.Name,
			&product.Description,
			&product.Category,
			&product.Price,
		); err != nil {
			return nil, err
		}

		products = append(products, product)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}