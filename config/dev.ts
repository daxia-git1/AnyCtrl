import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: {
    quiet: false,
    stats: true,
  },
  mini: {},
  h5: {
    devServer: {
      static: false as any,
      historyApiFallback: true,
    },
  },
} satisfies UserConfigExport
