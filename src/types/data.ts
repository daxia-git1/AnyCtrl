import type { ProtocolType } from './network'

/** 按钮数据 */
export interface Button {
  /** 按钮唯一ID */
  id: string
  /** 动作名称（显示在按钮上） */
  action: string
  /** 按钮描述 */
  description: string
}

/** 标签分组 */
export interface TagGroup {
  /** 标签ID（用于触发接口） */
  tagId: string
  /** 标签名称（显示为分组标题） */
  tagName: string
  /** 该标签下的所有按钮 */
  buttons: Button[]
}

/** 健康状态 */
export interface HealthStatus {
  /** 在线状态 */
  status: 'online' | 'offline' | 'warning'
  /** 运行时长（秒） */
  uptime: number
  /** 最后检查时间戳 */
  lastCheck: number
  /** 数据是否过期（接口调用失败时降级为 true，提示用户"上次数据"） */
  stale?: boolean
  /** 扩展信息 */
  details?: Record<string, unknown>
}

/** 连接配置 */
export interface ConnectionConfig {
  /** HTTP 基础地址 */
  httpUrl: string
  /** WebSocket 地址 */
  wsUrl: string
  /** MQTT Broker 地址 */
  mqttHost: string
  /** MQTT 端口 */
  mqttPort: number
  /** 用户名 */
  username?: string
  /** 密码 */
  password?: string
  /** 健康检查间隔（秒），默认 60 */
  healthInterval?: number
}

/** 动作触发结果 */
export interface ActionResult {
  /** 是否成功 */
  success: boolean
  /** 按钮ID */
  buttonId: string
  /** 时间戳 */
  timestamp: number
  /** 错误信息 */
  message?: string
}

/** 应用设置 */
export interface AppSettings {
  /** 当前协议 */
  protocol: ProtocolType
  /** 是否启用 Mock */
  mockEnabled: boolean
  /** 连接配置 */
  connectionConfig: ConnectionConfig
}

/**
 * HTTP 响应信封
 * - 成功：{ code: 200, data: T }
 * - 失败：{ code: 4xxx|5xxx, message: string }
 * 仅 HTTP 协议使用此信封；WebSocket / MQTT / Mock 不走此格式
 */
export interface ApiEnvelope<T> {
  /** 业务状态码，200 = 成功，其他 = 失败 */
  code: number
  /** 业务数据，仅成功时存在 */
  data?: T
  /** 错误描述，仅失败时存在 */
  message?: string
}
