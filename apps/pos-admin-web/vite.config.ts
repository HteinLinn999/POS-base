import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite"; // Tailwind v4 CSS Compiler ⭐

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // Tailwind v4 အား Plugin အဖြစ် တိုက်ရိုက် မောင်းနှင်ခြင်း ⭐
  ],
});
