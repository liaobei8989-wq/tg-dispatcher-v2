const fs = require('fs');

let engine = fs.readFileSync('src/server/officialBotEngine.ts', 'utf8');

// 1. 添加防抖状态字段
if (!engine.includes('private lastReplyTimestampByChat')) {
  engine = engine.replace(
    'private lastStartTimestamps: Map<string, number> = new Map();',
    `private lastStartTimestamps: Map<string, number> = new Map();\n  private lastReplyTimestampByChat: Map<string, { key: string; time: number }> = new Map();`
  );
}

// 2. 优化自动回复规则匹配，增加去重、防抖以及防止长文本误触
const oldRulesBlock = `    // Match auto-replies
    const lower = text.toLowerCase();
    const rulesToMatch = this.config.autoMultiLanguage
      ? [...userPreset.autoReplies, ...this.config.autoReplies]
      : this.config.autoReplies;

    for (const rule of rulesToMatch) {
      if (!rule.enabled) continue;
      const trig = rule.trigger.toLowerCase();
      let matched = false;
      if (rule.matchType === "exact" && lower === trig) matched = true;
      else if (rule.matchType === "contains" && lower.includes(trig)) matched = true;
      else if (rule.matchType === "prefix" && lower.startsWith(trig)) matched = true;

      if (matched) {
        await this.sendMessage(chatId, rule.replyText, rule.buttons);
        return;
      }
    }`;

const newRulesBlock = `    // Match auto-replies (已升级：规则去重 + 4秒防抖锁 + 避免长文本误判)
    const lower = text.toLowerCase().trim();
    // 超过 100 个字符的长文本通常是整段粘贴或长聊天，不作为关键词触发
    if (lower.length > 100) {
      return;
    }

    const seenRuleIds = new Set<string>();
    const rawRules = this.config.autoMultiLanguage
      ? [...userPreset.autoReplies, ...this.config.autoReplies]
      : this.config.autoReplies;
    const rulesToMatch = rawRules.filter(r => {
      if (!r || !r.id) return false;
      if (seenRuleIds.has(r.id)) return false;
      seenRuleIds.add(r.id);
      return true;
    });

    for (const rule of rulesToMatch) {
      if (!rule.enabled) continue;
      const trig = rule.trigger.toLowerCase().trim();
      let matched = false;
      if (rule.matchType === "exact" && lower === trig) matched = true;
      else if (rule.matchType === "contains" && lower.includes(trig)) matched = true;
      else if (rule.matchType === "prefix" && lower.startsWith(trig)) matched = true;

      if (matched) {
        // 4秒防抖锁，杜绝同一条回复被发两次
        const lastReply = this.lastReplyTimestampByChat.get(chatId);
        const now = Date.now();
        if (lastReply && lastReply.key === rule.id && now - lastReply.time < 4000) {
          console.log(\`⚠️ [Bot Debounce] Duplicate prevented for \${rule.id} to \${chatId}\`);
          return;
        }
        this.lastReplyTimestampByChat.set(chatId, { key: rule.id, time: now });

        await this.sendMessage(chatId, rule.replyText, rule.buttons);
        return;
      }
    }`;

if (engine.includes(oldRulesBlock)) {
  engine = engine.replace(oldRulesBlock, newRulesBlock);
  console.log('Replaced oldRulesBlock successfully');
} else {
  console.log('Warning: oldRulesBlock not matched directly, checking...');
}

// 3. 避免 fallback 重发导致双发
const oldSendBlock = `    if (this.config.botToken) {
      try {
        result = await this.callTelegramApi("sendMessage", payload);
      } catch (sendErr: any) {
        // Fallback without parse_mode if Markdown fails due to special characters like _
        delete payload.parse_mode;
        try {
          result = await this.callTelegramApi("sendMessage", payload);
        } catch (e2) {
          console.error(\`[OfficialBot] sendMessage failed to \${chatId}:\`, e2);
          throw e2;
        }
      }
    }`;

const newSendBlock = `    if (this.config.botToken) {
      try {
        result = await this.callTelegramApi("sendMessage", payload);
      } catch (sendErr: any) {
        const errMsg = String(sendErr?.message || sendErr || "");
        // 仅在明确是 Telegram Markdown parse 错误时降级重试，防止网络抖动导致的重复重试发送
        if (errMsg.toLowerCase().includes("parse") || errMsg.toLowerCase().includes("entities")) {
          delete payload.parse_mode;
          try {
            result = await this.callTelegramApi("sendMessage", payload);
          } catch (e2) {
            console.error(\`[OfficialBot] sendMessage fallback failed to \${chatId}:\`, e2);
            throw e2;
          }
        } else {
          console.error(\`[OfficialBot] sendMessage error to \${chatId}:\`, errMsg);
          throw sendErr;
        }
      }
    }`;

if (engine.includes(oldSendBlock)) {
  engine = engine.replace(oldSendBlock, newSendBlock);
  console.log('Replaced oldSendBlock successfully');
}

fs.writeFileSync('src/server/officialBotEngine.ts', engine);
console.log('All patches applied to officialBotEngine.ts');
