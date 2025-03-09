import { definePlugin } from '../../src/core/plugin';
import { Structs } from 'node-napcat-ts';

export default definePlugin({
    name: 'Ai语音',
    version: '1.0.0',
    desc: 'AI 语音插件',
    
    setup(ctx) {
      // 处理消息事件,e 会自动获得正确的类型
      ctx.handleMessage(async e => {
        if (ctx.getText(e) === '角色列表') {
            const roles = await ctx.getAiRoleList(e.group_id);

            const messages = roles.map(role => ({
                type: "node",
                data: {
                    user_id: e.user_id,
                    nickname: e.nickname,
                    content: [
                        Structs.text(`〓 ${role.type} 〓\n`),
                        ...role.characters.map(character => (
                            Structs.text(`${character.character_name} - ${character.preview_url}\n`)
                        ))
                    ]
                }
            }));
    
            const json = {
                action: "send_group_forward_msg",
                params: {
                    group_id: e.group_id,
                    messages: [
                        {
                            type: "node",
                            data: {
                                user_id: e.user_id,
                                nickname: e.nickname,
                                content: [Structs.text("〓 角色列表 〓")]
                            }
                        },
                        {
                            type: "node",
                            data: {
                                user_id: e.user_id,
                                nickname: e.nickname,
                                content: messages
                            }
                        }
                    ],
                    news: [
                        {
                            text: "分类查看"
                        }
                    ],
                    prompt: "Ai角色详细",
                    summary: "点击查看详细",
                    source: "Ai语音列表"
                },
                echo: `send_group_forward_msg_${Date.now().toString()}`
            };

            // 发送合并转发消息
            await ctx.eventBus.send(json.action, json.params);
        }

        // 处理 "xx说" 开头的消息
        const name = extractName(ctx.getText(e));
        if (name) {
            const characterId = roleList[name]; // 获取角色 ID
            const content = ctx.getText(e).slice(name.length + 1); // 提取 "说" 之后的内容

            await ctx.sendGroupAiRecord(e.group_id, characterId, content);

        }
        
        
      });
    }
  }); 

const roleList = {
    "小新": "lucy-voice-laibixiaoxin",
    "猴哥": "lucy-voice-houge",
    "四郎": "lucy-voice-silang",
    "东北老妹儿": "lucy-voice-guangdong-f1",
    "广西大表哥": "lucy-voice-guangxi-m1",
    "妲己": "lucy-voice-daji",
    "霸道总裁": "lucy-voice-lizeyan",
    "酥心御姐": "lucy-voice-suxinjiejie",
    "说书先生": "lucy-voice-m8",
    "憨憨小弟": "lucy-voice-male1",
    "憨厚老哥": "lucy-voice-male3",
    "吕布": "lucy-voice-lvbu",
    "元气少女": "lucy-voice-xueling",
    "文艺少女": "lucy-voice-f37",
    "磁性大叔": "lucy-voice-male2",
    "邻家小妹": "lucy-voice-female1",
    "低沉男声": "lucy-voice-m14",
    "傲娇少女": "lucy-voice-f38",
    "爹系男友": "lucy-voice-m101",
    "暖心姐姐": "lucy-voice-female2",
    "温柔妹妹": "lucy-voice-f36",
    "书香少女": "lucy-voice-f34"
}

// 获取所有合法的角色名
const validNames = Object.keys(roleList);

// 提取 xx
function extractName(input: string) {
    for (const name of validNames) {
        if (input.startsWith(`${name}说`)) {
            return name;
        }
    }
    return null;
}