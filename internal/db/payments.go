package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type Payment struct {
	ID            int     `json:"id"`
	OrderID       int     `json:"order_id"`
	Status        string  `json:"status"`
	Amount        float64 `json:"amount"`
	Provider      string  `json:"provider"`
	TransactionID *string `json:"transaction_id"`
	CreatedAt     string  `json:"created_at"`
}

func GetPayment(
	ctx context.Context,
	conn *pgx.Conn,
	orderID int,
) (Payment, error) {
	var payment Payment

	err := conn.QueryRow(ctx, `
		SELECT
			id,
			order_id,
			status,
			amount,
			provider,
			transaction_id,
			created_at::text
		FROM payments
		WHERE order_id = $1
	`, orderID).Scan(
		&payment.ID,
		&payment.OrderID,
		&payment.Status,
		&payment.Amount,
		&payment.Provider,
		&payment.TransactionID,
		&payment.CreatedAt,
	)

	return payment, err
}