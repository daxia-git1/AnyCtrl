import Taro from '@tarojs/taro'
import type { IProtocolAdapter, ConnStatus } from '../../types/network'
import type { ConnectionConfig, HealthStatus, TagGroup, ActionResult } from '../../types/data'

/** WebSocket 消息格式 */
interface WsMessage {
  id: string
  type: string
  payload: unknown
}

/**
 * WebSocket 协议适配器
 * 使用 Taro.connectSocket 建立长连接
 * 通过消息ID匹配请求和响应
 */
export class WsAdapter implements IProtocolAdapter {
  private socket: Taro.SocketTask | null = null
  private status: ConnStatus = 'disconnected'
  private statusCallbacks: Array<(status: ConnStatus) => void> = []
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
  }> = new Map()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  async connect(config: ConnectionConfig): Promise<void> {
    this.setStatus('connecting')

    return new Promise((resolve, reject) => {
      const task = Taro.connectSocket({
        url: config.wsUrl,
        success: () => {},
        fail: (err) => {
          this.setStatus('error')
          reject(new Error(`WebSocket 连接失败: ${err.errMsg}`))
        },
      })

      const bindEvents = (st: Taro.SocketTask) => {
        this.socket = st
        st.onOpen(() => {
          this.setStatus('connected')
          resolve()
        })
        st.onMessage((msg) => {
          this.handleMessage(msg.data as string)
        })
        st.onClose(() => {
          this.setStatus('disconnected')
          this.rejectAllPending('连接已关闭')
          this.scheduleReconnect(config)
        })
        st.onError(() => {
          this.setStatus('error')
          this.rejectAllPending('连接错误')
        })
      }

      if (task && typeof (task as any).onOpen === 'function') {
        bindEvents(task as Taro.SocketTask)
      } else if (task && typeof (task as any).then === 'function') {
        ;(task as unknown as Promise<Taro.SocketTask>).then(bindEvents).catch((err) => {
          this.setStatus('error')
          reject(err)
        })
      }
    })
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.socket) {
      this.socket.close({})
      this.socket = null
    }
    this.rejectAllPending('主动断开连接')
    this.setStatus('disconnected')
  }

  async getHealth(): Promise<HealthStatus> {
    return this.sendCommand<HealthStatus>('GET_HEALTH', {})
  }

  async getButtons(): Promise<TagGroup[]> {
    return this.sendCommand<TagGroup[]>('GET_BUTTONS', {})
  }

  async triggerAction(buttonId: string): Promise<ActionResult> {
    return this.sendCommand<ActionResult>('TRIGGER_ACTION', { buttonId })
  }

  onStatusChange(cb: (status: ConnStatus) => void): void {
    this.statusCallbacks.push(cb)
  }

  getStatus(): ConnStatus {
    return this.status
  }

  removeAllStatusListeners(): void {
    this.statusCallbacks = []
  }

  /** 发送命令并等待响应 */
  private sendCommand<T>(type: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket || this.status !== 'connected') {
        reject(new Error('WebSocket 未连接'))
        return
      }

      const id = this.generateId()
      const message: WsMessage = { id, type, payload }

      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      this.socket.send({
        data: JSON.stringify(message),
        fail: () => {
          this.pendingRequests.delete(id)
          reject(new Error('消息发送失败'))
        },
      })

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('请求超时'))
        }
      }, 10000)
    })
  }

  /** 处理收到的消息 */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data) as WsMessage
      const pending = this.pendingRequests.get(message.id)
      if (pending) {
        this.pendingRequests.delete(message.id)
        pending.resolve(message.payload)
      }
    } catch {
      console.warn('[WsAdapter] 无法解析消息:', data)
    }
  }

  /** 定时重连 */
  private scheduleReconnect(config: ConnectionConfig): void {
    if (this.reconnectTimer) return
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect(config).catch(() => {})
    }, 3000)
  }

  /** 拒绝所有待处理的请求 */
  private rejectAllPending(reason: string): void {
    this.pendingRequests.forEach(({ reject }) => reject(new Error(reason)))
    this.pendingRequests.clear()
  }

  private setStatus(status: ConnStatus): void {
    this.status = status
    this.statusCallbacks.forEach((cb) => cb(status))
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
