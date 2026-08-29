import React, { useState } from 'react';
import { CampaignLog } from '../types';
import { exportToCSV } from '../utils/spintax';
import {
  History,
  Download,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Sparkles,
  Globe2,
  RefreshCw
} from 'lucide-react';

interface LogViewerProps {
  logs: CampaignLog[];
  setLogs: React.Dispatch<React.SetStateAction<CampaignLog[]>>;
  setActiveTab: (tab: string) => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, setLogs, setActiveTab }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.targetPhone.includes(searchQuery) ||
      log.accountPhone.includes(searchQuery) ||
      log.messageText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const failedLogs = logs.filter((l) => l.status === 'failed' || l.status === 'banned');

  // Export Failed Numbers CSV
  const handleExportFailedCSV = () => {
    if (failedLogs.length === 0) {
      alert('目前沒有失敗的紀錄可供導出');
      return;
    }

    const headers = ['Platform', 'TargetPhone', 'SenderAccount', 'ErrorReason', 'Timestamp'];
    const rows = failedLogs.map((l) => [
      l.platform || 'whatsapp',
      l.targetPhone,
      l.accountPhone,
      l.errorMessage || 'Unknown Error',
      l.timestamp
    ]);

    exportToCSV(`tg_ws_failed_targets_${Date.now()}.csv`, headers, rows);
  };

  // Export Full Logs CSV
  const handleExportFullCSV = () => {
    if (logs.length === 0) {
      alert('尚無發送紀錄可導出');
      return;
    }

    const headers = ['Platform', 'TargetPhone', 'SenderAccount', 'Status', 'DelaySec', 'MessageText', 'Timestamp'];
    const rows = logs.map((l) => [
      l.platform || 'whatsapp',
      l.targetPhone,
      l.accountPhone,
      l.status,
      l.delaySec,
      l.messageText,
      l.timestamp
    ]);

    exportToCSV(`tg_ws_full_campaign_report_${Date.now()}.csv`, headers, rows);
  };

  // Re-dispatch failed numbers back to Campaign Console
  const handleRedispatchFailed = () => {
    if (failedLogs.length === 0) {
      alert('無失敗號碼需要重試');
      return;
    }
    setActiveTab('campaign');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>MODULE 05 / CAMPAIGN LOGS & FAILURE RETRY ENGINE</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-400" />
              發送日誌與失敗重試匯出 (Campaign Analytics)
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              即時紀錄 TG 與 WS 雙軌發送成功與失敗清單，支援一鍵導出失敗號碼 CSV 與無縫閉環重試。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRedispatchFailed}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> 失敗號碼一鍵重試派發 ({failedLogs.length} 筆)
            </button>

            <button
              onClick={handleExportFailedCSV}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" /> 導出失敗號碼 CSV
            </button>

            <button
              onClick={handleExportFullCSV}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
            >
              <FileSpreadsheet className="w-4 h-4" /> 導出完整報告 CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="搜尋目標號碼、發送帳號或文案關鍵字..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          {['all', 'success', 'failed'].map((statusKey) => (
            <button
              key={statusKey}
              onClick={() => setFilterStatus(statusKey)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize whitespace-nowrap ${
                filterStatus === statusKey
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {statusKey === 'all' && `全部雙軌日誌 (${logs.length})`}
              {statusKey === 'success' && `發送成功 (${logs.filter((l) => l.status === 'success').length})`}
              {statusKey === 'failed' && `發送失敗 (${failedLogs.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">時間</th>
                <th className="py-3.5 px-4">平台通道</th>
                <th className="py-3.5 px-4">目標巴西號碼 (+55)</th>
                <th className="py-3.5 px-4">派發 Session 帳號</th>
                <th className="py-3.5 px-4">到達狀態</th>
                <th className="py-3.5 px-4">高斯 Jitter</th>
                <th className="py-3.5 px-4">解碼發送文案 preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    目前尚無紀錄或沒有符合篩選條件的資料
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        log.platform === 'telegram'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {log.platform === 'telegram' ? '✈️ Telegram' : '🟢 WhatsApp'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                      {log.targetPhone}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {log.accountPhone}
                    </td>
                    <td className="py-3.5 px-4">
                      {log.status === 'success' ? (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> 成功送達
                        </span>
                      ) : (
                        <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> 失敗 ({log.errorMessage})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {log.delaySec}s
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 max-w-xs truncate text-[11px]">
                      {log.messageText}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

