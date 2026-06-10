import type { IProtocolAdapter, ConnStatus } from '../../types/network'
import type { ConnectionConfig, HealthStatus, TagGroup, ActionResult } from '../../types/data'

/**
 * MQTT 协议适配器
 * 使用 mqtt.js 通过 WebSocket 桥接连接 MQTT Broker
 * 小程序和 H5 统一使用 wss:// 协议
 */
export class MqttAdapter implements IProtocolAdapter {
  private client: any = null
  private status: ConnStatus = 'disconnected'
  private statusCallbacks: Array<(status: ConnStatus) => void> = []
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void
    reject: (reason: unknown) => void
    topic: string
  }> = new Map()

  /** Topic 前缀 */
  private readonly REQUEST_TOPIC = 'led/request'
  private readonly RESPONSE_TOPIC = 'led/response'
  private readonly CONTROL_TOPIC = 'led/control'

  async connect(config: ConnectionConfig): Promise<void> {
    this.setStatus('connecting')

    try {
      // 动态导入 mqtt.js（减小包体积）
      const mqttModule = await import('mqtt')
      const mqtt = (mqttModule as any).default || mqttModule

      const isLocal = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(config.mqttHost)
      const scheme = isLocal ? 'ws' : 'wss'
      const brokerUrl = `${scheme}://${config.mqttHost}:${config.mqttPort}/mqtt`

      this.client = mqtt.connect(brokerUrl, {
        username: config.username,
        password: config.password,
        clientId: `led_panel_${Date.now()}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
      })

      return new Promise((resolve, reject) => {
        let settled = false
        const settle = (fn: () => void) => { if (!settled) { settled = true; fn() } }

        const timeout = setTimeout(() => {
          settle(() => {
            this.setStatus('error')
            reject(new Error('MQTT 连接超时'))
          })
        }, 8000)

        this.client.on('connect', () => {
          clearTimeout(timeout)
          settle(() => {
            this.setStatus('connected')
            this.client.subscribe(`${this.RESPONSE_TOPIC}/#`, (err: Error | null) => {
              if (err) console.warn('[MqttAdapter] 订阅失败:', err)
            })
            resolve()
          })
        })

        this.client.on('message', (topic: string, message: Buffer) => {
          this.handleMessage(topic, message.toString())
        })

        this.client.on('error', (err: Error) => {
          clearTimeout(timeout)
          settle(() => {
            this.setStatus('error')
            reject(new Error(`MQTT 连接错误: ${err.message}`))
          })
        })

        this.client.on('close', () => {
          this.setStatus('disconnected')
        })

        this.client.on('offline', () => {
          this.setStatus('disconnected')
        })
      })
    } catch (err) {
      this.setStatus('error')
      throw new Error(`MQTT 初始化失败: ${err}`)
    }
  }

  disconnect(): void {
    if (this.client) {
      this.client.end(true)
      this.client = null
    }
    this.pendingRequests.forEach(({ reject }) => reject(new Error('主动断开连接')))
    this.pendingRequests.clear()
    this.setStatus('disconnected')
  }

  async getHealth(): Promise<HealthStatus> {
    return this.publishAndWait<HealthStatus>('health', {})
  }

  async getButtons(): Promise<TagGroup[]> {
    return this.publishAndWait<TagGroup[]>('buttons', {})
  }

  async triggerAction(buttonId: string): Promise<ActionResult> {
    return this.publishAndWait<ActionResult>(`trigger/${buttonId}`, { buttonId })
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

  /** 发布消息并等待对应 topic 的响应 */
  private publishAndWait<T>(action: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.client || this.status !== 'connected') {
        reject(new Error('MQTT 未连接'))
        return
      }

      const requestId = this.generateId()
      const requestTopic = `${this.REQUEST_TOPIC}/${action}`
      const responseTopic = `${this.RESPONSE_TOPIC}/${action}/${requestId}`

      // 订阅特定响应 topic
      this.client.subscribe(responseTopic, (err: Error | null) => {
        if (err) {
          reject(new Error(`订阅响应失败: ${err.message}`))
          return
        }

        this.pendingRequests.set(requestId, {
          resolve: resolve as (value: unknown) => void,
          reject,
          topic: responseTopic,
        })

        // 发布请求
        this.client.publish(
          requestTopic,
          JSON.stringify({ id: requestId, payload }),
          { qos: 1 },
          (pubErr: Error | null) => {
            if (pubErr) {
              this.pendingRequests.delete(requestId)
              reject(new Error(`发布失败: ${pubErr.message}`))
            }
          }
        )
      })

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          this.client?.unsubscribe(responseTopic)
          reject(new Error('请求超时'))
        }
      }, 10000)
    })
  }

  /** 处理收到的 MQTT 消息 */
  private handleMessage(topic: string, message: string): void {
    try {
      const data = JSON.parse(message)
      const requestId = data.id as string

      const pending = this.pendingRequests.get(requestId)
      if (pending && pending.topic === topic) {
        this.pendingRequests.delete(requestId)
        this.client?.unsubscribe(pending.topic)
        pending.resolve(data.payload)
      }
    } catch {
      console.warn('[MqttAdapter] 无法解析消息:', topic, message)
    }
  }

  private setStatus(status: ConnStatus): void {
    this.status = status
    this.statusCallbacks.forEach((cb) => cb(status))
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  }
}
