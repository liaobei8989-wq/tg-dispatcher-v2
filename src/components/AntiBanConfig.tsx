import React from 'react';
import { AntiBanSettings } from '../types';
import {
  ShieldCheck,
  Clock,
  Shuffle,
  Zap,
  Lock,
  Globe,
  Sliders,
  Sparkles,
  Layers,
  Flame
} from 'lucide-react';

interface AntiBanConfigProps {
  antiBan: AntiBanSettings;
  setAntiBan: React.Dispatch<React.SetStateAction<AntiBanSettings>>;
}

export const AntiBanConfig: React.FC<AntiBanConfigProps> = ({ antiBan, setAntiBan }) => {
  const [savedToast, setSavedToast] = React.useState<boolean>(false);

  const handleChange = (key: keyof AntiBanSettings, value: any) => {
    setAntiBan((prev) => ({ ...prev, [key]: value }));
  };

  const handleManualSave = () => {
    try {
      localStorage.setItem('antiban_settings', JSON.stringify(antiBan));
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>MODULE 06 / DYNAMIC SAFE MODE & ANTI-BAN RISK CONTROL</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              防封號風控與代理動態校驗中臺
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              策略狀態: <strong className="text-emerald-400">🛡️ 智能擬真防封中 (Dynamic Safe Mode)</strong> |
              代理鎖定: <strong className="text-cyan-400">🇧🇷 巴西聖保羅靜態住宅 IP (號段匹配)</strong> |
              冷卻隔離: <strong className="text-amber-400">健康度 &lt; 85% 自動 2小時強制冷卻</strong>
            </p>
          </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const supremePreset: AntiBanSettings = {
                    ...antiBan,
                    minDelaySec: 15,
                    maxDelaySec: 35,
                    enableRandomRestDuration: true,
                    pauseIntervalCount: 15,
                    minPauseDurationMin: 3,
                    maxPauseDurationMin: 8,
                    enableWarmupSchedule: true,
                    scheduledStartTime: '09:30',
                    scheduledEndTime: '23:30',
                    scheduleTimezone: 'brazil',
                    dailyWarmupLimits: [10, 25, 50, 100, 200, 400],
                    autoRotateAccounts: true,
                    rotationStrategy: 'weighted_health',
                    injectInvisibleUnicode: true,
                    enableEarlyWarningFuse: true,
                    warningThresholdPercent: 85,
                    autoResumeNextDay: true,
                    enableUrlRotator: true
                  };
                  setAntiBan(supremePreset);
                  try {
                    localStorage.setItem('antiban_settings', JSON.stringify(supremePreset));
                  } catch (e) {}
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 2500);
                }}
                className="bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 hover:opacity-95 transition-all cursor-pointer active:scale-95 animate-pulse"
              >
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>👑 一键应用【最顶配商业矩阵配置】 (12大引擎全开 + 1:1巴西IP + 防红熔断)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const goldenPreset: AntiBanSettings = {
                    ...antiBan,
                    minDelaySec: 15,
                    maxDelaySec: 30,
                    enableRandomRestDuration: true,
                    pauseIntervalCount: 20,
                    minPauseDurationMin: 2,
                    maxPauseDurationMin: 6,
                    enableWarmupSchedule: true,
                    scheduledStartTime: '09:00',
                    scheduledEndTime: '22:00',
                    scheduleTimezone: 'local',
                    dailyWarmupLimits: [15, 35, 70, 150, 300, 500],
                    autoRotateAccounts: true,
                    rotationStrategy: 'round_robin',
                    injectInvisibleUnicode: true,
                    enableEarlyWarningFuse: true,
                    warningThresholdPercent: 80,
                    autoResumeNextDay: true
                  };
                  setAntiBan(goldenPreset);
                  try {
                    localStorage.setItem('antiban_settings', JSON.stringify(goldenPreset));
                  } catch (e) {}
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 2500);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 fill-slate-950 text-slate-950" />
                <span>⚡ 恢复黄金防封</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAntiBan((prev) => ({
                    ...prev,
                    minDelaySec: 45,
                    maxDelaySec: 120,
                    enableRandomRestDuration: true,
                    pauseIntervalCount: 10,
                    minPauseDurationMin: 10,
                    maxPauseDurationMin: 25,
                    enableWarmupSchedule: true,
                    scheduledStartTime: '10:00',
                    scheduledEndTime: '21:00',
                    scheduleTimezone: 'brazil',
                    dailyWarmupLimits: [0, 0, 5, 12, 18, 22, 25],
                    injectInvisibleUnicode: true,
                    enableUrlRotator: true,
                    rotationStrategy: 'weighted_health',
                  }));
                  try {
                    localStorage.setItem('antiban_settings', JSON.stringify({
                      ...antiBan,
                      minDelaySec: 45,
                      maxDelaySec: 120,
                      enableRandomRestDuration: true,
                      pauseIntervalCount: 10,
                      minPauseDurationMin: 10,
                      maxPauseDurationMin: 25,
                      enableWarmupSchedule: true,
                      scheduledStartTime: '10:00',
                      scheduledEndTime: '21:00',
                      scheduleTimezone: 'brazil',
                      dailyWarmupLimits: [0, 0, 5, 12, 18, 22, 25],
                      injectInvisibleUnicode: true,
                      enableUrlRotator: true,
                      rotationStrategy: 'weighted_health',
                    }));
                  } catch (e) {}
                  setSavedToast(true);
                  setTimeout(() => setSavedToast(false), 2500);
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-amber-500/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>🛡️ 超高规格防封 (45~120s)</span>
              </button>

              <button
                type="button"
                onClick={handleManualSave}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
              >
                {savedToast ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>✅ 已保存！</span>
                  </>
                ) : (
                  <>
                    <span>💾 保存</span>
                  </>
                )}
              </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Random Jitter & Frequency Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-200 text-sm">動態隨機延遲與頻率保護</h3>
          </div>

          {/* Random Delay Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300">每訊息動態隨機延遲範圍 (秒)</label>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {antiBan.minDelaySec} 秒 ～ {antiBan.maxDelaySec} 秒
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] text-slate-400">最小延遲 (Min): {antiBan.minDelaySec}s</span>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={antiBan.minDelaySec}
                  onChange={(e) => handleChange('minDelaySec', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer mt-1"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-400">最大延遲 (Max): {antiBan.maxDelaySec}s</span>
                <input
                  type="range"
                  min={20}
                  max={90}
                  value={antiBan.maxDelaySec}
                  onChange={(e) => handleChange('maxDelaySec', parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer mt-1"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              建議巴西市場預設設置為 15~30 秒，可模擬人類正常聊天發送頻率。
            </p>
          </div>

          {/* Micro Pause Rest Interval */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 text-xs block">
                批次高斯休眠 (Pause Rest - 擬人隨機避障)
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiBan.enableRandomRestDuration !== false}
                  onChange={(e) => handleChange('enableRandomRestDuration', e.target.checked)}
                  className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                />
                <span className="text-[11px] text-amber-300 font-bold">✓ 啟用隨機動態休眠 (破除固定時間波形)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-400">觸發休眠頻率:</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={antiBan.pauseIntervalCount}
                    onChange={(e) => handleChange('pauseIntervalCount', parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">則訊息</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">最短休眠時間 (分鐘):</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={antiBan.minPauseDurationMin || 2}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      handleChange('minPauseDurationMin', val);
                      handleChange('pauseDurationMin', val);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">分</span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">最長休眠時間 (分鐘):</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={antiBan.maxPauseDurationMin || 6}
                    onChange={(e) => handleChange('maxPauseDurationMin', parseInt(e.target.value, 10) || 6)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">分</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <span className="text-amber-400 font-bold">💡 擬人化防封核心：</span>
              <span>
                每當發送滿 <strong className="text-slate-200">{antiBan.pauseIntervalCount} 則</strong>，系統不會使用固定的 3 分鐘，而是在 <strong className="text-emerald-400">{antiBan.minPauseDurationMin || 2}~{antiBan.maxPauseDurationMin || 6} 分鐘</strong> 之間隨機生成精確至秒的休眠時間（例如：2分43秒、4分12秒、3分05秒），徹底消除機器人固定間隔特徵！
              </span>
            </div>
          </div>

          {/* Account Rotation Strategy */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <label className="font-semibold text-slate-300 text-xs block">多號 Session 輪換策略</label>
            <select
              value={antiBan.rotationStrategy}
              onChange={(e) => handleChange('rotationStrategy', e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="round_robin">🔄 輪流派發 (Round Robin) - 均勻分攤各號發送量</option>
              <option value="weighted_health">💚 依健康度加權 (Weighted Health) - 優先使用高健康分帳號</option>
              <option value="sequential">➡️ 依序用盡 (Sequential) - 依序用完單號每日容量後切換</option>
            </select>
          </div>

          {/* Daily Limit Early Warning Fuse Protection */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                账号单日预警熔断机制 (Early Warning Fuse)
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={antiBan.enableEarlyWarningFuse !== false}
                  onChange={(e) => handleChange('enableEarlyWarningFuse', e.target.checked)}
                  className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 bg-slate-950"
                />
                <span className="text-xs text-amber-300 font-bold">✓ 开启预警自动停发避险</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-400">预警触顶阀值 (%):</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={antiBan.warningThresholdPercent ?? 80}
                    onChange={(e) => handleChange('warningThresholdPercent', parseInt(e.target.value, 10))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 whitespace-nowrap">
                    {antiBan.warningThresholdPercent ?? 80}%
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400">次日 (00:00) 自动清零恢复:</span>
                <label className="flex items-center space-x-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={antiBan.autoResumeNextDay !== false}
                    onChange={(e) => handleChange('autoResumeNextDay', e.target.checked)}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 bg-slate-950"
                  />
                  <span className="text-xs text-emerald-300 font-semibold">自动重置次日额度并解锁</span>
                </label>
              </div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-200/90 leading-relaxed space-y-1">
              <div className="font-bold text-amber-300 flex items-center gap-1">
                <span>⚡ 触顶熔断防封原理：</span>
              </div>
              <p>
                例如某个账号单日上限为 <strong className="text-amber-100 font-mono">100 条</strong>，当该号群发达到 <strong className="text-amber-100 font-mono">{antiBan.warningThresholdPercent ?? 80} 条 ({antiBan.warningThresholdPercent ?? 80}% 预警线)</strong> 时，系统立即触发【单日触顶预警熔断】，今日停止向该号派发新任务，并自动无缝切号继续发送。次日 (00:00) 自动清零解锁恢复，彻底杜绝单日超额发送引发的封号！
              </p>
            </div>
          </div>
        </div>

        {/* Right Box: Content Anti-Duplication & Warmup Schedule */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-200 text-sm">內容去重與智慧養號模式</h3>
          </div>

          {/* Anti-Hash Unicode Injection Toggle */}
          <div className="flex items-start justify-between p-3.5 bg-slate-800/50 rounded-xl border border-slate-800">
            <div className="space-y-1 pr-3">
              <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> 隱形 Unicode 去重標籤 (Zero-Width Padding)
              </span>
              <p className="text-[11px] text-slate-400">
                發送時自動在末尾插入隨機零寬不連字符 (\u200B, \u200C)，使每封文案哈希 (Hash) 簽名完全唯一，避免被系統判斷為垃圾群發。
              </p>
            </div>
            <input
              type="checkbox"
              checked={antiBan.injectInvisibleUnicode}
              onChange={(e) => handleChange('injectInvisibleUnicode', e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-1"
            />
          </div>

          {/* Smart Warmup Mode & Scheduled Daily Launch Controller */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1 pr-3">
                <span className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> 新號智慧養號曲線與每日定時啟動 (Auto Warm-up & Daily Scheduled)
                </span>
                <p className="text-[11px] text-slate-400">
                  新帳號階梯式提升每日限額，並可設定每天固定時間（如 09:00 AM）自動開始群發挂机：
                </p>
              </div>
              <input
                type="checkbox"
                checked={antiBan.enableWarmupSchedule}
                onChange={(e) => handleChange('enableWarmupSchedule', e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer mt-1"
              />
            </div>

            {antiBan.enableWarmupSchedule && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80">
                {/* Time Picker & Working Hours Window */}
                <div className="space-y-3 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Start Time */}
                    <div className="space-y-1">
                      <span className="text-slate-300 font-semibold flex items-center justify-between text-[11px]">
                        <span>⏰ 每日啟動時間:</span>
                      </span>
                      <input
                        type="text"
                        placeholder="例：18:00"
                        value={antiBan.scheduledStartTime || '09:00'}
                        onChange={(e) => handleChange('scheduledStartTime', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400 text-sm"
                      />
                    </div>

                    {/* End Time / Stop Time */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300 font-semibold">🛑 每日結束時間:</span>
                        <label className="flex items-center space-x-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={antiBan.enableScheduledEndTime ?? true}
                            onChange={(e) => handleChange('enableScheduledEndTime', e.target.checked)}
                            className="w-3 h-3 accent-rose-500 rounded cursor-pointer"
                          />
                          <span className="text-[10px] text-slate-400">啟用</span>
                        </label>
                      </div>
                      {(antiBan.enableScheduledEndTime ?? true) ? (
                        <input
                          type="text"
                          placeholder="例：23:00"
                          value={antiBan.scheduledEndTime || '22:00'}
                          onChange={(e) => handleChange('scheduledEndTime', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-rose-300 font-mono font-bold focus:outline-none focus:border-rose-400 text-sm"
                        />
                      ) : (
                        <div className="text-[11px] text-slate-500 italic py-1.5">不限制 (24小時連續)</div>
                      )}
                    </div>

                    {/* Timezone Switcher */}
                    <div className="space-y-1">
                      <span className="text-slate-300 font-semibold flex items-center justify-between text-[11px]">
                        <span>🌐 時區基準:</span>
                      </span>
                      <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleChange('scheduleTimezone', 'local')}
                          className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold transition-all ${
                            (antiBan.scheduleTimezone || 'local') === 'local'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          💻 本地時間
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('scheduleTimezone', 'brazil')}
                          className={`flex-1 py-1 px-1.5 rounded text-[10px] font-semibold transition-all ${
                            antiBan.scheduleTimezone === 'brazil'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          🇧🇷 巴西 (UTC-3)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                      <span>
                        每日工作時段：每天 <strong className="text-amber-300">{antiBan.scheduledStartTime || '09:00'}</strong> 自動開始，
                        {(antiBan.enableScheduledEndTime ?? true) ? (
                          <> 到 <strong className="text-rose-300">{antiBan.scheduledEndTime || '22:00'}</strong> 自動休眠暫停 </>
                        ) : (
                          ' 全天連續執行 '
                        )}
                        ({antiBan.scheduleTimezone === 'brazil' ? '🇧🇷 巴西時間 UTC-3' : '💻 本地瀏覽器時間'})
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900 text-[10px]">
                    <span className="text-slate-400 font-mono">快捷選取時間:</span>
                    {['08:00', '09:30', '12:00', '14:30', '18:00', '20:00', '22:30', '23:59'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleChange('scheduledStartTime', t)}
                        className={`px-2 py-0.5 rounded border font-mono transition-all ${
                          antiBan.scheduledStartTime === t
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editable Daily Limits Schedule */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-300 font-semibold block">📈 每日限額階梯 (可直接修改):</span>
                  <div className="grid grid-cols-4 gap-2">
                    {(antiBan.dailyWarmupLimits || [15, 35, 70, 150]).slice(0, 4).map((limit, idx) => (
                      <div key={idx} className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Day {idx + 1}{idx === 3 ? '+' : ''}
                        </span>
                        <input
                          type="number"
                          value={limit}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 10;
                            const current = [...(antiBan.dailyWarmupLimits || [15, 35, 70, 150])];
                            current[idx] = val;
                            handleChange('dailyWarmupLimits', current);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-1 py-0.5 text-xs text-amber-300 font-mono font-bold text-center focus:outline-none focus:border-cyan-400 mt-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Promotional URL Rotator */}
          <div className="space-y-3 border-t border-slate-800/80 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> 博彩推廣網址動態輪換池 (支持泛子域名梯隊)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={antiBan.enableUrlRotator}
                  onChange={(e) => handleChange('enableUrlRotator', e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* Quick Batch Presets */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px]">
              <span className="text-slate-400 font-mono font-semibold flex items-center gap-1">⚡️ 快捷加載副域名子域名批次:</span>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    const domain = `promobr${num}.xyz`;
                    const subdomains = Array.from({ length: 10 }, (_, i) => `https://m${i + 1}.${domain}`);
                    handleChange('urls', subdomains);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950/80 border border-slate-700 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 font-mono transition-all"
                >
                  批次{num} (promobr{num} 10子域名)
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const all50 = [];
                  for (let d = 1; d <= 5; d++) {
                    for (let s = 1; s <= 10; s++) {
                      all50.push(`https://m${s}.promobr${d}.xyz`);
                    }
                  }
                  handleChange('urls', all50);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 font-mono transition-all"
              >
                🔥 全 50 子域名大矩阵
              </button>
              <button
                type="button"
                onClick={() => {
                  handleChange('urls', [
                    'https://promobr1.xyz',
                    'https://promobr2.xyz',
                    'https://promobr3.xyz',
                    'https://promobr4.xyz',
                    'https://promobr5.xyz'
                  ]);
                }}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 font-mono transition-all"
              >
                5主副域名
              </button>
            </div>

            <textarea
              rows={6}
              disabled={!antiBan.enableUrlRotator}
              value={antiBan.urls.join('\n')}
              onChange={(e) => handleChange('urls', e.target.value.split('\n'))}
              placeholder="每行輸入一個網址，例如：&#10;https://m1.promobr1.xyz&#10;https://m2.promobr1.xyz&#10;https://m3.promobr1.xyz"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 disabled:opacity-50 focus:outline-none focus:border-emerald-500"
            />
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1.5 text-[11px] text-slate-400">
              <div className="text-emerald-400 font-semibold flex items-center gap-1">
                💡 顶尖黑产/博彩引流团队「单个副域名+泛子域名批次梯队」防封核心优势：
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-400">
                <li><strong className="text-amber-300">完全可以且强烈推荐！</strong> 绝对不要一次性把 5 个副域名全露出来。采用「一个副域名创 10 个子域名先上」是极佳的战术。</li>
                <li><strong className="text-slate-200">域名资产防损：</strong> 把 <code className="text-cyan-300">promobr2~5.xyz</code> 保留在幕后作为备用弹药。当第一批 <code className="text-cyan-300 font-mono">promobr1.xyz</code> 被标记黑名单后，直接无缝一键切换第二批！</li>
                <li><strong className="text-slate-200">Cloudflare 泛子域名 302 批量重定向三步法：</strong>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 my-1 space-y-1 text-[9.5px]">
                    <p className="text-emerald-300 font-semibold">1. DNS 记录设置（泛解析）：</p>
                    <p className="text-slate-300 font-mono pl-2">· 类型: <span className="text-amber-300">CNAME</span> | 名称: <span className="text-amber-300">*</span> | 目标: <span className="text-amber-300">@</span> (代理状态: <span className="text-orange-400">已代理/橙色云朵 ☁️</span>)</p>
                    <p className="text-emerald-300 font-semibold">2. 页面规则 (Page Rules) 设置：</p>
                    <p className="text-slate-300 font-mono pl-2">· URL 匹配: <span className="text-cyan-300">*.promobr1.xyz/*</span></p>
                    <p className="text-slate-300 font-mono pl-2">· 设置: <span className="text-cyan-300">Forwarding URL</span> ➔ 状态码: <span className="text-amber-300">302 Temporary</span></p>
                    <p className="text-slate-300 font-mono pl-2">· 目标 URL: <span className="text-emerald-300">https://brazilgo888.com/pankou1</span></p>
                  </div>
                </li>
                <li><strong className="text-slate-200">流量打散与触发阈值降低：</strong> 系统在替换 <code className="text-slate-300 font-mono">&#123;URL&#125;</code> 时会自动在 10 个子域名间随机/轮换，WhatsApp 风控系统只会看到 10 个不同的链接，大幅降低针对单一字符串的拦截率！</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Brazil Funnel Strategy & Compliance Golden Rules (Step 2 & Step 3) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-3">
          <Flame className="w-5 h-5 text-amber-400" />
          <span>二、 巴西市場引流操作流程提示優化 (Step 2 & Step 3 擬真與合規黃金法則)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono">STEP 2</span>
              擬真發送特徵 (Typing Simulation & Hash Unicode)
            </div>
            <p className="text-slate-300 leading-relaxed">
              已全面啟用<strong className="text-emerald-400">「真人擬真打字狀態（Typing...）」</strong>與隨機 Unicode 變體 Hash 簽名，能完全避開 WhatsApp & Telegram 系統對機械化自動腳本行為特徵的特徵碼檢測。
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded font-mono">STEP 3</span>
              合規引流黃金法則 (二級跳轉導流模式)
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-red-400">嚴禁直接發送帶完整充值直鏈的文本</strong>；建議採用<strong className="text-amber-300">「引導回復關鍵詞 ➔ 自動化回覆卡片/TG頻道」</strong>的二級跳轉模式，高效率規避官方直鏈域名攔截。
            </p>
          </div>
        </div>
      </div>

      {/* AI Intelligent Anti-Ban Copywriting System Prompt Guide */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>三、 AI 智能防封話術編寫指南（系統提示文案）</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">1</span>
              善用 Spintax 動態標籤
            </div>
            <p className="text-slate-300 leading-relaxed">
              請使用 <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded font-mono">&#123;Olá|Oi|E aí&#125;</code> 變體語法，確保發送給不同用戶的每一條消息內容完全不重複，繞過內容特徵碼攔截。
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-extrabold text-cyan-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">2</span>
              變量化稱呼 (@Var_Name)
            </div>
            <p className="text-slate-300 leading-relaxed">
              開頭務必帶上 <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded font-mono">@Var_Name</code>（客戶暱稱變量）或姓名，提高帳號行為的“真人化”權重與互動信任度。
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
              規避敏感詞與直接開炸
            </div>
            <p className="text-slate-300 leading-relaxed">
              避免在首輪打招呼消息中直接出現大面積數字、敏感網址或誘導性直白營銷詞，建議先引導用戶進行自然互動回覆。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
