import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  Globe2,
  RefreshCw,
  Zap,
  Tag,
  Smile,
  Check,
  Copy,
  DollarSign
} from 'lucide-react';
import { InboxConversation, InboxMessage, AccountSession } from '../types';

interface WebInboxHubProps {
  accounts: AccountSession[];
}

export const WebInboxHub: React.FC<WebInboxHubProps> = ({ accounts }) => {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [filterAccount, setFilterAccount] = useState<string>('ALL');
  const [filterTag, setFilterTag] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [isSuggestingAi, setIsSuggestingAi] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/inbox/conversations');
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch inbox conversations:', e);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const activeConversation = conversations.find(c => c.id === selectedConvId) || conversations[0];

  // Fetch AI suggestions when switching conversations
  useEffect(() => {
    if (activeConversation) {
      const lastCustMsg = [...activeConversation.messages].reverse().find(m => m.senderType === 'customer');
      if (lastCustMsg) {
        handleGetAiSuggestions(lastCustMsg.text, activeConversation.customerName);
      }
    }
  }, [selectedConvId]);

  const handleGetAiSuggestions = async (customerMessage: string, customerName: string) => {
    setIsSuggestingAi(true);
    try {
      const res = await fetch('/api/ai/suggest-inbox-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerMessage,
          customerName
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error('Failed to get AI suggestions:', e);
    } finally {
      setIsSuggestingAi(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConversation) return;
    setIsSendingReply(true);
    try {
      const res = await fetch('/api/inbox/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          text: replyText,
          senderName: '官方客服 (Suporte VIP)'
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchConversations();
      }
    } catch (e) {
      console.error('Send reply error:', e);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleApplySnippet = (text: string) => {
    setReplyText(text);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    if (filterAccount !== 'ALL' && c.assignedAccountPhone !== filterAccount) return false;
    if (filterTag !== 'ALL' && c.tag !== filterTag) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customerName.toLowerCase().includes(q) ||
        c.customerPhone.includes(q) ||
        (c.customerUsername && c.customerUsername.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getTagBadge = (tag: string) => {
    switch (tag) {
      case 'asking_bonus':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">🎁 咨询彩金</span>;
      case 'asking_pix':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">💰 PIX充值中</span>;
      case 'deposited':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">💎 已充值玩家</span>;
      case 'hot_lead':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">🔥 超高意向</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">日常交流</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              Telegram 矩阵聚合收件箱 & AI 智能客服 (Web Inbox)
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-normal">
                pt-BR 实时会话承接
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            跨所有 Telegram 协议号统一聚合管理巴西客户回复。结合两阶段破冰链路，支持人工实时回复、PIX 催付与 Gemini 3.7 一键地道葡萄牙语智能推荐。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchConversations}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>刷新会话流</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[680px]">
        {/* Left Column: Conversation List */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3.5 shadow-lg overflow-hidden">
          {/* Search & Account Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索巴西客户手机号/姓名..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500/50 shadow-inner font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="ALL">全部协议号 (All)</option>
                {accounts.map(acc => (
                  <option key={acc.phone} value={acc.phone}>
                    {acc.name} ({acc.phone.slice(-4)})
                  </option>
                ))}
              </select>

              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="ALL">全部意向状态</option>
                <option value="asking_bonus">🎁 咨询彩金</option>
                <option value="asking_pix">💰 PIX 充值中</option>
                <option value="deposited">💎 已充值</option>
                <option value="hot_lead">🔥 超高意向</option>
              </select>
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-slate-950 border-teal-500/50 shadow-md shadow-teal-500/10'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-950/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 border border-slate-700 flex items-center justify-center">
                          {conv.customerAvatar ? (
                            <img
                              src={conv.customerAvatar}
                              alt={conv.customerName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">{conv.customerName[0]}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-100 truncate">{conv.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{conv.customerPhone}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-[10px] text-slate-400 font-mono">{conv.lastMessageTime}</div>
                        {conv.unreadCount > 0 && (
                          <span className="inline-block px-1.5 py-0.2 rounded-full bg-teal-500 text-slate-950 text-[10px] font-extrabold font-mono">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 truncate">{conv.lastMessageText}</p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                      {getTagBadge(conv.tag)}
                      <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                        {conv.assignedAccountAlias}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400 text-xs">暂无匹配的客户会话</div>
            )}
          </div>
        </div>

        {/* Middle Column: Chat Window & Messenger */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col shadow-lg overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700 flex items-center justify-center">
                    {activeConversation.customerAvatar ? (
                      <img
                        src={activeConversation.customerAvatar}
                        alt={activeConversation.customerName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">{activeConversation.customerName[0]}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{activeConversation.customerName}</span>
                      {getTagBadge(activeConversation.tag)}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {activeConversation.customerPhone} ({activeConversation.customerUsername || '私信对话'})
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-mono border border-teal-500/30">
                    承接: {activeConversation.assignedAccountAlias}
                  </span>
                </div>
              </div>

              {/* Chat Bubble Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/30">
                {activeConversation.messages.map((msg) => {
                  const isCustomer = msg.senderType === 'customer';
                  const isPhase1 = msg.senderType === 'system_phase1';
                  const isPhase2 = msg.senderType === 'system_phase2';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1 font-mono">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{msg.timestamp}</span>
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                          isCustomer
                            ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-tl-sm'
                            : isPhase1
                            ? 'bg-slate-900 border border-indigo-500/30 text-indigo-200 rounded-tr-sm'
                            : isPhase2
                            ? 'bg-gradient-to-r from-amber-950/60 to-emerald-950/60 border border-amber-500/40 text-amber-200 rounded-tr-sm'
                            : 'bg-teal-600 text-white rounded-tr-sm shadow-md shadow-teal-500/10'
                        }`}
                      >
                        {isPhase1 && (
                          <div className="text-[10px] text-indigo-400 font-semibold mb-1 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> 系统阶段一：破冰问候
                          </div>
                        )}
                        {isPhase2 && (
                          <div className="text-[10px] text-amber-400 font-semibold mb-1 flex items-center gap-1">
                            <Flame className="w-3 h-3" /> 系统阶段二：福利与链接推送
                          </div>
                        )}
                        <p className="select-text">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
                <div className="flex items-center gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="输入回复内容，或点击右侧 Gemini 推荐话术一键填入..."
                    rows={2}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-teal-500/50 resize-none shadow-inner"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSendingReply || !replyText.trim()}
                    className="px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer h-full self-stretch"
                  >
                    {isSendingReply ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>发送</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              请在左侧选择需要查看的会话
            </div>
          )}
        </div>

        {/* Right Column: Gemini AI Suggestions & Quick Snippets */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-4 shadow-lg overflow-y-auto">
          {/* AI Smart Suggestions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" /> Gemini AI 智能回复推荐
              </span>
              <button
                onClick={() => {
                  if (activeConversation) {
                    const lastCustMsg = [...activeConversation.messages].reverse().find(m => m.senderType === 'customer');
                    handleGetAiSuggestions(lastCustMsg?.text || 'Como funciona?', activeConversation.customerName);
                  }
                }}
                className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSuggestingAi ? 'animate-spin' : ''}`} />
                <span>重新分析</span>
              </button>
            </div>

            <div className="space-y-2">
              {aiSuggestions.length > 0 ? (
                aiSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-purple-500/30 rounded-xl p-3 space-y-2 group hover:border-purple-500/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-300">{item.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 font-mono">
                        {item.intent}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3 select-text">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800">
                      <button
                        onClick={() => handleCopy(item.text, 200 + idx)}
                        className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                      >
                        {copiedIndex === 200 + idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>复制</span>
                      </button>
                      <button
                        onClick={() => handleApplySnippet(item.text)}
                        className="text-[10px] px-2 py-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>填入发送框</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  {isSuggestingAi ? 'Gemini 正在分析客户意图...' : '暂无推荐，点击右上角重新生成'}
                </div>
              )}
            </div>
          </div>

          {/* Quick Brazillian Gaming Snippets */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> 巴西高频转化快捷话术库
            </span>
            
            <div className="space-y-2">
              {[
                {
                  title: '💳 PIX 充值操作指引',
                  text: 'Acesse o site oficial brazilgo888.com, selecione Depósito via PIX e envie qualquer valor a partir de R$ 10. O saldo e o bônus entram na hora! 🚀'
                },
                {
                  title: '🐯 Fortune Tiger 爆分信号',
                  text: '🔥 Dica quente: O Fortune Tiger está com 98.7% de assertividade agora em brazilgo888.com! Aproveite as rodadas pagantes!'
                },
                {
                  title: '🎁 200% 首充翻倍福利',
                  text: 'Seu bônus de 200% de primeiro depósito está liberado! Acesse brazilgo888.com/vip e ative antes que expire hoje! 💰'
                }
              ].map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplySnippet(s.text)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-teal-300">{s.title}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 truncate mt-0.5">{s.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
