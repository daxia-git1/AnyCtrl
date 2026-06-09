# MQTT 接口参考表

***

## 1. 连接总览

| 项目          | 说明                                             |
| ----------- | ---------------------------------------------- |
| Broker 地址   | `wss://{mqttHost}:{mqttPort}/mqtt`              |
| 传输协议        | MQTT over WebSocket（`wss://`）                   |
| 消息格式        | JSON 文本                                        |
| QoS         | 1（至少一次）                                        |
| Client ID   | `led_panel_{timestamp}`                        |
| Clean Session | `true`                                         |
| 连接超时        | 5s                                             |
| 重连间隔        | 3s                                             |
| 请求超时        | 10s（客户端）                                       |
| 鉴权          | 可选，通过 `username` / `password` 认证               |

> MQTT 协议**不使用** HTTP 的 `ApiEnvelope` 信封格式，消息体为裸 JSON。

***

## 2. Topic 结构

| Topic                                    | 方向       | 说明            |
| ---------------------------------------- | -------- | ------------- |
| `led/request/{action}`                   | 客户端 → Broker | 发送请求          |
| `led/response/{action}/{requestId}`      | Broker → 客户端 | 接收响应（按请求ID订阅） |

客户端发送请求前，先订阅对应的响应 Topic，收到响应后取消订阅。

***

## 3. 消息格式

### 请求消息（发布到 `led/request/{action}`）

```json
{
  "id": "<请求ID>",
  "payload": { ... }
}
```

| 字段        | 必填 | 类型       | 说明                           |
| --------- | -- | -------- | ---------------------------- |
| `id`      | ✅  | `string` | 请求唯一ID，格式：`{timestamp}_{随机字符}` |
| `payload` | ✅  | `object` | 请求参数                         |

### 响应消息（发布到 `led/response/{action}/{requestId}`）

```json
{
  "id": "<请求ID>",
  "payload": { ... }
}
```

| 字段        | 必填 | 类型       | 说明              |
| --------- | -- | -------- | --------------- |
| `id`      | ✅  | `string` | 与请求对应的ID，用于匹配响应 |
| `payload` | ✅  | `object` | 响应数据            |

***

## 4. 接口列表

| Action               | 请求 Topic                     | 响应 Topic                                    | payload（请求） | payload（响应）    | 说明       |
| -------------------- | ---------------------------- | -------------------------------------------- | ----------- | -------------- | -------- |
| `health`             | `led/request/health`         | `led/response/health/{requestId}`            | `{}`        | `HealthStatus` | 健康检查     |
| `buttons`            | `led/request/buttons`        | `led/response/buttons/{requestId}`           | `{}`        | `TagGroup[]`   | 获取按钮分组配置 |
| `trigger/{buttonId}` | `led/request/trigger/{buttonId}` | `led/response/trigger/{buttonId}/{requestId}` | `{ buttonId }` | `ActionResult` | 触发按钮动作   |

***

## 5. `health` — 健康检查

### 请求

- **发布 Topic**: `led/request/health`
- **订阅 Topic**: `led/response/health/{requestId}`

```json
{ "id": "1717526400000_a1b2c3d", "payload": {} }
```

### 响应 payload

| 字段                      | 必填 | 类型                                   | 说明                |
| ----------------------- | -- | ------------------------------------ | ----------------- |
| `status`                | ✅  | `'online' \| 'offline' \| 'warning'` | 设备状态              |
| `uptime`                | ✅  | `number`                             | 运行时长，单位**秒**      |
| `lastCheck`             | ✅  | `number`                             | 服务端检查时间，**毫秒时间戳** |
| `details`               | ❌  | `object`                             | 扩展信息，仅展示用         |
| `details.version`       | ❌  | `string`                             | 固件/服务版本           |
| `details.deviceCount`   | ❌  | `number`                             | 设备总数              |
| `details.activeDevices` | ❌  | `number`                             | 当前在线设备数           |

### 示例

```json
// 发布到 led/request/health
{ "id": "1717526400000_a1b2c3d", "payload": {} }

// 从 led/response/health/1717526400000_a1b2c3d 收到
{
  "id": "1717526400000_a1b2c3d",
  "payload": {
    "status": "online",
    "uptime": 86400,
    "lastCheck": 1717526400000
  }
}
```

***

## 6. `buttons` — 获取按钮分组配置

### 请求

- **发布 Topic**: `led/request/buttons`
- **订阅 Topic**: `led/response/buttons/{requestId}`

```json
{ "id": "1717526400000_a1b2c3d", "payload": {} }
```

### 响应 payload

| 字段        | 必填 | 类型       | 说明             |
| --------- | -- | -------- | -------------- |
| `tagId`   | ✅  | `string` | 标签分组ID（用于分组管理） |
| `tagName` | ✅  | `string` | 分组标题           |
| `buttons` | ✅  | `数组`     | 该分组下的按钮列表      |

#### `buttons 数组`

| 字段            | 必填 | 类型       | 说明     |
| ------------- | -- | -------- | ------ |
| `id`          | ✅  | `string` | 按钮唯一ID |
| `action`      | ✅  | `string` | 按钮显示文字 |
| `description` | ✅  | `string` | 按钮描述   |

### 示例

```json
// 发布到 led/request/buttons
{ "id": "1717526400000_a1b2c3d", "payload": {} }

// 从 led/response/buttons/1717526400000_a1b2c3d 收到
{
  "id": "1717526400000_a1b2c3d",
  "payload": [
    {
      "tagId": "tag_lighting",
      "tagName": "照明控制",
      "buttons": [
        { "id": "btn_all_on",  "action": "全开", "description": "打开所有设备" },
        { "id": "btn_all_off", "action": "全关", "description": "关闭所有设备" }
      ]
    }
  ]
}
```

***

## 7. `trigger/{buttonId}` — 触发按钮动作

### 请求

- **发布 Topic**: `led/request/trigger/{buttonId}`
- **订阅 Topic**: `led/response/trigger/{buttonId}/{requestId}`

### 请求 payload

| 字段         | 必填 | 类型       | 说明     |
| ---------- | -- | -------- | ------ |
| `buttonId` | ✅  | `string` | 按钮唯一ID |

### 响应 payload

| 字段          | 必填 | 类型        | 说明                  |
| ----------- | -- | --------- | ------------------- |
| `success`   | ✅  | `boolean` | 是否触发成功              |
| `buttonId`  | ✅  | `string`  | 按钮ID（**请求入参回显**）    |
| `timestamp` | ✅  | `number`  | 服务端处理完成时间，**毫秒时间戳** |
| `message`   | ❌  | `string`  | 成功描述 / 错误信息         |

### 示例

```json
// 发布到 led/request/trigger/btn_living_room_main
{
  "id": "1717526400000_a1b2c3d",
  "payload": { "buttonId": "btn_living_room_main" }
}

// 从 led/response/trigger/btn_living_room_main/1717526400000_a1b2c3d 收到
{
  "id": "1717526400000_a1b2c3d",
  "payload": {
    "success": true,
    "buttonId": "btn_living_room_main",
    "timestamp": 1717526400000,
    "message": "动作已触发"
  }
}
```

***

## 8. 错误处理

MQTT 协议无 HTTP 状态码，错误通过以下方式传达：

| 场景       | 表现                                        |
| -------- | ----------------------------------------- |
| 请求超时     | 客户端 10s 未收到匹配 `id` 的响应，取消订阅并抛出 `请求超时` 错误 |
| 连接断开     | 所有 pending 请求被拒绝（`主动断开连接`），清空请求队列         |
| 连接错误     | 状态变为 `error`，抛出连接错误                       |
| 订阅失败     | 请求被拒绝（`订阅响应失败`）                           |
| 发布失败     | 请求被拒绝（`发布失败`）                             |
| 消息解析失败   | 客户端忽略无法解析的消息，输出 warn 日志                   |
| Broker 离线 | 客户端自动每 3s 尝试重连                            |
