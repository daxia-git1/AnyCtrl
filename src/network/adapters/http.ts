import Taro from '@tarojs/taro'
import type { IProtocolAdapter, ConnStatus } from '../../types/network'
import type {
  ConnectionConfig,
  HealthStatus,
  TagGroup,
  ActionResult,
  ApiEnvelope,
} from '../../types/data'

/**
 * HTTP 协议适配器
 * 使用 Taro.request 进行 REST API 调用
 *
 * 响应一律为信封格式：{ code: 200, data: T } 或 { code: 4xxx, message }
 * 适配器负责解包，业务 code !== 200 时抛出（带后端 message），供上层 toast
 */
export class HttpAdapter implements IProtocolAdapter {
  private baseUrl = ''
  private status: ConnStatus = 'disconnected'
  private statusCallbacks: Array<(status: ConnStatus) => void> = []

  async connect(config: ConnectionConfig): Promise<void> {
    this.baseUrl = config.httpUrl.replace(/\/$/, '')
    this.setStatus('connecting')
    try {
      // 通过健康检查验证连接
      await this.getHealth()
      this.setStatus('connected')
    } catch {
      this.setStatus('error')
      throw new Error('HTTP 连接失败: 无法访问服务')
    }
  }

  disconnect(): void {
    this.baseUrl = ''
    this.setStatus('disconnected')
  }

  /** 解包 HTTP 信封：业务 code !== 200 时抛错（带后端 message） */
  private unwrap<T>(body: ApiEnvelope<T>, op: string): T {
    if (body.code !== 200) {
      throw new Error(body.message || `${op}失败: code=${body.code}`)
    }
    return body.data as T
  }

  async getHealth(): Promise<HealthStatus> {
    const res = await Taro.request({
      url: `${this.baseUrl}/api/health`,
      method: 'GET',
      timeout: 5000,
    })
    if (res.statusCode !== 200) {
      throw new Error(`健康检查失败: HTTP ${res.statusCode}`)
    }
    return this.unwrap<HealthStatus>(res.data as ApiEnvelope<HealthStatus>, '健康检查')
  }

  async getButtons(): Promise<TagGroup[]> {
    const res = await Taro.request({
      url: `${this.baseUrl}/api/buttons`,
      method: 'GET',
      timeout: 10000,
    })
    if (res.statusCode !== 200) {
      throw new Error(`获取按钮数据失败: HTTP ${res.statusCode}`)
    }
    return this.unwrap<TagGroup[]>(res.data as ApiEnvelope<TagGroup[]>, '获取按钮数据')
  }

  async triggerAction(buttonId: string): Promise<ActionResult> {
    const res = await Taro.request({
      url: `${this.baseUrl}/api/trigger/${encodeURIComponent(buttonId)}`,
      method: 'GET',
      timeout: 10000,
    })
    if (res.statusCode !== 200) {
      throw new Error(`触发动作失败: HTTP ${res.statusCode}`)
    }
    return this.unwrap<ActionResult>(
      res.data as ApiEnvelope<ActionResult>,
      '触发动作'
    )
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

  private setStatus(status: ConnStatus): void {
    this.status = status
    this.statusCallbacks.forEach((cb) => cb(status))
  }
}
