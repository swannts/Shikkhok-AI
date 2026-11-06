FROM golang:1.23-alpine AS builder
WORKDIR /src
RUN apk add --no-cache ca-certificates
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/shikkhok-worker .

FROM golang:1.23-alpine AS development
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
CMD ["go", "run", "."]

FROM alpine:3.21 AS runner
RUN apk add --no-cache ca-certificates && addgroup -S -g 10001 app && adduser -S -u 10001 -G app app
WORKDIR /app
COPY --from=builder /out/shikkhok-worker /usr/local/bin/shikkhok-worker
ENV NODE_ENV=production
USER app
EXPOSE 3100
ENTRYPOINT ["/usr/local/bin/shikkhok-worker"]
