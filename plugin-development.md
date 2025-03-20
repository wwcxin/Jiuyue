# xincBot 插件开发指南

## 插件结构

xincBot 的插件是一个 TypeScript 模块，通过 `definePlugin` 函数定义。一个基本的插件结构如下：

```typescript
import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

export default definePlugin({
    name: '插件名称',
    version: '1.0.0',
    desc: '插件描述',
    
    setup(ctx) {
        // 插件初始化代码
    }
});
```

## 事件处理

插件通过 `ctx.handle` 方法注册事件处理器。常用的事件类型包括：

- `message`: 处理所有消息
- `message.private`: 处理私聊消息
- `message.group`: 处理群聊消息
- `request.friend`: 处理好友请求
- `request.group`: 处理群邀请
- `notice.group_increase`: 处理群成员增加事件
- `notice.group_decrease`: 处理群成员减少事件

示例：

```typescript
// 处理所有消息
ctx.handle('message', async e => {
    if (ctx.getText(e) === '你好') {
        await ctx.respond(e, ['世界，你好！']);
    }
});

// 处理私聊消息
ctx.handle('message.private', async e => {
    console.log('收到私聊消息:', ctx.getText(e));
});

// 处理群聊消息
ctx.handle('message.group', async e => {
    console.log('收到群聊消息:', ctx.getText(e));
});
```

## 消息处理

### 获取消息内容

```typescript
// 获取纯文本内容
const text = ctx.getText(e);

// 获取图片URL
const imageUrl = ctx.getImageURL(e);

// 获取被@的用户ID
const mentionedUserId = ctx.getTaggedUserID(e);

// 获取引用的消息
const quoteMsg = await ctx.getQuoteMsg(e);
```

### 发送消息

```typescript
// 发送文本消息
await ctx.respond(e, ['你好，世界！']);

// 发送图片
await ctx.respond(e, [Structs.image('https://example.com/image.jpg')]);

// 发送混合内容
await ctx.respond(e, [
    '这是一条消息，带有图片：',
    Structs.image('https://example.com/image.jpg')
]);

// 发送并在3秒后撤回
const result = await ctx.respond(e, ['这条消息将在3秒后撤回']);
setTimeout(async () => {
    await ctx.recallMsg(result.message_id);
}, 3000);
```

## 权限管理

```typescript
// 检查是否为主人
if (ctx.isRoot(e)) {
    // 主人专属功能
}

// 检查是否为管理员
if (ctx.isAdmin(e)) {
    // 管理员功能
}

// 检查是否为群主
if (ctx.isGroupOwner(e)) {
    // 群主功能
}

// 检查是否为群管理员
if (ctx.isGroupAdmin(e)) {
    // 群管理员功能
}
```

## 群管理功能

```typescript
// 禁言群成员
await ctx.mute(e.group_id, user_id, 60); // 禁言1分钟

// 踢出群成员
await ctx.kick(e.group_id, user_id);

// 设置群名片
await ctx.setGroupCard(e.group_id, user_id, '新名片');

// 设置群名
await ctx.setGroupName(e.group_id, '新群名');
```

## 插件生命周期

插件在 `setup` 函数中初始化，可以返回一个清理函数用于插件卸载时执行清理操作：

```typescript
setup(ctx) {
    // 初始化代码
    
    // 返回清理函数
    return async () => {
        // 清理代码
        console.log('插件被卸载，执行清理操作');
    };
}
```

## 最佳实践

1. 使用有意义的插件名称和描述
2. 合理组织代码，将复杂逻辑拆分为多个函数
3. 使用 try-catch 处理可能的异常
4. 避免过度使用全局变量
5. 为重要功能添加权限检查
6. 使用 TypeScript 类型系统提高代码质量