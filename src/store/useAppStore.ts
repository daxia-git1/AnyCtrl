import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { ProtocolType, ConnStatus } from '../types/network'
import type { ConnectionConfig, HealthStatus, TagGroup } from '../types/data'
import { ProtocolFactory } from '../network/factory'
import { MockInterceptor } from '../network/mock-interceptor'
import type { FontSizeLevel } from '../constants/font'
import { FONT_SCALE_MAP } from '../constants/font'

interface AppState {
  // ========== 设置 ==========
  /** 当前协议类型 */
  protocol: ProtocolType
  /** 是否启用 Mock */
  mockEnabled: boolean
  /** 连接配置 */
  connectionConfig: ConnectionConfig
  /** 字体大小等级 */
  fontSizeLevel: FontSizeLevel
  /** 当前字体缩放因子 */
  fontScale: number

  // ========== 业务数据 ==========
  /** 健康状态 */
  healthStatus: HealthStatus | null
  /** 按钮数据（按标签分组） */
  tagGroups: TagGroup[]
  /** 连接状态 */
  connectionStatus: ConnStatus
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null

  // ========== 内部 ==========
  /** 当前适配器实例 */
  _adapter: MockInterceptor | null
  /** 健康检查定时器 */
  _healthTimer: ReturnType<typeof setInterval> | null

  // ========== Actions ==========
  /** 设置协议类型 */
  setProtocol: (protocol: ProtocolType) => void
  /** 设置 Mock 开关 */
  setMockEnabled: (enabled: boolean) => void
  /** 设置字体大小等级 */
  setFontSizeLevel: (level: FontSizeLevel) => void
  /** 更新连接配置 */
  setConnectionConfig: (config: Partial<ConnectionConfig>) => void
  /** 初始化适配器（协议切换 / Mock 切换时调用） */
  initAdapter: () => Promise<void>
  /** 刷新健康状态 */
  checkHealth: () => Promise<void>
  /** 刷新按钮数据 */
  refreshButtons: () => Promise<void>
  /** 触发按钮动作 */
  triggerAction: (buttonId: string, actionLabel?: string) => Promise<boolean>
  /** 保存设置到本地存储 */
  saveSettings: () => void
  /** 提交设置（保存到本地 + 重置适配器应用新配置） */
  commitSettings: () => Promise<void>
  /** 从本地存储恢复设置 */
  restoreSettings: () => Promise<void>
  /** 读取已保存的设置（不触发适配器初始化），用于重置按钮回滚未保存修改 */
  getSavedSettings: () => {
    protocol: ProtocolType
    mockEnabled: boolean
    connectionConfig: ConnectionConfig
    fontSizeLevel: FontSizeLevel
  } | null
}

const defaultConfig: ConnectionConfig = {
  httpUrl: 'http://localhost:3000',
  wsUrl: 'ws://localhost:3001',
  mqttHost: 'localhost',
  mqttPort: 1883,
  username: '',
  password: '',
  healthInterval: 60,
}

export const useAppStore = create<AppState>((set, get) => ({
  // 初始状态
  protocol: 'http',
  mockEnabled: true,
  connectionConfig: { ...defaultConfig },
  fontSizeLevel: 'standard',
  fontScale: FONT_SCALE_MAP.standard,
  healthStatus: null,
  tagGroups: [],
  connectionStatus: 'disconnected',
  loading: false,
  error: null,
  _adapter: null,
  _healthTimer: null,

  // ========== Actions ==========

  setProtocol: (protocol) => {
    set({ protocol })
    // 不再自动保存，由"保存设置"按钮统一触发
  },

  setMockEnabled: (mockEnabled) => {
    set({ mockEnabled })
    // 不再自动保存，由"保存设置"按钮统一触发
  },

  setFontSizeLevel: (fontSizeLevel) => {
    set({ fontSizeLevel, fontScale: FONT_SCALE_MAP[fontSizeLevel] })
    // 字体大小即时生效，自动持久化（无需点击保存）
    const { protocol, mockEnabled, connectionConfig } = get()
    Taro.setStorage({
      key: 'app_settings',
      data: { protocol, mockEnabled, connectionConfig, fontSizeLevel },
    })
  },

  setConnectionConfig: (config) => {
    set((state) => ({
      connectionConfig: { ...state.connectionConfig, ...config },
    }))
    // 不再自动保存，由"保存设置"按钮统一触发
  },

  initAdapter: async () => {
    const { protocol, connectionConfig, mockEnabled } = get()

    // 销毁旧适配器和定时器
    const oldAdapter = get()._adapter
    const oldTimer = get()._healthTimer
    if (oldTimer) clearInterval(oldTimer)
    if (oldAdapter) {
      oldAdapter.disconnect()
      oldAdapter.removeAllStatusListeners()
    }

    set({
      healthStatus: null,
      tagGroups: [],
      connectionStatus: 'connecting',
      loading: true,
      error: null,
      _healthTimer: null,
    })

    try {
      const adapter = await ProtocolFactory.create(protocol, connectionConfig, mockEnabled)

      // 监听连接状态变化
      adapter.onStatusChange((status) => {
        set({ connectionStatus: status })
      })

      set({ _adapter: adapter, connectionStatus: adapter.getStatus() })

      // 自动加载数据
      await Promise.all([get().checkHealth(), get().refreshButtons()])

      // 启动健康轮询
      const interval = (get().connectionConfig.healthInterval || 60) * 1000
      const timer = setInterval(() => { get().checkHealth() }, interval)
      set({ _healthTimer: timer })
    } catch (err) {
      const message = err instanceof Error ? err.message : '初始化失败'
      // 失败时显式标记设备"离线"——避免用户看到上一协议/Mock 留下的"在线"假数据
      set({
        connectionStatus: 'error',
        healthStatus: {
          status: 'offline',
          uptime: 0,
          lastCheck: Date.now(),
          stale: true,
          details: { lastError: message, lastErrorAt: Date.now() },
        },
        error: message,
      })
      console.error('[Store] 适配器初始化失败:', err)
    } finally {
      set({ loading: false })
    }
  },

  checkHealth: async () => {
    const adapter = get()._adapter
    if (!adapter) return

    try {
      const health = await adapter.getHealth()
      set({ healthStatus: { ...health, stale: false }, connectionStatus: 'connected' })
    } catch (err) {
      // 降级处理：保留上一次健康数据，但标记为"陈旧" + warning 状态
      // 这样 UI 不会突然消失（特别是首页"运行 X 天"），同时给用户可见反馈
      const prev = get().healthStatus
      const message = err instanceof Error ? err.message : '健康检查失败'
      console.error('[Store] 健康检查失败:', err)
      set({ connectionStatus: 'error' })
      if (prev) {
        set({
          healthStatus: {
            ...prev,
            status: 'warning',
            stale: true,
            details: {
              ...(prev.details || {}),
              lastError: message,
              lastErrorAt: Date.now(),
            },
          },
        })
      }
    }
  },

  refreshButtons: async () => {
    const adapter = get()._adapter
    if (!adapter) return

    set({ loading: true })
    try {
      const tagGroups = await adapter.getButtons()
      set({ tagGroups, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取按钮数据失败'
      set({ error: message })
      console.error('[Store] 获取按钮数据失败:', err)
    } finally {
      set({ loading: false })
    }
  },

  triggerAction: async (buttonId: string, actionLabel?: string) => {
    const adapter = get()._adapter
    if (!adapter) return false

    const successTitle = actionLabel
      ? `${actionLabel}指令已下发成功`
      : '指令已下发成功'

    try {
      const result = await adapter.triggerAction(buttonId)
      if (result.success) {
        Taro.showToast({ title: successTitle, icon: 'success', duration: 1200 })
      } else {
        Taro.showToast({ title: result.message || '触发失败', icon: 'none' })
      }
      return result.success
    } catch (err) {
      const message = err instanceof Error ? err.message : '指令下发失败'
      Taro.showToast({ title: message, icon: 'none' })
      console.error('[Store] 触发动作失败:', err)
      return false
    }
  },

  saveSettings: () => {
    const { protocol, mockEnabled, connectionConfig, fontSizeLevel } = get()
    Taro.setStorage({
      key: 'app_settings',
      data: { protocol, mockEnabled, connectionConfig, fontSizeLevel },
    })
  },

  commitSettings: async () => {
    // 1. 持久化到本地存储
    get().saveSettings()
    // 2. 把 Mock 开关同步到当前适配器
    const { mockEnabled, _adapter } = get()
    if (_adapter) {
      _adapter.setMockEnabled(mockEnabled)
    }
    // 3. 重置适配器，重新建立连接并加载数据
    await get().initAdapter()
  },

  restoreSettings: async () => {
    try {
      const res = await Taro.getStorage({ key: 'app_settings' })
      const settings = res.data
      if (settings) {
        const fontSizeLevel = settings.fontSizeLevel || 'standard'
        set({
          protocol: settings.protocol || 'http',
          mockEnabled: settings.mockEnabled ?? true,
          connectionConfig: settings.connectionConfig || { ...defaultConfig },
          fontSizeLevel,
          fontScale: FONT_SCALE_MAP[fontSizeLevel],
        })
      }
    } catch {
      // 首次启动无存储数据，使用默认值
    }
    // 恢复后初始化适配器
    await get().initAdapter()
  },

  getSavedSettings: () => {
    try {
      const res = Taro.getStorageSync('app_settings') as
        | { protocol: ProtocolType; mockEnabled: boolean; connectionConfig: ConnectionConfig }
        | undefined
      if (res) {
        return {
          protocol: res.protocol || 'http',
          mockEnabled: res.mockEnabled ?? true,
          connectionConfig: res.connectionConfig || { ...defaultConfig },
          fontSizeLevel: res.fontSizeLevel || 'standard',
        }
      }
    } catch {
      // 忽略读取错误
    }
    return null
  },
}))
