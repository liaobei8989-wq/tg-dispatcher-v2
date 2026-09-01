import React, { useState, useEffect } from 'react';
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
  Settings2,
  Sliders,
  Plus,
  Minus
} from 'lucide-react';
import { ScheduledCampaignConfig, TimezoneClock } from '../types';
import {
  getCurrentClocks,
  calculateNextRunInfo,
  findNextUpcomingWave,
  loadScheduledCampaignConfig,
  saveScheduledCampaignConfig,
  convertBrazilToIndonesia,
  addHoursToTime,
  addMinutesToTime
} from '../utils/timezoneScheduler';
import { CrossTimezoneSchedulerModal } from './CrossTimezoneSchedulerModal';

interface CrossTimezoneSchedulerWidgetProps {
  onTriggerNow: (config?: ScheduledCampaignConfig, wave?: any) => void;
  isCampaignRunning: boolean;
  targetCount: number;
}

export const CrossTimezoneSchedulerWidget: React.FC<CrossTimezoneSchedulerWidgetProps> = ({
  onTriggerNow,
  isCampaignRunning,
  targetCount
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [config, setConfig] = useState<ScheduledCampaignConfig>(loadScheduledCampaignConfig);
  const [clocks, setClocks] = useState(getCurrentClocks());
  const initialWaveInfo = findNextUpcomingWave(config.waves);
  const [nextWaveObj, setNextWaveObj] = useState<any>(initialWaveInfo.nextWave);
  const [countdown, setCountdown] = useState(initialWaveInfo.countdown);

  // Ticking effect every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      const currentClocks = getCurrentClocks();
      setClocks(currentClocks);
      
      const waveInfo = findNextUpcomingWave(config.waves);
      setNextWaveObj(waveInfo.nextWave);
      setCountdown(waveInfo.countdown);

      // Check if any wave is due right now and campaign is not already running
      if (
        config.enabled &&
        config.status === 'waiting' &&
        !isCampaignRunning &&
        waveInfo.dueWave
      ) {
        const dueWave = waveInfo.dueWave;
        console.log(`[Timezone Scheduler] ⏰ 波次定时时间已到达: ${dueWave.name} (${dueWave.brazilTime})! 正在自动发射...`);
        
        // Update wave execution timestamp
        const updatedWaves = (config.waves || []).map(w => {
          if (w.id === dueWave.id) {
            return {
              ...w,
              lastExecutedAt: new Date().toISOString(),
              status: config.recurring ? ('waiting' as const) : ('completed' as const)
            };
          }
          return w;
        });

        const updated: ScheduledCampaignConfig = {
          ...config,
          lastExecutedAt: new Date().toISOString(),
          waves: updatedWaves,
          status: config.recurring ? 'waiting' : 'completed'
        };
        setConfig(updated);
        saveScheduledCampaignConfig(updated);
        onTriggerNow(updated, dueWave);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [config, isCampaignRunning, onTriggerNow]);

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = config.status === 'paused' ? 'waiting' : 'paused';
    const newEnabled = newStatus === 'waiting';
    const updated: ScheduledCampaignConfig = {
      ...config,
      status: newStatus,
      enabled: newEnabled
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
  };

  const handleSimulate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetWave = nextWaveObj || config.waves?.[0];
    onTriggerNow(config, targetWave);
  };

  // Quick inline time change directly from widget
  const handleQuickTimeChange = (newBrTime: string) => {
    const idInfo = convertBrazilToIndonesia(newBrTime);
    const updated: ScheduledCampaignConfig = {
      ...config,
      targetTimeBrazil: newBrTime,
      targetTimeIndonesia: idInfo.timeStr,
      enabled: true,
      status: 'waiting'
    };
    setConfig(updated);
    saveScheduledCampaignConfig(updated);
  };

  const handleQuickHourDelta = (delta: number) => {
    const newTime = addHoursToTime(config.targetTimeBrazil, delta);
    handleQuickTimeChange(newTime);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 shadow-xl transition-all space-y-3">
        
        {/* Main Row */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Left: Dual Timezone Real-Time Clocks */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-base">🇧🇷</span>
              <div>
                <div className="text-[10px] text-slate-400 font-mono">巴西圣保罗 (BRT)</div>
                <div className="text-sm font-mono font-black text-emerald-400">{clocks.brazil.timeStr}</div>
              </div>
            </div>

            <div className="text-slate-600 font-mono hidden sm:block">⇄</div>

            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-base">🇮🇩</span>
              <div>
                <div className="text-[10px] text-slate-400 font-mono">印尼雅加达 (WIB)</div>
                <div className="text-sm font-mono font-black text-amber-400">{clocks.indonesia.timeStr}</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 hidden xl:flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>时差 <strong>+10 小时</strong></span>
            </div>
          </div>

          {/* Center: Active Schedule & Countdown */}
          <div className="flex-1 min-w-[280px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>下一个就绪波次:</span>
                <span className="text-emerald-400 font-mono font-black">
                  {config.enabled && config.status !== 'paused'
                    ? `【${nextWaveObj?.name || '定时波次'}】🇧🇷 巴西 ${nextWaveObj?.brazilTime || config.targetTimeBrazil} ➔ 🇮🇩 印尼 ${convertBrazilToIndonesia(nextWaveObj?.brazilTime || config.targetTimeBrazil).label}`
                    : '已暂停'}
                </span>
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-400">距离发射倒计时:</span>
              <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {config.enabled && config.status !== 'paused' ? countdown.remainingFormatted : '已暂停'}
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline">
                ({config.recurring ? '3波循环' : '单次预约'} | 待发: {(nextWaveObj?.targetList?.length || 0)}条)
              </span>
            </div>
          </div>

          {/* Right: Quick Trigger & Config Buttons */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              type="button"
              onClick={handleSimulate}
              disabled={isCampaignRunning}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3 py-1.5 rounded-xl text-xs border border-amber-500/40 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="在网页上直接模拟到点触发群发，查看完整运行效果"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ 立即模拟演练</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePause}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-xl text-xs border border-slate-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              {config.status === 'paused' ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span>恢复</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                  <span>暂停</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Sliders className="w-3.5 h-3.5 text-slate-950" />
              <span>📁 3波排期与数据上传 ({(config.waves || []).reduce((sum, w) => sum + (w.targetList?.length || 0), 0) || targetCount}条)</span>
            </button>
          </div>

        </div>

        {/* 3 Golden Waves Status Quick Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {(config.waves || []).map((w, idx) => {
            const hasData = (w.targetList?.length || 0) > 0;
            const isCurrent = config.targetTimeBrazil === w.brazilTime;
            const labelTitle = idx === 0 ? '① 午间摸鱼' : (idx === 1 ? '② 晚饭下班 (爆款)' : '③ 夜间冲刺');
            return (
              <div
                key={w.id}
                onClick={() => setIsModalOpen(true)}
                className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isCurrent 
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-slate-100 ring-1 ring-emerald-500/30' 
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="点击打开模态框独立上传/管理各波数据"
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <span className="font-bold text-xs">{labelTitle}</span>
                  <span className="font-mono text-[11px] text-emerald-400 font-bold">🇧🇷{w.brazilTime}</span>
                </div>
                <div className="text-[10px] font-mono flex items-center gap-1">
                  <span className={hasData ? 'text-amber-300 font-bold' : 'text-slate-500'}>
                    {hasData ? `${w.targetList.length}条已就绪` : '待传数据'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Secondary Quick Time Selector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
              <Sliders className="w-3 h-3 text-emerald-400" /> 快捷自由调时:
            </span>

            {/* Direct Quick Native Time Input */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-bold">🇧🇷 巴西</span>
              <input
                type="time"
                value={config.targetTimeBrazil}
                onChange={(e) => handleQuickTimeChange(e.target.value || '19:00')}
                className="bg-transparent text-emerald-300 font-mono font-bold text-xs focus:outline-none cursor-pointer"
                title="直接在看板上自由修改巴西发送时间"
              />
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickHourDelta(-1)}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 rounded border border-slate-800 text-[11px] font-mono transition"
                title="提前 1 小时"
              >
                -1h
              </button>
              <button
                type="button"
                onClick={() => handleQuickHourDelta(1)}
                className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 rounded border border-slate-800 text-[11px] font-mono transition"
                title="推迟 1 小时"
              >
                +1h
              </button>
            </div>

            {/* Quick Common Peaks */}
            <div className="flex items-center gap-1.5 ml-1">
              {[
                { label: '🐯 19:00 (黄金晚高峰)', time: '19:00' },
                { label: '🎰 20:30 (深夜冲刺)', time: '20:30' },
                { label: '☕ 12:30 (午间发薪)', time: '12:30' },
                { label: '🌅 09:30 (早间晨报)', time: '09:30' }
              ].map((p) => {
                const isSelected = config.targetTimeBrazil === p.time;
                return (
                  <button
                    key={p.time}
                    type="button"
                    onClick={() => handleQuickTimeChange(p.time)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/25 border border-emerald-500/60 text-emerald-300 font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            换算印尼时间: <strong className="text-amber-300">{convertBrazilToIndonesia(config.targetTimeBrazil).label}</strong>
          </div>
        </div>

      </div>

      {/* Full Settings Modal */}
      <CrossTimezoneSchedulerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setConfig(loadScheduledCampaignConfig());
        }}
        onTriggerNow={(cfg) => {
          setIsModalOpen(false);
          onTriggerNow(cfg);
        }}
        isCampaignRunning={isCampaignRunning}
        targetCount={targetCount}
      />
    </>
  );
};
