# 技术选型：H5 + Capacitor vs React Native

## 选型结论

AnyCtrl 采用 **Taro H5 + Capacitor** 方案打包 Android App，而非 React Native。

项目定位是设备控制面板，界面以按钮列表为主，不涉及复杂动画或高性能渲染场景，H5 方案在开发效率和维护成本上优势明显。

## 两种方案的本质区别

| | H5 + Capacitor（当前方案） | React Native |
|---|---|---|
| 运行原理 | 代码编译为网页，运行在 App 内嵌的 WebView 中 | 代码通过桥接层翻译为系统原生组件渲染 |
| 类比 | 手机里打开一个全屏浏览器看网页 | 和微信、抖音一样用系统原生控件 |
| 性能 | WebView 渲染，适合中低复杂度界面 | 原生渲染，适合复杂动画和大列表 |

## 详细对比

### 1. 环境搭建

- **H5**：浏览器即可开发调试，`pnpm dev:h5` 启动即用
- **RN**：必须安装 Android Studio + SDK + 模拟器，iOS 还需要 Mac + Xcode，环境配置繁琐且容易出错

### 2. 组件与 UI 库

- **H5**：使用标准 HTML 标签（`<div>`、`<span>`、`<input>`），NutUI H5 版组件直接可用
- **RN**：全部替换为 RN 组件（`<View>`、`<Text>`、`<TextInput>`），NutUI 的 H5 组件无法使用，需要寻找 RN 专用 UI 库

### 3. 样式系统

- **H5**：完整 CSS 支持 — 选择器、伪元素、动画、媒体查询、SCSS 等
- **RN**：仅支持 Flexbox 子集，不能写 class 选择器，使用 `StyleSheet.create({})` 对象语法，无伪元素，动画需使用 `Animated` API

### 4. 第三方库兼容性

- **H5**：npm 上绝大多数库可直接使用
- **RN**：依赖 DOM 的库全部不可用，mqtt.js 在 RN 中需要额外 polyfill，很多库需要找 RN 专用版本

### 5. 调试体验

- **H5**：浏览器 F12 开发者工具，改代码即时刷新
- **RN**：Metro bundler + Chrome DevTools 远程调试，原生层崩溃无法在 JS 端看到堆栈，需查看 Logcat / Xcode 日志

### 6. 原生能力接入

- **H5 + Capacitor**：官方和社区插件已封装好常用原生能力（相机、文件、通知、网络状态等）
- **RN**：部分原生功能需要编写 Java/Kotlin（Android）或 Swift/ObjC（iOS）桥接代码

## 选择 H5 + Capacitor 的理由

1. **界面简单** — 按钮列表 + 状态展示，WebView 性能完全够用
2. **开发效率高** — 标准 Web 技术栈，调试方便，迭代快
3. **一套代码多端复用** — 同时支持 H5 网页和 Android App，无需维护两套 UI
4. **生态成熟** — NutUI、mqtt.js 等库直接可用，无兼容性问题
5. **维护成本低** — 不需要 Android/iOS 原生开发经验

## 什么场景该选 React Native

- 需要 60fps 复杂手势动画（如地图交互、拖拽排序）
- 大数据量长列表需要原生级虚拟滚动
- 深度依赖原生硬件能力（蓝牙、NFC、AR）
- 对启动速度和内存占用有严格要求
