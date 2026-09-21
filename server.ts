import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { classifyPlaylist } from './api/classify.ts'

const app = new Hono()

app.post('/api/classify', async (context) => {
  let body: unknown
  try {
    body = await context.req.json()
  } catch {
    return context.json({ error: '请求内容不是有效的 JSON。' }, 400)
  }

  const result = await classifyPlaylist(body)
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
})

app.use('/*', serveStatic({ root: './dist' }))
app.get('*', serveStatic({ path: './dist/index.html' }))

const port = Number(process.env.PORT ?? 8787)
serve({ fetch: app.fetch, port }, ({ port: activePort }) => {
  console.log(`SONGTYPE server listening on http://127.0.0.1:${activePort}`)
})
