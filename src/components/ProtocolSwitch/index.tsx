import { View, Text } from '@tarojs/components'
import { Internation } from '@nutui/icons-react-taro'
import type { ProtocolType } from '../../types/network'
import './index.scss'

interface ProtocolSwitchProps {
  value: ProtocolType
  onChange: (protocol: ProtocolType) => void
}

const PROTOCOLS: { type: ProtocolType; label: string; desc: string }[] = [
  { type: 'http', label: 'HTTP', desc: 'REST API 请求' },
  { type: 'websocket', label: 'WebSocket', desc: '长连接通信' },
  { type: 'mqtt', label: 'MQTT', desc: '发布/订阅模式' },
]

export function ProtocolSwitch({ value, onChange }: ProtocolSwitchProps) {
  return (
    <View className="protocol-switch">
      <Text className="protocol-switch__title">
        <Internation width={22} height={22} color="#6366f1" />
        <Text>网络协议</Text>
      </Text>
      <View className="protocol-switch__options">
        {PROTOCOLS.map((p) => (
          <View
            key={p.type}
            className={`protocol-switch__option ${
              value === p.type ? 'protocol-switch__option--active' : ''
            }`}
            onClick={() => onChange(p.type)}
          >
            <Text className="protocol-switch__option-label">{p.label}</Text>
            <Text className="protocol-switch__option-desc">{p.desc}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}
