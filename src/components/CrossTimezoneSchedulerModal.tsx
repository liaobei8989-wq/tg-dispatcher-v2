import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Globe2,
  Play,
  Square,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  Flame,
  Calendar,
  Layers,
  ChevronRight,
  Send,
  Pause,
  Plus,
  Minus,
  Sliders,
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  Upload,
  FileText,
  Trash2,
  Database,
  Tag,
  Users
} from 'lucide-react';
import { ScheduledCampaignConfig, ScheduledWaveConfig, TimezoneClock } from '../types';
import {
  getCurrentClocks,
  convertBrazilToIndonesia,
  convertIndonesiaToBrazil,
  calculateNextRunInfo,
  loadScheduledCampaignConfig,
  saveScheduledCampaignConfig,
  addMinutesToTime,
  addHoursToTime,
  DEFAULT_SCHEDULED_CONFIG,
  DEFAULT_THREE_WAVES
} from '../utils/timezoneScheduler';

interface CrossTimezoneSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerNow: (config: ScheduledCampaignConfig) => void;
  isCampaignRunning: boolean;
  targetCount: number;
}

export const CrossTimezoneSchedulerModal: React.FC<CrossTimezoneSchedulerModalProps> = ({
  isOpen,
  onClose,
  onTriggerNow,
  isCampaignRunning,
  targetCount
}) => {
  // Config state
  const [config, setConfig] = useState<ScheduledCampaignConfig>(loadScheduledCampaignConfig);
  const [clocks, setClocks] = useState(getCurrentClocks());
  const [countdownInfo, setCountdownInfo] = useState(calculateNextRunInfo(config.targetTimeBrazil));
  const [saveSuccessToast, setSaveSuccessToast] = useState<string>('');
  
  // Free Customization Time Input Mode: 'brazil' | 'indonesia'
  const [inputMode, setInputMode] = useState<'brazil' | 'indonesia'>('brazil');

  // Active expanded wave ID for details
  const [expandedWaveId, setExpandedWaveId] = useState<string>('wave-2-dinner');

  // File input refs for each wave
  const waveFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Ensure waves always exist
  const waves: ScheduledWaveConfig[] = config.waves && config.waves.length === 3 
    ? config.waves 
    : DEFAULT_THREE_WAVES;

  // Ticking clocks & countdown effect (updates every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setClocks(getCurrentClocks());
      setCountdownInfo(calculateNextRunInfo(config.targetTimeBrazil));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.targetTimeBrazil]);

  // Handle uploading independent data for a wave
  const handleWaveFileUpload = (waveId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      const lines = content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0 && !l.startsWith('#'));
      
      const updatedWaves = waves.map(w => {
        if (w.id === waveId) {
          return {
            ...w,
            fileName: file.name,
            dataText: content,
            targetList: lines,
            sentOffset: 0
          };
        }
        return w;
      });

      const updatedConfig = { ...config, waves: updatedWaves };
      setConfig(updatedConfig);
      saveScheduledCampaignConfig(updatedConfig);
      setSaveSuccessToast(`✅ 已为【${updatedWaves.find(w => w.id === waveId)?.name}】成功装载数据包：${file.name}（共 ${lines.length} 条号码）！`);
      setTimeout(() => setSaveSuccessToast(''), 3500);
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Handle editing text data for a wave
  const handleWaveTextChange = (waveId: string, newText: string) => {
    const lines = newText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#'));

    const updatedWaves = waves.map(w => {
      if (w.id === waveId) {
        return {
          ...w,
          dataText: newText,
          targetList: lines
        };
      }
      return w;
    });

    const updatedConfig = { ...config, waves: updatedWaves };
    setConfig(updatedConfig);
    saveScheduledCampaignConfig(updatedConfig);
  };

  // Clear data for a wave
  const handleClearWaveData = (waveId: string) => {
    const updatedWaves = waves.map(w => {
      if (w.id === waveId) {
        return {
          ...w,
          fileName: '',
          dataText: '',
          targetList: [],
          sentOffset: 0
        };
      }
      return w;
    });

    const updatedConfig = { ...config, waves: updatedWaves };
    setConfig(updatedConfig);
    saveScheduledCampaignConfig(updatedConfig);
    setSaveSuccessToast(`🗑️ 已清空该波次的数据包！`);
    setTimeout(() => setSaveSuccessToast(''), 2500);
  };

  // Toggle wave enabled status
  const handleToggleWaveEnabled = (waveId: string) => {
    const updatedWaves = waves.map(w => {
      if (w.id === waveId) {
        return {
          ...w,
          enabled: !w.enabled
        };
      }
      return w;
    });

    const updatedConfig = { ...config, waves: updatedWaves };
    setConfig(updatedConfig);
    saveScheduledCampaignConfig(updatedConfig);
  };

  // Handle changing the assigned account group for a wave
  const handleWaveGroupChange = (waveId: string, groupTag: string) => {
    const updatedWaves = waves.map(w => {
      if (w.id === waveId) {
        return {
          ...w,
          targetGroupTag: groupTag
        };
      }
      return w;
    });

    const updatedConfig = { ...config, waves: updatedWaves };
    setConfig(updatedConfig);
    saveScheduledCampaignConfig(updatedConfig);
    setSaveSuccessToast(`🏷️ 已将该波次发信账号绑定为【${groupTag === 'ALL' ? '全部分组' : groupTag}】！`);
    setTimeout(() => setSaveSuccessToast(''), 3000);
  };

  // Quick select a wave as active trigger
  const handleSelectWaveAsMainTrigger = (wave: ScheduledWaveConfig) => {
    const idInfo = convertBrazilToIndonesia(wave.brazilTime);
    const updated: ScheduledCampaignConfig = {
      ...config,
      targetTimeBrazil: wave.brazilTime,
      targetTimeIndonesia: idInfo.timeStr,
      name: `🇧🇷 巴西 ${wave.brazilTime} 定时群发 (${wave.name})`,
      enabled: true,
      status: 'waiting'
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
    setExpandedWaveId(wave.id);
    setSaveSuccessToast(`🎯 已锁定【${wave.name}】！巴西时间 ${wave.brazilTime} (印尼 ${idInfo.timeStr}) 准点触发`);
    setTimeout(() => setSaveSuccessToast(''), 3000);
  };

  // Peak Hour Presets
  const PEAK_PRESETS = [
    {
      id: 'preset-tiger-evening',
      title: '🐯 巴西黄金晚高峰 (18:30)',
      brazilTime: '18:30',
      indonesiaTime: '04:30',
      desc: '巴西博彩玩家晚间在线峰值，印尼清晨 04:30 熟睡未起，系统全自动唤醒！',
      tag: '爆款转化推荐'
    },
    {
      id: 'preset-highroller-night',
      title: '🎰 巴西深夜冲刺期 (20:30)',
      brazilTime: '20:30',
      indonesiaTime: '06:30',
      desc: '巴西高客单价玩家下注高峰，印尼早上 06:30 醒来已自动发完！',
      tag: '客单价最高'
    },
    {
      id: 'preset-lunch-bonus',
      title: '☕ 巴西午间发薪期 (12:30)',
      brazilTime: '12:30',
      indonesiaTime: '22:30',
      desc: '巴西午休看手机高峰，印尼当天夜间 22:30 睡前自动推一波！',
      tag: '首充转化佳'
    },
    {
      id: 'preset-morning-wakeup',
      title: '🌅 巴西早间晨报期 (09:30)',
      brazilTime: '09:30',
      indonesiaTime: '19:30',
      desc: '巴西早晨上班通勤看消息，印尼晚上 19:30 发射！',
      tag: '唤醒老客'
    }
  ];

  // 24 Hour Quick Chips
  const ALL_HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

  // Handlers for free time adjustments
  const handleSetExactBrazilTime = (newBrTime: string) => {
    const idInfo = convertBrazilToIndonesia(newBrTime);
    const updated: ScheduledCampaignConfig = {
      ...config,
      targetTimeBrazil: newBrTime,
      targetTimeIndonesia: idInfo.timeStr,
      name: `🇧🇷 巴西 ${newBrTime} 定时群发 (印尼 ${idInfo.timeStr})`
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
  };

  const handleSetExactIndonesiaTime = (newIdTime: string) => {
    const brInfo = convertIndonesiaToBrazil(newIdTime);
    const updated: ScheduledCampaignConfig = {
      ...config,
      targetTimeIndonesia: newIdTime,
      targetTimeBrazil: brInfo.timeStr,
      name: `🇧🇷 巴西 ${brInfo.timeStr} 定时群发 (印尼 ${newIdTime})`
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
  };

  // Adjust Brazil hour
  const handleAdjustBrazilHour = (delta: number) => {
    const newTime = addHoursToTime(config.targetTimeBrazil, delta);
    handleSetExactBrazilTime(newTime);
  };

  // Adjust Brazil minutes
  const handleAdjustBrazilMinutes = (delta: number) => {
    const newTime = addMinutesToTime(config.targetTimeBrazil, delta);
    handleSetExactBrazilTime(newTime);
  };

  // Quick relative timer (e.g. 5 minutes from now in Brazil)
  const handleSetRelativeMinutesFromNow = (minutes: number) => {
    const brTimeNow = clocks.brazil.timeStr.slice(0, 5); // HH:mm
    const targetTime = addMinutesToTime(brTimeNow, minutes);
    handleSetExactBrazilTime(targetTime);
    setSaveSuccessToast(`⚡ 已设置为 ${minutes} 分钟后（巴西时间 ${targetTime}）准时触发！`);
    setTimeout(() => setSaveSuccessToast(''), 3000);
  };

  const handleApplyPreset = (preset: typeof PEAK_PRESETS[0]) => {
    const updated: ScheduledCampaignConfig = {
      ...config,
      targetTimeBrazil: preset.brazilTime,
      targetTimeIndonesia: preset.indonesiaTime,
      name: `🇧🇷 巴西 ${preset.brazilTime} 定时群发 (印尼 ${preset.indonesiaTime})`,
      enabled: true,
      status: 'waiting'
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
    setSaveSuccessToast(`✅ 已套用【${preset.title}】！巴西时间 ${preset.brazilTime} (印尼 ${preset.indonesiaTime}) 自动群发！`);
    setTimeout(() => setSaveSuccessToast(''), 3500);
  };

  const handleSaveAndActivate = () => {
    const updated: ScheduledCampaignConfig = {
      ...config,
      enabled: true,
      status: 'waiting',
      lastExecutedAt: undefined
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
    setSaveSuccessToast(`🎉 自由定时预约已保存并启动！系统将于每天巴西时间 ${config.targetTimeBrazil} (印尼时间 ${config.targetTimeIndonesia}) 准时发射！`);
    setTimeout(() => {
      setSaveSuccessToast('');
      onClose();
    }, 1800);
  };

  const handleTogglePause = () => {
    const newStatus = config.status === 'paused' ? 'waiting' : 'paused';
    const newEnabled = newStatus === 'waiting';
    const updated: ScheduledCampaignConfig = {
      ...config,
      status: newStatus,
      enabled: newEnabled
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
    setSaveSuccessToast(newEnabled ? '▶️ 已恢复定时群发预约！' : '⏸️ 已暂停定时群发预约！');
    setTimeout(() => setSaveSuccessToast(''), 3000);
  };

  const handleSimulateTriggerNow = () => {
    if (isCampaignRunning) {
      alert('当前已有正在运行的群发任务，请等待当前任务结束或手动停止！');
      return;
    }
    setSaveSuccessToast('🚀 正在模拟到点唤醒并启动群发引擎...');
    setTimeout(() => {
      onTriggerNow(config);
      onClose();
    }, 500);
  };

  if (!isOpen) return null;

  // Extract hours and minutes for digital display
  const brParts = config.targetTimeBrazil.split(':');
  const brHour = brParts[0] || '18';
  const brMin = brParts[1] || '30';

  const idParts = config.targetTimeIndonesia.split(':');
  const idHour = idParts[0] || '04';
  const idMin = idParts[1] || '30';

  // Calculate total targets across 3 waves
  const totalWaveTargets = waves.reduce((sum, w) => sum + (w.targetList?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-950/95 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-emerald-500 to-teal-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-100 text-base sm:text-lg flex items-center gap-1.5">
                  <span>⏰ 3波黄金时段独立排期与数据上传中心</span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                    印尼 (UTC+7) ➔ 巴西 (UTC-3)
                  </span>
                </h3>
              </div>
              <p className="text-slate-400 text-xs">
                支持 3 个黄金时间段独立上传各自名单数据包，上班一次性排期完毕即可关机托管！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 flex-1">

          {/* Toast Alert */}
          {saveSuccessToast && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in slide-in-from-top duration-300 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{saveSuccessToast}</span>
            </div>
          )}

          {/* 1. Synchronized Dual Clocks Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Brazil Clock */}
            <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3 relative">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-0.5">
                <span className="flex items-center gap-1">🇧🇷 巴西圣保罗 (BRT)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">客户市场</span>
              </div>
              <div className="font-mono text-2xl font-black text-emerald-300 tracking-wide my-0.5">
                {clocks.brazil.timeStr}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{clocks.brazil.dateStr}</span>
                <span className={clocks.brazil.isNight ? 'text-amber-400' : 'text-emerald-400'}>
                  {clocks.brazil.isNight ? '🌙 宵禁期' : '🟢 活跃期'}
                </span>
              </div>
            </div>

            {/* Indonesia Clock */}
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-3 relative">
              <div className="flex items-center justify-between text-xs font-bold text-amber-400 mb-0.5">
                <span className="flex items-center gap-1">🇮🇩 印尼雅加达 (WIB)</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-mono">您当前时区</span>
              </div>
              <div className="font-mono text-2xl font-black text-amber-300 tracking-wide my-0.5">
                {clocks.indonesia.timeStr}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{clocks.indonesia.dateStr}</span>
                <span className="text-amber-300 font-mono">比巴西快 +10 小时</span>
              </div>
            </div>

            {/* Beijing Clock */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">🇨🇳 中国北京 (CST)</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded font-mono">国内时间</span>
              </div>
              <div className="font-mono text-xl font-black text-slate-200 tracking-wide my-0.5">
                {clocks.china.timeStr}
              </div>
              <div className="text-[10px] text-slate-500">
                巴西 18:30 = 印尼次日 04:30
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 核心模块：3 个黄金时间段独立上传数据与排期卡片 (满足用户核心诉求)        */}
          {/* ========================================================================= */}
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/60 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <h4 className="font-black text-slate-100 text-sm sm:text-base">
                    3个黄金时段独立排期与独立数据包上传
                  </h4>
                  <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                    每波数据独立互不混淆
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  每个波次均配备独立上传通道、名单解析与断点记忆。上班时把 3 个波次文件传好，全天候全自动发完！
                </p>
              </div>

              <div className="text-xs font-mono text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shrink-0">
                <Database className="w-4 h-4 text-teal-400" />
                <span>3波已装载总数据: <strong className="text-emerald-400 text-sm">{totalWaveTargets}</strong> 条</span>
              </div>
            </div>

            {/* 3 Wave Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {waves.map((wave, idx) => {
                const isSelectedForMain = config.targetTimeBrazil === wave.brazilTime;
                const hasData = (wave.targetList?.length || 0) > 0;
                const waveNumberName = idx === 0 ? '第一波：午间摸鱼' : (idx === 1 ? '第二波：晚饭下班 (爆款)' : '第三波：夜间高峰');
                const waveTheme = idx === 0 
                  ? { border: 'border-teal-500/50', badge: 'bg-teal-500/20 text-teal-300', btn: 'from-teal-600 to-emerald-500' }
                  : (idx === 1 
                      ? { border: 'border-amber-500/60 ring-2 ring-amber-500/30', badge: 'bg-amber-500/20 text-amber-300', btn: 'from-amber-500 to-orange-500' }
                      : { border: 'border-purple-500/50', badge: 'bg-purple-500/20 text-purple-300', btn: 'from-purple-600 to-pink-500' });

                return (
                  <div
                    key={wave.id}
                    className={`bg-slate-900 rounded-2xl p-4 border transition-all flex flex-col justify-between space-y-3 relative ${
                      isSelectedForMain ? `${waveTheme.border} shadow-xl shadow-emerald-500/10` : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border font-mono ${waveTheme.badge}`}>
                          {waveNumberName}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400 flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={wave.enabled}
                              onChange={() => handleToggleWaveEnabled(wave.id)}
                              className="accent-emerald-500 w-3.5 h-3.5 rounded"
                            />
                            <span>启用</span>
                          </label>
                        </div>
                      </div>

                      {/* Time Details */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">🇧🇷 巴西时间:</span>
                          <strong className="text-emerald-400 font-black text-sm">{wave.brazilTime}</strong>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">🇮🇩 对应印尼:</span>
                          <strong className="text-amber-400">{wave.indonesiaTime} ({idx === 0 ? '今晚' : '次日'})</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                          建议发送量: <span className="text-slate-300 font-semibold">{wave.targetCountSuggestion}</span>
                        </div>
                      </div>

                      {/* 🏷️ 核心新增：此波次指定发件账号分组 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-cyan-500/40 space-y-1.5 shadow-inner">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-cyan-300 font-bold flex items-center gap-1">
                            <Tag className="w-3.5 h-3.5 text-cyan-400" /> 指定执行分组:
                          </span>
                          <span className="text-[10px] text-cyan-400 font-mono font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {wave.targetGroupTag === 'ALL' || !wave.targetGroupTag ? '⚡ 混合轮发' : wave.targetGroupTag}
                          </span>
                        </div>
                        <select
                          value={wave.targetGroupTag || 'ALL'}
                          onChange={(e) => handleWaveGroupChange(wave.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-cyan-200 font-bold text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400 cursor-pointer"
                          title="选择该波次专门使用哪个账号分组去执行任务"
                        >
                          <option value="ALL">⚡ 全部分组 (全部可用矩阵号混合轮发)</option>
                          <option value="主力爆破A组">🚀 主力爆破A组 (成熟高权重爆款号)</option>
                          <option value="新买养号B组">🛡️ 新买养号B组 (轻量小批提权号)</option>
                          <option value="备用储备C组">📦 备用储备C组 (轮换替补发信号)</option>
                          <option value="测试组">⚙️ 测试组 (专项测试号)</option>
                        </select>
                      </div>
                    </div>

                    {/* Data Status & Upload Area */}
                    <div className="space-y-2">
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-[11px] flex items-center gap-1 font-bold">
                            <FileText className="w-3 h-3 text-cyan-400" />
                            {hasData ? '已装载数据包:' : '尚未装载数据包:'}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                            hasData ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {hasData ? `✅ ${wave.targetList.length} 条已载入` : '待上传'}
                          </span>
                        </div>

                        {hasData ? (
                          <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900 p-1.5 rounded border border-slate-800">
                            <span className="truncate font-mono font-medium max-w-[140px]" title={wave.fileName || '手动输入数据'}>
                              📄 {wave.fileName || `手动粘贴 (${wave.targetList.length}条)`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleClearWaveData(wave.id)}
                              className="text-rose-400 hover:text-rose-300 text-[10px] underline ml-1"
                              title="清空此波数据"
                            >
                              清空
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-500 italic">
                            点击下方按钮上传此波独立的 TXT/CSV 名单
                          </p>
                        )}
                      </div>

                      {/* Hidden File Input for this Wave */}
                      <input
                        type="file"
                        accept=".txt,.csv,.tsv"
                        ref={el => waveFileInputRefs.current[wave.id] = el}
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleWaveFileUpload(wave.id, e.target.files[0]);
                          }
                        }}
                      />

                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => waveFileInputRefs.current[wave.id]?.click()}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-black text-white bg-gradient-to-r ${waveTheme.btn} hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{hasData ? `🔄 重新上传第${idx + 1}波数据` : `📁 上传第${idx + 1}波数据`}</span>
                      </button>

                      {/* Quick Apply / Set as Primary Trigger Button */}
                      <button
                        type="button"
                        onClick={() => handleSelectWaveAsMainTrigger(wave)}
                        className={`w-full py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                          isSelectedForMain
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isSelectedForMain ? '🟢 当前主控排期中' : `🎯 设为当前发射时间 (${wave.brazilTime})`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Text Editor for Selected Wave */}
            <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-400" />
                  手动粘贴/查看各波次数据明细:
                </span>
                <div className="flex items-center gap-1.5">
                  {waves.map((w, i) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setExpandedWaveId(w.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        expandedWaveId === w.id
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      第 {i + 1} 波 ({w.targetList?.length || 0}条)
                    </button>
                  ))}
                </div>
              </div>

              {(() => {
                const currentExpandedWave = waves.find(w => w.id === expandedWaveId) || waves[0];
                return (
                  <div>
                    <textarea
                      rows={3}
                      value={currentExpandedWave.dataText}
                      onChange={(e) => handleWaveTextChange(currentExpandedWave.id, e.target.value)}
                      placeholder={`在此粘贴【${currentExpandedWave.name}】的手机号名单 (每行一个，例如：\n5511987654321\n5511987654322)`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/50"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                      <span>波次: <strong className="text-slate-300">{currentExpandedWave.name}</strong> | 巴西时间: <strong className="text-emerald-400">{currentExpandedWave.brazilTime}</strong></span>
                      <span>已加载: <strong className="text-amber-400 font-bold">{currentExpandedWave.targetList?.length || 0}</strong> 条号码</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 🌟 2. 自由自定义设置群发时间 (想几点发就几点发)                             */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Section Title & Mode Switcher */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="font-black text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <span>⚙️ 自由自定义群发时间 (任意时间自由点选/输入)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  您可以在这里自由设置 00:00 ~ 23:59 任意时分，系统自动双向换算时差！
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setInputMode('brazil')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'brazil'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇧🇷 按巴西时间设置</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('indonesia')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'indonesia'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>🇮🇩 按印尼时间设置</span>
                </button>
              </div>
            </div>

            {/* Big Interactive Dual-Time Synchronized Adjustment Box */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* PRIMARY TIME INPUT CARD */}
              <div className={`p-4 rounded-2xl border transition-all ${
                inputMode === 'brazil'
                  ? 'bg-slate-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>🇧🇷 巴西触发时间 (BRT)</span>
                    {inputMode === 'brazil' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-semibold">
                        当前主控输入
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    24小时制
                  </span>
                </div>

                {/* Digital Hour & Minute Stepper */}
                <div className="flex items-center justify-center gap-3 my-2">
                  {/* Hour Box */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleAdjustBrazilHour(1)}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="增加 1 小时"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={parseInt(brHour, 10)}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        val = Math.max(0, Math.min(23, val));
                        handleSetExactBrazilTime(`${String(val).padStart(2, '0')}:${brMin}`);
                      }}
                      className="w-16 h-14 bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 text-center font-mono text-2xl font-black text-emerald-300 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustBrazilHour(-1)}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="减少 1 小时"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1">小时 (00~23)</span>
                  </div>

                  <span className="text-3xl font-black text-emerald-400 font-mono -mt-5">:</span>

                  {/* Minute Box */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => handleAdjustBrazilMinutes(5)}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="增加 5 分钟"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={parseInt(brMin, 10)}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        val = Math.max(0, Math.min(59, val));
                        handleSetExactBrazilTime(`${brHour}:${String(val).padStart(2, '0')}`);
                      }}
                      className="w-16 h-14 bg-slate-900 border-2 border-emerald-500/50 focus:border-emerald-400 text-center font-mono text-2xl font-black text-emerald-300 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustBrazilMinutes(-5)}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="减少 5 分钟"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1">分钟 (00~59)</span>
                  </div>

                  {/* Standard Time Input Trigger */}
                  <div className="ml-2 flex flex-col justify-center gap-1.5">
                    <label className="text-[10px] text-slate-400 block font-semibold">原生选择器:</label>
                    <input
                      type="time"
                      value={config.targetTimeBrazil}
                      onChange={(e) => handleSetExactBrazilTime(e.target.value || '18:30')}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-mono font-bold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Minute & Hour Bumpers */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">快捷微调:</span>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrazilHour(-1)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 rounded-md text-[11px] font-mono transition"
                  >
                    -1 小时
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrazilHour(1)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 rounded-md text-[11px] font-mono transition"
                  >
                    +1 小时
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrazilMinutes(-10)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 rounded-md text-[11px] font-mono transition"
                  >
                    -10 分
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrazilMinutes(10)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 rounded-md text-[11px] font-mono transition"
                  >
                    +10 分
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustBrazilMinutes(30)}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-emerald-300 rounded-md text-[11px] font-mono transition"
                  >
                    +30 分
                  </button>
                </div>
              </div>

              {/* INDONESIA SYNCHRONIZED COUNTERPART CARD */}
              <div className={`p-4 rounded-2xl border transition-all ${
                inputMode === 'indonesia'
                  ? 'bg-slate-950 border-amber-500/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span>🇮🇩 印尼换算时间 (WIB)</span>
                    {inputMode === 'indonesia' && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-semibold">
                        当前主控输入
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-amber-400/90 font-mono font-bold">
                    {convertBrazilToIndonesia(config.targetTimeBrazil).isNextDay ? '🌙 印尼次日清晨' : '☀️ 印尼当天'}
                  </span>
                </div>

                {/* Digital Hour & Minute Stepper for Indonesia */}
                <div className="flex items-center justify-center gap-3 my-2">
                  {/* Hour Box */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newTime = addHoursToTime(config.targetTimeIndonesia, 1);
                        handleSetExactIndonesiaTime(newTime);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="增加 1 小时"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={parseInt(idHour, 10)}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        val = Math.max(0, Math.min(23, val));
                        handleSetExactIndonesiaTime(`${String(val).padStart(2, '0')}:${idMin}`);
                      }}
                      className="w-16 h-14 bg-slate-900 border-2 border-amber-500/50 focus:border-amber-400 text-center font-mono text-2xl font-black text-amber-300 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTime = addHoursToTime(config.targetTimeIndonesia, -1);
                        handleSetExactIndonesiaTime(newTime);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="减少 1 小时"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1">小时 (00~23)</span>
                  </div>

                  <span className="text-3xl font-black text-amber-400 font-mono -mt-5">:</span>

                  {/* Minute Box */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const newTime = addMinutesToTime(config.targetTimeIndonesia, 5);
                        handleSetExactIndonesiaTime(newTime);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="增加 5 分钟"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={parseInt(idMin, 10)}
                      onChange={(e) => {
                        let val = parseInt(e.target.value, 10);
                        if (isNaN(val)) val = 0;
                        val = Math.max(0, Math.min(59, val));
                        handleSetExactIndonesiaTime(`${idHour}:${String(val).padStart(2, '0')}`);
                      }}
                      className="w-16 h-14 bg-slate-900 border-2 border-amber-500/50 focus:border-amber-400 text-center font-mono text-2xl font-black text-amber-300 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newTime = addMinutesToTime(config.targetTimeIndonesia, -5);
                        handleSetExactIndonesiaTime(newTime);
                      }}
                      className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition cursor-pointer"
                      title="减少 5 分钟"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-slate-400 mt-1">分钟 (00~59)</span>
                  </div>

                  {/* Standard Time Input Trigger */}
                  <div className="ml-2 flex flex-col justify-center gap-1.5">
                    <label className="text-[10px] text-slate-400 block font-semibold">原生选择器:</label>
                    <input
                      type="time"
                      value={config.targetTimeIndonesia}
                      onChange={(e) => handleSetExactIndonesiaTime(e.target.value || '04:30')}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-mono font-bold cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Minute & Hour Bumpers for Indonesia */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">快捷预设:</span>
                  <button
                    type="button"
                    onClick={() => handleSetExactIndonesiaTime('04:30')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 rounded-md text-[11px] font-mono transition"
                    title="印尼清晨 04:30 = 巴西 18:30"
                  >
                    🌅 印尼 04:30 (巴西18:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExactIndonesiaTime('06:30')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 rounded-md text-[11px] font-mono transition"
                    title="印尼早上 06:30 = 巴西 20:30"
                  >
                    🎰 印尼 06:30 (巴西20:30)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetExactIndonesiaTime('22:30')}
                    className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 rounded-md text-[11px] font-mono transition"
                    title="印尼夜间 22:30 = 巴西 12:30"
                  >
                    ☕ 印尼 22:30 (巴西12:30)
                  </button>
                </div>
              </div>

            </div>

            {/* 24-HOUR QUICK HOUR SELECTOR BAR */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1">
                  <span>⚡ 24小时全天候巴西整点一键直选 (点击任意时间立即生效):</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  当前选中: 🇧🇷 {config.targetTimeBrazil}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                {ALL_HOURS.map((hourStr) => {
                  const timeValue = `${hourStr}:00`;
                  const isSelected = config.targetTimeBrazil.startsWith(hourStr);
                  const isPeak = hourStr === '18' || hourStr === '19' || hourStr === '20' || hourStr === '21';
                  const isNight = parseInt(hourStr, 10) >= 22 || parseInt(hourStr, 10) < 7;
                  
                  return (
                    <button
                      key={hourStr}
                      type="button"
                      onClick={() => handleSetExactBrazilTime(timeValue)}
                      className={`py-1 px-1 rounded text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-black ring-2 ring-emerald-300 shadow-md scale-105'
                          : isPeak
                          ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                          : isNight
                          ? 'bg-slate-900/60 hover:bg-slate-800 text-slate-500 border border-slate-800'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                      title={`巴西时间 ${timeValue} (印尼 ${convertBrazilToIndonesia(timeValue).label})`}
                    >
                      {timeValue}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Relative Timing Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> 相对现在快捷倒计时:
              </span>
              <button
                type="button"
                onClick={() => handleSetRelativeMinutesFromNow(5)}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono transition"
              >
                ⚡ 5分钟后触发
              </button>
              <button
                type="button"
                onClick={() => handleSetRelativeMinutesFromNow(10)}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono transition"
              >
                ⚡ 10分钟后触发
              </button>
              <button
                type="button"
                onClick={() => handleSetRelativeMinutesFromNow(30)}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono transition"
              >
                ⚡ 30分钟后触发
              </button>
              <button
                type="button"
                onClick={() => handleSetRelativeMinutesFromNow(60)}
                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-mono transition"
              >
                ⚡ 1小时后触发
              </button>
            </div>

          </div>

          {/* 3. Live Active Trigger Confirmation Card & Countdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {config.enabled && config.status !== 'paused' ? '🟢 定时预约守护中 (ACTIVE)' : '⏸️ 定时预约已暂停 (PAUSED)'}
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {config.recurring ? '每日循环模式' : '单次预约'}
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>下次发射:</span>
                  <span className="text-emerald-300 font-mono">🇧🇷 巴西 {countdownInfo.brazilTargetStr}</span>
                  <span className="text-slate-500">⇄</span>
                  <span className="text-amber-300 font-mono">🇮🇩 印尼 {countdownInfo.indonesiaTargetStr}</span>
                </h4>
              </div>

              {/* Countdown badge */}
              <div className="bg-slate-900 border border-emerald-500/30 rounded-xl px-4 py-2 text-right shrink-0">
                <span className="text-[10px] text-slate-400 font-mono block">⏳ 距离自动发射倒计时:</span>
                <span className="text-sm sm:text-base font-mono font-black text-emerald-400 tracking-wide">
                  {config.enabled && config.status !== 'paused' ? countdownInfo.remainingFormatted : '已暂停'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-3 mt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateTriggerNow}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>⚡ 立即模拟到点触发 (演练)</span>
                </button>

                <button
                  type="button"
                  onClick={handleTogglePause}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                >
                  {config.status === 'paused' ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                      <span>恢复预约</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-400" />
                      <span>暂停预约</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2">
                <span>待发名单: <strong className="text-slate-200 font-mono">{totalWaveTargets || targetCount} 条</strong></span>
                <span>•</span>
                <span>发件号: <strong className="text-emerald-400 font-mono">Telegram 协议轮发</strong></span>
              </div>
            </div>
          </div>

          {/* 4. Brazil Golden Peak Hour Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>🇧🇷 巴西博彩行业黄金高峰时段预设 (点击快速套用):</span>
              </h4>
              <span className="text-[10px] text-slate-500">点击任意卡片即可一键切换并自动换算</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PEAK_PRESETS.map((preset) => {
                const isSelected = config.targetTimeBrazil === preset.brazilTime;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500 text-slate-100 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-1 text-slate-100">
                        {preset.title}
                      </span>
                      <span className="text-[9px] bg-amber-500/15 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/20">
                        {preset.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-2 leading-tight">
                      {preset.desc}
                    </p>
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">🇧🇷 巴西 {preset.brazilTime}</span>
                      <span className="text-slate-500">➔</span>
                      <span className="text-amber-300 font-bold">🇮🇩 印尼 {preset.indonesiaTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Additional Safety & Policy toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Daily Recurring vs One-time */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">每日自动循环触发</span>
                <span className="text-[10px] text-slate-400">每天固定在巴西 {config.targetTimeBrazil} 自动开启群发</span>
              </div>
              <input
                type="checkbox"
                checked={config.recurring}
                onChange={(e) => {
                  const updated = { ...config, recurring: e.target.checked };
                  setConfig(updated);
                  saveScheduledCampaignConfig(updated);
                }}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Night Curfew Auto Sleep */}
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">巴西 22:00 自动宵禁休眠</span>
                <span className="text-[10px] text-slate-400">到达巴西 22:00 (印尼 08:00) 自动停止，防投诉</span>
              </div>
              <input
                type="checkbox"
                checked={config.enableAutoStop}
                onChange={(e) => {
                  const updated = { ...config, enableAutoStop: e.target.checked };
                  setConfig(updated);
                  saveScheduledCampaignConfig(updated);
                }}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            关闭返回
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateTriggerNow}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3.5 py-2 rounded-xl text-xs border border-amber-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ 立即测试演练</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndActivate}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>💾 保存并启动 3 波定时群发预约</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
