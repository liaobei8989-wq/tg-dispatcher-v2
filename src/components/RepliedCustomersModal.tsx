import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Search, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  FileSpreadsheet, 
  FileText, 
  Sparkles, 
  RefreshCw,
  Phone,
  Clock,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { RepliedCustomerRecord } from '../types';

interface RepliedCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshStats?: () => void;
}

export const RepliedCustomersModal: React.FC<RepliedCustomersModalProps> = ({
  isOpen,
  onClose,
  onRefreshStats
}) => {
  const [customers, setCustomers] = useState<RepliedCustomerRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'txt_usernames' | 'txt_ids' | 'txt_phones'>('csv');

  // Load replied customers list from server
  const fetchRepliedCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/telegram/replied-customers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.customers)) {
          setCustomers(data.customers);
        }
      }
    } catch (e) {
      console.error('Failed to fetch replied customers:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRepliedCustomers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter customers by search query
  const filtered = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.fullName.toLowerCase().includes(q) ||
      c.id.includes(q) ||
      (c.username && c.username.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q)) ||
      (c.lastReplyText && c.lastReplyText.toLowerCase().includes(q)) ||
      (c.receivedByAccount && c.receivedByAccount.includes(q))
    );
  });

  // Copy single text
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Copy all based on chosen type
  const handleCopyAll = (type: 'usernames' | 'ids' | 'phones' | 'full') => {
    let textToCopy = '';
    if (type === 'usernames') {
      textToCopy = customers.filter(c => c.username).map(c => c.username).join('\n');
    } else if (type === 'ids') {
      textToCopy = customers.map(c => c.id).join('\n');
    } else if (type === 'phones') {
      textToCopy = customers.filter(c => c.phone).map(c => c.phone).join('\n');
    } else {
      textToCopy = customers.map(c => 
        `ID: ${c.id} | ${c.username || '无用户名'} | ${c.fullName} | ${c.phone || '无电话'} | 回复: "${c.lastReplyText}"`
      ).join('\n');
    }

    navigator.clipboard.writeText(textToCopy);
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Direct download trigger
  const handleDownload = (format: 'csv' | 'txt', type: string = 'all') => {
    const url = `/api/telegram/export-replied-customers?format=${format}&type=${type}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Clear all replied customers from database
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const handleClearAll = async () => {
    if (window.confirm('确定要清空已回复客户名单并归零计数吗？\n（清空后，下次导出的就全都是全新回复的意向客户，绝不重复！）')) {
      setIsClearing(true);
      try {
        await fetch('/api/telegram/clear-replied-customers', { method: 'POST' });
        setCustomers([]);
        onRefreshStats?.();
      } catch (e) {
        console.error('Failed to clear replied customers', e);
      } finally {
        setIsClearing(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-950 via-teal-950/40 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-100">
                  🎯 已回复高意向客户名单库 (自动补发客资)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                  共 {customers.length} 位互动客户
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono">
                  巴西活跃老哥
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                系统后台巡航已为这批客户完成第 2 阶段彩金补发。支持将客户 Telegram ID、@Username、手机号一键导出，供主号（官方大号）直接跟进私信截流！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchRepliedCustomers}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="刷新最新客户名单"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索客户姓名 / Telegram ID / @用户名 / 手机号..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/60"
            />
          </div>

          {/* Export & Copy Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download CSV */}
            <button
              onClick={() => handleDownload('csv')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
              title="导出完整 Excel 表格（包含客户ID、用户名、回复话术、时间）"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>导出 CSV (Excel表格)</span>
            </button>

            {/* Download TXT Dropdown/Direct */}
            <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5">
              <button
                onClick={() => handleDownload('txt', 'usernames')}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="导出纯 @Username 文本文件（每行一个，用于主号搜索私信）"
              >
                <FileText className="w-3.5 h-3.5 text-cyan-400" />
                <span>导出 TXT (@用户名)</span>
              </button>
              <div className="w-px h-4 bg-slate-700 mx-0.5"></div>
              <button
                onClick={() => handleDownload('txt', 'ids')}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 transition cursor-pointer"
                title="导出纯 Telegram 数字 ID 文本文件"
              >
                <span>导出 ID TXT</span>
              </button>
            </div>

            {/* Copy Dropdown */}
            <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5">
              <button
                onClick={() => handleCopyAll('usernames')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-xs font-medium text-amber-300 flex items-center gap-1 transition cursor-pointer"
                title="复制所有 @用户名 到剪贴板"
              >
                {copyFeedback === 'usernames' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyFeedback === 'usernames' ? '已复制用户名' : '复制全部 @用户名'}</span>
              </button>
              <div className="w-px h-4 bg-slate-700 mx-0.5"></div>
              <button
                onClick={() => handleCopyAll('ids')}
                className="px-2.5 py-1.5 rounded-lg hover:bg-slate-700 text-xs font-medium text-slate-300 flex items-center gap-1 transition cursor-pointer"
                title="复制所有数字 ID 到剪贴板"
              >
                {copyFeedback === 'ids' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copyFeedback === 'ids' ? '已复制 ID' : '复制全部 ID'}</span>
              </button>
            </div>

            {/* Clear List Button */}
            <button
              onClick={handleClearAll}
              disabled={isClearing || customers.length === 0}
              className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
              title="导出后点击清空，下次导出的就全都是全新的意向客户，绝不重复"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isClearing ? '正在清空...' : '清空已导名单 (归零)'}</span>
            </button>
          </div>
        </div>

        {/* Customer List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-7 h-7 mx-auto animate-spin text-teal-400" />
              <p className="text-xs">正在整理已回复客户资料库...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-slate-400 space-y-2 bg-slate-950/40 rounded-2xl border border-slate-800">
              <Users className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">暂未找到匹配的已回复客户记录</p>
              <p className="text-xs text-slate-500">
                当后台巡检守护雷达检测到客户回复时，会自动记录并展示在此处。
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item, index) => (
                <div
                  key={item.id + '_' + index}
                  className="bg-slate-950/70 hover:bg-slate-800/50 border border-slate-800/80 hover:border-slate-700 rounded-xl p-3.5 transition flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  {/* Left: Customer Info */}
                  <div className="flex items-start gap-3 min-w-[280px]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600/30 to-emerald-600/30 border border-teal-500/30 flex items-center justify-center font-bold text-teal-300 shrink-0 text-sm">
                      {item.firstName ? item.firstName.charAt(0).toUpperCase() : 'C'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{item.fullName}</span>
                        {item.username ? (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 border border-teal-500/30 font-mono font-medium">
                            {item.username}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            未设公开发信用户名
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">ID:</span>
                          <span className="text-slate-300 font-semibold">{item.id}</span>
                          <button
                            onClick={() => handleCopyText(item.id, `id_${item.id}`)}
                            className="text-slate-500 hover:text-teal-300 ml-0.5 transition cursor-pointer"
                            title="复制数字 ID"
                          >
                            {copiedId === `id_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>

                        {item.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{item.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{item.repliedAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Reply Message Snippet */}
                  <div className="flex-1 max-w-md bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-1">
                      <MessageSquare className="w-3 h-3 text-teal-400" />
                      <span>客户主动回复内容:</span>
                    </div>
                    <p className="text-xs text-amber-200 font-medium line-clamp-2">
                      “{item.lastReplyText}”
                    </p>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                      <span>接待小号: {item.receivedByAccount}</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> 已自动补发彩金
                      </span>
                    </div>
                  </div>

                  {/* Right: Direct Telegram Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyText(
                        item.username || item.id,
                        `user_${item.id}`
                      )}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      title="复制此人的联系标识 (@用户名或ID)"
                    >
                      {copiedId === `user_${item.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === `user_${item.id}` ? '已复制' : '复制标识'}</span>
                    </button>

                    <a
                      href={item.directChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-teal-900/30 transition active:scale-95 cursor-pointer"
                      title="点击直接在 Telegram 中打开与该客户的聊天窗口（使用你的大号私聊）"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>主号直达私聊</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Strategy & Operational Tips for Main Account Outreach */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>💡 主号（大号/客服VIP号）二次跟进截流秘籍：</span>
            </div>
            <p className="text-[11px] text-slate-400">
              1. <strong>主号包装</strong>：将主号设置为 <code className="text-teal-300">Gerente VIP Oficial</code>（官方VIP经理），带平台头像；
              2. <strong>破冰话术</strong>：直接说 <em>“Olá! Vi que você pediu o bônus no suporte. Sou o gerente VIP e liberei +R$30 no seu primeiro PIX...”</em>；
              3. <strong>控频安全</strong>：主号每天主动私聊建议 <strong>30~50 人</strong>，间隔 15~30 秒，切勿过快。
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleDownload('csv')}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition cursor-pointer"
            >
              📥 下载名单 (CSV)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition cursor-pointer shadow-lg shadow-teal-900/20"
            >
              完成并关闭
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
