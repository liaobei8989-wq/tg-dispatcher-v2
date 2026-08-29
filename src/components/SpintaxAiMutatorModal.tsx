import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Layers,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Zap,
  Globe2,
  ChevronRight,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  parseSpintax,
  analyzeSpintax,
  injectAntiHashPadding,
  BRAZILIAN_SPINTAX_PRESETS
} from '../utils/spintax';
import { SpintaxTestResult } from '../types';

interface SpintaxAiMutatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  onApplyText?: (text: string) => void;
}

export const SpintaxAiMutatorModal: React.FC<SpintaxAiMutatorModalProps> = ({
  isOpen,
  onClose,
  initialText = '',
  onApplyText
}) => {
  const [inputText, setInputText] = useState(initialText);
  const [selectedPersona, setSelectedPersona] = useState<'slang_player' | 'vip_concierge' | 'friendly_casual' | 'clean_minimal'>('slang_player');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiVariants, setAiVariants] = useState<string[]>([]);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [injectZeroWidth, setInjectZeroWidth] = useState(true);
  const [analysis, setAnalysis] = useState<SpintaxTestResult>({
    totalCombinations: 1,
    previewSamples: [],
    depthLevel: 0,
    isValid: true,
    errors: []
  });

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  useEffect(() => {
    if (inputText) {
      const res = analyzeSpintax(inputText, 6);
      setAnalysis(res);
    } else {
      setAnalysis({
        totalCombinations: 0,
        previewSamples: [],
        depthLevel: 0,
        isValid: true,
        errors: []
      });
    }
  }, [inputText]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetSpintax: string) => {
    setInputText(presetSpintax);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateAiRewrite = async () => {
    if (!inputText.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai/rewrite-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          persona: selectedPersona,
          count: 3,
          targetDomain: 'brazilgo888.com',
          injectZeroWidth
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.variants)) {
        setAiVariants(data.variants);
        setAiModelUsed(data.modelUsed || 'gemini-3.7-flash');
      }
    } catch (e) {
      console.error('AI Rewrite Error:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyToDispatch = (text: string) => {
    if (onApplyText) {
      onApplyText(text);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-6 text-slate-100 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                多重嵌套 Spintax 变异 & Gemini 实时润色器
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                  pt-BR 巴西母语防封
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                支持深度递归嵌套语法、变体组合数精算、防哈希零宽字符注入与 Gemini 3.7 母语地道变异
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Preset Pills */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> 巴西爆款高转化 Spintax 预设模板：
          </label>
          <div className="flex flex-wrap gap-2">
            {BRAZILIAN_SPINTAX_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset.spintax)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <span>{preset.name}</span>
                <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Main Editor & Analysis Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Left Column: Textarea & Syntax Tree */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Spintax 语法编辑器：</span>
                <span className="text-slate-400 font-mono text-[11px]">
                  字符数: {inputText.length} | 嵌套深度: {analysis.depthLevel} 级
                </span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="在此输入多重嵌套 Spintax，例如：{ {Oi|Olá|E aí} {amigo|parceiro} | Fala mano }, {tudo bem?|como vai?}"
                rows={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* Error banner if invalid */}
            {!analysis.isValid && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">语法错误提示：</div>
                  {analysis.errors?.map((err, i) => (
                    <div key={i} className="text-[11px] font-mono">• {err}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Spintax Metrics */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">独立排列组合数</div>
                <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">
                  {analysis.isValid ? analysis.totalCombinations.toLocaleString() : '0'} <span className="text-[10px] text-slate-400 font-normal">种</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">嵌套语法层级</div>
                <div className="text-base font-extrabold text-teal-400 font-mono mt-0.5">
                  {analysis.depthLevel} <span className="text-[10px] text-slate-400 font-normal">层递归</span>
                </div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400">防查重安全评级</div>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">
                  {analysis.totalCombinations > 1000 ? '🟢 极高 (A+)' : analysis.totalCombinations > 50 ? '🟡 良好 (B)' : '⚪ 偏低'}
                </div>
              </div>
            </div>

            {/* Random Samples Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" /> 即时随机抽取效果预览 (Sample Previews)：
                </span>
                <button
                  onClick={() => setAnalysis(analyzeSpintax(inputText, 6))}
                  className="text-[11px] text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> 重新摇号
                </button>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {analysis.previewSamples.length > 0 ? (
                  analysis.previewSamples.map((sample, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-300 flex items-start justify-between gap-2 group hover:border-slate-700"
                    >
                      <span className="font-mono text-slate-400 text-[10px] shrink-0 mt-0.5">#{idx + 1}</span>
                      <p className="flex-1 text-[11px] leading-relaxed select-text">{sample}</p>
                      <button
                        onClick={() => handleCopy(sample, idx)}
                        className="text-slate-500 hover:text-emerald-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="复制单条变体"
                      >
                        {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 text-center py-4 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                    输入有效 Spintax 或选择预设模板后展示随机变体
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Gemini AI Portuguese Rewriting */}
          <div className="md:col-span-5 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-purple-400" /> Gemini 3.7 葡语同义深度改写
                </span>
                <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                  AI 智能
                </span>
              </div>

              {/* Persona Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-400">选择文案润色人设 (Persona)：</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'slang_player', label: '🎮 老彩民俚语', desc: '热血接地气、PIX秒到、Forrar' },
                    { id: 'vip_concierge', label: '🎩 VIP 专享顾问', desc: '高端尊贵、双倍首充、无抽水' },
                    { id: 'friendly_casual', label: '🌸 甜美日常破冰', desc: '可爱自然、群友打招呼、送福利' },
                    { id: 'clean_minimal', label: '🛡️ 极简零触风控', desc: '超短问候、100% 绕开过滤' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p.id as any)}
                      className={`p-2 rounded-lg text-left text-xs transition-all border ${
                        selectedPersona === p.id
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-sm'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold text-[11px]">{p.label}</div>
                      <div className="text-[9px] text-slate-500 truncate mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Zero-Width Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                <input
                  type="checkbox"
                  checked={injectZeroWidth}
                  onChange={(e) => setInjectZeroWidth(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="flex-1 text-[11px]">
                  注入零宽隐形字符 (<code className="text-emerald-400">\u200B</code>) 强力阻断 TG 哈希比对
                </span>
              </label>

              {/* Action Button */}
              <button
                onClick={handleGenerateAiRewrite}
                disabled={isGeneratingAi || !inputText.trim()}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Gemini 3.7 正在深度构思 3 篇母语文案...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>一键调用 Gemini 葡语实时改写</span>
                  </>
                )}
              </button>

              {/* AI Variants Stream */}
              {aiVariants.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                    <span>✨ AI 生成成果 ({aiVariants.length} 篇)：</span>
                    <span className="font-mono text-[10px] text-slate-500">{aiModelUsed}</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {aiVariants.map((variant, i) => (
                      <div
                        key={i}
                        className="bg-slate-900 border border-purple-500/30 rounded-lg p-2.5 text-xs text-slate-200 space-y-1.5 shadow-sm"
                      >
                        <p className="text-[11px] leading-relaxed select-text">{variant}</p>
                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-800/60">
                          <button
                            onClick={() => handleCopy(variant, 100 + i)}
                            className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                          >
                            {copiedIndex === 100 + i ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>复制</span>
                          </button>
                          <button
                            onClick={() => handleApplyToDispatch(variant)}
                            className="text-[10px] px-2 py-1 bg-emerald-600/80 hover:bg-emerald-500 text-white font-semibold rounded flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>直接应用此文案</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>智能风控机制：单日高频发信建议 Spintax 组合数 &gt; 500 种以保持 100% 账号存活</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-semibold transition-colors"
            >
              取消
            </button>
            <button
              onClick={() => handleApplyToDispatch(inputText)}
              disabled={!inputText.trim() || !analysis.isValid}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              应用当前 Spintax 到主任务
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
