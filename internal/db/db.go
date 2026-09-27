package db

import (
	"context"
	"errors"
	"os"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5"
)

var ErrEmailExists = errors.New("email already exists")

func Connect() (*pgx.Conn, error) {
	dsn := os.Getenv("DATABASE_URL")

	return pgx.Connect(context.Background(), dsn)
}

type User struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

func GetUsers(ctx context.Context, conn *pgx.Conn) ([]User, error) {
	rows, err := conn.Query(ctx, `
		SELECT id, name, email
		FROM users
		ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []User

	for rows.Next() {
		var user User

		err := rows.Scan(
			&user.ID,
			&user.Name,
			&user.Email,
		)
		if err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func CreateUser(
	ctx context.Context,
	conn *pgx.Conn,
	name string,
	email string,
) (User, error) {
	var user User

	err := conn.QueryRow(ctx, `
		INSERT INTO users (name, email)
		VALUES ($1, $2)
		RETURNING id, name, email
	`, name, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
	)

	if err != nil {
		var pgErr *pgconn.PgError

		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailExists
		}

		return User{}, err
	}

	return user, nil
}
