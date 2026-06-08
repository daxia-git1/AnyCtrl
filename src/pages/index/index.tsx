import { useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import { Category, Processing, Link, ShieldCheck, Checked, Refresh } from '@nutui/icons-react-taro'
import { useAppStore } from '../../store/useAppStore'
import { ConnectionBar } from '../../components/ConnectionBar'
import { HealthBadge } from '../../components/HealthBadge'
import { CustomTabBar } from '../../components/CustomTabBar'
import { FONT_SCALE_MAP } from '../../constants/font'
import './index.scss'

export default function IndexPage() {
  const {
    protocol,
    mockEnabled,
    connectionStatus,
    healthStatus,
    tagGroups,
    loading,
    error,
    restoreSettings,
    checkHealth,
    refreshButtons,
    fontSizeLevel,
  } = useAppStore()

  useEffect(() => {
    restoreSettings()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      checkHealth()
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  const totalButtons = tagGroups.reduce((sum, g) => sum + g.buttons.length, 0)

  return (
    <View className="index-page" style={`--font-scale: ${FONT_SCALE_MAP[fontSizeLevel]}`}>
      <ConnectionBar protocol={protocol} status={connectionStatus} />

      <View className="index-page__content">
        {/* 健康状态 */}
        <View className="index-page__section">
          <Text className="index-page__section-title">设备状态</Text>
          <HealthBadge status={healthStatus} />
        </View>

        {/* 概览统计 */}
        <View className="index-page__section">
          <Text className="index-page__section-title">概览</Text>
          <View className="index-page__stats">
            <View className="index-page__stat index-page__stat--groups">
              <View className="index-page__stat-icon index-page__stat-icon--groups">
                <Category width={28} height={28} color="#6366f1" />
              </View>
              <Text className="index-page__stat-value">{tagGroups.length}</Text>
              <Text className="index-page__stat-label">标签分组</Text>
            </View>
            <View className="index-page__stat index-page__stat--buttons">
              <View className="index-page__stat-icon index-page__stat-icon--buttons">
                <Processing width={28} height={28} color="#10b981" />
              </View>
              <Text className="index-page__stat-value">{totalButtons}</Text>
              <Text className="index-page__stat-label">控制按钮</Text>
            </View>
            <View className="index-page__stat index-page__stat--protocol">
              <View className="index-page__stat-icon index-page__stat-icon--protocol">
                <Link width={28} height={28} color="#f59e0b" />
              </View>
              <Text className="index-page__stat-value">
                {protocol.toUpperCase()}
              </Text>
              <Text className="index-page__stat-label">当前协议</Text>
            </View>
            <View className="index-page__stat index-page__stat--mode">
              <View className="index-page__stat-icon index-page__stat-icon--mode">
                {mockEnabled
                  ? <ShieldCheck width={28} height={28} color="#ec4899" />
                  : <Checked width={28} height={28} color="#ec4899" />
                }
              </View>
              <Text className="index-page__stat-value">
                {mockEnabled ? 'Mock' : 'Real'}
              </Text>
              <Text className="index-page__stat-label">数据模式</Text>
            </View>
          </View>
        </View>

        {/* 按钮数据加载失败：空状态卡 */}
        {!loading && tagGroups.length === 0 && connectionStatus === 'error' && (
          <View className="index-page__empty" onClick={() => refreshButtons()}>
            <View className="index-page__empty-icon">
              <Link width={48} height={48} color="#ef4444" />
            </View>
            <Text className="index-page__empty-title">配置加载失败</Text>
            <Text className="index-page__empty-desc">
              {error || '无法连接到设备，请检查网络或服务地址'}
            </Text>
            <View className="index-page__empty-action">
              <Refresh width={20} height={20} color="#0ea5e9" />
              <Text className="index-page__empty-action-text">点击重试</Text>
            </View>
          </View>
        )}

        {/* 加载状态 */}
        {loading && (
          <View className="index-page__loading">
            <Text className="index-page__loading-text">加载中...</Text>
          </View>
        )}
      </View>
      <CustomTabBar currentTab="index" />
    </View>
  )
}
