# MQTT WebSocket 协议选择（ws / wss）

## 背景

MQTT.js 在浏览器和 WebView 中**只能通过 WebSocket 连接** Broker，不支持原生 TCP。WebSocket 有两种协议：

| 协议 | 端口（惯例） | 说明 |
|------|:-----------:|------|
| `ws://` | 1883 | 明文，适用于局域网 / 开发环境 |
| `wss://` | 8883 | TLS 加密，适用于公网 / 生产环境 |

如果协议选错，连接会一直停留在 **"连接中"** 状态：

- 用 `wss://` 连一个只开了 `ws` 的 Broker → TLS 握手失败，静默超时
- 用 `ws://` 连一个只开了 `wss` 的 Broker → 明文数据被 TLS 拒绝

## 自动检测逻辑

`src/network/adapters/mqtt.ts` 根据 Broker 地址自动选择协议：

```
私有网络地址 → ws://（明文）
公网地址     → wss://（加密）
```

判定为私有网络的地址：

| 模式 | 范围 |
|------|------|
| `localhost` | 本机 |
| `127.*` | 回环地址 |
| `10.*` | A 类私有网络 |
| `192.168.*` | C 类私有网络 |
| `172.16.* ~ 172.31.*` | B 类私有网络 |

其他所有地址（如域名、公网 IP）一律使用 `wss://`。

## 典型场景

### 局域网调试（自动 ws）

手机和电脑在同一局域网，Broker 地址填电脑的局域网 IP：

```
地址: 192.168.2.4
端口: 1883
→ 自动选择 ws://192.168.2.4:1883/mqtt
```

### 本机开发（自动 ws）

使用 `启动本地测试服务.bat` 启动的 Mock Server：

```
地址: localhost
端口: 1883
→ 自动选择 ws://localhost:1883/mqtt
```

### 生产环境（自动 wss）

连接云端 MQTT Broker：

```
地址: mqtt.example.com
端口: 8883
→ 自动选择 wss://mqtt.example.com:8883/mqtt
```

## 排查连接问题

如果 MQTT 一直显示"连接中"：

1. **确认 Broker 地址是否正确** — 在设置页检查 Host 和 Port
2. **确认 Broker 是否开启了 WebSocket 监听** — 原生 TCP 端口不能直接用，需要开 WebSocket 端口
3. **确认协议匹配** — 局域网 Broker 通常只开 ws，如果错误匹配到 wss 会静默失败
4. **确认防火墙** — 手机和 Broker 之间的网络是否畅通（`ping` 测试）
5. **查看 WebView 控制台** — Android Studio Logcat 过滤 `chromium` 可以看到 WebSocket 连接错误

## 相关代码

- 协议选择逻辑：[mqtt.ts](../src/network/adapters/mqtt.ts) `connect()` 方法
- MQTT API 约定：[api-contract-mqtt.md](./api-contract-mqtt.md)
- Mock Server MQTT 端口：[local-server.js](../server/local-server.js)
