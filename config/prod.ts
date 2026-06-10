import type { UserConfigExport } from '@tarojs/cli'

export default {
  mini: {},
  h5: {
    terser: {
      config: {
        output: {
          quote_keys: false,
        },
      },
    },
  },
} satisfies UserConfigExport
