# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: assemble PocketBase + the built frontend ----
FROM alpine:3.20
WORKDIR /pb

RUN apk add --no-cache ca-certificates unzip curl

ARG PB_VERSION=0.39.6
RUN curl -sL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o /tmp/pb.zip \
  && unzip /tmp/pb.zip -d /pb \
  && rm /tmp/pb.zip \
  && chmod +x /pb/pocketbase

COPY backend/pb_hooks ./pb_hooks
COPY backend/pb_migrations ./pb_migrations
COPY --from=frontend-build /app/dist ./pb_public

# Railway (and most platforms) inject $PORT at runtime; default to 8090
# for local `docker run` / other hosts that don't set it.
EXPOSE 8090
CMD ["sh", "-c", "/pb/pocketbase serve --http=0.0.0.0:${PORT:-8090}"]
