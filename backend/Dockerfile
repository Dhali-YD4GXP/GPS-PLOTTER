# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o gps_backend main.go

# Run stage
FROM alpine:latest
WORKDIR /app
# Copy the binary
COPY --from=builder /app/gps_backend .
# Create an empty tokens.json if it doesn't exist so it doesn't crash
RUN touch tokens.json

EXPOSE 8081
CMD ["./gps_backend"]
