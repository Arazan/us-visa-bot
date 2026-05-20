# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install deps first to leverage Docker layer cache.
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest of the source.
COPY src ./src

# Run as the non-root user that ships with the node image.
USER node

# Configuration is provided via env vars (see README). The CLI flags
# (-c, -t, -m, --dry-run, ...) are passed as `docker run` arguments.
ENTRYPOINT ["node", "src/index.js"]
