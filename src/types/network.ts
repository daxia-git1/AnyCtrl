import type { ConnectionConfig, HealthStatus, TagGroup, ActionResult } from './data'

/** 协议类型 */
export type ProtocolType = 'http' | 'websocket' | 'mqtt'

/** 连接状态 */
export type ConnStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

/** 所有协议适配器必须实现的接口 */
export interface IProtocolAdapter {
  /** 初始化连接 */
  connect(config: ConnectionConfig): Promise<void>
  /** 断开连接 */
  disconnect(): void
  /** 获取健康状态 */
  getHealth(): Promise<HealthStatus>
  /** 获取按钮数据（按标签分组） */
  getButtons(): Promise<TagGroup[]>
  /** 触发按钮动作 */
  triggerAction(buttonId: string): Promise<ActionResult>
  /** 连接状态变化监听 */
  onStatusChange(cb: (status: ConnStatus) => void): void
  /** 移除所有状态监听 */
  removeAllStatusListeners(): void
  /** 获取当前连接状态 */
  getStatus(): ConnStatus
}
