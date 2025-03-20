import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

export default definePlugin({
    name: '插件名称',
    version: '1.0.0',
    desc: '插件描述',
    
    setup(ctx) {
        ctx.handle('message', async e => {
            // 处理全部消息
            if (ctx.getText(e) === '你好') {
                await ctx.respond(e, ['世界，你好！']);
            }
        });

        ctx.handle('message.private', async e => {
            // 处理私聊消息
            if (ctx.getText(e) === '你好') {
                await ctx.respond(e, ['世界，你好！']);
            }
        });

        ctx.handle('message.group', async e => {
            // 处理群聊消息
            if (ctx.getText(e) === '你好') {
                await ctx.respond(e, ['世界，你好！']);
            }
        });
    }
});