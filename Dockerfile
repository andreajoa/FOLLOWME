# syntax=docker/dockerfile:1
FROM node:22-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NC_ENV_HASH
RUN --mount=type=secret,id=ncenv sh -c 'set -a; [ -f /run/secrets/ncenv ] && . /run/secrets/ncenv; set +a; npx prisma generate && npm run build'

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

CMD ["npm", "start"]
