# WebSocket 接口参考表

***

## 1. 连接总览

| 项目       | 说明                                 |
| -------- | ---------------------------------- |
| 连接地址     | 由 `ConnectionConfig.wsUrl` 配置      |
| 传输协议     | WebSocket（`ws://` 或 `wss://`）      |
| 消息格式     | JSON 文本帧                           |
| 超时       | 10s（客户端）                           |
| 自动重连     | 断开后 3s 自动重连                        |
| 消息匹配     | 通过 `id` 字段关联请求与响应                  |

> WebSocket 协议**不使用** HTTP 的 `ApiEnvelope` 信封格式，请求和响应均为裸 JSON 消息。

***

## 2. 消息格式

### 请求消息

```json
{
  "id": "<请求ID>",
  "type": "<命令类型>",
  "payload": { ... }
}
```

| 字段        | 必填 | 类型       | 说明                           |
| --------- | -- | -------- | ---------------------------- |
| `id`      | ✅  | `string` | 请求唯一ID，格式：`{timestamp}_{随机字符}` |
| `type`    | ✅  | `string` | 命令类型，见下方命令列表                 |
| `payload` | ✅  | `object` | 请求参数                         |

### 响应消息

```json
{
  "id": "<请求ID>",
  "type": "<命令类型>",
  "payload": { ... }
}
```

| 字段        | 必填 | 类型       | 说明              |
| --------- | -- | -------- | --------------- |
| `id`      | ✅  | `string` | 与请求对应的ID，用于匹配响应 |
| `type`    | ✅  | `string` | 命令类型            |
| `payload` | ✅  | `object` | 响应数据            |

***

## 3. 命令列表

| `type`           | payload（请求） | payload（响应）    | 说明       |
| ---------------- | ----------- | -------------- | -------- |
| `GET_HEALTH`     | `{}`        | `HealthStatus` | 健康检查     |
| `GET_BUTTONS`    | `{}`        | `TagGroup[]`   | 获取按钮分组配置 |
| `TRIGGER_ACTION` | `见下方`       | `ActionResult` | 触发按钮动作   |

***

## 4. `GET_HEALTH`

### 请求

```json
{ "id": "1717526400000_a1b2c3d", "type": "GET_HEALTH", "payload": {} }
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
// 请求
{ "id": "1717526400000_a1b2c3d", "type": "GET_HEALTH", "payload": {} }

// 响应
{
  "id": "1717526400000_a1b2c3d",
  "type": "GET_HEALTH",
  "payload": {
    "status": "online",
    "uptime": 86400,
    "lastCheck": 1717526400000
  }
}
```

***

## 5. `GET_BUTTONS`

### 请求

```json
{ "id": "1717526400000_a1b2c3d", "type": "GET_BUTTONS", "payload": {} }
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
// 请求
{ "id": "1717526400000_a1b2c3d", "type": "GET_BUTTONS", "payload": {} }

// 响应
{
  "id": "1717526400000_a1b2c3d",
  "type": "GET_BUTTONS",
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

## 6. `TRIGGER_ACTION`

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
// 请求
{
  "id": "1717526400000_a1b2c3d",
  "type": "TRIGGER_ACTION",
  "payload": { "buttonId": "btn_living_room_main" }
}

// 响应
{
  "id": "1717526400000_a1b2c3d",
  "type": "TRIGGER_ACTION",
  "payload": {
    "success": true,
    "buttonId": "btn_living_room_main",
    "timestamp": 1717526400000,
    "message": "动作已触发"
  }
}
```

***

## 7. 错误处理

WebSocket 协议无 HTTP 状态码，错误通过响应 payload 中的字段传达：

| 场景     | 响应表现                                         |
| ------ | -------------------------------------------- |
| 请求超时   | 客户端 10s 未收到匹配 `id` 的响应，抛出 `请求超时` 错误          |
| 连接断开   | 所有 pending 请求被拒绝（`连接已关闭`），3s 后自动重连           |
| 连接错误   | 所有 pending 请求被拒绝（`连接错误`）                     |
| 按钮不存在  | `TRIGGER_ACTION` 响应中 `success: false`，附带错误信息 |
| 消息解析失败 | 客户端忽略无法解析的消息，输出 warn 日志                      |
