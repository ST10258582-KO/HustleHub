FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p logs && chown -R appuser:appgroup /app
USER appuser
EXPOSE 3443
CMD ["node", "src/server.js"]
