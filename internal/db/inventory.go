package db

import (
	"context"

	"github.com/jackc/pgx/v5"
)

type InventoryItem struct {
	ID               int `json:"id"`
	ProductID        int `json:"product_id"`
	Quantity         int `json:"quantity"`
	ReservedQuantity int `json:"reserved_quantity"`
	Available        int `json:"available"`
}

func GetInventory(
	ctx context.Context,
	conn *pgx.Conn,
) ([]InventoryItem, error) {
	rows, err := conn.Query(ctx, `
		SELECT
			id,
			product_id,
			quantity,
			reserved_quantity,
			quantity - reserved_quantity AS available
		FROM inventory
		ORDER BY id
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []InventoryItem

	for rows.Next() {
		var item InventoryItem

		if err := rows.Scan(
			&item.ID,
			&item.ProductID,
			&item.Quantity,
			&item.ReservedQuantity,
			&item.Available,
		); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}