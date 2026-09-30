import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The admin panel is a plain Vite app that talks to the *same* Supabase
// project as the Expo app, so there is exactly one source of truth for
// credentials and one set of RLS rules.
//
// `envDir: '..'` makes Vite read the repository root `.env` -- the very
// file the mobile app loads -- instead of requiring a second copy here.
// `envPrefix` admits the EXPO_PUBLIC_ names, which are the ones already
// in that file; VITE_ is kept as an override for deployments that inject
// their own.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '..',
  envPrefix: ['VITE_', 'EXPO_PUBLIC_'],
  resolve: {
    // Mirrors the app's `@/*` -> `src/*` alias so imports read the same
    // in both projects. Needs the matching `paths` entry in
    // tsconfig.app.json; without it TypeScript cannot resolve these.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
