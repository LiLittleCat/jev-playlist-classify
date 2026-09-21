import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { classifyPlaylist } from './api/classify.ts'

const classifyApi = {
  name: 'songtype-classify-api',
  configureServer(server) {
    server.middlewares.use('/api/classify', async (request, response, next) => {
      if (request.method !== 'POST') {
        next()
        return
      }

      try {
        const chunks: Buffer[] = []
        for await (const chunk of request) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        }
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
        const result = await classifyPlaylist(body)
        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify(result.body))
      } catch {
        response.statusCode = 400
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({ error: '请求内容不是有效的 JSON。' }))
      }
    })
  },
} satisfies Plugin

export default defineConfig({
  plugins: [react(), tailwindcss(), classifyApi],
})
