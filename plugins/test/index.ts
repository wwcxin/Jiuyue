import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

export default definePlugin({
    name: 'test', // 修改为你的插件名称
    version: '1.0.0', // 插件版本
    desc: '测试插件', // 插件描述
    
    setup(ctx) {
        // 处理所有消息
        ctx.handle('message', async e => {
            if (ctx.getText(e) === '关键词') {
                await ctx.respond(e, ['回复内容']);
            }
        });
        
        // 处理私聊消息
        ctx.handle('message.private', async e => {
            // 私聊消息处理逻辑
        });
        
        // 处理群聊消息
        ctx.handle('message.group', async e => {
            // 群聊消息处理逻辑
        });
        
        // 处理好友请求
        ctx.handle('request.friend', async e => {
            // 好友请求处理逻辑
        });
        
        // 处理群邀请
        ctx.handle('request.group', async e => {
            // 群邀请处理逻辑
        });
        
        // 处理群成员增加事件
        ctx.handle('notice.group_increase', async e => {
            // 群成员增加事件处理逻辑
        });
        
        // 处理群成员减少事件
        ctx.handle('notice.group_decrease', async e => {
            // 群成员减少事件处理逻辑
        });
    }
});