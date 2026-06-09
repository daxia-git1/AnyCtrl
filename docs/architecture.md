## AnyCtrl 控制面板 - Taro 跨端架构分析

### 一、技术选型总览

| 维度 | 选型 | 说明 |
|------|------|------|
| 框架 | Taro 4.x | 支持 H5 / 微信小程序 / App (React Native) |
| 语言 | TypeScript | 类型安全，接口定义清晰 |
| UI库 | NutUI 4.x | Taro 官方适配，组件丰富 |
| 状态管理 | zustand | 轻量、跨端兼容、TS 友好 |
| 网络层 | 自研协议适配器 | 策略模式，HTTP/WS/MQTT 可切换 |
| Mock | 自研 Mock 拦截层 | 在网络适配器层拦截，与业务代码完全解耦 |

---

### 二、整体架构分层

```
┌─────────────────────────────────────────────────┐
│                   页面层 (Pages)                
│   首页(健康状态)  │  按钮面板  │  设置页           
├─────────────────────────────────────────────────┤
│                  组件层 (Components)              
│   TagGroup  │  ActionButton  │  HealthBadge      
├─────────────────────────────────────────────────┤
│                 状态管理 (Store)                  
│   useAppStore (zustand)                          
│   - 协议类型 / Mock开关 / 按钮数据 / 健康状态     
├─────────────────────────────────────────────────┤
│               网络适配层 (Network)                    
│     HttpAdapter │ WsAdapter  │ MqttAdapter       
│              ↕ ProtocolFactory (策略选择)         
│              ↕ MockInterceptor (数据拦截)         
├─────────────────────────────────────────────────┤
│                 基础层 (Utils)                    
│   Taro.storage / Logger / EventEmitter           
└─────────────────────────────────────────────────┘
```

---

### 三、网络协议层设计（核心）

这是整个项目最关键的部分。思路是用**策略模式**定义统一的接口契约，每种协议实现同一个适配器接口，运行时通过工厂根据用户设置动态切换。

#### 3.1 统一接口定义

```typescript
// types/network.ts

/** 所有协议适配器必须实现的接口 */
interface IProtocolAdapter {
  /** 初始化连接 */
  connect(config: ConnectionConfig): Promise<void>
  /** 断开连接 */
  disconnect(): void
  /** 获取健康状态 */
  getHealth(): Promise<HealthStatus>
  /** 获取按钮数据（按标签分组） */
  getButtons(): Promise<TagGroup[]>
  /** 触发标签动作 */
  triggerAction(tagId: string): Promise<ActionResult>
  /** 连接状态变化监听 */
  onStatusChange(cb: (status: ConnStatus) => void): void
}

type ConnStatus = 'connected' | 'disconnected' | 'connecting' | 'error'
type ProtocolType = 'http' | 'websocket' | 'mqtt'
```

#### 3.2 各协议适配器实现要点

**HTTP 适配器** — 最简单，每次操作发一个请求：

```typescript
class HttpAdapter implements IProtocolAdapter {
  private baseUrl: string

  async getButtons(): Promise<TagGroup[]> {
    const res = await Taro.request({ url: `${this.baseUrl}/api/buttons` })
    return res.data
  }

  async triggerAction(tagId: string): Promise<ActionResult> {
    const res = await Taro.request({
      url: `${this.baseUrl}/api/tags/${tagId}/trigger`,
      method: 'POST'
    })
    return res.data
  }
}
```

**WebSocket 适配器** — 长连接，适合实时推送按钮状态变化：

```typescript
class WsAdapter implements IProtocolAdapter {
  private socket: Taro.SocketTask | null = null
  private pendingRequests: Map<string, { resolve, reject }> = new Map()

  async connect(config: ConnectionConfig) {
    this.socket = Taro.connectSocket({ url: config.wsUrl })
    this.socket.onMessage((msg) => this.handleMessage(msg))
  }

  /** 通过消息ID匹配请求和响应 */
  async getButtons(): Promise<TagGroup[]> {
    return this.sendCommand('GET_BUTTONS', {})
  }

  async triggerAction(tagId: string): Promise<ActionResult> {
    return this.sendCommand('TRIGGER_ACTION', { tagId })
  }
}
```

**MQTT 适配器** — 基于发布/订阅模式，小程序端通过 WebSocket 桥接：

```typescript
class MqttAdapter implements IProtocolAdapter {
  private client: MqttClient | null = null

  async connect(config: ConnectionConfig) {
    // 小程序和H5都走 WebSocket 桥接 MQTT
    this.client = mqtt.connect(`wss://${config.mqttHost}:${config.mqttPort}/mqtt`, {
      username: config.username,
      password: config.password,
    })
  }

  async triggerAction(tagId: string): Promise<ActionResult> {
    // 发布到控制 topic
    this.client!.publish(`device/control/${tagId}`, JSON.stringify({ action: 'trigger' }))
    // 等待响应 topic 的回复
    return this.waitForResponse(`device/response/${tagId}`)
  }
}
```

> **MQTT 在小程序中的注意事项：** 微信小程序只支持 WebSocket（wss://），不支持原生 TCP 的 MQTT。因此统一使用 `mqtt.js` 的 WebSocket 模式，H5 和小程序代码一致。App 端（React Native）如果支持 TCP，可以用原生 MQTT 获得更好性能，但 WebSocket 方案也完全可用。

#### 3.3 协议工厂

```typescript
class ProtocolFactory {
  static create(type: ProtocolType, config: ConnectionConfig): IProtocolAdapter {
    const AdapterMap: Record<ProtocolType, new () => IProtocolAdapter> = {
      http: HttpAdapter,
      websocket: WsAdapter,
      mqtt: MqttAdapter,
    }
    const adapter = new AdapterMap[type]()
    adapter.connect(config)
    return adapter
  }
}
```

---

### 四、Mock 拦截层设计

Mock 不应该侵入业务代码。方案是在适配器外面包一层 `MockInterceptor`，当 Mock 开关打开时，直接返回本地模拟数据，不走真实网络。

```typescript
class MockInterceptor implements IProtocolAdapter {
  private realAdapter: IProtocolAdapter
  private mockEnabled: boolean

  constructor(realAdapter: IProtocolAdapter, mockEnabled: boolean) {
    this.realAdapter = realAdapter
    this.mockEnabled = mockEnabled
  }

  async getButtons(): Promise<TagGroup[]> {
    if (this.mockEnabled) {
      // 模拟网络延迟
      await delay(300)
      return MockData.buttons
    }
    return this.realAdapter.getButtons()
  }

  async triggerAction(tagId: string): Promise<ActionResult> {
    if (this.mockEnabled) {
      await delay(200)
      return { success: true, tagId, timestamp: Date.now() }
    }
    return this.realAdapter.triggerAction(tagId)
  }

  // ...其余方法同理委托
}
```

这样做的好处：切换 Mock/真实数据只需要在设置页改一个开关，重新包装适配器即可，业务页面完全无感。

---

### 五、状态管理设计

使用 zustand 管理全局状态，轻量且 TS 友好：

```typescript
// store/useAppStore.ts
interface AppState {
  // 设置
  protocol: ProtocolType        // 'http' | 'websocket' | 'mqtt'
  mockEnabled: boolean
  connectionConfig: ConnectionConfig

  // 业务数据
  healthStatus: HealthStatus | null
  tagGroups: TagGroup[]
  connectionStatus: ConnStatus

  // Actions
  setProtocol: (p: ProtocolType) => void
  setMockEnabled: (v: boolean) => void
  refreshButtons: () => Promise<void>
  triggerAction: (tagId: string) => Promise<void>
  checkHealth: () => Promise<void>
}
```

协议切换时的流程：

```
用户在设置页切换协议
  → store.setProtocol('mqtt')
  → 销毁旧适配器
  → ProtocolFactory.create('mqtt', config)
  → new MockInterceptor(mqttAdapter, mockEnabled)
  → 自动 reconnect
  → 更新 connectionStatus
```

---

### 六、数据模型设计

```typescript
// types/data.ts

/** 按钮数据 */
interface Button {
  id: string          // 按钮唯一ID
  action: string      // 动作名称（显示在按钮上）
  description: string // 按钮描述
}

/** 标签分组 */
interface TagGroup {
  tagId: string       // 标签ID（用于触发接口）
  tagName: string     // 标签名称（显示为分组标题）
  buttons: Button[]   // 该标签下的所有按钮
}

/** 健康状态 */
interface HealthStatus {
  status: 'online' | 'offline' | 'warning'
  uptime: number       // 运行时长（秒）
  lastCheck: number    // 最后检查时间戳
  details?: Record<string, any>
}

/** 连接配置 */
interface ConnectionConfig {
  httpUrl: string       // HTTP 基础地址
  wsUrl: string         // WebSocket 地址
  mqttHost: string      // MQTT Broker 地址
  mqttPort: number      // MQTT 端口
  username?: string
  password?: string
}
```

---

### 七、页面与组件方案

#### 页面规划

| 页面 | 路由 | 职责 |
|------|------|------|
| 首页 | /pages/index/index | 显示连接状态 + 健康状态 + 快速入口 |
| 按钮面板 | /pages/panel/index | 按标签分组展示按钮，点击触发动作 |
| 设置 | /pages/settings/index | 协议切换、Mock开关、连接参数配置 |

#### 核心组件

```
src/components/
├── HealthBadge/        # 健康状态徽章（绿/黄/红 + 文字）
├── ProtocolSwitch/     # 协议选择器（HTTP/WS/MQTT 三个选项）
├── ConnectionBar/      # 顶部连接状态条（显示当前协议+连接状态）
├── TagGroup/           # 标签分组卡片（标题 + 按钮列表）
├── ActionButton/       # 动作按钮（显示动作名+描述，点击触发）
└── MockToggle/         # Mock 开关组件
```

#### 按钮面板页示意

```
┌──────────────────────────────┐
│ 🔌 MQTT · 已连接       ⚙️   │  ← ConnectionBar
├──────────────────────────────┤
│                              │
│  ┌─ 照明控制 ─────────────┐  │  ← TagGroup: tagName="照明控制"
│  │                         │  │
│  │  [全开]   [全关]        │  │  ← ActionButton
│  │  打开所有  关闭所有      │  │     action / description
│  │                         │  │
│  │  [阅读模式]  [睡眠模式] │  │
│  │  柔和护眼    暖色夜灯    │  │
│  └─────────────────────────┘  │
│                              │
│  ┌─ 温控管理 ─────────────┐  │  ← TagGroup: tagName="温控管理"
│  │  [制冷]  [制暖]  [通风] │  │
│  └─────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

---

### 八、项目目录结构

```
AnyCtrl/
├── config/                    # Taro 构建配置
│   ├── index.ts
│   ├── dev.ts
│   └── prod.ts
├── src/
│   ├── app.ts                 # 应用入口
│   ├── app.config.ts          # Taro 全局配置
│   ├── app.scss               # 全局样式
│   │
│   ├── pages/
│   │   ├── index/             # 首页（健康状态）
│   │   │   ├── index.tsx
│   │   │   ├── index.config.ts
│   │   │   └── index.scss
│   │   ├── panel/             # 按钮面板页
│   │   │   ├── index.tsx
│   │   │   ├── index.config.ts
│   │   │   └── index.scss
│   │   └── settings/          # 设置页
│   │       ├── index.tsx
│   │       ├── index.config.ts
│   │       └── index.scss
│   │
│   ├── components/            # 公共组件
│   │   ├── HealthBadge/
│   │   ├── ConnectionBar/
│   │   ├── ProtocolSwitch/
│   │   ├── TagGroup/
│   │   ├── ActionButton/
│   │   └── MockToggle/
│   │
│   ├── network/               # 网络层（核心）
│   │   ├── types.ts           # IProtocolAdapter 等接口定义
│   │   ├── factory.ts         # ProtocolFactory
│   │   ├── mock-interceptor.ts# Mock 拦截层
│   │   ├── adapters/
│   │   │   ├── http.ts        # HTTP 适配器
│   │   │   ├── websocket.ts   # WebSocket 适配器
│   │   │   └── mqtt.ts        # MQTT 适配器
│   │   └── mock-data.ts       # Mock 数据
│   │
│   ├── store/                 # 状态管理
│   │   └── useAppStore.ts
│   │
│   ├── types/                 # 全局类型定义
│   │   ├── data.ts
│   │   └── network.ts
│   │
│   └── utils/                 # 工具函数
│       ├── storage.ts         # Taro.storage 封装
│       ├── logger.ts          # 日志工具
│       └── event.ts           # 事件总线
│
├── package.json
├── tsconfig.json
├── babel.config.js
└── project.config.json        # 小程序项目配置
```

---

### 九、跨端兼容性注意事项

**MQTT 兼容性：**
- H5：mqtt.js 原生支持浏览器 WebSocket
- 小程序：mqtt.js 使用 WebSocket 模式（`wss://`），需要手动适配 `Taro.connectSocket` 替代浏览器原生 WebSocket
- App (RN)：mqtt.js WebSocket 模式可用；若需 TCP 原生连接可后续引入 `react-native-mqtt`

**WebSocket 兼容性：**
- 小程序使用 `Taro.connectSocket` API
- H5 使用浏览器原生 `WebSocket`
- 适配器内部做平台判断，对外暴露统一接口

**存储：**
- 统一使用 `Taro.setStorage` / `Taro.getStorage`，三端自动适配

**NutUI：**
- 使用 `@nutui/nutui-react-taro` 包，自带 Taro 适配

