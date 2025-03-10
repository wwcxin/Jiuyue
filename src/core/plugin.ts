import { EventKey, EventHandleMap } from './Interfaces';
import type { NCEventBus } from './NCEventBus';
import path from 'path';
import fs from 'fs';
import { NCWebsocket, Structs, type Send } from 'node-napcat-ts';
import { configManager } from './config';
import { logger } from './logger';
import { createRequire } from 'module';

/** 群组信息接口 */
export interface GroupInfo {
  /** 群号 */
  group_id: number;
  /** 群名称 */
  group_name: string;
  /** 当前成员数 */
  member_count: number;
  /** 最大成员数 */
  max_member_count: number;
}

/** 群成员信息接口 */
export interface GroupMemberInfo {
  /** 群号 */
  group_id: number;
  /** QQ号 */
  user_id: number;
  /** 昵称 */
  nickname: string;
  /** 群名片 */
  card: string;
  /** 角色: 群主、管理员、普通成员 */
  role: 'owner' | 'admin' | 'member';
  /** 专属头衔 */
  title: string;
  /** 加群时间(时间戳) */
  join_time: number;
  /** 最后发言时间(时间戳) */
  last_sent_time: number;
}

/** Cookie信息接口 */
export interface CookieInfo {
  /** Cookies字符串 */
  cookies: string;
  /** bkn/gtk值 */
  bkn: string;
}

/** 登录凭证信息接口 */
export interface CredentialsInfo {
  /** Cookies字符串 */
  cookies: string;
  /** CSRF Token */
  token: string;
}

/** 版本信息接口 */
export interface VersionInfo {
  /** 应用标识 */
  app_name: string;
  /** 应用版本 */
  app_version: string;
  /** 协议版本 */
  protocol_version: string;
}

// 添加消息类型定义
interface MessageElement {
  type: string;
  data: {
    text?: string;
    url?: string;
    id?: string;
    qq?: string;
    [key: string]: any;
  };
}

// 添加 AI 角色相关接口
interface AICharacter {
  character_id: string;
  character_name: string;
  preview_url: string;
}

interface AICharacterGroup {
  type: string;
  characters: AICharacter[];
}

/** 插件上下文接口 - 提供插件所需的各种方法和工具 */
export interface XincPluginContext {
  /** WebSocket客户端实例 */
  eventBus: NCWebsocket;

  /** 注册事件处理器,自动推导事件类型对应的处理器参数类型 */
  handle: <T extends EventKey>(event: T, handler: EventHandleMap[T]) => void;
  
  /** 处理消息事件的快捷方法 */
  handleMessage: (handler: (message: any) => void) => void;
  
  /** 取消注册事件处理器 */
  off: <T extends EventKey>(event: T, handler: EventHandleMap[T]) => void;
  
  /** 获取插件数据目录路径 */
  getDataPath: () => string;
  
  /** 获取插件配置目录路径 */
  getConfigPath: () => string;
  
  /** 提取消息中的文本内容 */
  getText: (e: any) => string;
  
  /** 获取QQ头像URL */
  getAvatarLink: (qq: number | string) => string;
  
  /** 获取QQ群头像URL */
  getGroupLink: (group_id: number | string) => string;
  
  /** 获取被引用的消息 */
  getQuoteMsg: (e: any) => Promise<any>;
  
  /** 获取消息中的第一个图片URL */
  getImageURL: (e: any) => string | null;
  
  /** 获取引用消息中的图片URL */
  getQuoteImageURL: (e: any) => Promise<string | null>;
  
  /** 获取消息提及的图片URL（消息本身或引用消息中的图片） */
  getMentionedImageURL: (e: any) => Promise<string | null>;
  
  /** 获取消息中最后一个被@的用户QQ号 */
  getTaggedUserID: (e: any) => number | null;
  
  /** 上传文件到群文件根目录 */
  uploadFileToDir: (group_id: number | string, file: string, name?: string) => Promise<void>;
  
  /** 判断是否是主人的消息 */
  isRoot: (e: any) => boolean;
  
  /** 判断是否是管理员的消息 */
  isAdmin: (e: any) => boolean;
  
  /** 判断是否是群主的消息 */
  isGroupOwner: (e: any) => boolean;
  
  /** 判断是否是群管理员的消息 */
  isGroupAdmin: (e: any) => boolean;
  
  /** 获取已加载的插件列表 */
  getLoadedPlugins: () => XincPlugin[];
  
  /** 重载指定插件 */
  reloadPlugin: (name: string) => Promise<void>;
  
  /** 禁用插件 */
  disablePlugin: (name: string) => Promise<void>;
  
  /** 启用插件 */
  enablePlugin: (name: string) => Promise<void>;
  
  /** 获取框架状态 */
  getStatus: () => Promise<{
    uptime: string;      // 运行时间
    memory: number;      // 内存使用(MB)
    pluginCount: number; // 已加载插件数
    groupCount: number;  // 活跃群组数
  }>;
  
  /** 关闭框架 */
  shutdown: () => Promise<void>;
  
  /** 发送消息并返回消息ID */
  respond: (e: any, message: any) => Promise<any>;
  
  /** 撤回消息 */
  recallMsg: (message_id: number) => Promise<void>;
  
  /** 给好友点赞
   * @param user_id 好友QQ号
   * @param times 点赞次数(1-50)，默认50次
   */
  sendLike: (user_id: number | string, times?: number) => Promise<void>;
  
  /** 踢出群成员
   * @param group_id 群号
   * @param user_id 要踢的QQ号
   * @param reject_add_request 是否拉黑，默认false
   */
  kick: (group_id: number | string, user_id: number | string, reject_add_request?: boolean) => Promise<void>;
  
  /** 群禁言
   * @param group_id 群号
   * @param user_id 要禁言的QQ号
   * @param duration 禁言时长(秒)，0表示解除禁言，默认1800(30分钟)
   */
  mute: (group_id: number | string, user_id: number | string, duration?: number) => Promise<void>;
  
  /** 群组全员禁言
   * @param group_id 群号
   * @param enable 是否开启全员禁言，默认true
   */
  muteGroup: (group_id: number | string, enable?: boolean) => Promise<void>;
  
  /** 设置群管理员
   * @param group_id 群号
   * @param user_id 要设置的QQ号
   * @param enable 是否设为管理员，默认true
   */
  setAdmin: (group_id: number | string, user_id: number | string, enable?: boolean) => Promise<void>;
  
  /** 设置群名片
   * @param group_id 群号
   * @param user_id 要设置的QQ号
   * @param card 群名片，空字符串表示删除群名片
   */
  setGroupCard: (group_id: number | string, user_id: number | string, card: string) => Promise<void>;
  
  /** 设置群名
   * @param group_id 群号
   * @param group_name 新群名
   */
  setGroupName: (group_id: number | string, group_name: string) => Promise<void>;
  
  /** 退出群组
   * @param group_id 群号
   */
  quitGroup: (group_id: number | string) => Promise<void>;
  
  /** 设置群头衔
   * @param group_id 群号
   * @param user_id 要设置的QQ号
   * @param special_title 头衔，空字符串表示删除头衔
   */
  setTitle: (group_id: number | string, user_id: number | string, special_title: string) => Promise<void>;
  
  /** 获取群信息
   * @param group_id 群号
   * @returns 群信息对象
   */
  getGroupInfo: (group_id: number | string) => Promise<GroupInfo>;
  
  /** 获取群列表
   * @returns 群信息数组
   */
  getGroupList: () => Promise<GroupInfo[]>;
  
  /** 获取群成员信息
   * @param group_id 群号
   * @param user_id 要查询的QQ号
   * @param no_cache 是否不使用缓存
   * @returns 群成员信息
   */
  getGroupMemberInfo: (group_id: number | string, user_id: number | string, no_cache?: boolean) => Promise<GroupMemberInfo>;
  
  /** 获取指定域名的 Cookies
   * @param domain 域名
   * @returns Cookie信息
   */
  getCookie: (domain: string) => Promise<CookieInfo>;
  
  /** 获取 CSRF Token
   * @returns CSRF Token
   */
  getCsrfToken: () => Promise<string>;
  
  /** 获取登录凭证
   * @returns 凭证信息
   */
  getCredentials: () => Promise<CredentialsInfo>;
  
  /** 获取服务端版本信息
   * @returns 版本信息
   */
  getVersionInfo: () => Promise<VersionInfo>;
  
  /** 获取群 AI 角色列表
   * @param group_id 群号
   * @returns AI 角色列表，按类型分组
   */
  getAiRoleList: (group_id: number | string) => Promise<AICharacterGroup[]>;

  /** 发送群 AI 语音
   * @param group_id 群号
   * @param character_id AI 角色 ID
   * @param text 要转换为语音的文本
   * @returns 消息发送结果
   */
  sendGroupAiRecord: (group_id: number | string, character: string, text: string) => Promise<null>;

  /** 发送WebSocket消息
   * @param action 动作名称
   * @param params 参数对象
   * @returns WebSocket响应结果
   */
  wsSend: (action: string, params: any) => Promise<any>;

  /** 获取所有插件列表，包含启用状态 */
  getPlugins: () => Array<XincPlugin & { enabled: boolean }>;
}

/** 插件接口 */
export interface XincPlugin {
  /** 插件ID */
  name: string;
  /** 插件版本 */
  version?: string;
  /** 插件描述 */
  desc?: string;
  /** 插件安装方法 */
  setup?: (ctx: XincPluginContext) => void | Promise<void> | (() => void | Promise<void>);
}

/** 插件管理器接口 */
export interface XincPluginManager {
  /** 加载插件 */
  loadPlugin(plugin: XincPlugin): Promise<void>;
  /** 卸载插件 */
  unloadPlugin(name: string): Promise<void>;
  /** 获取已加载的插件列表 */
  getLoadedPlugins(): XincPlugin[];
}

export class PluginManager implements XincPluginManager {
  private plugins: Map<string, XincPlugin> = new Map();
  private cleanupFns = new Map<string, () => void | Promise<void>>();
  private eventHandlers = new Map<string, Set<Function>>();  // 新增：记录插件的事件处理器
  private eventBus: NCWebsocket;
  private dataDir: string;
  private configDir: string;
  private startTime: number = Date.now();

  constructor(ws: NCWebsocket, dataDir: string, configDir: string) {
    this.eventBus = ws;
    this.dataDir = dataDir;
    this.configDir = configDir;
  }

  async loadPlugin(plugin: XincPlugin): Promise<void> {
    // 类型检查
    if (!plugin || typeof plugin !== 'object') {
      throw new Error('Invalid plugin: plugin must be an object')
    }
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Invalid plugin: plugin.name must be a string')
    }
    if (plugin.setup && typeof plugin.setup !== 'function') {
      throw new Error('Invalid plugin: plugin.setup must be a function')
    }

    // 检查是否已加载
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already loaded`)
    }

    const ctx: XincPluginContext = {
      eventBus: this.eventBus,
      handle: <T extends EventKey>(event: T, handler: EventHandleMap[T]) => {
        // 记录事件处理器
        if (!this.eventHandlers.has(plugin.name)) {
          this.eventHandlers.set(plugin.name, new Set());
        }
        this.eventHandlers.get(plugin.name)!.add(handler);
        this.eventBus.on(event, handler);
      },
      handleMessage: (handler) => {
        // 记录消息处理器
        if (!this.eventHandlers.has(plugin.name)) {
          this.eventHandlers.set(plugin.name, new Set());
        }
        this.eventHandlers.get(plugin.name)!.add(handler);
        this.eventBus.on('message', handler);
      },
      off: <T extends EventKey>(event: T, handler: EventHandleMap[T]) => {
        this.eventBus.off(event, handler);
      },
      getDataPath: () => {
        const dir = path.join(this.dataDir, plugin.name);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
      },
      getConfigPath: () => {
        const dir = path.join(this.configDir, plugin.name);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        return dir;
      },
      getText: (e: any): string => {
        // 处理消息数组
        if (Array.isArray(e.message)) {
            const text = e.message
                .filter((msg: any) => msg.type === 'text')
                .map((msg: any) => msg.data.text)
                .join('');
            return text.trim();
        }
        return '';
      },
      getAvatarLink: (qq: number | string): string => {
        return `https://thirdqq.qlogo.cn/headimg_dl?dst_uin=${qq}&spec=0`;
      },
      getGroupLink: (group_id: number | string): string => {
        return `https://p.qlogo.cn/gh/${group_id}/${group_id}/0`;
      },
      getQuoteMsg: async (e: any): Promise<any> => {
        try {
            // 检查是否存在引用消息
            const reply = e.message?.find((msg: any) => msg.type === 'reply');
            if (!reply) return null;

            // 获取引用消息ID
            const messageId = reply.data.id;
            if (!messageId) return null;

            // 获取消息详情
            try {
                const result = await this.eventBus.get_msg({
                    message_id: parseInt(messageId)
                });
                return result;
            } catch (error) {
                console.error('Failed to get message by ID:', error);
                return null;
            }
        } catch (error) {
            console.error('Failed to get quote message:', error);
            return null;
        }
      },
      getImageURL: (e) => {
        const imageMsg = e.message.find((msg: MessageElement) => msg.type === 'image');
        return imageMsg ? imageMsg.data.url : null;
      },
      getQuoteImageURL: async (e) => {
        const quoteMsg = await ctx.getQuoteMsg(e);
        if (!quoteMsg) return null;
        return ctx.getImageURL(quoteMsg);
      },
      getMentionedImageURL: async (e) => {
        const directImageUrl = ctx.getImageURL(e);
        if (directImageUrl) return directImageUrl;

        const quoteImageUrl = await ctx.getQuoteImageURL(e);
        return quoteImageUrl;
      },
      getTaggedUserID: (e) => {
        const atMessages = e.message.filter((msg: MessageElement) => msg.type === 'at');
        if (atMessages.length === 0) return null;
        return atMessages[atMessages.length - 1].data.qq;
      },
      uploadFileToDir: async (group_id: number | string, file: string, name?: string) => {
        try {
          await this.eventBus.upload_group_file({
            group_id: Number(group_id),
            file,
            name: name || path.basename(file),
            folder_id: "/"
          });
        } catch (error) {
          throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      isRoot: (e) => {
        const config = configManager.getConfig();
        const rootList = config.root || [];
        return rootList.includes(String(e.user_id));
      },
      isAdmin: (e) => {
        const config = configManager.getConfig();
        const adminList = config.admin || [];
        // 主人也是管理员
        return ctx.isRoot(e) || adminList.includes(String(e.user_id));
      },
      isGroupOwner: (e) => {
        return e.message_type === 'group' && e.sender.role === 'owner';
      },
      isGroupAdmin: (e) => {
        return e.message_type === 'group' && 
          (e.sender.role === 'owner' || e.sender.role === 'admin');
      },
      getLoadedPlugins: () => {
        return Array.from(this.plugins.values());
      },
      reloadPlugin: async (name: string) => {
        await this.unloadPlugin(name);
        const pluginPath = path.join(process.cwd(), 'plugins', name);
        const plugin = (await import(path.join(pluginPath, 'index.ts'))).default;
        await this.loadPlugin(plugin);
      },
      disablePlugin: async (name: string) => {
        if (!this.plugins.has(name)) {
          throw new Error(`Plugin ${name} not found`);
        }
        await this.unloadPlugin(name);
      },
      enablePlugin: async (name: string) => {
        const pluginPath = path.join(process.cwd(), 'plugins', name, 'index.ts');
        const devPluginPath = path.join(process.cwd(), 'plugins', name, 'index.ts');

        // 检查插件文件是否存在
        if (!fs.existsSync(devPluginPath)) {
          throw new Error(`找不到插件 ${name}`);
        }

        try {
          // 尝试导入编译后的文件
          const pluginModule = await import(pluginPath);
          const plugin = pluginModule.default;

          if (!plugin || !plugin.name) {
            throw new Error(`插件 ${name} 格式不正确`);
          }

          await this.loadPlugin(plugin);

          // 更新配置文件
          const config = configManager.getConfig();
          config.plugins = Array.from(new Set([...(config.plugins || []), name]));
          configManager.saveConfig();

        } catch (importError: any) {
          // 如果导入失败，尝试使用 require
          try {
            const plugin = require(devPluginPath).default;
            
            if (!plugin || !plugin.name) {
              throw new Error(`插件 ${name} 格式不正确`);
            }

            await this.loadPlugin(plugin);

            // 更新配置文件
            const config = configManager.getConfig();
            config.plugins = Array.from(new Set([...(config.plugins || []), name]));
            configManager.saveConfig();

          } catch (requireError: any) {
            throw new Error(`无法加载插件: ${requireError.message}`);
          }
        }
      },
      getStatus: async () => {
        const uptime = this.formatUptime(Date.now() - this.startTime);
        const memory = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
        const pluginCount = this.plugins.size;
        
        // 获取活跃群组数
        const groups = await this.eventBus.get_group_list();
        const groupCount = groups.length;

        return { uptime, memory, pluginCount, groupCount };
      },
      shutdown: async () => {
        // 卸载所有插件
        for (const name of this.plugins.keys()) {
          await this.unloadPlugin(name);
        }
        // 断开连接
        this.eventBus.disconnect();
        // 退出进程
        process.exit(0);
      },
      recallMsg: async (message_id: number) => {
        try {
          await this.eventBus.delete_msg({
            message_id
          });
        } catch (error) {
          throw new Error(`Failed to recall message: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      respond: async (e, message) => {
        try {
          const formattedMessage = message.map((msg: string | Send[keyof Send]) => 
            typeof msg === 'string' ? Structs.text(msg) : msg
          );

          let result;
          if (e.message_type === 'group') {
            result = await this.eventBus.send_group_msg({
              group_id: e.group_id,
              message: formattedMessage
            });
            // 添加日志
            const replyText = formattedMessage.map((msg: MessageElement) => 
              msg.type === 'text' ? msg.data.text : `[${msg.type}]`
            ).join('');
            logger.info(`succeed to send: [Group(${e.group_id})] ${replyText}`);
          } else {
            result = await this.eventBus.send_private_msg({
              user_id: e.user_id,
              message: formattedMessage
            });
            // 添加日志
            const replyText = formattedMessage.map((msg: MessageElement) => 
              msg.type === 'text' ? msg.data.text : `[${msg.type}]`
            ).join('');
            logger.info(`succeed to send: [Private(${e.user_id})] ${replyText}`);
          }
          return result;
        } catch (error) {
          throw new Error(`Failed to send message: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      sendLike: async (user_id: number | string, times: number = 50) => {
        try {
          // 确保次数在1-50之间
          const count = Math.max(1, Math.min(50, times));
          await this.eventBus.send_like({
            user_id: Number(user_id),
            times: count
          });
        } catch (error) {
          throw new Error(`Failed to send like: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      kick: async (group_id: number | string, user_id: number | string, reject_add_request: boolean = false) => {
        try {
          await this.eventBus.set_group_kick({
            group_id: Number(group_id),
            user_id: Number(user_id),
            reject_add_request
          });
        } catch (error) {
          throw new Error(`Failed to kick member: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      mute: async (group_id: number | string, user_id: number | string, duration: number = 1800) => {
        try {
          await this.eventBus.set_group_ban({
            group_id: Number(group_id),
            user_id: Number(user_id),
            duration: Math.max(0, duration) // 确保时长不为负数
          });
        } catch (error) {
          throw new Error(`Failed to mute member: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      muteGroup: async (group_id: number | string, enable: boolean = true) => {
        try {
          await this.eventBus.set_group_whole_ban({
            group_id: Number(group_id),
            enable
          });
        } catch (error) {
          throw new Error(`Failed to set group mute: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      setAdmin: async (group_id: number | string, user_id: number | string, enable: boolean = true) => {
        try {
          await this.eventBus.set_group_admin({
            group_id: Number(group_id),
            user_id: Number(user_id),
            enable
          });
        } catch (error) {
          throw new Error(`Failed to set admin: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      setGroupCard: async (group_id: number | string, user_id: number | string, card: string) => {
        try {
          await this.eventBus.set_group_card({
            group_id: Number(group_id),
            user_id: Number(user_id),
            card
          });
        } catch (error) {
          throw new Error(`Failed to set group card: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      setGroupName: async (group_id: number | string, group_name: string) => {
        try {
          await this.eventBus.set_group_name({
            group_id: Number(group_id),
            group_name
          });
        } catch (error) {
          throw new Error(`Failed to set group name: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      quitGroup: async (group_id: number | string) => {
        try {
          await this.eventBus.set_group_leave({
            group_id: Number(group_id)
          });
        } catch (error) {
          throw new Error(`Failed to quit group: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      setTitle: async (group_id: number | string, user_id: number | string, special_title: string) => {
        try {
          await this.eventBus.set_group_special_title({
            group_id: Number(group_id),
            user_id: Number(user_id),
            special_title
          });
        } catch (error) {
          throw new Error(`Failed to set group title: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getGroupInfo: async (group_id: number | string) => {
        try {
          const info = await this.eventBus.get_group_info({
            group_id: Number(group_id)
          });
          return {
            group_id: info.group_id,
            group_name: info.group_name,
            member_count: info.member_count,
            max_member_count: info.max_member_count
          };
        } catch (error) {
          throw new Error(`Failed to get group info: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getGroupList: async () => {
        try {
          const groups = await this.eventBus.get_group_list();
          return groups.map(group => ({
            group_id: group.group_id,
            group_name: group.group_name,
            member_count: group.member_count,
            max_member_count: group.max_member_count
          }));
        } catch (error) {
          throw new Error(`Failed to get group list: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getGroupMemberInfo: async (group_id: number | string, user_id: number | string, no_cache?: boolean) => {
        try {
          const info = await this.eventBus.get_group_member_info({
            group_id: Number(group_id),
            user_id: Number(user_id),
            no_cache
          });
          return {
            group_id: info.group_id,
            user_id: info.user_id,
            nickname: info.nickname,
            card: info.card,
            role: info.role,
            title: info.title,
            join_time: info.join_time,
            last_sent_time: info.last_sent_time
          };
        } catch (error) {
          throw new Error(`Failed to get member info: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getCookie: async (domain: string) => {
        try {
          const info = await this.eventBus.get_cookies({
            domain
          });
          return {
            cookies: info.cookies,
            bkn: info.bkn
          };
        } catch (error) {
          throw new Error(`Failed to get cookies: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getCsrfToken: async () => {
        try {
          const info = await this.eventBus.get_csrf_token();
          return info.token;
        } catch (error) {
          throw new Error(`Failed to get CSRF token: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getCredentials: async () => {
        try {
          const info = await this.eventBus.get_credentials();
          return {
            cookies: info.cookies,
            token: info.token
          };
        } catch (error) {
          throw new Error(`Failed to get credentials: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getVersionInfo: async () => {
        try {
          const info = await this.eventBus.get_version_info();
          return {
            app_name: info.app_name,
            app_version: info.app_version,
            protocol_version: info.protocol_version
          };
        } catch (error) {
          throw new Error(`Failed to get version info: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getAiRoleList: async (group_id: number | string) => {
        try {
          const result = await this.eventBus.get_ai_characters({
            group_id: Number(group_id)
          });
          return result;
        } catch (error) {
          throw new Error(`Failed to get AI characters: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      sendGroupAiRecord: async (group_id: number | string, character: string, text: string) => {
        try {
          const result = await this.eventBus.send_group_ai_record({
            group_id: Number(group_id),
            character,
            text
          });
          return result;
        } catch (error) {
          throw new Error(`Failed to send AI voice record: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      wsSend: async (action: string, params: any) => {
        try {
          const json = {
            action: action,
            params: params,
            echo: `${action}_${Date.now()}`
          };
          return await this.eventBus.send(action, params);
        } catch (error) {
          throw new Error(`Failed to send WebSocket message: ${error instanceof Error ? error.message : String(error)}`);
        }
      },
      getPlugins: () => {
        // 获取插件目录下的所有插件
        const pluginsDir = path.join(process.cwd(), 'plugins');
        const allPlugins = fs.readdirSync(pluginsDir)
          .filter(name => fs.statSync(path.join(pluginsDir, name)).isDirectory())
          .map(name => {
            try {
              // 尝试获取插件信息
              const pluginPath = path.join(pluginsDir, name, 'index.ts');
              if (fs.existsSync(pluginPath)) {
                // 检查是否已加载
                const loadedPlugin = this.plugins.get(name);
                if (loadedPlugin) {
                  return {
                    ...loadedPlugin,
                    enabled: true
                  };
                }
                // 如果未加载，返回基本信息
                return {
                  name,
                  enabled: false
                };
              }
              return null;
            } catch (error) {
              return null;
            }
          })
          .filter((p): p is (XincPlugin & { enabled: boolean }) => p !== null);

        return allPlugins;
      }
    };

    const cleanup = await plugin.setup?.(ctx);
    if (typeof cleanup === 'function') {
        this.cleanupFns.set(plugin.name, cleanup);
    }

    this.plugins.set(plugin.name, plugin);
  }

  async unloadPlugin(name: string): Promise<void> {
    try {
      const handlers = this.eventHandlers.get(name);
      if (handlers) {
        for (const handler of handlers) {
          this.eventBus.off('message' as EventKey, handler as any);
          // 使用正确的事件类型
          const events: EventKey[] = ['notice', 'request', 'meta_event'] as EventKey[];
          for (const event of events) {
            this.eventBus.off(event, handler as any);
          }
        }
        this.eventHandlers.delete(name);
      }

      // 2. 执行清理函数
      const cleanup = this.cleanupFns.get(name);
      if (cleanup) {
        await Promise.resolve(cleanup());
        this.cleanupFns.delete(name);
      }

      // 3. 从内存中移除插件
      this.plugins.delete(name);

      logger.info(`Plugin ${name} unloaded successfully`);
    } catch (error: any) {
      throw new Error(`Failed to unload plugin: ${error.message}`);
    }
  }

  private formatUptime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}天${hours % 24}时${minutes % 60}分${seconds % 60}秒`;
  }

  getLoadedPlugins(): XincPlugin[] {
    return Array.from(this.plugins.values());
  }

  private findPlugin(name: string): XincPlugin | undefined {
    // 直接匹配
    let plugin = this.plugins.get(name);
    
    // 不区分大小写匹配
    if (!plugin) {
        for (const [key, value] of this.plugins.entries()) {
            if (key.toLowerCase() === name.toLowerCase()) {
                plugin = value;
                break;
            }
        }
    }
    
    return plugin;
  }

  async reloadPlugin(name: string) {
    try {
      // 1. 先禁用
      await this.disablePlugin(name);
      
      // 2. 再启用
      await this.enablePlugin(name);
      
      logger.info(`Plugin ${name} reloaded successfully`);
    } catch (error: any) {
      throw new Error(`重载插件失败: ${error.message}`);
    }
  }

  async enablePlugin(name: string) {
    try {
      // 检查插件是否已启用
      if (this.plugins.has(name)) {
        throw new Error(`插件 ${name} 已经启用`);
      }

      // 统一使用正确的插件路径
      const pluginPath = path.join(process.cwd(), 'plugins', name, 'index.ts');
      
      if (!fs.existsSync(pluginPath)) {
        throw new Error(`找不到插件文件: ${pluginPath}`);
      }

      // 导入插件
      const plugin = (await import(`${pluginPath}?t=${Date.now()}`)).default;
      await this.loadPlugin(plugin);

      // 更新配置
      const config = configManager.getConfig();
      if (!config.plugins.includes(name)) {
        config.plugins.push(name);
        configManager.saveConfig();
      }

      logger.info(`Plugin ${name} enabled successfully`);
    } catch (error: any) {
      throw new Error(`启用插件失败: ${error.message}`);
    }
  }

  async disablePlugin(name: string) {
    try {
      // 1. 检查插件是否存在
      const plugin = this.plugins.get(name);
      if (!plugin) {
        throw new Error(`找不到插件 ${name}`);
      }

      // 2. 卸载插件
      await this.unloadPlugin(name);

      // 3. 更新配置文件
      const config = configManager.getConfig();
      config.plugins = config.plugins.filter(p => p !== name);
      configManager.saveConfig();

      logger.info(`Plugin ${name} disabled successfully`);
    } catch (error: any) {
      throw new Error(`禁用插件失败: ${error.message}`);
    }
  }
}

export function definePlugin(plugin: XincPlugin): XincPlugin {
  return plugin;
} 