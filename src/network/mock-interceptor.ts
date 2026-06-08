import type { IProtocolAdapter, ConnStatus } from '../types/network'
import type { ConnectionConfig, HealthStatus, TagGroup, ActionResult } from '../types/data'
import { mockButtons, mockHealth, delay } from './mock-data'

/**
 * Mock 拦截器
 * 装饰器模式：包装真实的协议适配器，当 mockEnabled 为 true 时返回模拟数据
 */
export class MockInterceptor implements IProtocolAdapter {
  private realAdapter: IProtocolAdapter
  private mockEnabled: boolean

  constructor(realAdapter: IProtocolAdapter, mockEnabled: boolean) {
    this.realAdapter = realAdapter
    this.mockEnabled = mockEnabled
  }

  /** 更新 Mock 开关 */
  setMockEnabled(enabled: boolean): void {
    this.mockEnabled = enabled
  }

  /** 获取内部适配器（用于协议切换时取出） */
  getRealAdapter(): IProtocolAdapter {
    return this.realAdapter
  }

  async connect(config: ConnectionConfig): Promise<void> {
    if (this.mockEnabled) {
      console.log('[MockInterceptor] Mock 模式，跳过真实连接')
      return
    }
    return this.realAdapter.connect(config)
  }

  disconnect(): void {
    this.realAdapter.disconnect()
  }

  async getHealth(): Promise<HealthStatus> {
    if (this.mockEnabled) {
      await delay(300) // 模拟网络延迟
      return {
        ...mockHealth,
        lastCheck: Date.now(),
      }
    }
    return this.realAdapter.getHealth()
  }

  async getButtons(): Promise<TagGroup[]> {
    if (this.mockEnabled) {
      await delay(500) // 模拟网络延迟
      return [...mockButtons]
    }
    return this.realAdapter.getButtons()
  }

  async triggerAction(buttonId: string): Promise<ActionResult> {
    if (this.mockEnabled) {
      await delay(200) // 模拟网络延迟
      return {
        success: true,
        buttonId,
        timestamp: Date.now(),
        message: `[Mock] 按钮 ${buttonId} 动作已触发`,
      }
    }
    return this.realAdapter.triggerAction(buttonId)
  }

  onStatusChange(cb: (status: ConnStatus) => void): void {
    this.realAdapter.onStatusChange(cb)
  }

  removeAllStatusListeners(): void {
    this.realAdapter.removeAllStatusListeners()
  }

  getStatus(): ConnStatus {
    if (this.mockEnabled) {
      return 'connected' // Mock 模式下始终显示已连接
    }
    return this.realAdapter.getStatus()
  }
}
