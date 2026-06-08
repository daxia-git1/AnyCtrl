import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import { ArrowDown, ArrowUp } from '@nutui/icons-react-taro'
import type { TagGroup as TagGroupType } from '../../types/data'
import { ActionButton } from '../ActionButton'
import './index.scss'

/** 每个分组的配色方案 */
const COLOR_THEMES = [
  { primary: '#6366f1', light: '#eef2ff', header: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', shadow: 'rgba(99, 102, 241, 0.3)', gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  { primary: '#f43f5e', light: '#fff1f2', header: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)', shadow: 'rgba(244, 63, 94, 0.3)', gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' },
  { primary: '#10b981', light: '#ecfdf5', header: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', shadow: 'rgba(16, 185, 129, 0.3)', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { primary: '#f59e0b', light: '#fffbeb', header: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', shadow: 'rgba(245, 158, 11, 0.3)', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { primary: '#8b5cf6', light: '#f5f3ff', header: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', shadow: 'rgba(139, 92, 246, 0.3)', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
  { primary: '#06b6d4', light: '#ecfeff', header: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)', shadow: 'rgba(6, 182, 212, 0.3)', gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
]

interface TagGroupProps {
  group: TagGroupType
  colorIndex?: number
  onTrigger: (buttonId: string, actionLabel?: string) => Promise<boolean> | void
}

export function TagGroup({ group, colorIndex = 0, onTrigger }: TagGroupProps) {
  const theme = COLOR_THEMES[colorIndex % COLOR_THEMES.length]
  const [triggeredId, setTriggeredId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  const handleClick = async (buttonId: string, actionLabel: string) => {
    setTriggeredId(buttonId)
    await onTrigger(buttonId, actionLabel)
    setTimeout(() => {
      setTriggeredId((curr) => (curr === buttonId ? null : curr))
    }, 1200)
  }

  return (
    <View className="tag-group">
      <View
        className="tag-group__header"
        style={{ background: theme.header, borderBottomColor: theme.primary + '20' }}
        onClick={() => setExpanded((v) => !v)}
      >
        <View className="tag-group__title">
          {expanded ? (
            <ArrowDown width={18} height={18} color={theme.primary} />
          ) : (
            <ArrowUp width={18} height={18} color={theme.primary} />
          )}
          <Text>{group.tagName}</Text>
        </View>
        <Text
          className="tag-group__count"
          style={{ color: theme.primary, background: theme.light }}
        >
          {group.buttons.length} 个动作
        </Text>
      </View>
      {expanded && (
        <View className="tag-group__buttons">
          {group.buttons.map((button) => (
            <ActionButton
              key={button.id}
              action={button.action}
              description={button.description}
              accentColor={theme.primary}
              bgColor={theme.light}
              triggered={triggeredId === button.id}
              onClick={() => handleClick(button.id, button.action)}
            />
          ))}
        </View>
      )}
    </View>
  )
}
