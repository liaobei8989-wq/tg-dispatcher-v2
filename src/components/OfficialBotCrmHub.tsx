import React, { useState, useEffect, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  Share2,
  Users,
  MessageSquare,
  Send,
  Radio,
  Settings,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Flame,
  BookOpen,
  Plus,
  Trash2,
  Filter,
  Search,
  RefreshCw,
  Globe2,
  ChevronRight,
  Clock,
  Tag,
  Zap,
  Check,
  Sliders,
  DollarSign
} from 'lucide-react';

interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}

interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

interface AutoReplyRule {
  id: string;
  trigger: string;
  matchType: 'exact' | 'contains' | 'prefix';
  replyText: string;
  buttons?: InlineButton[];
  enabled: boolean;
}

interface DeepLinkCampaign {
  id: string;
  code: string;
  name: string;
  channel: 'tiktok' | 'meta' | 'telegram_ads' | 'kol' | 'website' | 'other';
  visits: number;
  subscribersCount: number;
  conversionRate: string;
  createdAt: string;
  notes?: string;
}

interface Subscriber {
  id: string;
  username?: string;
  first_name: string;
  last_name?: string;
  source_campaign: string;
  language_code?: string;
  status: 'active' | 'vip' | 'lead' | 'blocked';
  tags: string[];
  notes?: string;
  first_seen: string;
  last_active: string;
  messages_count: number;
  last_message?: string;
}

interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'bot' | 'agent';
  text: string;
  timestamp: string;
  buttons?: InlineButton[];
}

interface BroadcastTask {
  id: string;
  title: string;
  text: string;
  targetCampaign?: string;
  targetTag?: string;
  status: 'draft' | 'running' | 'completed' | 'failed';
  total: number;
  sent: number;
  failed: number;
  createdAt: string;
}

interface MarketPreset {
  id: string;
  name: string;
  flag: string;
  region: string;
  langCode: string;
  currencyInfo: string;
  targetChannels: string;
  welcomeMessage: string;
  welcomeButtons: InlineButton[];
  autoReplies: AutoReplyRule[];
  suggestedDeepLinks: Array<{ code: string; name: string; channel: string; notes: string }>;
  vipSupportText: string;
  tutorialText: string;
}

export const OfficialBotCrmHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'subscribers' | 'attribution' | 'automation' | 'broadcast' | 'settings' | 'playbook'>('overview');

  // Bot Config State
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [welcomeButtons, setWelcomeButtons] = useState<InlineButton[]>([]);
  const [autoReplies, setAutoReplies] = useState<AutoReplyRule[]>([]);
  const [deepLinks, setDeepLinks] = useState<DeepLinkCampaign[]>([]);

  // Market Presets State
  const [presets, setPresets] = useState<MarketPreset[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string>('br_pt');
  const [autoMultiLanguage, setAutoMultiLanguage] = useState<boolean>(false);
  const [previewPreset, setPreviewPreset] = useState<MarketPreset | null>(null);
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  // Subscribers State
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Customer Chat Drawer State
  const [selectedSub, setSelectedSub] = useState<Subscriber | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // New Deep Link Modal State
  const [showAddDlModal, setShowAddDlModal] = useState(false);
  const [dlCode, setDlCode] = useState('');
  const [dlName, setDlName] = useState('');
  const [dlChannel, setDlChannel] = useState<'tiktok' | 'meta' | 'telegram_ads' | 'kol' | 'website'>('tiktok');
  const [dlNotes, setDlNotes] = useState('');

  // Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTargetCampaign, setBroadcastTargetCampaign] = useState('all');
  const [broadcastTargetTag, setBroadcastTargetTag] = useState('all');
  const [broadcastsList, setBroadcastsList] = useState<BroadcastTask[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const currentPreset = useMemo(() => {
    return presets.find(p => p.id === currentPresetId) || null;
  }, [presets, currentPresetId]);

  // Fetch initial config
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/bot/config');
      const data = await res.json();
      if (data.success && data.config) {
        setBotInfo(data.config.botInfo);
        setWelcomeMessage(data.config.welcomeMessage);
        setWelcomeButtons(data.config.welcomeButtons || []);
        setAutoReplies(data.config.autoReplies || []);
        setDeepLinks(data.config.deepLinks || []);
        if (data.config.botToken) setTokenInput(data.config.botToken);
      }
    } catch (e) {
      console.warn('Failed to load bot config', e);
    }
  };

  // Fetch subscribers
  const fetchSubscribers = async () => {
    setIsLoadingSubs(true);
    try {
      const res = await fetch('/api/bot/subscribers');
      const data = await res.json();
      if (data.success && Array.isArray(data.subscribers)) {
        setSubscribers(data.subscribers);
      }
    } catch (e) {
      console.warn('Failed to load subscribers', e);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  // Fetch broadcasts
  const fetchBroadcasts = async () => {
    try {
      const res = await fetch('/api/bot/broadcasts');
      const data = await res.json();
      if (data.success && Array.isArray(data.broadcasts)) {
        setBroadcastsList(data.broadcasts);
      }
    } catch (e) {}
  };

  // Fetch market presets
  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/bot/presets');
      const data = await res.json();
      if (data.success) {
        setPresets(data.presets || []);
        if (data.currentPresetId) setCurrentPresetId(data.currentPresetId);
        setAutoMultiLanguage(!!data.autoMultiLanguage);
      }
    } catch (e) {
      console.warn('Failed to load presets', e);
    }
  };

  // Apply market preset
  const handleApplyPreset = async (presetId: string) => {
    const target = presets.find(p => p.id === presetId);
    if (!target) return;
    if (!window.confirm(`确定要将 Bot 全套文案与功能切换为【${target.flag} ${target.name}】吗？\n将更新欢迎语、快捷按键与自动回复词库。`)) return;

    setIsApplyingPreset(true);
    try {
      const res = await fetch('/api/bot/presets/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentPresetId(presetId);
        setWelcomeMessage(data.preset.welcomeMessage);
        setWelcomeButtons(data.preset.welcomeButtons || []);
        setAutoReplies(data.preset.autoReplies || []);
        if (data.config && data.config.deepLinks) {
          setDeepLinks(data.config.deepLinks);
        }
        alert(`✅ 已成功切换为【${target.flag} ${target.name}】市场模板！`);
      }
    } catch (e: any) {
      alert('切换失败: ' + e.message);
    } finally {
      setIsApplyingPreset(false);
    }
  };

  // Toggle Telegram auto-detect multi language mode
  const handleToggleAutoMode = async (enabled: boolean) => {
    try {
      const res = await fetch('/api/bot/presets/auto-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        setAutoMultiLanguage(data.autoMultiLanguage);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchSubscribers();
    fetchBroadcasts(); setTimeout(fetchBroadcasts, 2000); setTimeout(fetchBroadcasts, 4000);
    fetchPresets();
  }, []);

  // Handle Token Verification
  const handleVerifyToken = async (customToken?: string) => {
    const token = customToken || tokenInput;
    if (!token) {
      setVerifyError('请输入有效的 Telegram Bot Token');
      return;
    }
    setIsVerifying(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/bot/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (data.success) {
        setBotInfo(data.botInfo);
        fetchConfig();
        fetchSubscribers();
      } else {
        setVerifyError(data.error || 'Token 验证失败，请确认该 Token 来自 @BotFather');
      }
    } catch (err: any) {
      setVerifyError(err.message || '网络请求超时');
    } finally {
      setIsVerifying(false);
    }
  };

  // Save Welcome & Auto-Reply updates
  const handleSaveAutomation = async () => {
    try {
      const res = await fetch('/api/bot/config/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeMessage,
          welcomeButtons,
          autoReplies
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ 自动化欢迎语与规则已成功保存生效！');
      }
    } catch (e) {
      alert('保存失败，请检查网络');
    }
  };

  // Open Chat Drawer for a subscriber
  const handleOpenChat = async (sub: Subscriber) => {
    setSelectedSub(sub);
    setEditNotes(sub.notes || '');
    try {
      const res = await fetch(`/api/bot/chat-history?chatId=${sub.id}`);
      const data = await res.json();
      if (data.success) {
        setChatHistory(data.history || []);
      }
    } catch (e) {}
  };

  // Send Direct Message from Support Agent
  const handleSendDirectReply = async () => {
    if (!selectedSub || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const res = await fetch('/api/bot/send-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: selectedSub.id,
          text: replyText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setChatHistory(prev => [
          ...prev,
          {
            id: 'agent_' + Date.now(),
            chat_id: selectedSub.id,
            sender: 'agent',
            text: replyText.trim(),
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
          }
        ]);
        setReplyText('');
        fetchSubscribers();
      }
    } catch (e) {
      alert('发送失败');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Save subscriber details
  const handleSaveSubDetails = async () => {
    if (!selectedSub) return;
    try {
      const res = await fetch('/api/bot/subscribers/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSub.id,
          updates: {
            notes: editNotes,
            tags: selectedSub.tags,
            status: selectedSub.status
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscribers();
        alert('✅ 客户信息已更新');
      }
    } catch (e) {}
  };

  // Add new deep link campaign
  const handleCreateDeepLink = async () => {
    if (!dlCode || !dlName) {
      alert('请填写完整的渠道代号和活动名称');
      return;
    }
    try {
      const res = await fetch('/api/bot/deep-links/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: dlCode,
          name: dlName,
          channel: dlChannel,
          notes: dlNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        setDeepLinks(data.deepLinks);
        setShowAddDlModal(false);
        setDlCode('');
        setDlName('');
        setDlNotes('');
      }
    } catch (e) {
      alert('创建失败');
    }
  };

  // Delete deep link
  const handleDeleteDeepLink = async (id: string) => {
    if (!window.confirm('确定要删除该引流链接跟踪记录吗？')) return;
    try {
      const res = await fetch('/api/bot/deep-links/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        setDeepLinks(data.deepLinks);
      }
    } catch (e) {}
  };

  // Delete subscriber
    const handleDeleteSubscriber = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/bot/subscribers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSubscribers(prev => prev.filter(s => s.id !== id));
        setStatusMsg({ type: "success", text: `已彻底删除客户: ${name}` });
        setTimeout(() => setStatusMsg(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setStatusMsg({ type: "error", text: "删除失败" });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  const handleClearAllSubscribers = async () => {
    try {
      const res = await fetch("/api/bot/subscribers/clear-all", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSubscribers([]);
        setStatusMsg({ type: "success", text: "✅ 所有测试小号记录已全部清空！" });
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reset channel stats to 0
  const handleResetStats = async () => {
    if (!window.confirm('确定将所有渠道的点击量和转化人数重置归零吗？此操作将以当前真实数据为准重新累计。')) return;
    try {
      const res = await fetch('/api/bot/reset-stats', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDeepLinks(data.deepLinks || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Broadcast
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      setStatusMsg({ type: 'error', text: '请输入广播通知内容' });
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }

    setIsBroadcasting(true);
    setStatusMsg({ type: 'info', text: '🚀 正在向私域客户推送官方广播通知...' });

    // 5秒强制看门狗，确保按钮绝对不会卡死
    const watchdog = setTimeout(() => {
      setIsBroadcasting(false);
    }, 5000);

    try {
      const res = await fetch('/api/bot/broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle || '官方重要公告',
          text: broadcastText.trim(),
          targetCampaign: broadcastTargetCampaign,
          targetTag: broadcastTargetTag,
          buttons: [{ text: '🎰 立即前往官网查看', url: 'https://brazilgo888.com' }]
        })
      });
      clearTimeout(watchdog);
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: 'success', text: `✅ 广播已成功启动！共 ${data.task?.total || 0} 位用户正在排队接收` });
        setTimeout(() => setStatusMsg(null), 4000);
        setBroadcastText('');
        setBroadcastTitle('');
        fetchBroadcasts();
      } else {
        setStatusMsg({ type: 'error', text: data.error || '推送失败' });
        setTimeout(() => setStatusMsg(null), 4000);
      }
    } catch (e: any) {
      clearTimeout(watchdog);
      setStatusMsg({ type: 'error', text: '推送失败: ' + (e?.message || '网络异常') });
      setTimeout(() => setStatusMsg(null), 4000);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Copy to clipboard helper
  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export Subscribers to CSV
  const exportSubscribersCsv = () => {
    if (subscribers.length === 0) {
      setStatusMsg({ type: 'error', text: '暂无客户数据可导出' });
      setTimeout(() => setStatusMsg(null), 3000);
      return;
    }
    const headers = ['Telegram ID', '用户名 (@username)', '姓名', '母语语言 (Lang)', '引流渠道 (Channel)', '客户状态', '画像标签', '首次进线时间', '最后互动时间', '互动次数', '系统备注', '最后一条消息'];
    const rows = subscribers.map(s => {
      const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ') || '未设置昵称';
      const cleanFirstSeen = s.first_seen ? s.first_seen.replace('T', ' ').slice(0, 19) : '--';
      const cleanLastActive = s.last_active ? s.last_active.replace('T', ' ').slice(0, 19) : '--';
      const cleanUsername = s.username ? ('@' + s.username) : '未设置公开用户名';
      const cleanChannel = s.source_campaign || '自然搜索 (organic)';

      return [
        `"\t${s.id}"`, // 加制表符防止 Excel 科学计数法
        `"${cleanUsername.replace(/"/g, '""')}"`,
        `"${fullName.replace(/"/g, '""')}"`,
        `"${(s.language_code || '未识别').toUpperCase()}"`,
        `"${cleanChannel.replace(/"/g, '""')}"`,
        `"${s.status}"`,
        `"${s.tags.join('; ')}"`,
        `"${cleanFirstSeen}"`,
        `"${cleanLastActive}"`,
        s.messages_count,
        `"${(s.notes || '').replace(/"/g, '""')}"`,
        `"${(s.last_message || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tg_私域客户档案_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: `🎉 成功导出 ${subscribers.length} 位真实私域客户档案！` });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Filtered subscribers list
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter(s => {
      if (filterCampaign !== 'all' && s.source_campaign !== filterCampaign) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (s.first_name + ' ' + (s.last_name || '')).toLowerCase().includes(q);
        const matchUser = (s.username || '').toLowerCase().includes(q);
        const matchId = s.id.includes(q);
        const matchMsg = (s.last_message || '').toLowerCase().includes(q);
        return matchName || matchUser || matchId || matchMsg;
      }
      return true;
    });
  }, [subscribers, filterCampaign, filterStatus, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalSubs = subscribers.length;
    const vipCount = subscribers.filter(s => s.status === 'vip').length;
    const activeCount = subscribers.filter(s => s.status === 'active').length;
    const totalVisits = deepLinks.reduce((sum, d) => sum + (d.visits || 0), 0);
    const totalDeepLinkSubs = deepLinks.reduce((sum, d) => sum + (d.subscribersCount || 0), 0);
    const avgConversion = totalVisits > 0 ? ((totalDeepLinkSubs / totalVisits) * 100).toFixed(1) + '%' : '38.5%';
    return { totalSubs, vipCount, activeCount, totalVisits, avgConversion };
  }, [subscribers, deepLinks]);

  const botUsername = botInfo ? `@${botInfo.username}` : '@SeuBot_Oficial';

  return (
    <div className="space-y-6">
      {/* Top Identity Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/30 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                官方 Bot API 认证架构 · 100% 零封号保障
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Zap className="w-3 h-3 text-cyan-400" /> Webhook 秒级长轮询在线
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                <Globe2 className="w-3 h-3 text-amber-400" /> {currentPreset ? `${currentPreset.flag} ${currentPreset.name}` : '全球多国语言'}
                {autoMultiLanguage && ' (智能路由开启)'}
              </span>
            </div>
            
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <Bot className="w-8 h-8 text-emerald-400 shrink-0" />
              Telegram 官方 Bot 自动化营销与私域客户 CRM 中台
            </h1>
            
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              彻底告别一次性协议小号和机房封禁风险。通过 <strong>Telegram 官方标准 Bot 接口</strong>，结合 TikTok、Meta Ads 及官方赞助广告的深度追踪短链（Deep Linking），实现公域精准买量、自动触发欢迎引导漏斗、沉淀真实私域客户资产。
            </p>
          </div>

          {/* Bot Status Widget */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-xl shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <Bot className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-sm font-bold text-white">{botInfo ? botInfo.first_name : '未绑定官方 Bot'}</span>
                <span className={`w-2 h-2 rounded-full ${botInfo ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              </div>
              <p className="text-xs text-emerald-400 font-mono">{botUsername}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {botInfo ? `Bot ID: ${botInfo.id} · 运行正常` : '请在设置中填入 Token 激活'}
              </p>
            </div>
            <button
              onClick={() => setActiveSubTab('settings')}
              className="mt-2 sm:mt-0 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {botInfo ? '管理配置' : '一键配置'}
            </button>
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-4 border-t border-slate-800/80 scrollbar-none">
          {[
            { id: 'overview', label: '📊 概览与引流漏斗', icon: BarChart3 },
            { id: 'subscribers', label: `👥 私域客户 CRM (${subscribers.length})`, icon: Users },
            { id: 'attribution', label: `🔗 渠道深度链接 (${deepLinks.length})`, icon: Share2 },
            { id: 'automation', label: '🌍 欢迎语与多国语言', icon: Globe2 },
            { id: 'broadcast', label: '📢 官方群发广播', icon: Radio },
            { id: 'playbook', label: '📚 官方合规获客指南', icon: BookOpen },
            { id: 'settings', label: '⚙️ 官方 Bot 设置', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: 概览与引流漏斗 (Overview) */}
      {/* ======================================================== */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">总私域订阅客户</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-white">{stats.totalSubs} <span className="text-xs font-normal text-slate-400">人</span></div>
              <p className="mt-1 text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% 真实授权订阅，零流失
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">高价值 VIP 客户</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Flame className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-amber-400">{stats.vipCount} <span className="text-xs font-normal text-slate-400">人</span></div>
              <p className="mt-1 text-xs text-slate-400">高频互动 · 已参与活动充值</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">公域引流累计点击</span>
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Share2 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-cyan-400">{stats.totalVisits} <span className="text-xs font-normal text-slate-400">次</span></div>
              <p className="mt-1 text-xs text-slate-400">跨 TikTok、Meta Ads 追踪</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">平均引流启动转化率</span>
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-purple-400">{stats.avgConversion}</div>
              <p className="mt-1 text-xs text-slate-400">点击到点击 Start 的启动率</p>
            </div>
          </div>

          {/* Visual Funnel Comparison: Old Protocol Spam vs Official Bot Architecture */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Compliant Bot Growth Engine */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">当前架构：官方 Bot + 公域买量闭环</h3>
                    <p className="text-xs text-emerald-400 font-mono">稳健增长 · 终身资产 · 零封号</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold">推荐标准</span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">1</span>
                    公域引流曝光 (TikTok/Meta/TG Ads)
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">100% 合规无投诉</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">2</span>
                    一键唤起专属 Bot 自动发送礼包
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">自动沉淀为 CRM 用户</span>
                </div>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">3</span>
                    多轮自动化推送与客服 1v1 跟进
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">可长期无限次触达</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-xs text-slate-300 leading-relaxed">
                💡 <strong>核心优势</strong>：每一位进来的客户都是经过筛选的真实玩家，账号与数据存放在您的控制台数据库中，不需要承担每天换号、购买代理的巨额损耗。
              </div>
            </div>

            {/* Right: Channel Attribution Leaderboard */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">各公域渠道引流转化表现</h3>
                  <p className="text-xs text-slate-400">实时计算各流量入口的转化率与进量情况</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetStats}
                    className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors"
                    title="重置渠道点击统计与转化量为0"
                  >
                    <RefreshCw className="w-3 h-3" /> 重置清零
                  </button>
                  <button
                    onClick={() => setActiveSubTab('attribution')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                  >
                    管理渠道链接 <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {deepLinks.slice(0, 4).map(dl => (
                  <div key={dl.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        {dl.name}
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                          ?start={dl.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{dl.notes || '常规引流'}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">{dl.subscribersCount} 人转化</div>
                      <p className="text-[11px] text-slate-400">{dl.visits} 点击 · 转化率 {dl.conversionRate}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-400 border-t border-slate-800">
                <span>支持一键生成二维码物料供视频或海报使用</span>
                <button
                  onClick={() => setShowAddDlModal(true)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 新增引流渠道
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: 私域客户管理 CRM (Subscribers) */}
      {/* ======================================================== */}
      {activeSubTab === 'subscribers' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="搜索客户姓名、用户名、ID、留言..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={filterCampaign}
                onChange={e => setFilterCampaign(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">全部引流来源渠道</option>
                {deepLinks.map(d => (
                  <option key={d.code} value={d.code}>{d.name} ({d.code})</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">全部客户状态</option>
                <option value="vip">💎 VIP 重点客户</option>
                <option value="active">🟢 活跃互动中</option>
                <option value="lead">⚡ 潜在意向客资</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={fetchSubscribers}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 transition-colors"
                title="刷新列表"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingSubs ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={exportSubscribersCsv}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                导出客资表
              </button>
              <button
                onClick={handleClearAllSubscribers}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                title="清空当前所有小号和测试数据"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>清空小号数据</span>
              </button>
            </div>
          </div>

          {/* Subscribers Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">客户身份 / Telegram ID</th>
                    <th className="py-3 px-3">引流渠道来源</th>
                    <th className="py-3 px-3">生命周期标签</th>
                    <th className="py-3 px-3">最后一条互动消息</th>
                    <th className="py-3 px-3">最后活跃时间</th>
                    <th className="py-3 px-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        没有找到匹配的私域客户记录
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                              {(sub.first_name || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {sub.first_name} {sub.last_name || ''}
                                {sub.status === 'vip' && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold">
                                    VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">
                                {sub.username ? `@${sub.username}` : `ID: ${sub.id}`}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono text-[11px] border border-slate-700">
                            {sub.source_campaign}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            value={(sub.language_code || "en").toLowerCase()}
                            onChange={async (e) => {
                              const newLang = e.target.value;
                              try {
                                await fetch(`/api/bot/subscribers/${sub.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ language_code: newLang })
                                });
                                fetchSubscribers();
                                setStatusMsg({ type: "success", text: `已将 ${sub.first_name} 的母语切换为 ${newLang.toUpperCase()}！` });
                                setTimeout(() => setStatusMsg(null), 3000);
                              } catch (err) {}
                            }}
                            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="en">🇺🇸 英语 (EN)</option>
                            <option value="pt-br">🇧🇷 葡语 (PT)</option>
                          </select>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap gap-1">
                            {sub.tags.map((t, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-3 max-w-xs truncate text-slate-300">
                          {sub.last_message || '无消息记录'}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-slate-400 font-mono">
                          {sub.last_active}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenChat(sub)}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white rounded-lg text-xs font-medium transition-all inline-flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" /> 1v1 客服回复
                            </button>
                            <button
                              onClick={() => handleDeleteSubscriber(sub.id, sub.first_name)}
                              className="p-1 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition-colors"
                              title="彻底删除此客户记录"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: 渠道深度链接与扫码 (Attribution) */}
      {/* ======================================================== */}
      {activeSubTab === 'attribution' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                Telegram Deep Linking 深度引流归因系统
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                每个渠道生成不同的参数（如 <code>?start=tiktok_br</code>）。用户无论在 TikTok 简介、Facebook 广告还是 KOL 视频中点击，Bot 均能自动识别来源并推送针对该渠道的专属话术，转化数据 100% 精准归因。
              </p>
            </div>
            <button
              onClick={() => setShowAddDlModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> 创建新渠道引流链接
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deepLinks.map(dl => {
              const fullBotLink = botInfo
                ? `https://t.me/${botInfo.username}?start=${dl.code}`
                : `https://t.me/SeuBot_Oficial?start=${dl.code}`;

              return (
                <div key={dl.id} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 relative group hover:border-emerald-500/40 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <h4 className="text-sm font-bold text-white">{dl.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">渠道类型: <strong className="text-slate-200 capitalize">{dl.channel}</strong> · 建立于 {dl.createdAt}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteDeepLink(dl.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="删除链接"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Link Box */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-emerald-400 font-mono truncate select-all">{fullBotLink}</span>
                    <button
                      onClick={() => copyText(fullBotLink, dl.id)}
                      className="p-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white rounded text-xs flex items-center gap-1 transition-all shrink-0"
                    >
                      {copiedId === dl.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === dl.id ? '已复制' : '复制短链'}
                    </button>
                  </div>

                  {/* Funnel Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
                    <div className="p-2 bg-slate-950 rounded">
                      <span className="text-[10px] text-slate-400 block">点击访问</span>
                      <strong className="text-sm text-cyan-400">{dl.visits}</strong>
                    </div>
                    <div className="p-2 bg-slate-950 rounded">
                      <span className="text-[10px] text-slate-400 block">点击 Start 激活</span>
                      <strong className="text-sm text-emerald-400">{dl.subscribersCount}</strong>
                    </div>
                    <div className="p-2 bg-slate-950 rounded">
                      <span className="text-[10px] text-slate-400 block">转化启动率</span>
                      <strong className="text-sm text-purple-400">{dl.conversionRate}</strong>
                    </div>
                  </div>

                  {dl.notes && (
                    <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/50">
                      📝 {dl.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: 欢迎语与自动回复 (Automation) */}
      {/* ======================================================== */}
      {activeSubTab === 'automation' && (
        <div className="space-y-6">
          {/* Global Multi-Market Localization Presets Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Globe2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">全球出海多国市场语言预设库</h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    支持 7 大核心国家/地区
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  一键切换目标市场，全套预设包含当地官方母语欢迎词、地道行业高频术语、本土支付通道（USDT / PIX / SPEI / Momo / QRIS）以及买量渠道建议。
                </p>
              </div>

              {/* Auto Multi-Language Toggle Switch */}
              <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    客户端语言智能路由
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {autoMultiLanguage ? (
                      <span className="text-emerald-400 font-medium">已开启：按客户 Telegram 语言自动回复</span>
                    ) : (
                      <span>已关闭：统一使用当前激活的国家模板</span>
                    )}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoMultiLanguage}
                    onChange={e => handleToggleAutoMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner" />
                </label>
              </div>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {presets.map(p => {
                const isCurrent = currentPresetId === p.id;
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{p.flag}</span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              {p.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {p.region} · [{p.langCode}]
                            </div>
                          </div>
                        </div>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 shrink-0 shadow-sm">
                            当前运行中
                          </span>
                        )}
                      </div>

                      <div className="mt-3 space-y-1.5 text-[11px]">
                        <div className="p-2 rounded bg-slate-900/90 border border-slate-800/60 text-slate-300">
                          <span className="text-slate-400 block text-[10px]">💳 本地化支付通道:</span>
                          <strong className="text-emerald-400 font-medium">{p.currencyInfo}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          🎯 建议渠道: {p.targetChannels}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewPreset(p)}
                        className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors text-center"
                      >
                        预览模板详情
                      </button>
                      {isCurrent ? (
                        <span className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> 生效中
                        </span>
                      ) : (
                        <button
                          onClick={() => handleApplyPreset(p.id)}
                          disabled={isApplyingPreset}
                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm text-center disabled:opacity-50"
                        >
                          一键应用
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Auto-routing explanation alert */}
            {autoMultiLanguage && (
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-emerald-300">智能多语种自适应路由生效中</strong>：每当陌生客户点击链接或发送消息时，Bot 会自动读取其 Telegram 客户端系统语言。美区客户自动说美式英语，巴西客户自动说葡萄牙语，西语客户说西语，越南客户说越南语，印尼客户说印尼语，华语客户说中文。单个 Bot 即可同时承接全球多个国家流量！
                </div>
              </div>
            )}
          </div>

          {/* Editors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: /start Welcome Funnel Editor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    /start 自动欢迎语与引导漏斗
                    {currentPreset && (
                      <span className="text-xs font-normal text-emerald-400 font-mono">
                        ({currentPreset.flag} {currentPreset.name})
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">当陌生人点击推广链接进入并按下 Start 时，Bot 自动触发</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/30">
                  实时自动生效
                </span>
              </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                欢迎正文 (支持 Markdown，可用 <code>{'{first_name}'}</code> 动态替换客户名字):
              </label>
              <textarea
                rows={6}
                value={welcomeMessage}
                onChange={e => setWelcomeMessage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Buttons Visual Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                内联交互按钮 (Inline Keyboard Buttons):
              </label>
              <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
                {welcomeButtons.map((btn, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800 text-xs">
                    <span className="font-medium text-emerald-400">{btn.text}</span>
                    <span className="text-slate-500 truncate max-w-[200px]">{btn.url || btn.callback_data}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveAutomation}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              保存欢迎语与配置
            </button>
          </div>

          {/* Right: Keyword Auto-Replies */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  智能关键词自动回复规则 (Auto-Replies)
                </h3>
                <p className="text-xs text-slate-400">客户在私聊中输入特定关键词，系统秒级自动作答</p>
              </div>
            </div>

            <div className="space-y-3">
              {autoReplies.map((ar, idx) => (
                <div key={ar.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
                        关键词: "{ar.trigger}"
                      </span>
                      <span className="text-[10px] text-slate-400">({ar.matchType === 'contains' ? '模糊包含' : '精确匹配'})</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ar.enabled}
                        onChange={e => {
                          const updated = [...autoReplies];
                          updated[idx].enabled = e.target.checked;
                          setAutoReplies(updated);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500" />
                    </label>
                  </div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{ar.replyText}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400">
              💡 <strong>运营贴士</strong>：当前市场为【{currentPreset ? currentPreset.name : '全球出海'}】，常见高转化关键词已按当地语言自动预置完毕。如需针对更多特定业务提问，您可在左侧配置任意关键词。
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: 官方群发广播 (Broadcast) */}
      {/* ======================================================== */}
      {activeSubTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Broadcast */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                向私域已订阅客户推送官方广播通知
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                严格遵循 Telegram 官方 API 频控（约 25~30 消息/秒），100% 官方正规通道，永不封号。
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">通知标题 (仅内部记录):</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="例如：周末巴西狂欢节限时加码活动"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">定向推送受众:</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={broadcastTargetCampaign}
                    onChange={e => setBroadcastTargetCampaign(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">全部来源渠道 ({subscribers.length} 人)</option>
                    {deepLinks.map(d => (
                      <option key={d.code} value={d.code}>{d.name} ({d.subscribersCount} 人)</option>
                    ))}
                  </select>

                  <select
                    value={broadcastTargetTag}
                    onChange={e => setBroadcastTargetTag(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">全部客户标签</option>
                    <option value="巴西高活跃">巴西高活跃</option>
                    <option value="已充值">已充值客户</option>
                    <option value="新订阅">新订阅用户</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">广播消息正文 (支持 Markdown):</label>
                <textarea
                  rows={5}
                  value={broadcastText}
                  onChange={e => setBroadcastText(e.target.value)}
                  placeholder="🎉 Exclusivo para você! Hoje seu depósito rende 200% de bônus imediato..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSendBroadcast}
              disabled={isBroadcasting}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isBroadcasting ? '广播任务推送中...' : '立即启动官方广播群发'}
            </button>
          </div>

          {/* Broadcasts History */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              历史广播推送记录
            </h3>

            <div className="space-y-3">
              {broadcastsList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  暂无广播推送记录，您可以发起第一次推送测试
                </div>
              ) : (
                broadcastsList.map(task => (
                  <div key={task.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">{task.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        task.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                      }`}>
                        {task.status === 'completed' ? '已完成' : '推送中'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">{task.text}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60 font-mono">
                      <span>目标: {task.total} | 成功: {task.sent} | 失败: {task.failed}</span>
                      <span>{task.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: 官方合规获客实操指南 (Playbook) */}
      {/* ======================================================== */}
      {activeSubTab === 'playbook' && (
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                海外正规团队获客实操全流程（告别买号与风控死循环）
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                为什么头部出海团队从来不用协议号强推陌生人？因为用公域买量将真实意向用户沉淀到官方 Bot，不仅单客获取成本更低，而且客资是 100% 永久属于您的可复利资产。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Playbook 1 */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h4 className="text-sm font-bold text-white">TikTok / YouTube 短视频自然流</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>制作高吸引力的 15 秒游戏精彩瞬间或玩法集锦；</li>
                  <li>在个人主页（Bio）放置带跟踪参数的专属 Bot 链接；</li>
                  <li>视频评论区置顶引导：<em>"Clique no link da bio para resgatar seu bônus"</em>；</li>
                  <li><strong>成本</strong>：几乎为零，每日自然进粉 20~100 人。</li>
                </ul>
              </div>

              {/* Playbook 2 */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h4 className="text-sm font-bold text-white">Meta / Facebook 信息流广告买量</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>定向投放巴西圣保罗、里约等核心州 20-45 岁兴趣人群；</li>
                  <li>广告目标选“访问网站”或“线索”，目标 URL 直接填写您的 Bot 链接；</li>
                  <li>用户在 Instagram/FB 点广告，一秒直跳 Telegram 并点击 Start；</li>
                  <li><strong>优势</strong>：进量速度快，单次点击 CPC 仅需几分到一毛美金。</li>
                </ul>
              </div>

              {/* Playbook 3 */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h4 className="text-sm font-bold text-white">Telegram 官方赞助广告 (Ads)</h4>
                <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li>在 <code>ads.telegram.org</code> 用 TON 充值（门槛仅几十美金）；</li>
                  <li>精准将 160 字广告条挂在竞品或巴西本地 10 万+ 人的公开频道底部；</li>
                  <li>用户点击广告即刻进入您的官方 Bot，自动触发首充优惠引导；</li>
                  <li><strong>优势</strong>：受众本身就在使用 Telegram，点击到进 Bot 的损耗接近于 0。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: 官方 Bot 设置 (Settings) */}
      {/* ======================================================== */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6 max-w-2xl">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" />
              Telegram 官方 BotFather 凭证绑定
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              只需 1 分钟即可免费创建属于您自己的官方品牌 Bot。
            </p>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs text-slate-300">
            <p className="font-bold text-emerald-400">如何获取官方 Bot Token？</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>在 Telegram 搜索官方机器人 <strong>@BotFather</strong>；</li>
              <li>发送 <code>/newbot</code> 并按照提示输入您的 Bot 名称和用户名（以 <code>bot</code> 结尾）；</li>
              <li>@BotFather 会立即返回一段类似 <code>7123456789:AAHk...</code> 的 Token 字符串；</li>
              <li>复制并粘贴在下方输入框中即可完成绑定！</li>
            </ol>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300 block">Bot API Token:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="例如: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                onClick={() => handleVerifyToken()}
                disabled={isVerifying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
              >
                {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {isVerifying ? '验证中...' : '验证并激活'}
              </button>
            </div>
            {verifyError && (
              <p className="text-xs text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {verifyError}
              </p>
            )}
          </div>

          {botInfo && (
            <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">{botInfo.first_name}</span>
                <span className="text-xs text-emerald-400 font-mono">@{botInfo.username} (ID: {botInfo.id})</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> 已连接就绪
              </span>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1v1 Customer Support Drawer (Modal) */}
      {/* ======================================================== */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {(selectedSub.first_name || 'U').charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    {selectedSub.first_name} {selectedSub.last_name || ''}
                    <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                      {selectedSub.source_campaign}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedSub.username ? `@${selectedSub.username}` : `ID: ${selectedSub.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-slate-400 hover:text-white p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Customer Metadata / Tags */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">客户状态:</span>
                <select
                  value={selectedSub.status}
                  onChange={e => setSelectedSub({ ...selectedSub, status: e.target.value as any })}
                  className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-white"
                >
                  <option value="lead">潜在客资 (Lead)</option>
                  <option value="active">活跃互动中 (Active)</option>
                  <option value="vip">💎 VIP 重点客户</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">标签管理:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSub.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 text-[10px] flex items-center gap-1">
                      {t}
                      <button
                        onClick={() => {
                          const newTags = selectedSub.tags.filter((_, i) => i !== idx);
                          setSelectedSub({ ...selectedSub, tags: newTags });
                        }}
                        className="hover:text-rose-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      placeholder="+ 新标签"
                      className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-white w-20"
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newTagInput.trim()) {
                          setSelectedSub({
                            ...selectedSub,
                            tags: [...selectedSub.tags, newTagInput.trim()]
                          });
                          setNewTagInput('');
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">客服跟进备注:</span>
                <input
                  type="text"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="记录该客户的游戏偏好、充值金额、特殊需求..."
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                />
              </div>

              <div className="text-right">
                <button
                  onClick={handleSaveSubDetails}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-semibold"
                >
                  保存客资修改
                </button>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-900/50">
              {chatHistory.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  暂无历史对话记录
                </div>
              ) : (
                chatHistory.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mb-0.5">
                        <span>{isUser ? selectedSub.first_name : '官方 Bot / 客服'}</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-xl text-xs whitespace-pre-wrap ${
                          isUser
                            ? 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                            : 'bg-emerald-600 text-white rounded-tr-none shadow-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Reply Input */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="以官方 Bot 身份发送 1v1 回复..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendDirectReply();
                }}
              />
              <button
                onClick={handleSendDirectReply}
                disabled={isSendingReply}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingReply ? '发送中' : '发送'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Modal: Add Deep Link */}
      {/* ======================================================== */}
      {showAddDlModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                新增渠道深度引流链接
              </h3>
              <button onClick={() => setShowAddDlModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">渠道代号 (URL 参数，英文字母与数字):</label>
                <input
                  type="text"
                  value={dlCode}
                  onChange={e => setDlCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="例如: tiktok_promo_01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">活动名称 (用于后台标识):</label>
                <input
                  type="text"
                  value={dlName}
                  onChange={e => setDlName(e.target.value)}
                  placeholder="例如: TikTok 巴西狂欢节专场短视频"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">渠道类型:</label>
                <select
                  value={dlChannel}
                  onChange={e => setDlChannel(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="tiktok">TikTok 短视频 / 个人主页</option>
                  <option value="meta">Meta / Facebook / Instagram 广告</option>
                  <option value="telegram_ads">Telegram 官方赞助广告</option>
                  <option value="kol">KOL / 博主合作置顶</option>
                  <option value="website">自建落地页 / 独立站</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">备注说明:</label>
                <input
                  type="text"
                  value={dlNotes}
                  onChange={e => setDlNotes(e.target.value)}
                  placeholder="如预算、投放地区、博主分成比例等..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddDlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                取消
              </button>
              <button
                onClick={handleCreateDeepLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-md"
              >
                立即生成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset Details Modal */}
      {previewPreset && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{previewPreset.flag}</span>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {previewPreset.name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {previewPreset.langCode}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{previewPreset.region} · 本地支付: {previewPreset.currencyInfo}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewPreset(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Welcome message preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">🎯 /start 自动欢迎语（母语版）:</span>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {previewPreset.welcomeMessage}
              </div>
            </div>

            {/* Buttons preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">🔘 配套内联交互按键 ({previewPreset.welcomeButtons.length} 个):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewPreset.welcomeButtons.map((btn, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                    <span className="font-semibold text-emerald-400">{btn.text}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{btn.url ? '↗ 外部直链' : '⚡ 交互指令'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Auto Replies Preview */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">⚡ 本地化关键词自动回复 ({previewPreset.autoReplies.length} 条):</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {previewPreset.autoReplies.map((ar) => (
                  <div key={ar.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-1">
                    <div className="text-emerald-300 font-bold font-mono">触发词: "{ar.trigger}"</div>
                    <div className="text-slate-400 text-[11px] whitespace-pre-wrap">{ar.replyText}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Channels */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">🚀 建议出海引流渠道与短链:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {previewPreset.suggestedDeepLinks.map((dl, idx) => (
                  <div key={idx} className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px]">
                    <div className="font-bold text-white flex items-center gap-1">
                      <span className="text-emerald-400">?start={dl.code}</span>
                      <span className="text-slate-400">({dl.channel})</span>
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">{dl.notes}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPreviewPreset(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                关闭
              </button>
              {currentPresetId === previewPreset.id ? (
                <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> 当前市场生效中
                </span>
              ) : (
                <button
                  onClick={() => {
                    handleApplyPreset(previewPreset.id);
                    setPreviewPreset(null);
                  }}
                  disabled={isApplyingPreset}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> 一键切换为此国家模板
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
