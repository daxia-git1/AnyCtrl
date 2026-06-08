import type { IProtocolAdapter } from '../types/network'
import type { ProtocolType } from '../types/network'
import type { ConnectionConfig } from '../types/data'
import { HttpAdapter } from './adapters/http'
import { WsAdapter } from './adapters/websocket'
import { MqttAdapter } from './adapters/mqtt'
import { MockInterceptor } from './mock-interceptor'

/**
 * 协议工厂
 * 策略模式：根据协议类型创建对应的适配器，并用 MockInterceptor 包装
 */
export class ProtocolFactory {
  /** 适配器构造函数映射表 */
  private static adapterMap: Record<ProtocolType, new () => IProtocolAdapter> = {
    http: HttpAdapter,
    websocket: WsAdapter,
    mqtt: MqttAdapter,
  }

  /**
   * 创建并初始化协议适配器
   * @param type 协议类型
   * @param config 连接配置
   * @param mockEnabled 是否启用 Mock
   * @returns MockInterceptor 包装后的适配器
   */
  static async create(
    type: ProtocolType,
    config: ConnectionConfig,
    mockEnabled: boolean
  ): Promise<MockInterceptor> {
    const AdapterClass = this.adapterMap[type]
    if (!AdapterClass) {
      throw new Error(`不支持的协议类型: ${type}`)
    }

    const adapter = new AdapterClass()

    // Mock 关闭时才建立真实连接
    if (!mockEnabled) {
      await adapter.connect(config)
    }

    return new MockInterceptor(adapter, mockEnabled)
  }

  /** 获取支持的协议列表 */
  static getSupportedProtocols(): ProtocolType[] {
    return Object.keys(this.adapterMap) as ProtocolType[]
  }
}
