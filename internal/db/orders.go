package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type Order struct {
	ID          int     `json:"id"`
	UserID      int     `json:"user_id"`
	Status      string  `json:"status"`
	TotalAmount float64 `json:"total_amount"`
	CreatedAt   string  `json:"created_at"`
}

type OrderItem struct {
	ID        int     `json:"id"`
	OrderID   int     `json:"order_id"`
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

func GetOrders(
	ctx context.Context,
	conn *pgx.Conn,
) ([]Order, error) {
	rows, err := conn.Query(ctx, `
		SELECT
			id,
			user_id,
			status,
			total_amount,
			created_at::text
		FROM orders
		ORDER BY id DESC
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order

	for rows.Next() {
		var order Order

		if err := rows.Scan(
			&order.ID,
			&order.UserID,
			&order.Status,
			&order.TotalAmount,
			&order.CreatedAt,
		); err != nil {
			return nil, err
		}

		orders = append(orders, order)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return orders, nil
}

func GetOrder(
	ctx context.Context,
	conn *pgx.Conn,
	id int,
) (Order, []OrderItem, error) {
	var order Order

	err := conn.QueryRow(ctx, `
		SELECT
			id,
			user_id,
			status,
			total_amount,
			created_at::text
		FROM orders
		WHERE id = $1
	`, id).Scan(
		&order.ID,
		&order.UserID,
		&order.Status,
		&order.TotalAmount,
		&order.CreatedAt,
	)

	if err != nil {
		return Order{}, nil, err
	}

	rows, err := conn.Query(ctx, `
		SELECT
			id,
			order_id,
			product_id,
			quantity,
			unit_price
		FROM order_items
		WHERE order_id = $1
		ORDER BY id
	`, id)
	if err != nil {
		return Order{}, nil, err
	}
	defer rows.Close()

	var items []OrderItem

	for rows.Next() {
		var item OrderItem

		if err := rows.Scan(
			&item.ID,
			&item.OrderID,
			&item.ProductID,
			&item.Quantity,
			&item.UnitPrice,
		); err != nil {
			return Order{}, nil, err
		}

		items = append(items, item)
	}

	return order, items, rows.Err()
}