export { NCWebsocketApi as NCWebsocket } from './NCWebsocketApi'
export { Bot } from './bot'
export { PluginManager, definePlugin } from './plugin'
export { configManager } from './config'
export { logger } from './logger'

export * from './Interfaces'
export * from './Structs'
export * from './Utils'

export interface Config {
    host: string
    port: string
    prefix: string
    root: string[]
    admin: string[]
    plugins: string[]
  }
  
  export interface LoggerOptions {
    level: string
    format: string
    timestamp: boolean
    colorize: boolean
  } 

  