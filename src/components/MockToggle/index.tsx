import { View, Text, Switch } from '@tarojs/components'
import { ShieldCheck } from '@nutui/icons-react-taro'
import './index.scss'

interface MockToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function MockToggle({ enabled, onChange }: MockToggleProps) {
  return (
    <View className="mock-toggle">
      <View className="mock-toggle__info">
        <Text className="mock-toggle__title">
          <ShieldCheck width={22} height={22} color="#6366f1" />
          <Text>Mock 数据模式</Text>
        </Text>
        <Text className="mock-toggle__desc">
          {enabled ? '当前使用模拟数据，不请求真实接口' : '当前连接真实后端接口'}
        </Text>
      </View>
      <Switch
        checked={enabled}
        onChange={(e) => onChange(e.detail.value)}
        color="#6366f1"
      />
    </View>
  )
}
