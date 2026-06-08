import { PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

function App({ children }: PropsWithChildren) {
  // 应用启动时初始化存储中的配置
  Taro.getStorage({ key: 'app_settings' }).catch(() => {
    // 首次启动，写入默认配置
    Taro.setStorage({
      key: 'app_settings',
      data: {
        protocol: 'http',
        mockEnabled: true,
        connectionConfig: {
          httpUrl: 'http://localhost:3000',
          wsUrl: 'ws://localhost:3001',
          mqttHost: 'localhost',
          mqttPort: 1883,
          username: '',
          password: '',
        },
        fontSizeLevel: 'standard',
      },
    })
  })

  return children
}

export default App
