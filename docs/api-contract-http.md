# HTTP 接口参考表

***

## 1. 端点总览

| Method | Path                     | 超时  | 鉴权 | 说明       |
| ------ | ------------------------ | --- | -- | -------- |
| `GET`  | `/api/health`            | 5s  | 否  | 健康检查     |
| `GET`  | `/api/buttons`           | 10s | 否  | 获取按钮分组配置 |
| `GET`  | `/api/trigger/:buttonId` | 10s | 否  | 触发按钮动作   |

通用要求：

- `Content-Type: application/json; charset=utf-8`
- `CORS: *`
- 前端超时见上表，后端建议做好防御

***

## 2. `GET /api/health`

### 响应 200

| 字段                      | 必填 | 类型                                   | 说明                |
| ----------------------- | -- | ------------------------------------ | ----------------- |
| `status`                | ✅  | `'online' \| 'offline' \| 'warning'` | 设备状态              |
| `uptime`                | ✅  | `number`                             | 运行时长，单位**秒**      |
| `lastCheck`             | ✅  | `number`                             | 服务端检查时间，**毫秒时间戳** |
| `details`               | ❌  | `object`                             | 扩展信息，仅展示用         |
| `details.version`       | ❌  | `string`                             | 固件/服务版本           |
| `details.deviceCount`   | ❌  | `number`                             | 设备总数              |
| `details.activeDevices` | ❌  | `number`                             | 当前在线设备数           |
| `details.<其他键>`         | ❌  | `unknown`                            | 透传字段，前端忽略未知键      |

### 错误响应 — `ApiError`

| 状态码 | `code` | `message` | 触发场景 |
| --- | ------ | --------- | ---- |
| 5xx | `5001` | `设备离线`    | 设备失联 |

### 示例

```json
// 200
{ 
  "code":200,
  "data":{
    "status": "online",
    "uptime": 86400,
    "lastCheck": 1717526400000,
  }
}

// 5xx
{ "code": 5001, "message": "设备离线" }
```

***

## 3. `GET /api/buttons`

### 响应 200

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

### 错误响应 — `ApiError`

| 状态码 | `code` | `message` | 触发场景   |
| --- | ------ | --------- | ------ |
| 5xx | `5002` | `配置加载失败`  | 配置读取失败 |

### 示例

```json
// 200
{
  "code":200,
  "data":[
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


// 5xx
{ "code": 5002, "message": "配置加载失败" }
```

***

## 4. `GET /api/trigger/:buttonId`

### 响应 200

| 字段          | 必填 | 类型        | 说明                  |
| ----------- | -- | --------- | ------------------- |
| `success`   | ✅  | `boolean` | 是否触发成功              |
| `buttonId`  | ✅  | `string`  | 按钮ID（**请求入参回显**）    |
| `timestamp` | ✅  | `number`  | 服务端处理完成时间，**毫秒时间戳** |
| `message`   | ❌  | `string`  | 成功描述 / 错误信息         |

### 错误响应 — `ApiError`

| 状态码 | `code` | `message` | 触发场景               |
| --- | ------ | --------- | ------------------ |
| 400 | `4001` | `按钮不存在`   | `buttonId` 不在配置中   |
| 400 | `4002` | `参数错误`    | `buttonId` 为空或格式非法 |
| 5xx | `5003` | `设备无响应`   | 设备执行超时 / 失联        |

### 示例

```json
// 200
{
  "code":200,
  "data":{
    "success": true,
    "buttonId": "btn_living_room_main",
    "timestamp": 1717526400000,
    "message": "动作已触发"
  }
}

// 4xx
{ "code": 4001, "message": "按钮不存在" }

// 5xx
{ "code": 5003, "message": "设备无响应" }
```

***

## 5. 错误码速查

| 状态码 | `code` | `message` | 端点                       | 触发场景               |
| --- | ------ | --------- | ------------------------ | ------------------ |
| 400 | `4001` | `按钮不存在`   | `/api/trigger/:buttonId` | `buttonId` 不在配置中   |
| 400 | `4002` | `参数错误`    | `/api/trigger/:buttonId` | `buttonId` 为空或格式非法 |
| 5xx | `5001` | `设备离线`    | `/api/health`            | 设备失联               |
| 5xx | `5002` | `配置加载失败`  | `/api/buttons`           | 配置读取失败             |
| 5xx | `5003` | `设备无响应`   | `/api/trigger/:buttonId` | 设备执行超时 / 失联        |


