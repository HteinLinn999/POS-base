# Stage 1: Build Module
FROM node:22-alpine AS builder
WORKDIR /app

# Monorepo တစ်ခုလုံးရှိ pnpm config များနှင့် Lockfile အား အရင်ကူးယူခြင်း
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/pos-backend/package.json ./apps/pos-backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Global အနေဖြင့် pnpm အား သွင်းယူပြီး dependencies များ ချိတ်ဆက်ခြင်း
RUN npm install -g pnpm@12.4.1
RUN pnpm install --frozen-lockfile

# Source code အားလုံးအား ကူးယူခြင်း
COPY . .

# 🔗 FIXED: Nest.js မဆောက်ခင် Prisma Engine Core အား အရင်ဆုံး Generate အတင်းအကျပ် လုပ်ခိုင်းခြင်း 🎯 ⭐
RUN pnpm --filter @pos/shared-types build
RUN pnpm --filter pos-backend db:generate 
RUN pnpm --filter pos-backend build

# Stage 2: Production Module (ဆာဗာလိုင်းအတွက် အပေါ့ပါးဆုံး Runtime တည်ဆောက်ခြင်း)
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /app ./

RUN npm install -g pnpm@12.4.1
RUN npm install -g prisma

EXPOSE 3000

# Container စတင်ပွင့်လာသည်နှင့် Database ထဲသို့ Migration များ လုပ်ဆောင်ပြီးမှ API မောင်းနှင်ခိုင်းခြင်း
CMD ["sh", "-c", "pnpm --filter pos-backend db:generate && pnpm --filter pos-backend start:prod"]
