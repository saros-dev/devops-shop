FROM golang:1.27.1 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o devops-shop ./cmd/api

FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/devops-shop .

EXPOSE 8080

CMD ["./devops-shop"]