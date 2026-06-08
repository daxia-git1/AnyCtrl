import { View, Text } from '@tarojs/components'
import { Link, Internation, Mail } from '@nutui/icons-react-taro'
import type { ProtocolType, ConnStatus } from '../../types/network'
import './index.scss'

interface ConnectionBarProps {
  protocol: ProtocolType
  status: ConnStatus
}

const PROTOCOL_LABELS: Record<ProtocolType, string> = {
  http: 'HTTP',
  websocket: 'WebSocket',
  mqtt: 'MQTT',
}

const PROTOCOL_ICONS: Record<ProtocolType, React.ReactNode> = {
  http: <Link width={16} height={16} color="#ffffff" />,
  websocket: <Internation width={16} height={16} color="#ffffff" />,
  mqtt: <Mail width={16} height={16} color="#ffffff" />,
}

const STATUS_MAP: Record<ConnStatus, { label: string; color: string }> = {
  connected: { label: '已连接', color: '#10b981' },
  disconnected: { label: '未连接', color: '#94a3b8' },
  connecting: { label: '连接中...', color: '#f59e0b' },
  error: { label: '连接错误', color: '#ef4444' },
}

export function ConnectionBar({ protocol, status }: ConnectionBarProps) {
  const statusInfo = STATUS_MAP[status]

  return (
    <View className="connection-bar">
      <View className="connection-bar__protocol">
        {PROTOCOL_ICONS[protocol]}
        <Text className="connection-bar__protocol-text">
          {PROTOCOL_LABELS[protocol]}
        </Text>
      </View>
      <View className="connection-bar__status">
        <View
          className="connection-bar__dot"
          style={{ backgroundColor: statusInfo.color }}
        />
        <Text
          className="connection-bar__status-text"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.label}
        </Text>
      </View>
    </View>
  )
}
