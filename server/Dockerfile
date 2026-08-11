FROM node:20-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm ci
COPY server/prisma ./prisma
RUN npx prisma generate
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npx tsc

FROM node:20-alpine AS runner
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 5000
CMD npx prisma db push --skip-generate && node dist/index.js
