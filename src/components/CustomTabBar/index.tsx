import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Home, More, Setting } from '@nutui/icons-react-taro'
import './index.scss'

interface TabItem {
  key: string
  label: string
  url: string
  Icon: typeof Home
}

const TABS: TabItem[] = [
  { key: 'index', label: '首页', url: '/pages/index/index', Icon: Home },
  { key: 'panel', label: '控制面板', url: '/pages/panel/index', Icon: More },
  { key: 'settings', label: '设置', url: '/pages/settings/index', Icon: Setting },
]

interface CustomTabBarProps {
  /** 当前高亮的 tab key */
  currentTab?: string
}

export function CustomTabBar({ currentTab }: CustomTabBarProps) {
  const handleSwitch = (url: string) => {
    Taro.switchTab({ url, fail: () => Taro.reLaunch({ url }) })
  }

  return (
    <View className="custom-tab-bar">
      {TABS.map(({ key, label, url, Icon }) => {
        const active = key === currentTab
        return (
          <View
            key={key}
            className={`custom-tab-bar__item${active ? ' custom-tab-bar__item--active' : ''}`}
            onClick={() => handleSwitch(url)}
          >
            <Icon
              width={22}
              height={22}
              color={active ? '#6366f1' : '#94a3b8'}
            />
            <Text className="custom-tab-bar__label">{label}</Text>
          </View>
        )
      })}
    </View>
  )
}
