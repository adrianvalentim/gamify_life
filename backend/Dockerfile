# Stage 1: Build the Go application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go.mod and go.sum to download dependencies first, for better caching
COPY go.mod go.sum ./
RUN go mod tidy
RUN go mod download

# Copy the rest of the source code
COPY . .

# Build the application for a static binary suitable for Alpine
# CGO_ENABLED=0 is critical for this
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/server ./cmd/server

# Stage 2: Create the final, minimal image
FROM alpine:latest

# It's good practice to run security updates
RUN apk --no-cache add ca-certificates && update-ca-certificates

WORKDIR /root/

# Copy only the compiled binary from the builder stage
COPY --from=builder /app/server .

# Expose port 8080 to the outside world
EXPOSE 8080

# Command to run the executable when the container starts
CMD ["./server"] 