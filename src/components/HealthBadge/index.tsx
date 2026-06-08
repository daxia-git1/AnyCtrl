import { View, Text } from '@tarojs/components'
import { Clock } from '@nutui/icons-react-taro'
import type { HealthStatus } from '../../types/data'
import './index.scss'

interface HealthBadgeProps {
  status: HealthStatus | null
}

const STATUS_MAP = {
  online: { label: '在线', color: '#10b981', bg: '#ecfdf5' },
  offline: { label: '离线', color: '#ef4444', bg: '#fef2f2' },
  warning: { label: '警告', color: '#f59e0b', bg: '#fffbeb' },
}

export function HealthBadge({ status }: HealthBadgeProps) {
  if (!status) {
    return (
      <View className="health-badge health-badge--unknown">
        <View className="health-badge__dot" />
        <Text className="health-badge__text">未检查</Text>
      </View>
    )
  }

  const info = STATUS_MAP[status.status]

  return (
    <View className="health-badge" style={{ backgroundColor: info.bg }}>
      <View className="health-badge__dot" style={{ backgroundColor: info.color }} />
      <Text className="health-badge__text" style={{ color: info.color }}>
        {info.label}
      </Text>
      {status.stale && (
        <Text className="health-badge__stale">数据可能过期</Text>
      )}
      <View className="health-badge__uptime">
        <Clock width={16} height={16} color="#94a3b8" />
        <Text>运行 {formatUptime(status.uptime)}</Text>
      </View>
    </View>
  )
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (days > 0) return `${days}天${hours}时`
  if (hours > 0) return `${hours}时${mins}分`
  return `${mins}分钟`
}
