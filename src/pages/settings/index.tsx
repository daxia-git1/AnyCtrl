import { useEffect, useState } from 'react'
import { View, Text, Input, Slider, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Link, Internation, Mail, Refresh, Success, Eye } from '@nutui/icons-react-taro'
import pkg from '../../../package.json'
import { useAppStore } from '../../store/useAppStore'
import { ConnectionBar } from '../../components/ConnectionBar'
import { ProtocolSwitch } from '../../components/ProtocolSwitch'
import { MockToggle } from '../../components/MockToggle'
import { CustomTabBar } from '../../components/CustomTabBar'
import { FONT_SCALE_MAP, FONT_SIZE_LABELS, FONT_SIZE_OPTIONS } from '../../constants/font'
import type { FontSizeLevel } from '../../constants/font'
import type { ProtocolType } from '../../types/network'
import './index.scss'

const PROTOCOL_FIELDS: Record<ProtocolType, { label: string; icon: React.ReactNode }> = {
  http: { label: 'HTTP 地址', icon: <Link width={18} height={18} color="#6366f1" /> },
  websocket: { label: 'WebSocket 地址', icon: <Internation width={18} height={18} color="#6366f1" /> },
  mqtt: { label: 'MQTT', icon: <Mail width={18} height={18} color="#6366f1" /> },
}

export default function SettingsPage() {
  const {
    protocol,
    mockEnabled,
    connectionConfig,
    connectionStatus,
    fontSizeLevel,
    setProtocol,
    setMockEnabled,
    setConnectionConfig,
    setFontSizeLevel,
    restoreSettings,
    commitSettings,
    getSavedSettings,
  } = useAppStore()

  // 是否有未保存的修改
  const [hasChanges, setHasChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(true)

  useEffect(() => {
    restoreSettings()
  }, [])

  const handleProtocolChange = (p: ProtocolType) => {
    setProtocol(p)
    setHasChanges(true)
  }

  const handleMockChange = (v: boolean) => {
    setMockEnabled(v)
    setHasChanges(true)
  }

  const handleConfigChange = (patch: Partial<typeof connectionConfig>) => {
    setConnectionConfig(patch)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    try {
      await commitSettings()
      setHasChanges(false)
      Taro.showToast({ title: '设置已保存', icon: 'success', duration: 1500 })
    } catch (err) {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  const handleFontSizeChange = (e: { detail: { value: number } }) => {
    const index = Math.round(e.detail.value)
    const level = FONT_SIZE_OPTIONS[index]
    if (level !== fontSizeLevel) {
      setFontSizeLevel(level)
    }
  }

  const handleReset = () => {
    // 恢复 = 回滚到已保存的状态（不触发适配器重连）
    const saved = getSavedSettings()
    if (saved) {
      setProtocol(saved.protocol)
      setMockEnabled(saved.mockEnabled)
      setConnectionConfig(saved.connectionConfig)
      setHasChanges(false)
      Taro.showToast({ title: '已恢复', icon: 'none', duration: 1200 })
    } else {
      Taro.showToast({ title: '暂无可恢复的设置', icon: 'none', duration: 1200 })
    }
  }

  const renderProtocolFields = () => {
    switch (protocol) {
      case 'http':
        return (
          <View className="settings-page__field">
            <Text className="settings-page__label">
              <Link width={18} height={18} color="#6366f1" />
              <Text>HTTP 地址</Text>
            </Text>
            <Input
              className="settings-page__input"
              value={connectionConfig.httpUrl}
              onInput={(e) =>
                handleConfigChange({ httpUrl: e.detail.value })
              }
              placeholder="http://localhost:3000"
            />
          </View>
        )
      case 'websocket':
        return (
          <View className="settings-page__field">
            <Text className="settings-page__label">
              <Internation width={18} height={18} color="#6366f1" />
              <Text>WebSocket 地址</Text>
            </Text>
            <Input
              className="settings-page__input"
              value={connectionConfig.wsUrl}
              onInput={(e) =>
                handleConfigChange({ wsUrl: e.detail.value })
              }
              placeholder="ws://localhost:3001"
            />
          </View>
        )
      case 'mqtt':
        return (
          <>
            <View className="settings-page__field">
              <Text className="settings-page__label">
                <Mail width={18} height={18} color="#6366f1" />
                <Text>MQTT Broker 地址</Text>
              </Text>
              <Input
                className="settings-page__input"
                value={connectionConfig.mqttHost}
                onInput={(e) =>
                  handleConfigChange({ mqttHost: e.detail.value })
                }
                placeholder="localhost"
              />
            </View>
            <View className="settings-page__field">
              <Text className="settings-page__label">
                <Mail width={18} height={18} color="#6366f1" />
                <Text>MQTT 端口</Text>
              </Text>
              <Input
                className="settings-page__input"
                type="number"
                value={String(connectionConfig.mqttPort)}
                onInput={(e) =>
                  handleConfigChange({ mqttPort: Number(e.detail.value) })
                }
                placeholder="1883"
              />
            </View>
          </>
        )
    }
  }

  return (
    <View className="settings-page" style={`--font-scale: ${FONT_SCALE_MAP[fontSizeLevel]}`}>
      <ConnectionBar protocol={protocol} status={connectionStatus} />

      <ScrollView scrollY className="settings-page__scroll">
        <View className="settings-page__content">
          {/* 协议选择 */}
          <View className="settings-page__section">
            <ProtocolSwitch value={protocol} onChange={handleProtocolChange} />
          </View>

          {/* Mock 开关 */}
          <View className="settings-page__section">
            <MockToggle enabled={mockEnabled} onChange={handleMockChange} />
          </View>

          {/* 连接配置 - 联动当前协议 */}
          <View className="settings-page__section">
            <Text className="settings-page__section-title">
              连接配置 · {protocol.toUpperCase()}
            </Text>
            <View className="settings-page__form">
              {renderProtocolFields()}

              {/* 用户名 */}
              <View className="settings-page__field">
                <Text className="settings-page__label">
                  <Text>用户名（可选）</Text>
                </Text>
                <Input
                  className="settings-page__input"
                  value={connectionConfig.username || ''}
                  onInput={(e) =>
                    handleConfigChange({ username: e.detail.value })
                  }
                  placeholder="留空则不认证"
                />
              </View>

              {/* 密码 */}
              <View className="settings-page__field">
                <Text className="settings-page__label">
                  <Text>密码（可选）</Text>
                </Text>
                <Input
                  className="settings-page__input"
                  password
                  value={connectionConfig.password || ''}
                  onInput={(e) =>
                    handleConfigChange({ password: e.detail.value })
                  }
                  placeholder="留空则不认证"
                />
              </View>
            </View>
          </View>

          {/* 高级设置 */}
          <View className="settings-page__section">
            <Text
              className="settings-page__section-title settings-page__section-title--toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              高级设置
              <View className="settings-page__toggle-icon">
                <View className={`settings-page__eye${showAdvanced ? '' : ' settings-page__eye--closed'}`}>
                  <Eye width={16} height={16} color={showAdvanced ? '#6366f1' : '#94a3b8'} />
                </View>
                <Text className="settings-page__toggle-text" style={`color: ${showAdvanced ? '#6366f1' : '#94a3b8'}`}>
                  {showAdvanced ? '显示' : '隐藏'}
                </Text>
              </View>
            </Text>
            {showAdvanced && (
              <>
                <View className="settings-page__form" style="margin-bottom: 16px">
                  <View className="settings-page__field">
                    <Text className="settings-page__label">
                      <Text>连接状态监测间隔</Text>
                    </Text>
                    <View className="settings-page__interval-group">
                      {[
                        { value: 10, label: '10s', desc: '灵敏' },
                        { value: 30, label: '30s', desc: '标准' },
                        { value: 60, label: '60s', desc: '默认' },
                        { value: 300, label: '5min', desc: '省电' },
                        { value: 600, label: '10min', desc: '超省电' },
                      ].map((opt) => (
                        <View
                          key={opt.value}
                          className={`settings-page__interval-btn${(connectionConfig.healthInterval || 60) === opt.value ? ' settings-page__interval-btn--active' : ''}`}
                          onClick={() => { handleConfigChange({ healthInterval: opt.value }); }}
                        >
                          <Text className="settings-page__interval-value">{opt.label}</Text>
                          <Text className="settings-page__interval-desc">{opt.desc}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
                <View className="settings-page__font-card">
                  <View className="settings-page__font-preview">
                    <Text
                      className="settings-page__font-preview-text"
                      style={`font-size: calc(28px * ${FONT_SCALE_MAP[fontSizeLevel]})`}
                    >
                      Aa
                    </Text>
                    <Text className="settings-page__font-current">
                      {FONT_SIZE_LABELS[fontSizeLevel]}
                    </Text>
                  </View>
                  <View className="settings-page__font-slider">
                    <Slider
                      step={1}
                      min={0}
                      max={3}
                      value={FONT_SIZE_OPTIONS.indexOf(fontSizeLevel)}
                      activeColor="#6366f1"
                      backgroundColor="#e2e8f0"
                      blockSize={20}
                      onChange={handleFontSizeChange}
                    />
                  </View>
                  <View className="settings-page__font-labels">
                    {FONT_SIZE_OPTIONS.map((level) => (
                      <Text
                        key={level}
                        className={`settings-page__font-label${fontSizeLevel === level ? ' settings-page__font-label--active' : ''}`}
                        onClick={() => setFontSizeLevel(level)}
                      >
                        {FONT_SIZE_LABELS[level]}
                      </Text>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* 保存 / 重置 按钮 */}
          <View
            className={`settings-page__save-bar${hasChanges ? ' settings-page__save-bar--active' : ''}`}
          >
            <View className="settings-page__save-actions">
              <View
                className={`settings-page__reset-btn${!hasChanges ? ' settings-page__reset-btn--disabled' : ''}`}
                onClick={hasChanges ? handleReset : undefined}
                hoverClass={hasChanges ? ' settings-page__reset-btn--hover' : ''}
              >
                <Refresh width={12} height={12} color={hasChanges ? '#64748b' : '#94a3b8'} />
                <Text className="settings-page__reset-text">恢复</Text>
              </View>
              <View
                className={`settings-page__save-btn${saving ? ' settings-page__save-btn--loading' : ''}`}
                onClick={handleSave}
              >
                <Success width={12} height={12} color="#ffffff" />
                <Text className="settings-page__save-text">
                  {saving ? '保存中...' : hasChanges ? '保存设置' : '已保存'}
                </Text>
              </View>
            </View>
          </View>

          {/* 到底提示 */}
          <View className="settings-page__end-line">
            <Text className="settings-page__end-text">— 已经到底了 —</Text>
          </View>

          {/* 版权信息 */}
          <View className="settings-page__copyright">
            <Text className="settings-page__copyright-text">AnyCtrl · AntsTeam</Text>
            <Text className="settings-page__copyright-version">v{pkg.version}</Text>
          </View>
        </View>
      </ScrollView>
      <CustomTabBar currentTab="settings" />
    </View>
  )
}
