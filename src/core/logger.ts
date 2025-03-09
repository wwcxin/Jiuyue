import winston from 'winston'
import chalk from 'chalk'
import type { LoggerOptions } from './'

const defaultOptions: LoggerOptions = {
  level: 'info',
  format: 'simple',
  timestamp: true,
  colorize: true
}

class Logger {
  private logger: winston.Logger

  constructor(options: Partial<LoggerOptions> = {}) {
    const opts = { ...defaultOptions, ...options }

    this.logger = winston.createLogger({
      level: opts.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
          const color = this.getLevelColor(level)
          const ts = opts.timestamp ? `${chalk.gray(this.formatTimestamp(timestamp as string))} ` : ''
          return `${ts}${color(level.toUpperCase())} ${message}`
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${this.formatTimestamp(timestamp as string)} ${level.toUpperCase()} ${message}`
            })
          )
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `${this.formatTimestamp(timestamp as string)} ${level.toUpperCase()} ${message}`
            })
          )
        })
      ]
    })
  }

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  private getLevelColor(level: string): (text: string) => string {
    switch (level) {
      case 'error':
        return chalk.red
      case 'warn':
        return chalk.yellow
      case 'info':
        return chalk.blue
      case 'debug':
        return chalk.green
      default:
        return chalk.white
    }
  }

  info(message: string): void {
    this.logger.info(message)
  }

  error(message: string): void {
    this.logger.error(message)
  }

  warn(message: string): void {
    this.logger.warn(message)
  }

  debug(message: string): void {
    this.logger.debug(message)
  }
}

export const logger = new Logger()
export default Logger 