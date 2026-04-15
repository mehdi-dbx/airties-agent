'use strict'

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') })

const express        = require('express')
const fs             = require('fs')
const path           = require('path')
const { buildGraph } = require('./lib/graph-builder')

const PORT        = process.env.VISUAL_BACKEND_PORT || 9001
const LAYOUT_FILE = path.resolve(__dirname, '../graph-layout.json')
const app         = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  next()
})
app.use(express.json())

function loadLayout() {
  try {
    return JSON.parse(fs.readFileSync(LAYOUT_FILE, 'utf8'))
  } catch {
    return {}
  }
}

function saveLayout(positions) {
  fs.writeFileSync(LAYOUT_FILE, JSON.stringify(positions, null, 2))
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/graph', (_req, res) => {
  try {
    const graph    = buildGraph()
    const saved    = loadLayout()
    // Merge saved positions over computed defaults
    graph.nodes = graph.nodes.map((n) =>
      saved[n.id] ? { ...n, position: saved[n.id] } : n
    )
    res.json(graph)
  } catch (err) {
    console.error('[graph-builder] error:', err)
    res.status(500).json({ error: String(err) })
  }
})

// PUT /api/layout  body: { id: { x, y }, ... }
app.put('/api/layout', (req, res) => {
  try {
    const positions = req.body
    if (typeof positions !== 'object' || Array.isArray(positions)) {
      return res.status(400).json({ error: 'expected object { nodeId: {x,y} }' })
    }
    saveLayout(positions)
    res.json({ ok: true })
  } catch (err) {
    console.error('[layout] save error:', err)
    res.status(500).json({ error: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`[visual-backend] listening on http://localhost:${PORT}`)
})
