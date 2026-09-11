import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function serveLegacyPages() {
  return {
    name: 'serve-legacy-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/travel-ai/') || !req.url.endsWith('.html')) {
          next()
          return
        }

        const filePath = path.join(projectRoot, 'public', req.url)
        if (!fs.existsSync(filePath)) {
          next()
          return
        }

        res.setHeader('Content-Type', 'text/html')
        res.end(fs.readFileSync(filePath))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveLegacyPages()],
  server: {
    port: 5173,
    proxy: {
      // Proxy /api/* calls to the Express backend during development
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
