FROM golang:1.25 AS builder 

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o devops-shop ./cmd/api




FROM debian:bookworm-slim

WORKDIR /app

COPY --from=builder /app/devops-shop .

EXPOSE 3000

CMD ["./devops-shop"] 
