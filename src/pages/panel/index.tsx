import { useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { useAppStore } from '../../store/useAppStore'
import { ConnectionBar } from '../../components/ConnectionBar'
import { TagGroup } from '../../components/TagGroup'
import { CustomTabBar } from '../../components/CustomTabBar'
import { FONT_SCALE_MAP } from '../../constants/font'
import './index.scss'

export default function PanelPage() {
  const {
    protocol,
    connectionStatus,
    tagGroups,
    loading,
    error,
    restoreSettings,
    refreshButtons,
    triggerAction,
    fontSizeLevel,
  } = useAppStore()

  useEffect(() => {
    restoreSettings()
  }, [])

  const handleTrigger = async (buttonId: string, actionLabel?: string) => {
    await triggerAction(buttonId, actionLabel)
  }

  return (
    <View className="panel-page" style={`--font-scale: ${FONT_SCALE_MAP[fontSizeLevel]}`}>
      <ConnectionBar protocol={protocol} status={connectionStatus} />

      <ScrollView scrollY className="panel-page__scroll">
        <View className="panel-page__content">
          {/* 错误提示 */}
          {error && (
            <View className="panel-page__error">
              <Text className="panel-page__error-text">{error}</Text>
              <Text
                className="panel-page__retry"
                onClick={() => refreshButtons()}
              >
                点击重试
              </Text>
            </View>
          )}

          {/* 加载状态 */}
          {loading && tagGroups.length === 0 && (
            <View className="panel-page__loading">
              <Text className="panel-page__loading-text">正在加载按钮数据...</Text>
            </View>
          )}

          {/* 空状态 */}
          {!loading && tagGroups.length === 0 && !error && (
            <View className="panel-page__empty">
              <Text className="panel-page__empty-text">暂无按钮数据</Text>
              <Text
                className="panel-page__retry"
                onClick={() => refreshButtons()}
              >
                刷新数据
              </Text>
            </View>
          )}

          {/* 标签分组列表 */}
          {tagGroups.map((group, index) => (
            <TagGroup
              key={group.tagId}
              group={group}
              colorIndex={index}
              onTrigger={handleTrigger}
            />
          ))}

          {/* 刷新按钮 */}
          {tagGroups.length > 0 && (
            <View className="panel-page__refresh">
              <Text
                className="panel-page__refresh-text"
                onClick={() => refreshButtons()}
              >
                {loading ? '刷新中...' : '刷新数据'}
              </Text>
            </View>
          )}

          {/* 到底提示 */}
          <View className="panel-page__end-line">
            <Text className="panel-page__end-text">— 已经到底了 —</Text>
          </View>
        </View>
      </ScrollView>
      <CustomTabBar currentTab="panel" />
    </View>
  )
}
