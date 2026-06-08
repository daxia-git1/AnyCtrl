type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

let currentLevel: LogLevel = 'info'

export const logger = {
  setLevel(level: LogLevel) {
    currentLevel = level
  },

  debug(tag: string, ...args: unknown[]) {
    if (LOG_LEVELS.debug >= LOG_LEVELS[currentLevel]) {
      console.log(`[${tag}]`, ...args)
    }
  },

  info(tag: string, ...args: unknown[]) {
    if (LOG_LEVELS.info >= LOG_LEVELS[currentLevel]) {
      console.info(`[${tag}]`, ...args)
    }
  },

  warn(tag: string, ...args: unknown[]) {
    if (LOG_LEVELS.warn >= LOG_LEVELS[currentLevel]) {
      console.warn(`[${tag}]`, ...args)
    }
  },

  error(tag: string, ...args: unknown[]) {
    if (LOG_LEVELS.error >= LOG_LEVELS[currentLevel]) {
      console.error(`[${tag}]`, ...args)
    }
  },
}
