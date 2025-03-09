import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';
import { configManager } from '../../src/core/config';
import os from 'os';
import path from 'path';
import fs from 'fs';

const startTime = Date.now();
const config = configManager.getConfig();
const prefix = config.prefix || '/';  // 使用配置的前缀,默认是'/'
const cpu = os.cpus()[0].model;

export default definePlugin({
  name: 'cmd',
  version: '1.0.0',
  desc: '框架管理插件',
  
  setup(ctx) {
    ctx.handleMessage(async e => {
      // 只响应主人和管理员的命令
      if (!ctx.isAdmin(e) && !ctx.isRoot(e)) return;
      if (!ctx.getText(e).startsWith(prefix)) return;
      const text = ctx.getText(e).replace(prefix, '');

      // 使用 ctx.respond 而不是 quick_action
      const sendMessage = async (message: string[]) => {
        await ctx.respond(e, message);
      };

      if (text === `help`) {
        // 显示帮助信息
        await sendMessage([
          '〓 xincBot help 〓\n' +
          'A list of commands:\n' +
          `${prefix}seting - 查看设置\n` +
          `${prefix}set +admin <@qq> - 添加管理员\n` +
          `${prefix}set -admin <@qq> - 删除管理员\n` +
          `${prefix}p ls - 查看插件列表\n` +
          `${prefix}p reload <plugin name> - 重载指定插件\n` +
          `${prefix}p off <plugin name> - 禁用指定插件\n` +
          `${prefix}p on <plugin name> - 启用指定插件\n` +
          `${prefix}status - 查看框架状态\n` +
          `${prefix}exit - 关闭框架(仅限主人)\n` +
          `${prefix}help - 显示此帮助`
        ]);
      }

      if (text === `帮助`) {
        // 显示帮助信息
        await sendMessage([
          '〓 xincBot 帮助 〓\n' +
          '命令列表:\n' +
          `${prefix}设置 - 查看设置\n` +
          `${prefix}设置 加管理 <@qq> - 添加管理员\n` +
          `${prefix}设置 删管理 <@qq> - 删除管理员\n` +
          `${prefix}插件 列表 - 查看插件列表\n` +
          `${prefix}插件 重载 <插件名> - 重载指定插件\n` +
          `${prefix}插件 禁用 <插件名> - 禁用指定插件\n` +
          `${prefix}插件 启用 <插件名> - 启用指定插件\n` +
          `${prefix}状态 - 查看框架状态\n` +
          `${prefix}退出 - 关闭框架(仅限主人)\n` +
          `${prefix}帮助 - 显示此帮助`
        ]);
      }

      if (text === `设置`) {
        // 显示设置
        await sendMessage([
          '〓 xincBot 设置 〓\n' +
          '设置列表:\n' +
          `${prefix}设置 加管理 <@qq> - 添加管理员\n` +
          `${prefix}设置 删管理 <@qq> - 删除管理员\n`
        ]);
      }

      if (text === 'seting') {
        // 显示设置
        await sendMessage([
          '〓 xincBot seting 〓\n' +
          'seting list:\n' +
          `${prefix}seting +admin <@qq> - add admin\n` +
          `${prefix}seting -admin <@qq> - del admin\n`
        ]);
      }
      if (text === `status` || text === `状态`) {
        // 获取框架状态
        const status = await ctx.getStatus();
        const botInfo = await ctx.eventBus.get_login_info();
        const groups = await ctx.eventBus.get_group_list();
        const friends = await ctx.eventBus.get_friend_list();
        
        // 获取插件统计
        const pluginsDir = path.join(process.cwd(), 'plugins');
        const allPlugins = fs.readdirSync(pluginsDir)
          .filter(name => fs.statSync(path.join(pluginsDir, name)).isDirectory());
        const config = configManager.getConfig();
        const enabledPlugins = config.plugins || [];

        const totalMem = os.totalmem() / 1024 / 1024 / 1024;
        const freeMem = os.freemem() / 1024 / 1024 / 1024;
        const usedMem = totalMem - freeMem;
        const memPercent = (usedMem / totalMem * 100).toFixed(1);
        const version = await ctx.getVersionInfo();

        await sendMessage([
          '〓 xincBot status 〓\n' +
          `Nickname: ${botInfo.nickname}\n` +
          `Account: ${botInfo.user_id}\n` +
          `Friend: ${groups.length} groups, ${friends.length} friends.\n` +
          `Plugin: ${enabledPlugins.length} up, ${allPlugins.length} total\n` +
          `Uptime: ${formatUptime(Date.now() - startTime)}\n` +
          `xincBot: v1.0.0-${Math.round(status.memory)}MB-${(status.memory / (totalMem * 100)).toFixed(1)}%\n` +
          `Protocol: ${version.app_name}v${version.app_version}\n` +
          `Env: xincbot-node${process.version.slice(1)}\n` +
          `CPU: ${cpu}\n` +
          `RAM: ${usedMem.toFixed(1)} GB/${totalMem.toFixed(1)} GB-${memPercent}%`
        ]);
      }

      // 插件相关命令
      if (text.startsWith('p ')) {
        const args = text.slice(2).split(' ');
        const cmd = args[0];
        const pluginName = args[1];
        
        switch (cmd) {
          case 'ls': {
            const plugins = ctx.getPlugins();
            const pluginList = plugins.map(p => 
              `${p.enabled ? '🟢' : '🔴'} ${p.name}`
            ).join('\n');
            await sendMessage([
              '〓 插件列表 〓\n' +
              pluginList + '\n' +
              `共 ${plugins.length} 个，启用 ${plugins.filter(p => p.enabled).length} 个`
            ]);
            break;
          }
          
          case 'on':
          case 'off':
          case 'reload': {
            if (!pluginName) {
              await sendMessage(['请指定插件名']);
              return;
            }
            
            try {
              // 获取所有插件
              const plugins = ctx.getPlugins();
              // 使用模糊匹配找到插件,不区分大小写
              const plugin = plugins.find(p => 
                p.name.toLowerCase() === pluginName.toLowerCase() ||
                p.name === pluginName
              );
              
              if (!plugin) {
                throw new Error(`找不到插件 ${pluginName}`);
              }

              if (cmd === 'on') {
                await ctx.enablePlugin(plugin.name);
                await sendMessage([`已启用插件 ${plugin.name}`]);
              } else if (cmd === 'off') {
                await ctx.disablePlugin(plugin.name);
                await sendMessage([`已禁用插件 ${plugin.name}`]);
              } else if (cmd === 'reload') {
                await ctx.reloadPlugin(plugin.name);
                await sendMessage([`已重载插件 ${plugin.name}`]);
              }
            } catch (error) {
              await sendMessage([`${cmd === 'on' ? '启用' : cmd === 'off' ? '禁用' : '重载'}失败: ${error.message}`]);
            }
            break;
          }
          
          default:
            await sendMessage(['未知命令']);
        }
        return;
      }

      // 设置相关命令
      if (text.startsWith('set ') || text.startsWith('设置 ')) {
        const cmd = text.replace("set ", '').replace("设置 ", '');
        const qq = ctx.getTaggedUserID(e);

        if (!ctx.isRoot(e)) return;
        

        switch (cmd) {
          case '+admin':
          case '加管理':
            if (!qq) {
              await sendMessage([`用法: ${prefix}set +admin <@qq>`]);
              return;
            }
            try {
              const config = configManager.getConfig();
              config.admin = [...(config.admin || []), String(qq)];
              configManager.saveConfig();  // 调用保存方法
              await sendMessage([`已添加管理员: ${qq}`]);
            } catch (error) {
              await sendMessage([`添加失败: ${error}`]);
            }
            break;

          case '-admin':
          case '删管理':
            if (!qq) {
              await sendMessage([`用法: ${prefix}set -admin <@qq>`]);
              return;
            }
            try {
              const config = configManager.getConfig();
              config.admin = (config.admin || []).filter(id => id !== String(qq));
              configManager.saveConfig();  // 调用保存方法
              await sendMessage([`已删除管理员: ${qq}`]);
            } catch (error) {
              await sendMessage([`删除失败: ${error}`]);
            }
            break;
        }
      }

      // 退出命令
      if (text === 'exit' || text === '退出') {
        if (!ctx.isRoot(e)) return;
        
        await sendMessage(['正在关闭框架...']);
        await ctx.shutdown();
      }
    });
  }
});

// 添加一个格式化运行时间的辅助函数
function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
} 