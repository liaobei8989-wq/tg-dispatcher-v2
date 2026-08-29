import React, { useState, useEffect } from 'react';
import {
  Clock,
  Sun,
  Moon,
  Coffee,
  Zap,
  Shield,
  CheckCircle2,
  X,
  Play,
  Copy,
  Terminal,
  Calendar,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface BrazilSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateSchedule?: (config: any) => void;
}

export const BrazilSchedulerModal: React.FC<BrazilSchedulerModalProps> = ({
  isOpen,
  onClose,
  onUpdateSchedule
}) => {
  const [brTimeStr, setBrTimeStr] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState<'lunch_rush' | 'evening_peak' | 'day_normal' | 'night_sleep'>('day_normal');
  const [enableSmartSchedule, setEnableSmartSchedule] = useState(true);
  const [lunchStart, setLunchStart] = useState('11:30');
  const [lunchEnd, setLunchEnd] = useState('14:00');
  const [eveningStart, setEveningStart] = useState('19:30');
  const [eveningEnd, setEveningEnd] = useState('23:30');
  const [autoSleepNight, setAutoSleepNight] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Brazil Clock (UTC-3)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // UTC-3 Brasília
      const brTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) - (3 * 3600000));
      const hours = brTime.getHours();
      const mins = brTime.getMinutes();
      const secs = brTime.getSeconds();

      setBrTimeStr(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} (UTC-3 BRT)`
      );

      // Determine period
      const totalMins = hours * 60 + mins;
      if (totalMins >= 11 * 60 + 30 && totalMins <= 14 * 60) {
        setCurrentPeriod('lunch_rush');
      } else if (totalMins >= 19 * 60 + 30 && totalMins <= 23 * 60 + 30) {
        setCurrentPeriod('evening_peak');
      } else if (totalMins >= 0 && totalMins < 8 * 60) {
        setCurrentPeriod('night_sleep');
      } else {
        setCurrentPeriod('day_normal');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaveSuccess(true);
    if (onUpdateSchedule) {
      onUpdateSchedule({
        enableSmartSchedule,
        lunchStart,
        lunchEnd,
        eveningStart,
        eveningEnd,
        autoSleepNight
      });
    }
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const copyScriptCmd = () => {
    navigator.clipboard.writeText('python3 public/tg_smart_scheduler.py --timezone UTC-3 --lunch 11:30-14:00 --peak 19:30-23:30');
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white">
                  ⏰ 巴西本土黄金作息发信调度 (Brasília Time UTC-3 错峰调度)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                  真实玩家作息拟合
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                实时对齐巴西利亚时区 (UTC-3)，午休与夜间波峰加速发信，深夜自动静默休眠防封
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Live Brazil Clock Card */}
          <div className="p-4 bg-gradient-to-r from-slate-950 to-amber-950/40 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                {currentPeriod === 'lunch_rush' ? (
                  <Coffee className="w-6 h-6 animate-bounce" />
                ) : currentPeriod === 'evening_peak' ? (
                  <Zap className="w-6 h-6 animate-pulse" />
                ) : currentPeriod === 'night_sleep' ? (
                  <Moon className="w-6 h-6" />
                ) : (
                  <Sun className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                  <span>🇧🇷 巴西当前标准时间 (Brasília Time):</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-xl font-black font-mono text-amber-300">
                  {brTimeStr || '正在同步中...'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                currentPeriod === 'lunch_rush'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/50'
                  : currentPeriod === 'evening_peak'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/50'
                  : currentPeriod === 'night_sleep'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}>
                {currentPeriod === 'lunch_rush' && '☀️ 午休摸鱼转化波峰期 (转化率+85%)'}
                {currentPeriod === 'evening_peak' && '🔥 晚间下班休闲爆奖黄金期 (充值峰值)'}
                {currentPeriod === 'night_sleep' && '💤 巴西深夜静默休眠 (防举报封禁)'}
                {currentPeriod === 'day_normal' && '⛅ 常规平稳匀速发信期'}
              </span>
            </div>
          </div>

          {/* Golden Time Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Slot 1: Lunch */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Coffee className="w-4 h-4 text-amber-400" />
                <span>☀️ 午休摸鱼波峰期</span>
              </div>
              <div className="text-xs font-mono text-slate-300 font-bold">
                {lunchStart} ~ {lunchEnd} (BRT)
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                巴西白领与学生午休刷手机高发期，自动提速发信，点击率高达 38%
              </p>
            </div>

            {/* Slot 2: Evening Peak */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>🔥 晚间下班爆奖黄金期</span>
              </div>
              <div className="text-xs font-mono text-slate-300 font-bold">
                {eveningStart} ~ {eveningEnd} (BRT)
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                博彩与老虎机娱乐最高峰期，充值 PIX 转化率全天最高
              </p>
            </div>

            {/* Slot 3: Night Silence */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>💤 深夜静默避险休眠</span>
              </div>
              <div className="text-xs font-mono text-slate-300 font-bold">
                00:00 ~ 08:00 (BRT)
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                巴西深夜禁止盲发陌生人，自动转为小号对聊互养，100% 避免深夜被投诉封号
              </p>
            </div>
          </div>

          {/* Schedule Toggles Form */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                ⚙️ 智能错峰波峰发信策略总开关：
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSmartSchedule}
                  onChange={(e) => setEnableSmartSchedule(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSleepNight}
                  onChange={(e) => setAutoSleepNight(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="text-slate-300 text-[11px]">巴西深夜自动暂停群发并转入挂机小号互聊</span>
              </label>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400">午休时段:</span>
                <input
                  type="text"
                  value={lunchStart}
                  onChange={(e) => setLunchStart(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-slate-200"
                />
                <span className="text-slate-500">至</span>
                <input
                  type="text"
                  value={lunchEnd}
                  onChange={(e) => setLunchEnd(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* VPS Script Terminal Box */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-amber-300 font-bold flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" /> VPS 后台巴西作息守护进程启动命令：
              </span>
              <button
                onClick={copyScriptCmd}
                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-bold text-[11px] flex items-center gap-1 transition-colors border border-amber-500/30"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedCmd ? '已复制！' : '复制命令'}</span>
              </button>
            </div>
            <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300 select-all border border-slate-800">
              python3 public/tg_smart_scheduler.py --timezone UTC-3 --lunch 11:30-14:00 --peak 19:30-23:30
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>智能作息拟合中：在巴西当地最适宜时段发送，转化率提高 2.4 倍</span>
          </div>

          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>已应用调度配置！</span>
              </>
            ) : (
              <span>保存并应用调度</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
