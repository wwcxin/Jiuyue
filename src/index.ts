import { Bot } from './core/bot'

const bot = new Bot()
bot.start().catch((error: Error) => {
  console.error('Fatal error:', error)
  process.exit(1)
}) 