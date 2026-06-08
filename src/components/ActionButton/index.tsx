import { View, Text } from '@tarojs/components'
import './index.scss'

interface ActionButtonProps {
  action: string
  description: string
  onClick: () => void
  disabled?: boolean
  /** 描边主色 */
  accentColor?: string
  /** 按钮底色（分组浅色调） */
  bgColor?: string
  /** 是否处于已触发状态（带视觉反馈） */
  triggered?: boolean
}

export function ActionButton({
  action,
  description,
  onClick,
  disabled = false,
  accentColor = '#6366f1',
  bgColor = '#ffffff',
  triggered = false,
}: ActionButtonProps) {
  return (
    <View
      className={`action-button${triggered ? ' action-button--triggered' : ''}${disabled ? ' action-button--disabled' : ''}`}
      style={triggered ? undefined : { background: bgColor, borderColor: accentColor }}
      onClick={() => !disabled && onClick()}
    >
      <Text className="action-button__action">{action}</Text>
      <Text className="action-button__desc">{description}</Text>
    </View>
  )
}
