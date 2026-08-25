import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  server: {
    // DEV-ONLY same-origin proxy for the backend API — has no effect on a
    // production build (server.proxy only runs under `vite dev`). Required,
    // not a convenience: the backend's auth cookies are SameSite=Lax in
    // development, which browsers never send on a cross-port request, so
    // login would silently fail without this. See README.md "Environment &
    // Deployment Strategy" for the full explanation and the two supported
    // production deployment strategies.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Same reasoning as /api above, plus a WebSocket upgrade: the
      // Socket.IO handshake's auth cookie is scoped to this dev server's
      // origin, so the connection must be proxied same-origin too.
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})


// import path from 'node:path'
// import { fileURLToPath } from 'node:url'
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// const dirname = path.dirname(fileURLToPath(import.meta.url))

// export default defineConfig({
//   plugins: [react(), tailwindcss()],

//   resolve: {
//     alias: {
//       '@': path.resolve(dirname, './src'),
//     },
//   },

//   server: {
//     proxy: {
//       '/api': {
//         target: 'https://l-s-a-project.onrender.com',
//         changeOrigin: true,
//         secure: true,
//       },

//       '/socket.io': {
//         target: 'https://l-s-a-project.onrender.com',
//         changeOrigin: true,
//         secure: true,
//         ws: true,
//       },
//     },
//   },
// })

