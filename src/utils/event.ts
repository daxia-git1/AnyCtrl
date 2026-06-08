type EventHandler = (...args: unknown[]) => void

/**
 * 简易事件总线
 * 用于跨组件通信（如适配器状态变化通知 UI）
 */
class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map()

  /** 监听事件 */
  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }

  /** 取消监听 */
  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler)
  }

  /** 触发事件 */
  emit(event: string, ...args: unknown[]): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(...args)
      } catch (err) {
        console.error(`[EventBus] 事件 "${event}" 处理出错:`, err)
      }
    })
  }

  /** 一次性监听 */
  once(event: string, handler: EventHandler): void {
    const wrapper: EventHandler = (...args) => {
      handler(...args)
      this.off(event, wrapper)
    }
    this.on(event, wrapper)
  }

  /** 清除所有监听 */
  clear(): void {
    this.handlers.clear()
  }
}

export const eventBus = new EventBus()
