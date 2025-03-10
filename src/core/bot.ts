import { NCWebsocket, type WSErrorRes, type HeartBeat, type MessageHandler, type NoticeHandler, type RequestHandler, type MetaEventHandler } from 'node-napcat-ts'
import { logger } from './logger'
import { configManager } from './config'
import { PluginManager } from './plugin'
import path from 'path'
import fs from 'fs'

interface BotInfo {
  user_id: number
  nickname: string
}

interface GroupInfo {
  group_id: number
  group_name: string
  member_count: number
  max_member_count: number
}

interface FriendInfo {
  user_id: number
  nickname: string
}

export class Bot {
  private client: NCWebsocket | null = null
  private lastHeartbeatTime: number = 0
  private botInfo: BotInfo | null = null
  private groups: GroupInfo[] = []
  private friends: FriendInfo[] = []
  private pluginManager: PluginManager = new PluginManager(
    null!,  // 使用 null 断言
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'config')
  )

  constructor() {
    // 注册进程退出处理
    process.on('SIGINT', this.handleExit.bind(this))
    process.on('SIGTERM', this.handleExit.bind(this))
    // 修改错误处理，防止程序退出
    process.on('uncaughtException', this.handleError.bind(this))
    process.on('unhandledRejection', (reason) => {
        this.handleError(reason instanceof Error ? reason : new Error(String(reason)))
    })
  }

  async start(): Promise<void> {
    await configManager.validateAndPrompt()
    const config = configManager.getConfig()

    try {
      logger.info('Connecting to NapCat server...')
      this.client = new NCWebsocket({
        host: config.host,
        port: config.port,
        protocol: 'ws'
      })

      // 连接相关事件
      this.client.on('socket.open', async () => {
        logger.info('Connected to NapCat server successfully!')
        
        try {
          if (!this.client) {
            throw new Error('WebSocket client is not initialized')
          }

          this.botInfo = await this.client.get_login_info()
          logger.info(`Welcome! ${this.botInfo.nickname} Loading...`)

          // 获取群列表
          this.groups = await this.client.get_group_list()

          // 获取好友列表
          this.friends = await this.client.get_friend_list()

          logger.info(`Successfully loaded ${this.groups.length} groups, ${this.friends.length} friends.`)

          // 重新初始化插件管理器
          this.pluginManager = new PluginManager(
            this.client,
            path.join(process.cwd(), 'data'),
            path.join(process.cwd(), 'config')
          )

          // 加载插件
          await this.loadPlugins()
        } catch (error) {
          logger.error(`Failed to fetch initial data: ${error instanceof Error ? error.message : String(error)}`)
        }
      })

      // 添加其他事件监听...
      this.setupEventListeners()

      await this.client.connect()
      logger.info(`Bot started, logged in as ${config.host}:${config.port}`)

    } catch (error) {
      logger.error(`Failed to start bot: ${error instanceof Error ? error.message : String(error)}`)
      process.exit(1)
    }
  }

  private setupEventListeners() {
    if (!this.client) return

    this.client.on('socket.error', (context: WSErrorRes) => {
      if ('errors' in context) {
        const errors = context.errors.filter(e => e !== null)
        if (errors.length > 0) {
          logger.error(`Connection error: ${errors[0]?.code} - ${errors[0]?.syscall}`)
        }
      }
    })

    this.client.on('socket.close', () => {
      logger.warn('Connection closed')
    })

    this.client.on('meta_event.heartbeat', (heartbeat: HeartBeat) => {
      const now = Date.now()
      if (now - this.lastHeartbeatTime >= 60000) {
        logger.debug(`[Heartbeat] Online: ${heartbeat.status.online}`)
        this.lastHeartbeatTime = now
      }
    })

    // 添加消息事件监听
    this.client.on('message.private.friend', async (msg: MessageHandler['message.private.friend']) => {
      logger.info(`[Private Friend] ${msg.sender.nickname}(${msg.user_id}): ${msg.raw_message}`);
      
      const originalQuickAction = msg.quick_action;
      msg.quick_action = async (reply) => {
        const result = await originalQuickAction(reply);
        const replyText = reply.map(msg => 
          typeof msg === 'string' ? msg : 
          msg.type === 'text' ? msg.data.text : `[${msg.type}]`
        ).join('');
        logger.info(`succeed to send: [Private(${msg.user_id})] ${replyText}`);
        return result;
      };
    });

    this.client.on('message.private.group', async (msg: MessageHandler['message.private.group']) => {
      logger.info(`[Private Group] ${msg.sender.nickname}(${msg.user_id}): ${msg.raw_message}`);
      
      const originalQuickAction = msg.quick_action;
      msg.quick_action = async (reply) => {
        const result = await originalQuickAction(reply);
        const replyText = reply.map(msg => 
          typeof msg === 'string' ? msg : 
          msg.type === 'text' ? msg.data.text : `[${msg.type}]`
        ).join('');
        logger.info(`succeed to send: [Private(${msg.user_id})] ${replyText}`);
        return result;
      };
    });

    this.client.on('message.group.normal', async (msg: MessageHandler['message.group.normal']) => {
      logger.info(`[Group ${msg.group_id}] ${msg.sender.nickname}(${msg.user_id}): ${msg.raw_message}`);
    });

    // 消息发送事件
    this.client.on('message_sent.private.friend', (msg) => {
      logger.info(`[Private Friend Send] To ${msg.user_id}: ${msg.raw_message}`);
    });

    this.client.on('message_sent.private.group', (msg) => {
      logger.info(`[Private Group Send] To ${msg.user_id}: ${msg.raw_message}`);
    });

    this.client.on('message_sent.group.normal', (msg) => {
      logger.info(`[Group Send ${msg.group_id}] ${msg.raw_message}`);
    });
  }

  private async handleExit(): Promise<void> {
    logger.info('Received exit signal, shutting down...')
    await this.shutdown()
    process.exit(0)
  }

  private handleError(error: Error) {
    console.error('Uncaught error:', error);
    // 记录错误但不退出
    logger.error(`Uncaught error: ${error.message}\n${error.stack}`);
  }

  private async shutdown(): Promise<void> {
    if (this.client) {
      logger.info('Disconnecting from NapCat server...')
      this.client.disconnect()
      this.client = null
    }
  }

  private async loadPlugins() {
    const config = configManager.getConfig()
    for (const name of config.plugins) {
      try {
        const pluginPath = path.join(process.cwd(), 'plugins', name, 'index.ts')
        if (!fs.existsSync(pluginPath)) {
          throw new Error(`Plugin ${name} not found at ${pluginPath}`)
        }
        
        // 添加时间戳来避免缓存
        const plugin = (await import(`${pluginPath}?t=${Date.now()}`)).default
        await this.pluginManager.loadPlugin(plugin)
        logger.info(`Loaded plugin: ${name}`)
      } catch (error) {
        logger.error(`Failed to load plugin ${name}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  // ... 其他方法
} 