export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/panel/index',
    'pages/settings/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1d4ed8',
    navigationBarTitleText: 'AnyCtrl 控制面板',
    navigationBarTextStyle: 'white',
  },
  // 故意不配 tabBar —— H5 不支持 custom:true，App 不支持原生 tabBar
  // 三个页面都自己用 <CustomTabBar /> 组件渲染底部导航
})
