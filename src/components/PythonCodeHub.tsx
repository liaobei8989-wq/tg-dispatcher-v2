import React, { useState } from 'react';
import { PYTHON_SCRIPTS } from '../data/pythonScripts';
import {
  FileCode2,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  ShieldCheck,
  Zap,
  Globe,
  Play
} from 'lucide-react';

export const PythonCodeHub: React.FC = () => {
  const [selectedFilename, setSelectedFilename] = useState<string>('tg_telethon_direct_sender.py');
  const [copied, setCopied] = useState<boolean>(false);
  const [simulatedOutput, setSimulatedOutput] = useState<string | null>(null);
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);

  const currentScript =
    PYTHON_SCRIPTS.find((s) => s.filename === selectedFilename) || PYTHON_SCRIPTS[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([currentScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentScript.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRunPythonSimulation = () => {
    setIsRunningSim(true);
    setSimulatedOutput('Initializing Python runtime...\nLoading config.json and targets.csv...\nStarting SessionPoolManager...');

    setTimeout(() => {
      setSimulatedOutput((prev) =>
        `${prev}\n[+] Loaded 10 target numbers for Brazil campaign.\n[⚡] Active Session: SP-Matrix-01 (+55 11 98765-1001) via Proxy br-sp-proxy1.nodes.io:8080`
      );
    }, 800);

    setTimeout(() => {
      setSimulatedOutput((prev) =>
        `${prev}\n[1/10] Dispatching -> +55 11 98765-1001\n    Rendered Spintax: "Olá! Ganhe 200% de bônus no Fortune Tiger na brazilgo888.com"\n    [⏳] Anti-Ban Jitter: Waiting 18.4 seconds...\n[2/10] Dispatching -> +55 21 98877-3003\n    Rendered Spintax: "E aí, tudo bem? Saque no PIX instantâneo na brazilgo888.com"\n    [⏳] Anti-Ban Jitter: Waiting 22.1 seconds...\n[✅] Python Execution Successful! Logs exported to failed_retry.csv.`
      );
      setIsRunningSim(false);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">
              Python 后端自动化脚本库 (Python Backend Logic Hub)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            完整提供可在 Linux VPS / Docker / 本地服务器直接运行的 Python 自动化脚本（Telethon Telegram 矩阵群发 + 自动双端清洗）。
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunPythonSimulation}
            disabled={isRunningSim}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-4 h-4 fill-slate-950 ${isRunningSim ? 'animate-spin' : ''}`} />
            {isRunningSim ? 'Python 运行中...' : '实时模拟 Python 脚本'}
          </button>

          <button
            onClick={handleDownloadScript}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-4 h-4" /> 下载单文件 ({currentScript.filename})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Navigator Sidebar */}
        <div className="space-y-2">
          <h3 className="font-bold text-slate-300 text-xs uppercase tracking-wider px-1">
            脚本模块文件列表 (Files)
          </h3>

          <div className="space-y-1.5">
            {PYTHON_SCRIPTS.map((s) => {
              const isSelected = s.filename === selectedFilename;
              return (
                <button
                  key={s.filename}
                  onClick={() => setSelectedFilename(s.filename)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="truncate">{s.filename}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{s.language}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2 text-xs text-slate-400 mt-4">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 text-[11px]">
              <Server className="w-3.5 h-3.5 text-emerald-400" /> Windows PowerShell 运行命令:
            </span>
            <pre className="bg-slate-950 p-2.5 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
{`# ⚠️ 在 PowerShell 中必须加上 python 关键字 (直接敲 .\\xxx.py 只会用 VS Code 打开文件):
python wa_mobile_channel_runner.py

# 如果提示 python 无法识别，尝试使用 py 启动器:
py wa_mobile_channel_runner.py`}
            </pre>
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs text-slate-300">
            <div className="font-bold text-emerald-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" /> 已绑定的 5 组巴西静态独享代理 IP:
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-mono">
                SOCKS5 / HTTP 专线
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 pt-1">
              {[
                { label: 'TG 账号 1', ip: '200.160.36.222:12323:14aade52b86e6:70dd653fc2' },
                { label: 'TG 账号 2', ip: '200.239.237.124:12323:14aade52b86e6:70dd653fc2' },
                { label: 'TG 账号 3', ip: '200.160.43.132:12323:14aade52b86e6:70dd653fc2' },
                { label: 'TG 账号 4', ip: '200.160.38.29:12323:14aade52b86e6:70dd653fc2' },
                { label: 'WS 账号 1 & 2', ip: '200.239.213.26:12323:14aade52b86e6:70dd653fc2' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/80 p-1.5 px-2.5 rounded border border-slate-800/80 text-[11px]">
                  <span className="text-slate-300 font-medium">{item.label}</span>
                  <code className="text-emerald-400 font-mono text-[10px]">{item.ip}</code>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 text-xs text-slate-300">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" /> IP 一致性与终端/后台配对解疑:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300">
              <li>
                <strong className="text-amber-200">解决异地登录问题：</strong> 
                之前终端走印尼本地直连，而后台在云端选了巴西代理，导致 Telegram/Meta 判定为异地异 IP 登录。现在通过上面 5 组固定 IP 绑定后，终端与后台访问的物理出口 IP 将 100% 完全相同！
              </li>
              <li>
                <strong className="text-amber-200">如何在终端(PowerShell)挂载代理？</strong>
                在执行 Python 之前，可以在 PowerShell 执行：<code className="block mt-1 p-1 bg-slate-950 text-emerald-400 font-mono text-[10px] rounded">$env:HTTP_PROXY="http://14aade52b86e6:70dd653fc2@200.160.36.222:12323"; $env:HTTPS_PROXY="http://14aade52b86e6:70dd653fc2@200.160.36.222:12323"</code>
              </li>
            </ol>
          </div>
        </div>

        {/* Code View Area */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-100 text-xs">{currentScript.title}</span>
                <p className="text-[11px] text-slate-400 mt-0.5">{currentScript.description}</p>
              </div>

              <button
                onClick={handleCopyCode}
                className="bg-slate-900 hover:bg-slate-950 text-slate-200 border border-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> 已复制 Python 代码
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> 复制 Python 代码
                  </>
                )}
              </button>
            </div>

            {/* Code Content Box */}
            <pre className="p-5 bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed border-t border-slate-800/60 max-h-[500px]">
              <code>{currentScript.code}</code>
            </pre>
          </div>

          {/* Simulated Terminal Output Box */}
          {simulatedOutput && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 animate-fadeIn font-mono">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2 text-slate-400">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Terminal className="w-4 h-4" /> Python CLI 终端执行模拟器输出 (Output)
                </span>
                <button
                  onClick={() => setSimulatedOutput(null)}
                  className="hover:text-slate-200 text-[10px] cursor-pointer"
                >
                  清除
                </button>
              </div>
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                {simulatedOutput}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
