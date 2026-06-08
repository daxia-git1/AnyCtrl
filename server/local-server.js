/**
 * AnyCtrl 控制面板 - 本地开发后端
 * 跑在 :3000，3 个 GET 端点，响应一律为 ApiEnvelope 信封：
 *   成功：{ code: 200, data: T }
 *   失败：{ code: 4xxx|5xxx, message: string }（HTTP 状态码仍可为 200）
 *
 * 用法：
 *   1. 首次：cd server && npm install
 *   2. 启动：node server/local-server.js
 *   3. 调试：浏览器/小程序访问 http://localhost:3000/api/health
 *
 * 错误注入（环境变量，方便测前端降级）：
 *   MOCK_FAIL_HEALTH=1         /api/health 返回 5xx
 *   MOCK_FAIL_BUTTONS=5002     /api/buttons 返回业务 code 5002
 *   MOCK_TRIGGER_FAIL=4001     /api/trigger 全失败
 *   MOCK_LATENCY=1000          所有响应延迟 1s（测前端超时）
 */

const express = require('express')
const { buttons, getHealth } = require('./fixtures')

const PORT = process.env.PORT || 3000
const LATENCY = Number(process.env.MOCK_LATENCY || 0)

const app = express()

// CORS
app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// 模拟延迟
app.use((req, _res, next) => {
  if (LATENCY > 0) setTimeout(next, LATENCY)
  else next()
})

// 简单请求日志
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

/** 构造信封 */
const ok = (data) => ({ code: 200, data })
const fail = (code, message) => ({ code, message })

/** GET /api/health */
app.get('/api/health', (_req, res) => {
  if (process.env.MOCK_FAIL_HEALTH === '1') {
    return res.status(500).json(fail(5001, '设备离线（mock 注入失败）'))
  }
  res.json(ok(getHealth()))
})

/** GET /api/buttons */
app.get('/api/buttons', (_req, res) => {
  const forced = process.env.MOCK_FAIL_BUTTONS
  if (forced) return res.status(200).json(fail(Number(forced), '配置加载失败（mock 注入）'))
  res.json(ok(buttons))
})

/** GET /api/trigger/:buttonId */
app.get('/api/trigger/:buttonId', (req, res) => {
  const buttonId = req.params.buttonId
  const forced = process.env.MOCK_TRIGGER_FAIL
  if (forced) {
    return res
      .status(200)
      .json(fail(Number(forced), `触发失败（mock 注入 code=${forced}）`))
  }

  // 校验按钮存在
  const exists = buttons.some((g) => g.buttons.some((b) => b.id === buttonId))
  if (!exists) {
    return res.status(200).json(fail(4001, '按钮不存在'))
  }

  res.json(
    ok({
      success: true,
      buttonId,
      timestamp: Date.now(),
      message: '动作已触发（mock）',
    })
  )
})

/** 404 兜底（便于调试路径错误） */
app.use((req, res) => {
  res.status(404).json(fail(4040, `Mock 路由不存在: ${req.method} ${req.url}`))
})

app.listen(PORT, () => {
  console.log('============================================')
  console.log(`  Mock Server  : http://localhost:${PORT}`)
  console.log(`  Health       : http://localhost:${PORT}/api/health`)
  console.log(`  Buttons      : http://localhost:${PORT}/api/buttons`)
  console.log(`  Trigger 示例 : http://localhost:${PORT}/api/trigger/btn_all_on`)
  console.log('============================================')
  console.log('错误注入环境变量：')
  console.log('  MOCK_FAIL_HEALTH=1        /api/health 失败')
  console.log('  MOCK_FAIL_BUTTONS=5002    /api/buttons 失败')
  console.log('  MOCK_TRIGGER_FAIL=4001    /api/trigger 全失败')
  console.log('  MOCK_LATENCY=1000         全部延迟 1s')
  console.log('按 Ctrl+C 停止')
})
