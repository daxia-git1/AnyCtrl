/**
 * Mock 数据
 * 与 src/network/mock-data.ts 保持一致
 * 单独放在 .js 文件，方便 local-server 引用（不依赖 ts 编译）
 */

let bootTime = Date.now()

/** 启动时计算 uptime，避免每次都是固定值 */
function getUptime() {
  return Math.floor((Date.now() - bootTime) / 1000)
}

/** 基础按钮组（三种协议共享） */
const baseButtons = [
  {
    tagId: 'tag_lighting',
    tagName: '照明控制',
    buttons: [
      { id: 'btn_all_on',  action: '全开',     description: '打开所有灯光' },
      { id: 'btn_all_off', action: '全关',     description: '关闭所有灯光' },
      { id: 'btn_reading', action: '阅读模式', description: '柔和护眼灯光' },
      { id: 'btn_sleep',   action: '睡眠模式', description: '暖色夜灯' },
    ],
  },
  {
    tagId: 'tag_climate',
    tagName: '温控管理',
    buttons: [
      { id: 'btn_cool', action: '制冷', description: '空调制冷 26°C' },
      { id: 'btn_heat', action: '制暖', description: '空调制暖 22°C' },
      { id: 'btn_fan',  action: '通风', description: '新风系统换气' },
    ],
  },
  {
    tagId: 'tag_security',
    tagName: '安防监控',
    buttons: [
      { id: 'btn_arm',    action: '布防', description: '启用安防警戒' },
      { id: 'btn_disarm', action: '撤防', description: '解除安防警戒' },
      { id: 'btn_camera', action: '监控', description: '查看实时画面' },
    ],
  },
]

/** 每种协议的独有按钮组 */
const protocolExtraButtons = {
  http: {
    tagId: 'tag_scene',
    tagName: '场景联动',
    buttons: [
      { id: 'btn_go_home',   action: '回家模式', description: '灯光+空调+音乐一键开启' },
      { id: 'btn_leave',     action: '离家模式', description: '全关+布防一键搞定' },
      { id: 'btn_goodnight', action: '晚安模式', description: '关灯+锁门+夜灯' },
    ],
  },
  ws: {
    tagId: 'tag_realtime',
    tagName: '实时调节',
    buttons: [
      { id: 'btn_bright_up',   action: '亮度+', description: '灯光亮度增加 10%' },
      { id: 'btn_bright_down', action: '亮度-', description: '灯光亮度降低 10%' },
      { id: 'btn_temp_adj',    action: '温度微调', description: '空调温度 +1°C' },
    ],
  },
  mqtt: {
    tagId: 'tag_schedule',
    tagName: '定时任务',
    buttons: [
      { id: 'btn_timer_on',  action: '定时开灯',  description: '每天 18:00 自动开灯' },
      { id: 'btn_timer_off', action: '定时关灯',  description: '每天 23:00 自动关灯' },
      { id: 'btn_timer_ac',  action: '定时空调',  description: '每天 14:00 自动制冷' },
    ],
  },
}

/** 协议差异化配置 */
const protocolProfiles = {
  http: { version: '1.0.0-http', channel: 'HTTP',      deviceCount: 8,  activeDevices: 6  },
  ws:   { version: '1.0.0-ws',   channel: 'WebSocket', deviceCount: 12, activeDevices: 10 },
  mqtt: { version: '1.0.0-mqtt', channel: 'MQTT',      deviceCount: 15, activeDevices: 13 },
}

function getHealthByProtocol(protocol) {
  const profile = protocolProfiles[protocol] || protocolProfiles.http
  return {
    status: 'online',
    uptime: getUptime(),
    lastCheck: Date.now(),
    details: {
      version: profile.version,
      channel: profile.channel,
      deviceCount: profile.deviceCount,
      activeDevices: profile.activeDevices,
    },
  }
}

function getButtonsByProtocol(protocol) {
  const extra = protocolExtraButtons[protocol]
  return extra ? [...baseButtons, extra] : [...baseButtons]
}

/** 所有协议的按钮合集（用于校验 buttonId 是否存在） */
function allButtons() {
  return [...baseButtons, ...Object.values(protocolExtraButtons)]
}

module.exports = {
  buttons: baseButtons,
  getHealth: () => getHealthByProtocol('http'),
  getUptime,
  getHealthByProtocol,
  getButtonsByProtocol,
  allButtons,
}
