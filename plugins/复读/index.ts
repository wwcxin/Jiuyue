import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

// 同一消息达到目标次数时复读该消息
const HISTORY_SIZE = 3

// 类型定义
type Message = any[]
interface MessageRecord {
    message: Message
    count: number
}

// 存储每个群的消息记录
const groupMessagesMap = new Map<number, MessageRecord>()

// 存储正在处理的群消息
const processingGroups = new Set<number>()

// 存储每个群的最近消息历史
const groupMessagesHistory = new Map<number, Message[]>()

// 比较两个消息数组是否完全相同
function areMessagesEqual(msg1: Message, msg2: Message): boolean {
    if (!Array.isArray(msg1) || !Array.isArray(msg2)) return false
    if (msg1.length !== msg2.length) return false

    return msg1.every((item, index) => {
        const item2 = msg2[index]
        if (!item || !item2 || item.type !== item2.type) return false

        try {
            switch (item.type) {
                case 'text':
                    return item.data?.text === item2.data?.text
                case 'face':
                    return item.data?.id === item2.data?.id
                case 'image':
                    return item.data?.file === item2.data?.file || item.data?.md5 === item2.data?.md5
                case 'at':
                    return item.data?.qq === item2.data?.qq
                case 'reply':
                    return item.data?.id === item2.data?.id
                default:
                    return JSON.stringify(item) === JSON.stringify(item2)
            }
        } catch (error) {
            console.error('消息比较出错:', error)
            return false
        }
    })
}

export default definePlugin({
    name: '复读',
    version: '1.0.0',
    
    setup(ctx) {
        // 添加定时清理机制
        setInterval(() => {
            groupMessagesHistory.clear();
        }, 1000 * 60 * 60); // 每小时清理一次

        ctx.handleMessage(async e => {
            // 验证是否为群消息
            if (!e.group_id) return
            
            // 验证消息内容
            if (!e.message || !Array.isArray(e.message) || e.message.length === 0) return
            
            const groupId = e.group_id
            const currentMessage = e.message

            // 获取该群的消息历史，如果不存在则创建
            if (!groupMessagesHistory.has(groupId)) {
                groupMessagesHistory.set(groupId, [])
            }
            
            const history = groupMessagesHistory.get(groupId)!
            
            // 检查当前消息是否与最近的消息相同
            const isRepeat = history.length > 0 && areMessagesEqual(currentMessage, history[history.length - 1])
            
            // 更新历史记录
            if (!isRepeat) {
                // 如果不是重复消息，清空历史并添加当前消息
                history.length = 0
                history.push(currentMessage)
            } else {
                // 如果是重复消息，添加到历史
                history.push(currentMessage)
                
                // 检查是否达到复读条件（连续3条相同消息）
                if (history.length >= HISTORY_SIZE) {
                    try {
                        // 发送复读消息
                        await ctx.respond(e, currentMessage)
                        // 清空历史
                        history.length = 0
                    } catch (error) {
                        console.error('复读消息发送失败:', error)
                    }
                }
            }
        });
    }
});