// import { defineConfig } from 'vitest/config';
// import tsconfigPaths from 'vite-tsconfig-paths';

// export default defineConfig({
//   // Resolves the path aliases declared in tsconfig.json, including the ones
//   // added by `nest g library`.
//   plugins: [tsconfigPaths()],
//   test: {
//     globals: true,
//     root: './',
//     include: ['**/*.spec.ts'],
//   },
// });

import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { config } from 'dotenv';
import { resolve } from 'path';

// Integration Test အတွက် .env ဖိုင်အား အတင်းအကျပ် ရှာဖွေဖတ်ခိုင်းခြင်း ⭐
config({ path: resolve(__dirname, './.env') });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});

