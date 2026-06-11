# AnyCtrl 版本变更记录

## [1.0.2] - 2026-06-11

### 修复

- **MQTT 连接超时卡死**
  mqtt.js 连接超时触发 `close` 事件而非 `error`，导致 Promise 永远不 resolve。
  修复：增加 8s setTimeout + settled guard 模式，确保 Promise 必定结算。

- **MQTT 局域网地址检测不全**
  原仅识别 `localhost` / `127.0.0.1`，遗漏 `10.x` / `192.168.x` / `172.16-31.x` 网段。
  修复：完善私有网络正则，局域网地址自动使用 `ws://`，公网使用 `wss://`。

- **断线后仍显示"已连接"**
  `checkHealth()` 失败时仅更新 `healthStatus`，未同步更新 `connectionStatus`。
  修复：健康检查失败立即标记 `connectionStatus: 'error'`，成功恢复 `'connected'`。

### 新增

- **健康检查统一轮询**
  从页面级 `setInterval` 移至 store 层 `initAdapter()` 统一管理，
  三种协议均支持断线检测，切换页面不中断轮询。

- **健康检查间隔可配置**
  高级设置中新增心跳间隔选择：10s（灵敏）/ 30s（标准）/ 60s（默认）/ 5min（省电）/ 10min（超省电）。

- **高级设置折叠面板**
  Eye 图标 + CSS 斜线闭眼效果 + "展开/收起" 文字状态提示，
  收纳心跳间隔和字体大小设置，保持主界面简洁。

### 优化

- **版本号统一管理**
  `package.json` 为唯一版本来源，`build.gradle` 正则读取自动生成 versionCode，
  设置页通过 `import pkg` 动态展示，升版只改一处。

- 默认健康检查间隔从 15s 调整为 60s，减少不必要的网络请求

### 文档

- 新增 `docs/mqtt-ws-scheme.md`：ws/wss 自动检测逻辑说明与排障指南

---

## [1.0.1] - 2026-06-10

### 修复

- **MQTT chunk 语法错误 (SyntaxError)**
  Taro H5 默认 terser 配置 `output.quote_keys: true` 会给 class 方法名加引号，
  导致 mqtt.js 打包后 `"constructor"()` 语法非法。
  修复：`config/prod.ts` 覆盖 `quote_keys: false`。

- **MQTT adapter 导入方式**
  mqtt v5 的 `dist/mqtt.min.js` 是 IIFE 格式，不导出模块。
  改为 `import('mqtt')` 走标准 ESM 入口，通过 `.default` 获取导出对象。

- **MQTT 本地连接协议**
  硬编码 `wss://` 导致本地开发 SSL 握手失败。
  改为自动检测：localhost/127.0.0.1 使用 `ws://`，其他使用 `wss://`。

- **WebSocket adapter H5 兼容**
  Taro.connectSocket 在 H5/Capacitor 环境返回 Promise\<SocketTask\> 而非 SocketTask。
  增加双模式检测（onOpen 直接调用 vs Promise.then）。

- **本地测试服务器拆分为独立端口**
  HTTP(:3000)、WebSocket(:3001)、MQTT(:1883) 各占独立端口，
  避免路径路由冲突，贴近真实部署场景。

### 新增

- 三种协议差异化 mock 数据，便于测试时区分当前协议
- 启动脚本显示全部三个服务端口

### 配置备忘

> 以下配置项容易遗忘，升级或迁移时请特别留意：

| 文件 | 配置 | 说明 |
|------|------|------|
| `config/prod.ts` | `terser.config.output.quote_keys: false` | Taro 默认 true 会破坏 ES2022 class 语法 |
| `src/network/adapters/mqtt.ts` | `import('mqtt')` + `.default` | mqtt v5 ESM 入口需要 default export |
| `android/app/build.gradle` | `signingConfigs.release` | Release 签名依赖环境变量 KEYSTORE_PATH 等 |
| `.github/workflows/build-android.yml` | Repository Secrets | KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD |

---

## [1.0.0] - 2026-06-09

### 初始版本

- Capacitor + Taro H5 跨端控制面板
- 支持 HTTP / WebSocket / MQTT 三种协议切换
- Mock 拦截器，离线开发无需后端
- Android 自适应图标 + SplashScreen
- GitHub Actions CI 自动构建签名 Release APK
- 本地一键启动脚本（Mock Server + H5 前端）
- 字体大小四档可调
- NutUI 组件库 + 自定义主题
