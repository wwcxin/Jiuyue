# xincBot

基于 NapCat 和 node-napcat-ts 开发的 QQ 机器人框架。

- 灵感来源 `kivibot` 因 `icqq` 难以登陆且内测版本未公开，故尝试使用 `NapCat` 。

## 特性

- 🔌 插件系统 - 支持动态加载/卸载插件
- 🛡️ 权限管理 - 区分主人/管理员/普通用户权限
- 🤖 AI 功能 - 支持 AI 语音等功能
- 📝 消息处理 - 支持文本/图片/表情等多种消息类型
- 👥 群管理 - 完整的群管理功能
- ⚙️ 配置灵活 - 通过 TOML 文件简单配置

## 快速开始
- 确保 `napcat` 开启服务端ws `websocket服务器`
- 确保 `napcat` 开启服务端ws `websocket服务器`
- 确保 `napcat` 开启服务端ws `websocket服务器`
### 安装

```bash
git clone https://github.com/wwcxin/jiuyue.git && cd jiuyue
```

### 配置

创建 `xinc.config.toml` 文件:

```toml
host = "127.0.0.1"    # 机器人服务器地址
port = 4001           # 端口
prefix = "#"          # 命令前缀
root = ["123456789"]  # 主人QQ号
admin = []            # 管理员QQ号
plugins = ["cmd"]     # 启用的插件
```

### 安装依赖

```bash
npm install
```

### 运行

```bash
# 开发模式
npm run dev
```

## 插件开发

创建一个简单的插件:

```typescript
import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

export default definePlugin({
    name: '插件名称',
    version: '1.0.0',
    desc: '插件描述',
    
    setup(ctx) {
        ctx.handleMessage(async e => {
            if (ctx.getText(e) === '你好') {
                await ctx.respond(e, ['世界，你好！']);
            }
        });
    }
});
```

## 命令列表

- `#help` - 显示帮助信息
- `#status` - 查看框架状态
- `#seting` - 查看设置
- `#set +admin @用户` - 添加管理员
- `#set -admin @用户` - 删除管理员
- `#p ls` - 查看插件列表
- `#p reload <插件名>` - 重载指定插件
- `#p off <插件名>` - 禁用指定插件
- `#p on <插件名>` - 启用指定插件
- `#exit` - 关闭框架(仅限主人)

## API 文档

### 消息处理

- `ctx.getText(e)` - 获取消息文本
- `ctx.respond(e, messages)` - 发送回复
- `ctx.recallMsg(messageId)` - 撤回消息

### 权限管理

- `ctx.isRoot(e)` - 判断是否为主人
- `ctx.isAdmin(e)` - 判断是否为管理员

### 群管理

- `ctx.mute(groupId, userId, duration)` - 禁言成员
- `ctx.setGroupCard(groupId, userId, card)` - 设置群名片

### AI 功能

- `ctx.getAiRoleList(groupId)` - 获取 AI 角色列表
- `ctx.sendGroupAiRecord(groupId, characterId, text)` - 发送 AI 语音

## 配置说明

### xinc.config.toml

- `host` - 机器人服务器地址
- `port` - 服务器端口
- `prefix` - 命令前缀
- `root` - 主人 QQ 号列表
- `admin` - 管理员 QQ 号列表
- `plugins` - 启用的插件列表

## 许可证

[GPL-3.0](LICENSE)

## 贡献指南

1. Fork 本仓库
2. 创建新分支: `git checkout -b feature/xxxx`
3. 提交更改: `git commit -am 'feat: add xxxx'`
4. 推送分支: `git push origin feature/xxxx`
5. 提交 Pull Request

## 问题反馈

如有问题，请在 [Issues](https://github.com/wwcxin/xincbot/issues) 中提出。

## 致谢

- [NapCat](https://github.com/napcat-xo/NapCat)
- [node-napcat-ts](https://github.com/napcat-xo/node-napcat-ts)
