# AnyCtrl 控制面板 - 后端接口契约

> 本文档为前端已固定使用的"后端契约"，后端实现必须**严格对齐**。所有协议对外只暴露 3 个核心方法：`getHealth()`、`getButtons()`、`triggerAction(tagId)`。

---

## 一、总体架构

```
┌────────────────┐  HTTP REST   ┌──────────────────────┐
│                │ ───────────▶ │                      │
│                │              │                      │
│  前端 (Taro)   │  WebSocket   │  后端服务 (Node TS)  │
│  3 套适配器    │ ───────────▶ │  建议：Express + ws  │
│                │              │                      │
│                │  MQTT WSS    │  + 桥接服务          │
│                │ ───────────▶ │  → EMQX / Mosquitto  │
└────────────────┘              └──────────────────────┘
```

**统一的 3 个核心方法**（见 `src/types/data.ts`）：

| 方法 | 用途 | 触发时机 |
|---|---|---|
| `getHealth()` | 拉取设备健康状态 | 启动 / 下拉刷新 / 协议切换 |
| `getButtons()` | 拉取按钮分组配置 | 启动 / 协议切换 |
| `triggerAction(tagId)` | 触发某个标签的动作 | 用户点击按钮 |

---

## 二、共享数据类型

后端**所有协议**响应都必须符合这些 TS 接口 src/types/data.ts：

```ts
// 按钮
interface Button {
  id: string                  // 唯一ID，前端用 id 作为 React key   【必填】
  action: string              // 按钮显示文字（"全开"、"派对"等）    【必填】
  description: string         // 按钮描述                           【必填】
}

// 标签分组
interface TagGroup {
  tagId: string               // 标签分组ID（用于 UI 展示和分组管理）【必填】
  tagName: string             // 分组标题                            【必填】
  buttons: Button[]           // 该标签下的按钮                      【必填】
}

// 健康状态
interface HealthStatus {
  status: 'online' | 'offline' | 'warning'  // 必填
  uptime: number              // 秒           【必填】
  lastCheck: number           // 毫秒时间戳   【必填】
  details?: {                 // 可选
    version?: string          // 可选
    deviceCount?: number      // 可选
    activeDevices?: number    // 可选
    [key: string]: unknown
  }
}

// 动作结果
interface ActionResult {
  success: boolean            // 必填
  buttonId: string            // 按钮ID（与 triggerAction 入参回显）【必填】
  timestamp: number           // 毫秒时间戳   【必填】
  message?: string            // 错误信息 / 成功描述   【可选】
}

// 错误统一格式（HTTP 4xx/5xx、WS 错误消息、MQTT 错误响应都用这个）
interface ApiError {
  code: number                // 业务错误码   【必填】
  message: string             // 人类可读     【必填】
}

// HTTP 响应信封（仅 HTTP 协议使用）
// 成功：{ code: 200, data: T }
// 失败：{ code: 4xxx|5xxx, message: string }
interface ApiEnvelope<T> {
  code: number                // 业务状态码，200 = 成功  【必填】
  data?: T                    // 业务数据                  【成功时存在】
  message?: string            // 错误描述                  【失败时存在】
}
```

---

## 三、附录：代码索引

| 内容 | 路径 |
|---|---|
| HTTP 适配器 | src/network/adapters/http.ts |
| WebSocket 适配器 | src/network/adapters/websocket.ts |
| MQTT 适配器 | src/network/adapters/mqtt.ts |
| Mock 拦截器 | src/network/mock-interceptor.ts |
| Mock 数据源 | src/network/mock-data.ts |
| 数据类型定义 | src/types/data.ts |
| 网络层类型 | src/types/network.ts |
| 协议工厂 | src/network/factory.ts |
