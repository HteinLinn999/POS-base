# Stage 1: Build Node
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/pos-admin-web/package.json ./apps/pos-admin-web/
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm install -g pnpm@12.4.1
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @pos/shared-types build
RUN pnpm --filter pos-admin-web build

# Stage 2: Nginx Runner (Vite Static Files များအား Nginx ဖြင့် မောင်းနှင်ခြင်း) ⭐
FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/apps/pos-admin-web/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]