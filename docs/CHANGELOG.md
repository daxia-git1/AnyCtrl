# AnyCtrl 版本变更记录

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
