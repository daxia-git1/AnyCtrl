import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.anyctrl.panel',
  appName: 'AnyCtrl 控制面板',
  webDir: 'dist',
  // Android 特定：允许 WebView 加载任意 URL
  android: {
    allowMixedContent: true,
  },
  // 服务器配置：Taro H5 用 hash 路由（#/pages/...），需要 https scheme 才能正常访问 localStorage
  server: {
    androidScheme: 'https',
  },
}

export default config
