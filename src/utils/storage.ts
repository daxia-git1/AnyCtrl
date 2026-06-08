import Taro from '@tarojs/taro'

/** Taro.storage 封装，带类型安全 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await Taro.getStorage({ key })
      return res.data as T
    } catch {
      return null
    }
  },

  async set<T>(key: string, data: T): Promise<void> {
    await Taro.setStorage({ key, data })
  },

  async remove(key: string): Promise<void> {
    await Taro.removeStorage({ key })
  },

  async clear(): Promise<void> {
    await Taro.clearStorage()
  },
}
