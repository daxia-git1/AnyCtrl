/**
 * AnyCtrl 控制面板 - 本地开发后端
 * 三个独立端口，模拟真实设备环境：
 *   HTTP       → http://localhost:3000/api/*
 *   WebSocket  → ws://localhost:3001
 *   MQTT (WSS) → ws://localhost:1883
 *
 * 用法：
 *   1. 首次：cd server && npm install
 *   2. 启动：node server/local-server.js
 *   3. 调试：浏览器/小程序访问对应协议端点
 *
 * 错误注入（环境变量，方便测前端降级）：
 *   MOCK_FAIL_HEALTH=1         health 返回失败
 *   MOCK_FAIL_BUTTONS=5002     buttons 返回业务 code 5002
 *   MOCK_TRIGGER_FAIL=4001     trigger 全失败
 *   MOCK_LATENCY=1000          所有响应延迟 1s（测前端超时）
 */

const http = require('http')
const express = require('express')
const { WebSocketServer, createWebSocketStream } = require('ws')
const Aedes = require('aedes')
const { buttons, getHealth, getHealthByProtocol, getButtonsByProtocol, allButtons } = require('./fixtures')

const HTTP_PORT = process.env.HTTP_PORT || 3000
const WS_PORT = process.env.WS_PORT || 3001
const MQTT_PORT = process.env.MQTT_PORT || 1883
const LATENCY = Number(process.env.MOCK_LATENCY || 0)

/** 延迟工具 */
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── HTTP ────────────────────────────────────────────────────────────

const app = express()

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use((req, _res, next) => {
  if (LATENCY > 0) setTimeout(next, LATENCY)
  else next()
})

app.use((req, _res, next) => {
  console.log(`[${ts()}] HTTP  ${req.method} ${req.url}`)
  next()
})

const ok = (data) => ({ code: 200, data })
const fail = (code, message) => ({ code, message })

app.get('/api/health', (_req, res) => {
  if (process.env.MOCK_FAIL_HEALTH === '1') {
    return res.status(500).json(fail(5001, '设备离线（mock 注入失败）'))
  }
  res.json(ok(getHealthByProtocol('http')))
})

app.get('/api/buttons', (_req, res) => {
  const forced = process.env.MOCK_FAIL_BUTTONS
  if (forced) return res.status(200).json(fail(Number(forced), '配置加载失败（mock 注入）'))
  res.json(ok(getButtonsByProtocol('http')))
})

app.get('/api/trigger/:buttonId', (req, res) => {
  const buttonId = req.params.buttonId
  const forced = process.env.MOCK_TRIGGER_FAIL
  if (forced) {
    return res.status(200).json(fail(Number(forced), `触发失败（mock 注入 code=${forced}）`))
  }
  const exists = allButtons().some((g) => g.buttons.some((b) => b.id === buttonId))
  if (!exists) {
    return res.status(200).json(fail(4001, '按钮不存在'))
  }
  res.json(ok({ success: true, buttonId, timestamp: Date.now(), message: '动作已触发（HTTP）' }))
})

app.use((req, res) => {
  res.status(404).json(fail(4040, `Mock 路由不存在: ${req.method} ${req.url}`))
})

// ─── HTTP Server ─────────────────────────────────────────────────────

app.listen(HTTP_PORT, () => {
  console.log(`  HTTP       : http://localhost:${HTTP_PORT}/api/health`)
})

// ─── WebSocket Server ───────────────────────────────────────────────

const wsServer = http.createServer()
const appWss = new WebSocketServer({ server: wsServer })

appWss.on('connection', (ws) => {
  console.log(`[${ts()}] WS    客户端已连接`)

  ws.on('message', async (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      console.warn(`[${ts()}] WS    无法解析消息:`, raw.toString())
      return
    }

    console.log(`[${ts()}] WS    ← ${msg.type} (id=${msg.id})`)

    if (LATENCY > 0) await delay(LATENCY)

    const response = { id: msg.id, type: msg.type, payload: handleCommand('ws', msg.type, msg.payload) }
    ws.send(JSON.stringify(response))
    console.log(`[${ts()}] WS    → ${msg.type} (id=${msg.id})`)
  })

  ws.on('close', () => {
    console.log(`[${ts()}] WS    客户端已断开`)
  })
})

wsServer.listen(WS_PORT, () => {
  console.log(`  WebSocket  : ws://localhost:${WS_PORT}`)
})

// ─── MQTT Broker ─────────────────────────────────────────────────────

const mqttServer = http.createServer()
const broker = Aedes()
const mqttWss = new WebSocketServer({ server: mqttServer })

mqttWss.on('connection', (ws) => {
  const duplex = createWebSocketStream(ws, { binary: true })
  broker.handle(duplex)
})

broker.on('client', (client) => {
  console.log(`[${ts()}] MQTT  客户端已连接: ${client.id}`)
})

broker.on('clientDisconnect', (client) => {
  console.log(`[${ts()}] MQTT  客户端已断开: ${client.id}`)
})

broker.on('publish', async (packet, client) => {
  if (!client) return
  const topic = packet.topic
  if (!topic.startsWith('led/request/')) return

  const action = topic.slice('led/request/'.length)
  console.log(`[${ts()}] MQTT  ← ${topic}`)

  let msg
  try {
    msg = JSON.parse(packet.payload.toString())
  } catch {
    console.warn(`[${ts()}] MQTT  无法解析消息:`, packet.payload.toString())
    return
  }

  if (LATENCY > 0) await delay(LATENCY)

  const responsePayload = handleCommand('mqtt', actionToType(action), extractMqttPayload(action, msg))
  const responseTopic = `led/response/${action}/${msg.id}`

  broker.publish(
    {
      topic: responseTopic,
      payload: JSON.stringify({ id: msg.id, payload: responsePayload }),
      qos: 1,
      retain: false,
    },
    () => {
      console.log(`[${ts()}] MQTT  → ${responseTopic}`)
    }
  )
})

mqttServer.listen(MQTT_PORT, () => {
  console.log(`  MQTT (WS)  : ws://localhost:${MQTT_PORT}`)
})

// ─── 共享命令处理 ────────────────────────────────────────────────────

function handleCommand(protocol, type, payload) {
  const label = { http: 'HTTP', ws: 'WebSocket', mqtt: 'MQTT' }[protocol] || protocol
  switch (type) {
    case 'GET_HEALTH': {
      if (process.env.MOCK_FAIL_HEALTH === '1') {
        return { status: 'offline', uptime: 0, lastCheck: Date.now() }
      }
      return getHealthByProtocol(protocol)
    }
    case 'GET_BUTTONS': {
      if (process.env.MOCK_FAIL_BUTTONS) {
        return []
      }
      return getButtonsByProtocol(protocol)
    }
    case 'TRIGGER_ACTION': {
      const buttonId = payload && payload.buttonId
      if (process.env.MOCK_TRIGGER_FAIL) {
        return { success: false, buttonId, timestamp: Date.now(), message: '触发失败（mock 注入）' }
      }
      if (!buttonId) {
        return { success: false, buttonId: '', timestamp: Date.now(), message: '参数错误：缺少 buttonId' }
      }
      const exists = allButtons().some((g) => g.buttons.some((b) => b.id === buttonId))
      if (!exists) {
        return { success: false, buttonId, timestamp: Date.now(), message: '按钮不存在' }
      }
      return { success: true, buttonId, timestamp: Date.now(), message: `动作已触发（${label}）` }
    }
    default:
      return { error: `未知命令: ${type}` }
  }
}

/** MQTT action → WS type 映射 */
function actionToType(action) {
  if (action === 'health') return 'GET_HEALTH'
  if (action === 'buttons') return 'GET_BUTTONS'
  if (action.startsWith('trigger/')) return 'TRIGGER_ACTION'
  return action
}

/** 从 MQTT 消息中提取 payload，trigger 时补充 buttonId */
function extractMqttPayload(action, msg) {
  if (action.startsWith('trigger/')) {
    return { buttonId: msg.payload?.buttonId || action.slice('trigger/'.length) }
  }
  return msg.payload || {}
}

// ─── 工具 ────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString()
}

console.log('============================================')
console.log('  AnyCtrl Mock Server')
console.log('--------------------------------------------')
console.log('  HTTP 端点:')
console.log('    GET /api/health')
console.log('    GET /api/buttons')
console.log('    GET /api/trigger/:buttonId')
console.log('  WS 命令:')
console.log('    GET_HEALTH / GET_BUTTONS / TRIGGER_ACTION')
console.log('  MQTT Topic:')
console.log('    请求 → led/request/{action}')
console.log('    响应 ← led/response/{action}/{requestId}')
console.log('--------------------------------------------')
console.log('  错误注入环境变量:')
console.log('    MOCK_FAIL_HEALTH=1        health 失败')
console.log('    MOCK_FAIL_BUTTONS=5002    buttons 失败')
console.log('    MOCK_TRIGGER_FAIL=4001    trigger 全失败')
console.log('    MOCK_LATENCY=1000         全部延迟 1s')
console.log('============================================')
