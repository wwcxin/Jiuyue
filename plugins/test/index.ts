import { definePlugin } from '../../src/core/';
import { Structs } from '../../src/core/';

export default definePlugin({
  name: 'test',
  version: '1.0.0',
  desc: '测试插件',
  
  setup(ctx) {
    // 处理消息事件,e 会自动获得正确的类型
    ctx.handleMessage(async e => {
      // if (ctx.isRoot(e)) {
      //   console.log('这是主人的消息');
      // } else if (ctx.isAdmin(e)) {
      //   console.log('这是管理员的消息');
      // } else {
      //   console.log('这是普通用户的消息');
      // }
      // console.log(JSON.stringify(e, null, 2));
      // const text = ctx.getText(e);  // 将返回 "123456789"
      // console.log('纯文本内容:', text);
      
      // const avatarUrl = ctx.getAvatarLink(e.user_id);
      // console.log('发送者头像:', avatarUrl);
      
      // if (e.message_type === 'group') {
      //   const groupAvatar = ctx.getGroupLink(e.group_id);
      //   console.log('群头像:', groupAvatar);
      //   // try {
      //   //   await ctx.uploadFileToDir(e.group_id, '/path/to/file.jpg');
      //   //   console.log('文件上传成功');
      //   // } catch (error) {
      //   //   console.error('文件上传失败:', error);
      //   // }
      // }
      
      // const quoteMsg = await ctx.getQuoteMsg(e);
      // if (quoteMsg) {
      //   console.log('引用的消息:', ctx.getText(quoteMsg));
      // }
      
      // const imageUrl = ctx.getImageURL(e);
      // if (imageUrl) {
      //   console.log('图片链接:', imageUrl);
      // }
      
      // const quoteImageUrl = await ctx.getQuoteImageURL(e);
      // if (quoteImageUrl) {
      //   console.log('引用消息的图片链接:', quoteImageUrl);
      // }
      
      // const mentionedImageUrl = await ctx.getMentionedImageURL(e);
      // if (mentionedImageUrl) {
      //   console.log('提及的图片链接:', mentionedImageUrl);
      // }
      
      // const mentionedUserId = ctx.getMentionedUserID(e);
      // if (mentionedUserId) {
      //   console.log('被@的用户:', mentionedUserId);
      // }
      
      if (ctx.getText(e) === '测试') {
        e.quick_action([Structs.text('收到测试消息！')]);
        try {
          // 发送消息并获取消息ID
          const result = await ctx.respond(e, ['这是一条测试消息']);
          
          // 3秒后撤回
          setTimeout(async () => {
            try {
              await ctx.recallMsg(result.message_id);
            } catch (error) {
              console.error('撤回失败:', error);
            }
          }, 3000);
        } catch (error) {
          console.error('发送失败:', error);
        }
      }
      
      // 给好友点50个赞
      await ctx.sendLike(e.user_id);
      
      // 给好友点10个赞
      await ctx.sendLike(e.user_id, 10);

      if (e.message_type === 'group' && ctx.isGroupAdmin(e)) {
        // 开启全员禁言
        await ctx.muteGroup(e.group_id);
        
        // 关闭全员禁言
        await ctx.muteGroup(e.group_id, false);
        
        // 设置群名片
        await ctx.setGroupCard(e.group_id, '123456', '新的群名片');
        
        // 删除群名片
        await ctx.setGroupCard(e.group_id, '123456', '');
        
        // 修改群名
        await ctx.setGroupName(e.group_id, '新的群名称');
      }

      if (e.message_type === 'group' && ctx.isGroupOwner(e)) {
        // 设置管理员
        await ctx.setAdmin(e.group_id, '123456');
        
        // 取消管理员
        await ctx.setAdmin(e.group_id, '123456', false);
        
        // 设置群头衔
        await ctx.setTitle(e.group_id, '123456', '荣誉会员');
        
        // 删除群头衔
        await ctx.setTitle(e.group_id, '123456', '');
      }

      if (e.message_type === 'group' && ctx.isRoot(e)) {
        // 退出群组
        await ctx.quitGroup(e.group_id);
      }

      if (e.message_type === 'group') {
        // 获取群信息
        const groupInfo = await ctx.getGroupInfo(e.group_id);
        await ctx.respond(e, [
          `群号: ${groupInfo.group_id}\n` +
          `群名: ${groupInfo.group_name}\n` +
          `成员数: ${groupInfo.member_count}/${groupInfo.max_member_count}`
        ]);

        // 获取群成员信息
        const memberInfo = await ctx.getGroupMemberInfo(e.group_id, e.user_id, true);
        await ctx.respond(e, [
          `昵称: ${memberInfo.nickname}\n` +
          `群名片: ${memberInfo.card || '无'}\n` +
          `身份: ${memberInfo.role}\n` +
          `头衔: ${memberInfo.title || '无'}\n` +
          `加群时间: ${new Date(memberInfo.join_time * 1000).toLocaleString()}\n` +
          `最后发言: ${new Date(memberInfo.last_sent_time * 1000).toLocaleString()}`
        ]);
      }

      // 获取群列表
      const groups = await ctx.getGroupList();
      await ctx.respond(e, [
        '群列表:\n' + groups.map(group => 
          `${group.group_name}(${group.group_id}): ${group.member_count}/${group.max_member_count}人`
        ).join('\n')
      ]);

      if (ctx.isRoot(e)) {  // 建议只允许主人获取凭证
        // 获取登录凭证
        const credentials = await ctx.getCredentials();
        console.log('Cookies:', credentials.cookies);
        console.log('CSRF Token:', credentials.token);
      }

      // 获取版本信息
      const version = await ctx.getVersionInfo();
      await ctx.respond(e, [
        `应用名称: ${version.app_name}\n` +
        `应用版本: ${version.app_version}\n` +
        `协议版本: ${version.protocol_version}`
      ]);
    });
  }
}); 