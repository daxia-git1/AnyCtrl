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

/** Mock 按钮数据 - 按标签分组 */
const buttons = [
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
  {
    tagId: 'tag_media',
    tagName: '媒体控制',
    buttons: [
      { id: 'btn_movie', action: '观影', description: '家庭影院模式' },
      { id: 'btn_music', action: '音乐', description: '播放背景音乐' },
      { id: 'btn_game',  action: '游戏', description: '游戏氛围模式' },
    ],
  },
]

/** Mock 健康状态（uptime 动态计算） */
function getHealth() {
  return {
    status: 'online',
    uptime: getUptime(),
    lastCheck: Date.now(),
    details: {
      version: '1.0.0-mock',
      deviceCount: 8,
      activeDevices: 6,
    },
  }
}

module.exports = { buttons, getHealth, getUptime }
