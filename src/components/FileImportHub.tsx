import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Zap,
  ArrowRight,
  Filter,
  Trash2,
  Download,
  Copy,
  Layers,
  Sparkles,
  PhoneCall,
  Check,
  FileCheck,
  Folder,
  ClipboardList
} from 'lucide-react';
import { ImportedBatchFile, ScrubbedContact } from '../types';

interface FileImportHubProps {
  onContactsParsed?: (contacts: ScrubbedContact[]) => void;
  onImportComplete?: (contacts: ScrubbedContact[], batchInfo: ImportedBatchFile) => void;
  onNavigateToScrubber?: () => void;
  onNavigateToCampaign?: () => void;
  resetKey?: number;
}

interface ActiveFileInfo {
  fileName: string;
  folderPath: string;
  fileSizeFormatted: string;
  totalLines: number;
  validCount: number;
  progress: number;
  status: 'parsing' | 'ready';
}

export const FileImportHub: React.FC<FileImportHubProps> = ({
  onContactsParsed,
  onImportComplete,
  onNavigateToScrubber,
  onNavigateToCampaign,
  resetKey = 0,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [activeFileInfo, setActiveFileInfo] = useState<ActiveFileInfo | null>(null);
  const [parsedContacts, setParsedContacts] = useState<ScrubbedContact[]>([]);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [batchHistory, setBatchHistory] = useState<ImportedBatchFile[]>([
    {
      id: 'batch-br-01',
      fileName: 'brazil_sp_rj_high_val_10k.csv',
      fileSizeKb: 342,
      totalLines: 10000,
      validPhoneCount: 8940,
      scrubbedWaCount: 7120,
      scrubbedTgCount: 6850,
      uploadedAt: '2026-07-29 10:30'
    },
    {
      id: 'batch-br-02',
      fileName: 'tg_ws_igaming_leads_5k.txt',
      fileSizeKb: 185,
      totalLines: 5000,
      validPhoneCount: 4620,
      scrubbedWaCount: 3910,
      scrubbedTgCount: 3840,
      uploadedAt: '2026-07-28 16:45'
    }
  ]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Clear states when platform reset is requested
  useEffect(() => {
    if (resetKey > 0) {
      setBatchHistory([]);
      setSelectedFile(null);
      setActiveFileInfo(null);
      setParsedContacts([]);
    }
  }, [resetKey]);

  // Helper to notify parents
  const notifyImportSuccess = (contacts: ScrubbedContact[], batch: ImportedBatchFile) => {
    onContactsParsed?.(contacts);
    onImportComplete?.(contacts, batch);
  };

  // Sample batch generator for rapid testing
  const handleLoadSampleBatch = (type: 'sp_1000' | 'rj_500' | 'mixed_2000' | 'br_10000') => {
    setParsing(true);
    let count = 1000;
    let fileName = 'sample_sp_1000.csv';
    let folderPath = '📁 來源資料夾: SampleData / brazil_campaign';

    if (type === 'br_10000') {
      count = 10000;
      fileName = '巴西13-10000.txt';
      folderPath = '📁 来源文件夹: C:/Marketing/TargetLists/巴西13-10000.txt';
    } else if (type === 'rj_500') {
      count = 500;
      fileName = 'sample_rj_500.txt';
      folderPath = '📁 来源文件夹: Desktop / Leads / sample_rj_500.txt';
    } else if (type === 'mixed_2000') {
      count = 2000;
      fileName = 'sample_brazil_mixed_2000.csv';
      folderPath = '📁 来源文件夹: Downloads / sample_brazil_mixed_2000.csv';
    }

    const fileSizeFormatted = `${(count * 0.024).toFixed(1)} KB`;

    setActiveFileInfo({
      fileName,
      folderPath,
      fileSizeFormatted,
      totalLines: count,
      validCount: Math.floor(count * 0.985),
      progress: 45,
      status: 'parsing'
    });

    setTimeout(() => {
      const generated: ScrubbedContact[] = [];
      const ddds = ['11', '13', '21', '31', '51', '71', '81'];
      for (let i = 1; i <= count; i++) {
        const ddd = ddds[i % ddds.length];
        const numPart = Math.floor(10000000 + Math.random() * 90000000);
        const rawPhone = `+55${ddd}9${numPart}`;
        const formatted = `+55 ${ddd} 9${String(numPart).slice(0, 4)}-${String(numPart).slice(4)}`;
        
        generated.push({
          id: `raw-${type}-${i}`,
          phone: rawPhone,
          formattedPhone: formatted,
          isWaActive: false,
          isTgActive: false,
          status: 'unverified'
        });
      }

      setParsedContacts(generated);
      const validCnt = generated.length;

      setActiveFileInfo({
        fileName,
        folderPath,
        fileSizeFormatted,
        totalLines: count,
        validCount: validCnt,
        progress: 100,
        status: 'ready'
      });

      const newBatch: ImportedBatchFile = {
        id: `batch-${Date.now()}`,
        fileName,
        fileSizeKb: Math.floor(count * 0.024),
        totalLines: count,
        validPhoneCount: validCnt,
        scrubbedWaCount: 0,
        scrubbedTgCount: 0,
        uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setBatchHistory(prev => [newBatch, ...prev]);
      notifyImportSuccess(generated, newBatch);
      setParsing(false);
    }, 600);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    // Always reset input so selecting the same file triggers onChange
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files) as File[];
      const filesArray = fileList.filter(f => f.name.endsWith('.txt') || f.name.endsWith('.csv'));
      if (filesArray.length > 0) {
        processMultipleFiles(filesArray);
      }
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const processFile = (file: File) => {
    setSelectedFile(file);
    setParsing(true);

    const fileSizeFormatted = file.size >= 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    // Folder or source path extraction
    const relativePath = file.webkitRelativePath || file.name;
    const folderPath = file.webkitRelativePath
      ? `📁 所属文件夹: ${file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'))}`
      : `📁 本地路径: 本地文件夹 / ${file.name}`;

    setActiveFileInfo({
      fileName: file.name,
      folderPath,
      fileSizeFormatted,
      totalLines: 0,
      validCount: 0,
      progress: 30,
      status: 'parsing'
    });

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      parseTextAndCommit(text, file.name, folderPath, file.size);
    };

    reader.readAsText(file);
  };

  const processMultipleFiles = (files: File[]) => {
    setParsing(true);
    let combinedText = '';
    let totalBytes = 0;
    const folderName = files[0].webkitRelativePath
      ? files[0].webkitRelativePath.split('/')[0]
      : '已选择多个文件文件夹';

    const folderPath = `📁 所属文件夹: ${folderName} (包含 ${files.length} 个文件)`;
    const displayName = `${folderName}_组合包 (${files.length} 个文件)`;

    let readCount = 0;
    files.forEach((file) => {
      totalBytes += file.size;
      const reader = new FileReader();
      reader.onload = (e) => {
        combinedText += '\n' + (e.target?.result as string || '');
        readCount++;
        if (readCount === files.length) {
          parseTextAndCommit(combinedText, displayName, folderPath, totalBytes);
        }
      };
      reader.readAsText(file);
    });
  };

  const parseTextAndCommit = (text: string, displayName: string, folderPath: string, fileSizeBytes: number) => {
    const rawLines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const cleanedContacts: ScrubbedContact[] = [];

    rawLines.forEach((line, idx) => {
      // Split line by common separators (comma, semicolon, tab, pipe)
      const fields = line.split(/[,;\t|]+/);
      let targetDigits = '';

      // Try finding a 8-15 digit sequence in fields
      for (const field of fields) {
        const d = field.replace(/\D/g, '');
        if (d.length >= 8 && d.length <= 15) {
          targetDigits = d;
          break;
        }
      }

      // Fallback: search whole line for digits if no field matched
      if (!targetDigits) {
        const lineDigits = line.replace(/\D/g, '');
        if (lineDigits.length >= 8 && lineDigits.length <= 15) {
          targetDigits = lineDigits;
        }
      }

      if (targetDigits) {
        let normalized = targetDigits;
        // Brazil 12-digit legacy fix: 55 + DDD (2 digits) + 8 digits (missing '9')
        if (normalized.startsWith('55') && normalized.length === 12) {
          const ddd = normalized.slice(2, 4);
          const body = normalized.slice(4);
          if (body.length === 8 && !body.startsWith('9')) {
            normalized = '55' + ddd + '9' + body;
          }
        } else if (!normalized.startsWith('55')) {
          if (normalized.length === 10 || normalized.length === 11) {
            normalized = '55' + normalized;
          } else if (normalized.length === 8 || normalized.length === 9) {
            normalized = '5511' + normalized; // Default SP area code
          }
        }

        const raw = '+' + normalized;
        let formatted = raw;

        if (normalized.startsWith('55') && normalized.length >= 12) {
          const ddd = normalized.slice(2, 4);
          const body = normalized.slice(4);
          formatted = `+55 ${ddd} ${body.slice(0, 5)}-${body.slice(5)}`;
        } else if (normalized.length >= 10) {
          formatted = `+${normalized.slice(0, 2)} ${normalized.slice(2, 5)} ${normalized.slice(5)}`;
        }

        cleanedContacts.push({
          id: `raw-uploaded-${idx}-${Date.now()}`,
          phone: raw,
          formattedPhone: formatted,
          isWaActive: true,
          isTgActive: true,
          status: 'tg_active'
        });
      }
    });

    // Deduplicate
    const uniqueMap = new Map<string, ScrubbedContact>();
    cleanedContacts.forEach(c => uniqueMap.set(c.phone, c));
    const deduplicated = Array.from(uniqueMap.values());

    const totalLinesCount = rawLines.length || deduplicated.length;
    const fileSizeFormatted = fileSizeBytes >= 1024 * 1024
      ? `${(fileSizeBytes / (1024 * 1024)).toFixed(2)} MB`
      : `${(fileSizeBytes / 1024).toFixed(1)} KB`;

    setParsedContacts(deduplicated);

    setActiveFileInfo({
      fileName: displayName,
      folderPath,
      fileSizeFormatted,
      totalLines: totalLinesCount,
      validCount: deduplicated.length,
      progress: 100,
      status: 'ready'
    });

    const newBatch: ImportedBatchFile = {
      id: `batch-${Date.now()}`,
      fileName: displayName,
      fileSizeKb: Math.round(fileSizeBytes / 1024) || 1,
      totalLines: totalLinesCount,
      validPhoneCount: deduplicated.length,
      scrubbedWaCount: 0,
      scrubbedTgCount: 0,
      uploadedAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    setBatchHistory(prev => [newBatch, ...prev]);
    notifyImportSuccess(deduplicated, newBatch);
    setParsing(false);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    setParsing(true);
    const displayName = `剪贴板直贴号码_${Date.now().toString().slice(-4)}.txt`;
    const folderPath = '📁 来源: 剪贴板文本直接粘贴';
    parseTextAndCommit(pastedText, displayName, folderPath, pastedText.length);
    setPastedText('');
    setPasteModalOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArr = Array.from(e.dataTransfer.files) as File[];
      if (filesArr.length === 1) {
        processFile(filesArr[0]);
      } else {
        processMultipleFiles(filesArr);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MODULE 01 / FILE IMPORT & NORMALIZATION</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              已清洗名单导入中心 (直发模式)
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              直接导入已在外部清洗好的 Telegram / WhatsApp 有效名单 (.txt / .csv)，无缝对接【矩阵群发调度】中心，无需二次在线检测，最大程度保护主号风控。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Drag & Drop Dropzone */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>上传号码文件 (.txt / .csv)</span>
              </h3>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setPasteModalOpen(!pasteModalOpen)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1 transition"
                  title="直接粘贴文字号码"
                >
                  <ClipboardList className="w-3 h-3 text-amber-400" />
                  <span>粘贴文字</span>
                </button>
              </div>
            </div>

            {/* Hidden inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFolderChange}
              className="hidden"
            />

            {/* Drop Zone Box */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                dragActive
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  拖拽文件/文件夹至此或点击选择
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  支持每行一个号码的 .txt / .csv，以及包含子文件的整包文件夹
                </p>
              </div>

              {/* Upload Action Buttons */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-md transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>选择单一文件</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    folderInputRef.current?.click();
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition"
                >
                  <Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>上传整包文件夹</span>
                </button>
              </div>
            </div>

            {/* Paste Modal / Textarea */}
            {pasteModalOpen && (
              <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <ClipboardList className="w-4 h-4 text-amber-400" />
                    <span>直接粘贴电话号码文本</span>
                  </span>
                  <button
                    onClick={() => setPasteModalOpen(false)}
                    className="text-slate-400 hover:text-slate-200 text-xs"
                  >
                    关闭 ✕
                  </button>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`551399887766\n5511988887777\n+55 21 99776-5544`}
                  rows={5}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400/60"
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={handlePasteSubmit}
                    disabled={!pastedText.trim()}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>快速解析粘贴内容</span>
                  </button>
                </div>
              </div>
            )}

            {/* Loaded File & Parsing Progress Card */}
            {activeFileInfo && (
              <div className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs sm:text-sm font-extrabold text-slate-100 font-mono truncate max-w-[180px]">
                          {activeFileInfo.fileName}
                        </h4>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                          {activeFileInfo.fileSizeFormatted}
                        </span>
                      </div>

                      {/* Folder / Source Path Display */}
                      <p className="text-[10px] text-cyan-400/90 mt-1 font-mono truncate max-w-[220px]" title={activeFileInfo.folderPath}>
                        {activeFileInfo.folderPath}
                      </p>

                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        总解析行数: <strong className="text-emerald-400 font-bold">{activeFileInfo.totalLines.toLocaleString()}</strong> 条号码
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        有效标准 E.164: <strong className="text-cyan-400 font-bold">{activeFileInfo.validCount.toLocaleString()}</strong> 条
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-1 flex items-center justify-between">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                    activeFileInfo.status === 'ready'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {activeFileInfo.status === 'ready' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        ✅ 已就绪，可开始清洗/分流
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                        正自动解析与去重格式中...
                      </>
                    )}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {activeFileInfo.progress}%
                  </span>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500 rounded-full"
                    style={{ width: `${activeFileInfo.progress}%` }}
                  />
                </div>

                {activeFileInfo.status === 'ready' && (
                  <div className="pt-2 space-y-3 border-t border-slate-800/80 mt-2">
                    {/* Live Parsed Numbers Table Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>已解析号码实时预览 (共 {parsedContacts.length} 条)</span>
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          全部符合 E.164
                        </span>
                      </div>

                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 max-h-48 overflow-y-auto font-mono text-[11px] divide-y divide-slate-800/60">
                        {parsedContacts.slice(0, 30).map((c, idx) => (
                          <div key={c.id || idx} className="p-2 flex items-center justify-between hover:bg-slate-900 transition">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-500 w-6">#{idx + 1}</span>
                              <span className="text-slate-200 font-bold">{c.phone}</span>
                              <span className="text-slate-400 text-[10px]">({c.formattedPhone})</span>
                            </div>
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
                              E.164 有效号码
                            </span>
                          </div>
                        ))}
                        {parsedContacts.length > 30 && (
                          <div className="p-2 text-center text-slate-500 text-[10px] bg-slate-900/50">
                            已隐藏其余 {parsedContacts.length - 30} 条，点击下方“开始双轨清洗”完整检测
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono"
                      >
                        重新选择 / 更换文件
                      </button>
                      <button
                        onClick={onNavigateToCampaign || onNavigateToScrubber}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                      >
                        <span>直接开始矩阵群发 ({activeFileInfo.validCount.toLocaleString()} 条)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Format Normalization Rules */}
            <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 space-y-2 text-xs">
              <span className="text-slate-400 font-semibold block text-[11px] uppercase tracking-wider">
                E.164 自动标准化规范
              </span>
              <div className="flex justify-between items-center text-[11px] text-slate-300">
                <span className="font-mono text-slate-500">11987654321</span>
                <span className="text-emerald-400 font-mono">➜ +55 11 98765-4321</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-300">
                <span className="font-mono text-slate-500">5521988773003</span>
                <span className="text-emerald-400 font-mono">➜ +55 21 98877-3003</span>
              </div>
            </div>
          </div>

          {/* Import History */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>历史导入记录</span>
            </h3>
            <div className="space-y-2.5">
              {batchHistory.map((batch) => (
                <div
                  key={batch.id}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl p-3 transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[180px]">
                      {batch.fileName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {batch.uploadedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>原始: {batch.totalLines.toLocaleString()} 条</span>
                    <span className="text-emerald-400 font-medium">
                      有效: {batch.validPhoneCount.toLocaleString()} 条
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Parsed Contacts Table & Fast Action */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>当前直发名单池 ({parsedContacts.length.toLocaleString()} 条已洗好号码)</span>
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  已完成格式标准化，数据已准备就绪，可直接无缝推送到矩阵群发调度中心。
                </p>
              </div>

              {parsedContacts.length > 0 && (
                <button
                  onClick={onNavigateToCampaign || onNavigateToScrubber}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-lg shadow-emerald-500/20"
                >
                  <span>一键直接前往【矩阵群发】</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Area Code / Region Distribution Chips */}
            {parsedContacts.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">区号分流:</span>
                <span className="bg-slate-800 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  📍 SP 11 (42%)
                </span>
                <span className="bg-slate-800 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  📍 RJ 21 (28%)
                </span>
                <span className="bg-slate-800 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  📍 MG 31 (15%)
                </span>
                <span className="bg-slate-800 text-slate-200 text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  📍 其他 (15%)
                </span>
              </div>
            )}

            {/* Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
              <div className="max-h-[420px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 font-mono sticky top-0 border-b border-slate-700 z-10">
                    <tr>
                      <th className="px-4 py-2.5">#</th>
                      <th className="px-4 py-2.5">标准 E.164 号码</th>
                      <th className="px-4 py-2.5">地区/区号</th>
                      <th className="px-4 py-2.5">TG 清洗状态</th>
                      <th className="px-4 py-2.5">WS 清洗状态</th>
                      <th className="px-4 py-2.5">动作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {parsedContacts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-slate-500">
                          <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <span>尚无解析号码，请从左侧拖拽或选择名单文件 (.txt / .csv) 上传。</span>
                        </td>
                      </tr>
                    ) : (
                      parsedContacts.slice(0, 100).map((contact, i) => (
                        <tr key={contact.id} className="hover:bg-slate-800/40 transition font-mono">
                          <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                          <td className="px-4 py-2 text-slate-100 font-bold">
                            {contact.formattedPhone}
                          </td>
                          <td className="px-4 py-2 text-slate-400">
                            🇧🇷 Brasil ({contact.phone.slice(3, 5)})
                          </td>
                          <td className="px-4 py-2">
                            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">
                              ✅ 已洗好 (可直发)
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="bg-cyan-500/10 text-cyan-400 text-[10px] px-2 py-0.5 rounded border border-cyan-500/20">
                              ✅ 已洗好 (备用)
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span
                              onClick={onNavigateToCampaign || onNavigateToScrubber}
                              className="text-emerald-400 text-[11px] font-bold cursor-pointer hover:underline"
                            >
                              直接群发 ➔
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {parsedContacts.length > 100 && (
              <p className="text-[11px] text-slate-500 text-center font-mono">
                * 仅显示前 100 条预览，完整 {parsedContacts.length.toLocaleString()} 条已安全载入内存池
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
