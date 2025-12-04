# build the front end
FROM node:20-alpine AS frontend-deps
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ .
COPY --from=frontend-deps /app/frontend/node_modules ./node_modules
RUN npm run build

# final stage
FROM python:3.11-slim AS runner
WORKDIR /app

# Install Node.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json

# Copy backend
COPY backend/ ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

ENV NODE_ENV=production

EXPOSE 3000 5000

# Start script to run both services
COPY start.sh ./
RUN chmod +x start.sh
CMD ["./start.sh"]
