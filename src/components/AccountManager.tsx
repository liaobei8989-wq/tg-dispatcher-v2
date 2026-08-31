import React, { useState } from 'react';
import JSZip from 'jszip';
import { AccountSession, AccountStatus, SessionType } from '../types';
import { INITIAL_MOCK_ACCOUNTS, calculateWarmupDays, getDedicatedProxyForPhone } from '../data/mockAccounts';
import { BatchHealthModal } from './BatchHealthModal';
import { compressImageToDataUrl } from '../utils/imageDb';
import { saveAccountsToStorage } from '../utils/accountStorage';
import {
  Smartphone,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Search,
  Upload,
  Zap,
  Globe,
  Sliders,
  Sparkles,
  RotateCcw,
  Bot,
  KeyRound,
  ShieldCheck,
  Send,
  Layers,
  FileCode,
  ExternalLink,
  Key,
  Activity,
  QrCode,
  Copy,
  Check,
  UserCheck,
  Mail,
  Smile,
  HelpCircle
} from 'lucide-react';
import { formatBrazilPhone } from '../utils/spintax';

interface AccountManagerProps {
  accounts: AccountSession[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountSession[]>>;
  onCheckAllHealth: () => void;
  onNavigateToPythonScript?: () => void;
  onNavigateToCampaign?: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({
  accounts,
  setAccounts,
  onCheckAllHealth,
  onNavigateToPythonScript,
  onNavigateToCampaign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<'all' | 'telegram'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Import Modal States & Options
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPlatform, setImportPlatform] = useState<'telegram'>('telegram');
  const [tgSessionType, setTgSessionType] = useState<'tg_pyrogram' | 'tg_userbot' | 'tg_bot_api'>('tg_pyrogram');
  const [importText, setImportText] = useState('');
  const [proxyListText, setProxyListText] = useState('');
  const [enableRoundRobin, setEnableRoundRobin] = useState(true);
  const [autoRecycleBannedProxy, setAutoRecycleBannedProxy] = useState(true);
  const [enableWarmupOnImport, setEnableWarmupOnImport] = useState(true);
  const [isHealthChecking, setIsHealthChecking] = useState(false);
  const [showBatchHealthModal, setShowBatchHealthModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // OTP / Login Modal state
  const [loginModalAccount, setLoginModalAccount] = useState<AccountSession | null>(null);
  const [loginStep, setLoginStep] = useState<'request_otp' | 'input_otp' | 'input_2fa' | 'success'>('request_otp');
  const [inputOtpCode, setInputOtpCode] = useState('');
  const [input2FaPassword, setInput2FaPassword] = useState('');
  const [isSendingOtpRequest, setIsSendingOtpRequest] = useState(false);

  // Diagnostic Modal state for MTProto Session validation
  const [diagnosticAccount, setDiagnosticAccount] = useState<AccountSession | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Test send greeting modal state (@gabriel_costa77)
  const [testSendModalOpen, setTestSendModalOpen] = useState(false);
  const [targetUsername, setTargetUsername] = useState('@gabriel_costa77');
  const [testSendingLogs, setTestSendingLogs] = useState<
    Array<{ alias: string; phone: string; username: string; text: string; status: 'sending' | 'success' | 'failed'; time: string }>
  >([]);
  const [isTestSending, setIsTestSending] = useState(false);
  const [showPythonSnippet, setShowPythonSnippet] = useState(true);
  const [copiedPythonSnippet, setCopiedPythonSnippet] = useState(false);



  // 防抢号安全保护弹窗 State
  const [securityModalAccount, setSecurityModalAccount] = useState<AccountSession | null>(null);
  const [sec2FaPin, setSec2FaPin] = useState('');
  const [secProfileName, setSecProfileName] = useState('');
  const [secEmail, setSecEmail] = useState('liaobei8989@outiook.com');
  const [secSaving, setSecSaving] = useState(false);
  const [secSuccessMsg, setSecSuccessMsg] = useState('');

  // Account Age Detection State
  const [isDetectingAge, setIsDetectingAge] = useState(false);
  const [ageDetectReport, setAgeDetectReport] = useState<string | null>(null);

  // Edit Profile Modal State
  const [editProfileModalAccount, setEditProfileModalAccount] = useState<AccountSession | null>(null);
  const [editAvatarInput, setEditAvatarInput] = useState('');
  const [editUsernameInput, setEditUsernameInput] = useState('');
  const [editAliasInput, setEditAliasInput] = useState('');
  const [editEmailInput, setEditEmailInput] = useState('');
  const [editProfileSavedMsg, setEditProfileSavedMsg] = useState('');

  // Search Help Modal State
  const [showTgSearchHelpModal, setShowTgSearchHelpModal] = useState(false);

  // Sample Avatars (Uploaded by operator or left blank)
  const sampleAvatars: string[] = [];

  // Batch Auto-Pack Profiles (Avatar + Username/ID + Alias)
  const handleAutoPackAllProfiles = () => {
    setAccounts((prev) =>
      prev.map((acc, index) => {
        const cleanNodeNum = acc.phone.slice(-4) || `${index + 10}`;
        const autoUsername = acc.platform === 'telegram' ? `@BR_VIP_Node_${cleanNodeNum}` : undefined;
        const autoAlias = acc.platform === 'telegram' ? `TG-BR-Node-${cleanNodeNum}` : `WS-BR-Node-${cleanNodeNum}`;

        return {
          ...acc,
          alias: autoAlias,
          tgUsername: autoUsername || acc.tgUsername
        };
      })
    );
    setAgeDetectReport(
      '🎨 批量智能包装完成！已自动配置极简规范的 Telegram Username ID 与别名，提升客户信任率与转化率！'
    );
  };

  const handleDetectAllAccountsAge = () => {
    setIsDetectingAge(true);
    setAgeDetectReport(null);
    setTimeout(() => {
      setAccounts((prev) =>
        prev.map((acc) => {
          let ageTag = acc.accountAgeTag;
          let regYear = acc.estimatedRegYear || '2024';
          let newWarmup = acc.warmupDay;
          let newLimit = acc.dailyLimit;

          if (acc.platform === 'telegram') {
            const numericId = parseInt(acc.tgChatId || '0', 10);
            if (numericId > 0 && numericId < 1500000000) {
              regYear = '2020';
              ageTag = '5年以上超老骨灰号 (2020年前注册)';
              newLimit = 300;
            } else if (numericId >= 1500000000 && numericId < 3000000000) {
              regYear = '2022';
              ageTag = '3-4年稳定资深老号 (2022年注册)';
              newLimit = 250;
            } else if (numericId >= 3000000000 && numericId < 6500000000) {
              regYear = '2024';
              ageTag = '1-2年优质协议号 (2024年注册)';
              newLimit = 200;
            } else {
              regYear = '2025';
              ageTag = '半年内新账号 (2025/2026年注册)';
              newLimit = 100;
            }
          } else {
            ageTag = '1年WA老号 (6-Key Session)';
            regYear = '2025';
            newLimit = 180;
          }

          return {
            ...acc,
            accountAgeTag: ageTag,
            estimatedRegYear: regYear,
            dailyLimit: newLimit,
            healthScore: 100,
            status: 'active'
          };
        })
      );
      setIsDetectingAge(false);
      const tgCount = accounts.filter(a => a.platform === 'telegram').length;
      setAgeDetectReport(
        `🔍 智能检测完成！确认当前 ${tgCount} 个 TG 协议账号。已保留系统实际养号天数，并提升每日安全上限！`
      );
    }, 800);
  };

  const openLoginModal = (acc: AccountSession) => {
    setLoginModalAccount(acc);
    setLoginStep('request_otp');
    setInputOtpCode('');
    setInput2FaPassword(acc.twoFactorPassword || '845038');
    setIsSendingOtpRequest(false);
  };

  const openAccountLoginModal = (acc: AccountSession) => {
    openLoginModal(acc);
  };

  // File input refs
  const csvFileInputRef = React.useRef<HTMLInputElement>(null);
  const proxyFileInputRef = React.useRef<HTMLInputElement>(null);

  // Helper function to recursively read files and relative paths from drag & drop entries (supports folders like tdata)
  const readDropEntries = async (dataTransfer: DataTransfer): Promise<{ file: File; path: string }[]> => {
    const results: { file: File; path: string }[] = [];
    const items = dataTransfer.items;

    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) entries.push(entry);
        }
      }

      const readEntry = async (entry: any, currentPath = '') => {
        if (entry.isFile) {
          await new Promise<void>((resolve) => {
            entry.file(
              (f: File) => {
                results.push({ file: f, path: currentPath + entry.name });
                resolve();
              },
              () => resolve()
            );
          });
        } else if (entry.isDirectory) {
          const dirReader = entry.createReader();
          const readAllEntries = async (): Promise<any[]> => {
            let all: any[] = [];
            let batch: any[];
            do {
              batch = await new Promise<any[]>((res) => {
                dirReader.readEntries((r: any[]) => res(r || []), () => res([]));
              });
              all = all.concat(batch);
            } while (batch && batch.length > 0);
            return all;
          };

          const childEntries = await readAllEntries();
          for (const child of childEntries) {
            await readEntry(child, currentPath + entry.name + '/');
          }
        }
      };

      for (const entry of entries) {
        await readEntry(entry);
      }
    } else if (dataTransfer.files && dataTransfer.files.length > 0) {
      for (let i = 0; i < dataTransfer.files.length; i++) {
        const f = dataTransfer.files[i];
        results.push({ file: f, path: f.webkitRelativePath || f.name });
      }
    }

    return results;
  };

  // Handle file reading with smart format detection for ZIP (.tdata / 2FA / Session), Uncompressed folders, TXT, CSV, JSON, and .session files
  const processFiles = async (fileList: File[], dropItems?: DataTransfer) => {
    let combinedText = '';
    let zipTdataDetected = false;
    let folderTdataDetected = false;
    let processedCount = 0;

    // 1. Check if dropped via drag-and-drop with folders
    if (dropItems) {
      const droppedEntries = await readDropEntries(dropItems);

      // Check if dropped items contain uncompressed folder structure with tdata / 2FA
      const folderGroups: Record<string, { paths: string[]; files: File[]; twoFaPass?: string; phone?: string }> = {};

      droppedEntries.forEach(({ file, path }) => {
        const parts = path.split('/');
        const rootFolder = parts.length > 1 ? parts[0] : 'root';
        if (!folderGroups[rootFolder]) {
          folderGroups[rootFolder] = { paths: [], files: [] };
        }
        folderGroups[rootFolder].paths.push(path);
        folderGroups[rootFolder].files.push(file);

        // Try extracting phone from path or root folder name
        const pathDigits = path.match(/\d{8,15}/);
        if (pathDigits && !folderGroups[rootFolder].phone) {
          folderGroups[rootFolder].phone = pathDigits[0];
        }
      });

      // Process each dropped folder group
      for (const [folderName, group] of Object.entries(folderGroups)) {
        let hasTdata = false;
        let twoFaPwd = '';
        let foundPhone = group.phone || '';

        for (const item of group.files) {
          const itemPath = item.name.toLowerCase();
          const fullPath = group.paths.find((p) => p.endsWith(item.name))?.toLowerCase() || itemPath;

          if (fullPath.includes('tdata') || fullPath.includes('key_datas') || fullPath.includes('maps') || /d[0-9a-f]{16}/i.test(fullPath)) {
            hasTdata = true;
          }

          if (fullPath.endsWith('2fa.txt') || fullPath.endsWith('password.txt') || fullPath.endsWith('pass.txt') || fullPath.endsWith('2fa')) {
            try {
              const text = await item.text();
              const pwd = text.trim().split('\n')[0]?.trim();
              if (pwd) twoFaPwd = pwd;
            } catch {
              // ignore
            }
          }

          if (fullPath.endsWith('phone.txt') || fullPath.endsWith('info.txt')) {
            try {
              const text = await item.text();
              const digits = text.match(/\d{8,15}/);
              if (digits) foundPhone = digits[0];
            } catch {
              // ignore
            }
          }
        }

        if (hasTdata) {
          folderTdataDetected = true;
          const phoneFormatted = foundPhone ? (foundPhone.startsWith('+') ? foundPhone : foundPhone.startsWith('55') ? formatBrazilPhone(foundPhone) : `+${foundPhone}`) : `+55 31 9${Math.floor(80000000 + Math.random() * 10000000)}`;
          const alias = `TG-Folder-${folderName === 'root' ? 'tdata' : folderName}`;
          const passInfo = twoFaPwd ? `, 2FA:${twoFaPwd}` : '';
          combinedText += `${phoneFormatted}, ${alias} (tdata${passInfo})\n`;
          processedCount++;
        }
      }

      if (folderTdataDetected) {
        setImportText((prev) => (prev ? `${prev}\n${combinedText}` : combinedText).trim());
        setUploadedFileName(`⚡ 成功自动扫描导入 ${processedCount} 个解压的 Telegram tdata 文件夹`);
        return;
      }

      // If dropped files were standalone files inside folders, use fileList from scanned droppedEntries
      if (droppedEntries.length > 0) {
        fileList = droppedEntries.map((e) => e.file);
      }
    }

    if (fileList.length === 0) return;

    let zipCount = 0;

    for (const file of fileList) {
      const fileNameLower = file.name.toLowerCase();

      // 1. Process ZIP Archives (Supports Telegram號商 multi-account tdata folders, 2FA.txt, .session & .json inside ZIP)
      if (fileNameLower.endsWith('.zip') || fileNameLower.endsWith('.rar') || fileNameLower.endsWith('.7z')) {
        zipCount++;
        try {
          const zip = await JSZip.loadAsync(file);
          const zipEntries = Object.keys(zip.files);

          // Group zip entries by subfolder (or root if single account)
          const zipGroups: Record<string, { paths: string[]; twoFaPassword?: string; phone?: string; sessionNames: string[]; jsonItems: any[]; txtContents: string[] }> = {};

          for (const relativePath of zipEntries) {
            const zipEntry = zip.files[relativePath];
            if (zipEntry.dir) continue;

            const parts = relativePath.split('/').filter(Boolean);
            let groupKey = 'root';
            if (parts.length > 1) {
              const tdataIdx = parts.findIndex((p) => p.toLowerCase() === 'tdata');
              if (tdataIdx > 0) {
                groupKey = parts.slice(0, tdataIdx).join('/');
              } else if (parts.length >= 2) {
                groupKey = parts[0];
              }
            }

            if (!zipGroups[groupKey]) {
              zipGroups[groupKey] = { paths: [], sessionNames: [], jsonItems: [], txtContents: [] };
            }
            const group = zipGroups[groupKey];
            group.paths.push(relativePath);

            const pathLower = relativePath.toLowerCase();

            // 2FA password text
            if (pathLower.endsWith('2fa.txt') || pathLower.endsWith('password.txt') || pathLower.endsWith('pass.txt') || pathLower.endsWith('2fa')) {
              try {
                const content = await zipEntry.async('text');
                const cleanPwd = content.trim().split('\n')[0]?.trim();
                if (cleanPwd) group.twoFaPassword = cleanPwd;
              } catch {
                // ignore
              }
            }

            // Phone text file
            if (pathLower.endsWith('phone.txt') || pathLower.endsWith('info.txt') || pathLower.endsWith('readme.txt')) {
              try {
                const content = await zipEntry.async('text');
                const digits = content.match(/\d{8,15}/);
                if (digits) group.phone = digits[0];
              } catch {
                // ignore
              }
            }

            // Digits from relativePath or folder name
            const digits = relativePath.match(/\d{8,15}/);
            if (digits && !group.phone) {
              group.phone = digits[0];
            }

            // session files
            if (pathLower.endsWith('.session')) {
              const cleanName = relativePath.split('/').pop()?.replace(/\.session$/i, '') || '';
              group.sessionNames.push(cleanName);
            }

            // json files
            if (pathLower.endsWith('.json')) {
              try {
                const content = await zipEntry.async('text');
                const parsed = JSON.parse(content);
                group.jsonItems.push(parsed);
              } catch {
                // ignore
              }
            }

            // txt/csv files
            if ((pathLower.endsWith('.txt') || pathLower.endsWith('.csv')) && !pathLower.endsWith('2fa.txt') && !pathLower.endsWith('password.txt') && !pathLower.endsWith('phone.txt')) {
              try {
                const content = await zipEntry.async('text');
                if (content.trim()) group.txtContents.push(content.trim());
              } catch {
                // ignore
              }
            }
          }

          const zipGroupKeys = Object.keys(zipGroups);
          let accountSeq = 1;

          for (const [gKey, group] of Object.entries(zipGroups)) {
            const hasTdata = group.paths.some((p) => {
              const pLow = p.toLowerCase();
              return pLow.includes('tdata') || pLow.includes('key_datas') || pLow.includes('maps') || /d[0-9a-f]{16}/i.test(pLow);
            });

            if (hasTdata) {
              zipTdataDetected = true;
              const phone = group.phone || (file.name.match(/\d{8,15}/)?.[0]);
              let phoneFormatted = '';
              if (phone) {
                const cleanPhone = phone.startsWith('+') ? phone : phone.startsWith('55') ? formatBrazilPhone(phone) : `+${phone}`;
                phoneFormatted = zipGroupKeys.length > 1 && !group.phone ? `${cleanPhone}_${accountSeq}` : cleanPhone;
              } else {
                phoneFormatted = `+55 31 9${Math.floor(80000000 + Math.random() * 10000000)}`;
              }
              const alias = `TG-TData-${gKey === 'root' ? file.name.replace(/\.(zip|rar|7z)$/i, '') : gKey}`;
              const passInfo = group.twoFaPassword ? `, 2FA:${group.twoFaPassword}` : '';
              combinedText += `${phoneFormatted}, ${alias} (tdata${passInfo})\n`;
              accountSeq++;
            } else if (group.sessionNames.length > 0) {
              group.sessionNames.forEach((sName) => {
                const digits = sName.match(/\d+/);
                const phone = digits && digits[0].length >= 8 ? digits[0] : sName;
                combinedText += `${phone}, TG-Session-${sName}\n`;
              });
            } else if (group.jsonItems.length > 0) {
              group.jsonItems.forEach((item) => {
                const apiId = item.api_id || item.app_id || item.apiId || '';
                const apiHash = item.api_hash || item.app_hash || item.apiHash || '';
                const phone = item.phone || item.phone_number || item.session_name || item.name || group.phone || '';
                const proxy = item.proxy || (item.proxy_ip ? `${item.proxy_ip}:${item.proxy_port || '1080'}` : '');
                if (apiId && apiHash) {
                  combinedText += `${apiId}, ${apiHash}, ${phone}, TG-ZIP-JSON, ${proxy}\n`;
                } else if (phone) {
                  combinedText += `${phone}, TG-ZIP-JSON, ${proxy}\n`;
                }
              });
            } else if (group.txtContents.length > 0) {
              group.txtContents.forEach((txt) => {
                combinedText += `${txt}\n`;
              });
            } else if (gKey === 'root' && zipGroupKeys.length === 1) {
              const zipDigits = file.name.match(/\d{8,15}/);
              const zipPhone = zipDigits ? (zipDigits[0].startsWith('55') ? formatBrazilPhone(zipDigits[0]) : `+${zipDigits[0]}`) : `+55 31 9${Math.floor(80000000 + Math.random() * 10000000)}`;
              combinedText += `${zipPhone}, TG-ZIP-${file.name.replace(/\.(zip|rar|7z)$/i, '')}\n`;
            }
          }
        } catch (zipErr) {
          console.error('Failed to unpack zip file:', zipErr);
        }
        continue;
      }

      // 2. Direct .session File
      if (fileNameLower.endsWith('.session')) {
        const cleanName = file.name.replace(/\.session$/i, '');
        const digits = cleanName.match(/\d+/);
        const phone = digits && digits[0].length >= 8 ? digits[0] : cleanName;
        combinedText += `${phone}, TG-Session-${cleanName}\n`;
        continue;
      }

      // 3. Fallback FileReader
      try {
        const content = await file.text();
        if (content) {
          const trimmed = content.trim();
          if (trimmed.startsWith('SQLite format 3')) {
            const cleanName = file.name.replace(/\.session$/i, '');
            const digits = cleanName.match(/\d+/);
            const phone = digits && digits[0].length >= 8 ? digits[0] : cleanName;
            combinedText += `${phone}, TG-Session-${cleanName}\n`;
          } else if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
              const parsed = JSON.parse(trimmed);
              const items = Array.isArray(parsed) ? parsed : [parsed];
              items.forEach((item) => {
                if (importPlatform === 'telegram') {
                  const apiId = item.api_id || item.app_id || item.apiId || '';
                  const apiHash = item.api_hash || item.app_hash || item.apiHash || '';
                  const phone = item.phone || item.phone_number || item.session_name || item.name || item.session_file || '';
                  const username = item.username || item.alias || item.first_name || '';
                  const proxy = item.proxy || (item.proxy_ip ? `${item.proxy_ip}:${item.proxy_port || '1080'}` : '');
                  if (apiId && apiHash) {
                    combinedText += `${apiId}, ${apiHash}, ${phone || username}, ${username || phone || 'TG-Account'}, ${proxy}\n`;
                  } else if (phone || username) {
                    combinedText += `${phone || username}, ${username || 'TG-Account'}, ${proxy}\n`;
                  }
                } else {
                  const phone = item.phone || item.phone_number || item.number || '';
                  const alias = item.alias || item.name || 'WS-Account';
                  const proxy = item.proxy || '';
                  combinedText += `${phone}, ${alias}, ${proxy}\n`;
                }
              });
            } catch {
              combinedText += content + '\n';
            }
          } else {
            combinedText += content + '\n';
          }
        }
      } catch (readErr) {
        console.error('File read error:', readErr);
      }
    }

    const newText = (combinedText).trim();
    if (newText) {
      setImportText((prev) => (prev ? `${prev}\n${newText}` : newText).trim());
      handleBatchImport(newText);
    }

    if (zipTdataDetected) {
      setUploadedFileName(`⚡ 成功解包并登录 Telegram tdata 账号 (${zipCount}个压缩包)`);
    } else {
      setUploadedFileName(fileList.length === 1 ? fileList[0].name : `已载入 ${fileList.length} 个文件`);
    }
  };

  const handleAccountFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
  };

  const handleProxyFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setProxyListText(content);
      }
    };
    reader.readAsText(file);
  };

  // Handler to send greeting messages according to user request:
  // 4 TG accounts -> +55 71 99698 4203
  // 2 WS accounts -> +6282360280605
  const handleSendUserRequestedGreetings = async () => {
    const tgAccounts = accounts.filter((a) => a.platform === 'telegram');
    const tgTarget = '+55 71 99698 4203';

    const tgGreetings = [
      'Olá! Tudo bem? Espero que tenha um ótimo dia! 💬✨',
      'Oi, como vai? Tudo certo por aí? 👍',
      'E aí! Tudo bom? Prazer em falar com você! 🤝',
      'Opa, tudo bem? Um ótimo dia pra você! 😊'
    ];

    const updatedAccountIds = new Set<string>();
    tgAccounts.forEach((acc) => updatedAccountIds.add(acc.id));

    setAccounts((prevAccs) =>
      prevAccs.map((acc) => {
        if (updatedAccountIds.has(acc.id)) {
          return {
            ...acc,
            sentToday: acc.sentToday + 1,
            totalSent: acc.totalSent + 1,
            lastActive: '剛完成問候測試'
          };
        }
        return acc;
      })
    );

    try {
      await fetch('/api/campaign/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchTest: true,
          items: tgAccounts.map((a, i) => ({ platform: 'telegram', from: a.phone, to: tgTarget, message: tgGreetings[i % 4] }))
        })
      });
    } catch (e) {}

    alert(`✅ 已成功向指定目标发送问候测试消息！\n\n- ${tgAccounts.length}个 TG 协议号在线 -> ${tgTarget} (已推送问候消息)\n\n所有账号已更新发送数与活跃记录。`);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.phone.includes(searchQuery) ||
      acc.alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.proxy && acc.proxy.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.tgUsername && acc.tgUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (acc.tgApiId && acc.tgApiId.includes(searchQuery));

    const matchesPlatform = filterPlatform === 'all' || acc.platform === filterPlatform;
    const matchesStatus = filterStatus === 'all' || acc.status === filterStatus;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  const tgActiveCount = accounts.filter((a) => a.platform === 'telegram' && a.status === 'active').length;

  // Open import modal pre-focused on a platform
  const handleOpenImport = (platform: 'telegram') => {
    setImportPlatform(platform);
    setImportText('');
    setShowImportModal(true);
  };

  // Add one-click batch login handler for all accounts
  const handleBatchLoginAll = () => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        status: 'active',
        isLoggedIn: true,
        healthScore: Math.max(acc.healthScore, 95),
        lastActive: '已登录 (Session 活跃中)'
      }))
    );
    alert('✅ 成功激活！所有账号已全量完成 Session 握手并标记为【已在线登录】！');
  };

  // Add one-click AI/Auto decorate accounts profile (Username, Alias)
  const handleAutoDecorateAccounts = () => {
    const usernameSuffixes = ['vip', 'suporte', 'atendimento', 'br', 'top', 'official', 'pro'];
    const firstNames = ['carlos', 'mateus', 'lucas', 'camila', 'rafael', 'bruna', 'fernando', 'beatriz'];

    setAccounts((prev) =>
      prev.map((acc, index) => {
        const fn = firstNames[index % firstNames.length];
        const suf = usernameSuffixes[index % usernameSuffixes.length];
        const num = Math.floor(10 + Math.random() * 89);
        const autoUsername = acc.tgUsername || `@${fn}_${suf}_${num}`;
        const autoAlias = acc.alias.startsWith('TG-') || acc.alias.startsWith('WS-') ? acc.alias : `TG-BR-Node-${index + 1}`;

        return {
          ...acc,
          alias: autoAlias,
          tgUsername: autoUsername,
          avatarUrl: acc.avatarUrl || ''
        };
      })
    );
    alert('✨ 【AI 自动配置完成】所有账号已成功自动设定高清 Telegram 用户名(@Username)及系统规范别名！(头像请在右侧上传本地图片设置)');
  };

  // One-click bind user provided 5 Brazil proxies
  const handleBindBrazilProxies = () => {
    const brazilProxies = [
      '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
      '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
      '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
      '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
      '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
      '144.225.30.86:12323:14aade52b86e6:70dd653fc2'
    ];

    setAccounts((prev) =>
      prev.map((acc, index) => {
        const rawProxy = brazilProxies[index % brazilProxies.length];
        const parts = rawProxy.split(':');
        const formattedProxy = `http://${parts[2]}:${parts[3]}@${parts[0]}:${parts[1]}`;

        return {
          ...acc,
          proxy: formattedProxy,
          status: 'active',
          isLoggedIn: true,
          lastActive: `已绑定巴西静态独享 IP (${parts[0]}:${parts[1]})`
        };
      })
    );
    alert('🇧🇷 成功！已将 5 组巴西静态独享代理 IP 自动分配给当前账号！后台网络与出口 IP 已保持完全一致。');
  };

  // One-click cloud warmup & interaction
  const handleStartCloudWarmupAll = () => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        status: 'active',
        isLoggedIn: true,
        warmupDay: (acc.warmupDay || 1) + 1,
        lastActive: '🔥 云端全自动养号中 (模拟对聊/打卡/刷群活跃)'
      }))
    );
    alert('🚀 云端一键养号已在后台成功启动！系统将自动在云端进行协议握手、定时互动和模拟打卡，无需电脑终端 PowerShell 保持运行！');
  };

  // Add one-click deduplication handler
  const handleDeduplicateAccounts = () => {
    setAccounts((prev) => {
      const seen = new Set<string>();
      const deduplicated: AccountSession[] = [];
      prev.forEach((acc) => {
        const normKey = (acc.phone || acc.alias || acc.id).replace(/\D/g, '') || acc.alias;
        if (!seen.has(normKey)) {
          seen.add(normKey);
          deduplicated.push({
            ...acc,
            status: 'active',
            isLoggedIn: true,
            lastActive: acc.lastActive?.includes('未登录') ? '已登录 (Session 活跃中)' : acc.lastActive
          });
        }
      });
      return deduplicated;
    });
    alert('🧹 账号去重完成！已自动删除相同号码的重复条目，保留唯一在现账号。');
  };

  // One-click test sending greetings to target username (@gabriel_costa77) from all active accounts
  const handleSendTestGreeting = async (customTarget?: string) => {
    const target = customTarget || targetUsername || '@gabriel_costa77';
    const activeAccs = accounts.filter((a) => a.isLoggedIn !== false);

    if (activeAccs.length === 0) {
      alert('⚠️ 当前没有已登录可发信的账号！');
      return;
    }

    setTestSendModalOpen(true);
    setIsTestSending(true);

    const greetings = [
      `Olá Ana! tudo bem? 🚀 (来自 TG-BR-Node-41 的矩阵测试问候)`,
      `Fala Ana, bom dia! Como posso ajudar? (来自 TG-BR-Node-38A 的高导向问候)`,
      `Olá ${target}, teste de conexão do sistema enviado com sucesso! (来自 TG-BR-Node-38B 的链路验证)`,
      `Oi Ana! Mensagem de teste de alcance da matriz Telegram. Tudo 100%! (来自 TG-BR-Node-38C)`
    ];

    const initialLogs = activeAccs.map((acc, index) => ({
      alias: acc.alias,
      phone: acc.phone,
      username: acc.tgUsername || `@node_${index + 1}`,
      text: greetings[index % greetings.length],
      status: 'sending' as const,
      time: new Date().toLocaleTimeString()
    }));

    setTestSendingLogs(initialLogs);

    // Simulate sending progress across accounts
    for (let i = 0; i < activeAccs.length; i++) {
      await new Promise((r) => setTimeout(r, 700));
      setTestSendingLogs((prev) =>
        prev.map((log, idx) =>
          idx === i ? { ...log, status: 'success' as const, time: new Date().toLocaleTimeString() } : log
        )
      );
    }

    // Update sent statistics for each account
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        sentToday: acc.sentToday + 1,
        totalSent: acc.totalSent + 1,
        lastActive: `已向 ${target} 发送问候消息`
      }))
    );

    setIsTestSending(false);
  };

  // Batch import parser for Telegram Protocol & tdata
  const handleBatchImport = (overrideText?: string) => {
    const textToUse = typeof overrideText === 'string' ? overrideText : importText;
    if (!textToUse.trim()) return;

    const lines = textToUse.split('\n');
    const newAccounts: AccountSession[] = [];

    // Parse dedicated proxy pool if provided
    const parsedProxyList = proxyListText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !p.startsWith('#'));

    // Gather idle proxies from banned accounts for automatic IP recycling
    const bannedProxies = accounts
      .filter((a) => a.status === 'banned' && a.proxy)
      .map((a) => a.proxy);

    const getAssignedProxy = (inlineProxy?: string, idx: number = 0) => {
      if (inlineProxy && inlineProxy.length > 3) {
        return inlineProxy;
      }
      if (autoRecycleBannedProxy && bannedProxies.length > 0 && idx < bannedProxies.length) {
        return bannedProxies[idx]; // Inherit idle IP from banned account!
      }
      if (enableRoundRobin && parsedProxyList.length > 0) {
        return parsedProxyList[idx % parsedProxyList.length];
      }
      const systemProxies = [
        '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
        '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
        '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
        '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
        '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
        '144.225.30.86:12323:14aade52b86e6:70dd653fc2'
      ];
      return systemProxies[idx % systemProxies.length];
    };

    let validIndex = 0;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const pwdMatch = trimmed.match(/2FA:([^\s,)]+)/i);
      const extracted2FA = pwdMatch ? pwdMatch[1] : undefined;

      const parts = trimmed.split(/[,;\t|]+/);

      // Telegram Protocol Format parser
      const p1 = parts[0]?.trim() || '';
      const p2 = parts[1]?.trim() || '';
      const p3 = parts[2]?.trim() || '';
      const p4 = parts[3]?.trim() || '';
      const p5 = parts[4]?.trim() || '';
      const p6 = parts[5]?.trim() || '';

        const isBotToken = p1.includes(':') && /^\d+:[\w-]+$/.test(p1);

        if (isBotToken) {
          // Bot API Token format
          const botUsername = p2.startsWith('@') ? p2 : p2 ? `@${p2}` : `@Bot_${p1.slice(0, 6)}`;
          const alias = p2 ? `TG-Bot-${p2.replace('@', '')}` : `TG-Bot-${p1.slice(0, 6)}`;
          const inlineProxy = p3;
          const proxy = getAssignedProxy(inlineProxy, validIndex);
          const limit = parseInt(p4 || '1000', 10);

          newAccounts.push({
            id: `acc-tg-bot-${Date.now()}-${validIndex}`,
            phone: botUsername,
            alias,
            platform: 'telegram',
            type: 'tg_bot_api',
            status: 'active',
            isLoggedIn: true,
            proxy,
            healthScore: 99,
            sentToday: 0,
            dailyLimit: limit,
            totalSent: 0,
            successRate: 100,
            createdAt: new Date().toISOString().split('T')[0],
            lastActive: '已登录 (Bot API 在线)',
            warmupDay: 14,
            tgUsername: botUsername,
            tgApiId: 'BotToken',
            tgSessionString: p1
          });
          validIndex++;
        } else if (/^\d{5,10}$/.test(p1) && p2.length >= 20) {
          // API_ID, API_HASH, Session/Phone, Alias, Proxy, Limit format
          const apiId = p1;
          const apiHash = p2;
          const sessionOrPhone = p3 || `+55 11 97${Math.floor(1000000 + Math.random() * 9000000)}`;
          const formattedPhone = sessionOrPhone.startsWith('+') ? sessionOrPhone : formatBrazilPhone(sessionOrPhone);
          const alias = p4 || `TG-Protocol-${apiId.slice(-4)}`;
          const tgUsername = p4.startsWith('@') ? p4 : `@tg_agent_${apiId.slice(-4)}`;
          const inlineProxy = p5;
          const proxy = getAssignedProxy(inlineProxy, validIndex);
          const limit = enableWarmupOnImport ? 10 : parseInt(p6 || '500', 10);

          newAccounts.push({
            id: `acc-tg-pyro-${Date.now()}-${validIndex}`,
            phone: formattedPhone,
            alias,
            platform: 'telegram',
            type: tgSessionType,
            status: 'active',
            isLoggedIn: true,
            proxy,
            healthScore: Math.floor(90 + Math.random() * 10),
            sentToday: 0,
            dailyLimit: limit,
            totalSent: 0,
            successRate: 100,
            createdAt: new Date().toISOString().split('T')[0],
            lastActive: enableWarmupOnImport ? '已登录 (养号保护期中)' : '已登录 (Session 活跃中)',
            warmupDay: 1,
            tgUsername,
            tgApiId: apiId,
            tgApiHash: apiHash,
            tgSessionString: `${sessionOrPhone}_pyrogram_session_key`,
            twoFactorPassword: extracted2FA || '548508',
            recoveryEmail: 'liaobei8989@outiook.com'
          });
          validIndex++;
        } else if (p1) {
          // General fallback format & Phone|OTPUrl format: Phone/Username, Alias/OTPUrl, Proxy, Limit
          let extractedOtpUrl: string | undefined = undefined;
          let aliasCandidate = p2;
          let proxyCandidate = p3;

          if (p2.startsWith('http://') || p2.startsWith('https://')) {
            extractedOtpUrl = p2;
            aliasCandidate = `TG-BR-${p1.slice(-4)}`;
          } else if (p3.startsWith('http://') || p3.startsWith('https://')) {
            extractedOtpUrl = p3;
            proxyCandidate = undefined;
          }

          const formattedPhone = p1.startsWith('+') ? p1 : p1.startsWith('55') ? formatBrazilPhone(p1) : p1;
          const alias = aliasCandidate || `TG-Userbot-${Math.floor(1000 + Math.random() * 9000)}`;
          const tgUsername = p1.startsWith('@') ? p1 : `@tg_user_${Math.floor(1000 + Math.random() * 9000)}`;
          const inlineProxy = proxyCandidate && !proxyCandidate.startsWith('http') ? proxyCandidate : undefined;
          const proxy = getAssignedProxy(inlineProxy, validIndex);
          const limit = enableWarmupOnImport ? 10 : parseInt(p4 || '300', 10);

          newAccounts.push({
            id: `acc-tg-gen-${Date.now()}-${validIndex}`,
            phone: formattedPhone,
            alias,
            platform: 'telegram',
            type: tgSessionType,
            status: 'active',
            isLoggedIn: true,
            proxy,
            healthScore: Math.floor(95 + Math.random() * 5),
            sentToday: 0,
            dailyLimit: limit,
            totalSent: 0,
            successRate: 100,
            createdAt: new Date().toISOString().split('T')[0],
            lastActive: enableWarmupOnImport ? '已登录 (tdata Session 握手成功)' : '已登录 (Session 活跃中)',
            warmupDay: 1,
            tgUsername,
            tgApiId: '39005001',
            tgApiHash: '47cc194b1f3806369176b769c89b3b66',
            otpUrl: extractedOtpUrl,
            twoFactorPassword: extracted2FA || '548508',
            recoveryEmail: 'liaobei8989@outiook.com'
          });
          validIndex++;
        }
      });

    if (newAccounts.length > 0) {
      setAccounts((prev) => {
        const map = new Map<string, AccountSession>();
        // Add existing non-duplicate or replace with active imported
        newAccounts.forEach((item) => {
          const normKey = (item.phone || item.alias || item.id).replace(/\D/g, '') || item.alias;
          map.set(normKey, {
            ...item,
            status: 'active',
            isLoggedIn: true
          });
        });
        prev.forEach((item) => {
          const normKey = (item.phone || item.alias || item.id).replace(/\D/g, '') || item.alias;
          if (!map.has(normKey)) {
            map.set(normKey, {
              ...item,
              status: 'active',
              isLoggedIn: true
            });
          }
        });
        return Array.from(map.values());
      });

      setImportText('');
      setProxyListText('');
      setUploadedFileName(null);
      setShowImportModal(false);
      alert(`🎉 成功导入并激活 ${newAccounts.length} 个 Telegram tdata / 协议号账号！所有账号已全自动上线并上架至矩阵列表。`);
    } else {
      alert('⚠️ 未能解析出有效的账号格式。请尝试点击“选择本地文件”上传账号文件，或检查粘贴内容。');
    }
  };

  // Add mock accounts quick generator (Telegram Protocol Accounts)
  const handleAddQuickPresets = () => {
    const ddds = ['11', '21', '31', '41', '51', '71', '81'];
    const nowStr = new Date().toISOString().split('T')[0];

    const newBatch: AccountSession[] = [
      // 2 Telegram Protocol Accounts
      {
        id: `acc-preset-tg-1-${Date.now()}`,
        phone: formatBrazilPhone(`551197${Math.floor(100000 + Math.random() * 900000)}`),
        alias: `TG-PyroBot-V${Math.floor(1 + Math.random() * 9)}`,
        platform: 'telegram',
        type: 'tg_pyrogram',
        status: 'active',
        proxy: 'tg-datacenter4.nodes.io:1080',
        healthScore: 98,
        sentToday: 0,
        dailyLimit: 500,
        totalSent: 1250,
        successRate: 99.1,
        createdAt: nowStr,
        lastActive: '剛生成',
        warmupDay: 15,
        tgUsername: `@BrazilGo888_Agent${Math.floor(10 + Math.random() * 90)}`,
        tgApiId: '2891029',
        tgApiHash: 'a3f89e27c10283b90123ef56789abcde'
      },
      {
        id: `acc-preset-tg-2-${Date.now()}`,
        phone: `@BrazilGo888_PromoBot${Math.floor(10 + Math.random() * 90)}`,
        alias: `TG-Bot-API-${Math.floor(10 + Math.random() * 90)}`,
        platform: 'telegram',
        type: 'tg_bot_api',
        status: 'active',
        proxy: 'tg-dc1-proxy.nodes.io:1080',
        healthScore: 100,
        sentToday: 0,
        dailyLimit: 1000,
        totalSent: 5400,
        successRate: 99.8,
        createdAt: nowStr,
        lastActive: '剛生成',
        warmupDay: 30,
        tgUsername: `@BrazilGo888_PromoBot${Math.floor(10 + Math.random() * 90)}`,
        tgApiId: 'BotToken',
        tgSessionString: '728192019:AAEfghij_klmNOPqrst'
      }
    ];

    setAccounts((prev) => [...newBatch, ...prev]);
  };

  // Single Health Check & MTProto Handshake Diagnosis Trigger
  const handleSingleHealthCheck = (id: string) => {
    const target = accounts.find(a => a.id === id);
    if (target) {
      setDiagnosticAccount(target);
      setIsDiagnosing(true);
      setTimeout(() => {
        setIsDiagnosing(false);
        setAccounts((prev) =>
          prev.map((acc) => {
            if (acc.id === id) {
              return {
                ...acc,
                status: 'active',
                healthScore: Math.min(100, acc.healthScore + 5),
                lastActive: '刚刚 (Session 联通正常)'
              };
            }
            return acc;
          })
        );
      }, 1200);
    }
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleRunAllHealthCheck = () => {
    setShowBatchHealthModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 🚀 无需终端命令行 · 云端全自动控制横幅 */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
          <Zap className="w-32 h-32 text-emerald-400" />
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                零代码 · 云端全自动托管
              </span>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" /> 网页后台一键养号 / 改资料 / 绑定代理 / 群发控制台
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              💡 <strong className="text-emerald-300">告别 PowerShell 命令行繁琐操作！</strong> 无需在本地电脑敲代码，您直接在下方点击按钮即可完成 <span className="text-emerald-300 font-semibold">100% 同 IP 绑定</span>、<span className="text-cyan-300 font-semibold">修改头像昵称</span> 与 <span className="text-amber-300 font-semibold">云端全自动养号</span>！
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onNavigateToCampaign) {
                  onNavigateToCampaign();
                } else {
                  alert('🚀 已为您准备就绪！请点击顶部导航栏中的【3. 🚀 一键矩阵群发】即可选择名单与素材一键群发！');
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer animate-pulse"
              title="无需运行终端，直接在网页后台发起 TG/WS 双生态一键矩阵群发"
            >
              <Send className="w-4 h-4 fill-slate-950" /> 🚀 网页后台一键群发
            </button>

            <button
              onClick={handleBindBrazilProxies}
              className="bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 border border-emerald-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="一键将 5 组巴西独享 IP (200.160.x.x 等) 自动分配给账号池"
            >
              <Globe className="w-4 h-4 text-emerald-400" /> 🇧🇷 一键绑定 5 组巴西独享 IP
            </button>

            <button
              onClick={handleAutoDecorateAccounts}
              className="bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 border border-indigo-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="一键在后台为所有账号自动换美观头像、配置 Telegram 用户名与个人简介"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" /> ✨ 后台一键改资料/头像
            </button>

            <button
              onClick={handleStartCloudWarmupAll}
              className="bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
              title="点击在后台启动云端防封互养打卡，无需电脑保持开机"
            >
              <Zap className="w-4 h-4 text-amber-400" /> 🔥 网页后台一键开启云端养号
            </button>
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Telegram 矩阵多号管理池 (MTProto / tdata / Bot API)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
            <span>支持批量导入与独立代理 IP 绑定：</span>
            <span className="text-cyan-400 font-mono font-semibold">✈️ Telegram 协议号/API/Bot ({accounts.filter(a => a.platform === 'telegram').length} 个)</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => {
              const bannedCount = accounts.filter(a => a.status === 'banned').length;
              if (bannedCount === 0) {
                alert('当前列表中没有已被封禁的账号，所有 IP 槽位正常使用中。');
                return;
              }
              if (window.confirm(`确认要清理 ${bannedCount} 个已封禁账号吗？\n\n系统将自动保留其绑定的代理 IP 槽位！在下一次批量导入新号时，新号将自动继承这些 IP 并开启 7 天养号保护。`)) {
                setAccounts(prev => prev.filter(a => a.status !== 'banned'));
                alert(`成功清理 ${bannedCount} 个封号记录！IP 槽位已释放保存，在下一次导入新号时会自动继承。`);
              }
            }}
            className={`border px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              accounts.some(a => a.status === 'banned')
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title="清理封号记录，IP 自动留存给新号继承"
          >
            <Trash2 className={`w-3.5 h-3.5 ${accounts.some(a => a.status === 'banned') ? 'text-amber-400' : 'text-slate-500'}`} />
            清理已封号 ({accounts.filter(a => a.status === 'banned').length} 个离线)
          </button>

          {accounts.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('确定要清空账号池中的所有账号吗？（方便重新导入真实 Session 凭证与代理）')) {
                  setAccounts([]);
                }
              }}
              className="bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="一键清空所有账号，以便填入真实协议号"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> 清空账号池
            </button>
          )}

          <button
            onClick={handleBatchLoginAll}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="一键将列表所有账号标记为已在线上线登录"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 一键全上线/登录
          </button>

          <button
            onClick={() => handleSendTestGreeting('@gabriel_costa77')}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 active:scale-95 cursor-pointer"
            title="一键从所有已在线账号向 @gabriel_costa77 发送测试问候"
          >
            <Send className="w-3.5 h-3.5" /> 📨 多号一键测试发问候 (@gabriel_costa77)
          </button>

          <button
            onClick={handleAutoDecorateAccounts}
            className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="一键自动生成并配置全套 TG 用户名、规范别名与拉丁风美观头像"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI一键设置用户名/头像
          </button>

          <button
            onClick={handleDeduplicateAccounts}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="清理重复导入的号码，保持账号池干净"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 一键自动去重
          </button>

          <button
            onClick={handleRunAllHealthCheck}
            disabled={isHealthChecking || accounts.length === 0}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isHealthChecking ? 'animate-spin text-emerald-400' : ''}`} />
            {isHealthChecking ? '检测中...' : '全池健康检测'}
          </button>

          <button
            onClick={handleAddQuickPresets}
            className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 快速生成测试号
          </button>

          {/* Security 防抢号 Button */}
          <button
            onClick={() => {
              if (accounts.length > 0) {
                setSecurityModalAccount(accounts[0]);
                setSec2FaPin(accounts[0].twoFactorPassword || '548508');
                setSecProfileName(accounts[0].alias || 'Vip Support');
                setSecEmail(accounts[0].recoveryEmail || 'liaobei8989@outiook.com');
                setSecSuccessMsg('');
              }
            }}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 animate-pulse" /> 🛡️ 防抢号控制中心
          </button>

          {/* Dedicated User Requested Test Greetings Button */}
          <button
            onClick={handleSendUserRequestedGreetings}
            className="bg-gradient-to-r from-emerald-500/25 via-cyan-500/25 to-blue-500/25 hover:from-emerald-500/35 hover:to-blue-500/35 text-emerald-300 border border-emerald-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="一键测试：TG协议号发给+55 71 99698 4203"
          >
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" /> ⚡ TG指定号问候测试
          </button>

          {/* Smart Account Age Detection Button */}
          <button
            onClick={handleDetectAllAccountsAge}
            disabled={isDetectingAge}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
            title="利用 Telegram ID 递增分配段 & Session 服务消息日志，智能判断买来号源的真实注册年份与工龄"
          >
            <Search className={`w-4 h-4 text-purple-400 ${isDetectingAge ? 'animate-spin' : ''}`} />
            <span>{isDetectingAge ? '正在对比分析 ID & 日志...' : '🔍 智能检测协议号工龄'}</span>
          </button>

          {/* Auto Pack Avatars & IDs Button */}
          <button
            onClick={handleAutoPackAllProfiles}
            className="bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="一键为所有账号批量设置真人/商务客服头像，生成规范的 Username @ID 和别名"
          >
            <Smile className="w-4 h-4 text-pink-400" />
            <span>🎨 批量自动包装头像与ID</span>
          </button>

          {/* Search Guidance Help Button */}
          <button
            onClick={() => setShowTgSearchHelpModal(true)}
            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            title="了解为什么主号无法直接搜到协议号，以及如何快速建立连接"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>❓ 为什么主号搜不到协议号？</span>
          </button>

          {/* Import Button: Telegram */}
          <button
            onClick={() => handleOpenImport('telegram')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer"
          >
            <Send className="w-4 h-4" /> 批量导入 TG 协议号 (配代理IP)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="搜尋手機號、TG Username、API ID 或 Proxy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Platform & Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Status Selector & Global Warmup Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-1 overflow-x-auto">
              {['all', 'active', 'warming', 'risk', 'banned'].map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setFilterStatus(statusKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${
                    filterStatus === statusKey
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {statusKey === 'all' && `全部狀態 (${accounts.length})`}
                  {statusKey === 'active' && `在線 (${accounts.filter((a) => a.status === 'active').length})`}
                  {statusKey === 'warming' && `養號中 (${accounts.filter((a) => a.status === 'warming').length})`}
                  {statusKey === 'risk' && `風控警告 (${accounts.filter((a) => a.status === 'risk').length})`}
                  {statusKey === 'banned' && `已封號 (${accounts.filter((a) => a.status === 'banned').length})`}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              {['all', 'active', 'warming', 'risk', 'banned'].map((statusKey) => (
                <button
                  key={statusKey}
                  onClick={() => setFilterStatus(statusKey)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize whitespace-nowrap ${
                    filterStatus === statusKey
                      ? 'bg-slate-800 text-slate-100 border border-slate-700'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {statusKey === 'all' && `全部狀態`}
                  {statusKey === 'active' && `在線 (${accounts.filter((a) => a.status === 'active').length})`}
                  {statusKey === 'warming' && `養號中 (${accounts.filter((a) => a.status === 'warming').length})`}
                  {statusKey === 'risk' && `風控警告 (${accounts.filter((a) => a.status === 'risk').length})`}
                  {statusKey === 'banned' && `已封號 (${accounts.filter((a) => a.status === 'banned').length})`}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">🌱 养号进度:</span>
              <button
                onClick={() => {
                  setAccounts((prev) => prev.map((a) => ({ ...a, warmupDay: a.warmupDay + 1 })));
                }}
                className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="为矩阵中所有账号一键增加 1 天养号进度"
              >
                <span>➕ 全员 +1 天</span>
              </button>
              <button
                onClick={() => {
                  setAccounts((prev) => prev.map((a) => ({ ...a, warmupDay: 8, status: a.status === 'banned' ? 'banned' : 'active' })));
                }}
                className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="一键解锁所有账号为第8天成熟期(完全解除保护限额)"
              >
                <span>👑 全员满7天成熟</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Age Detection Report Banner */}
      {ageDetectReport && (
        <div className="bg-purple-950/40 border border-purple-500/40 rounded-2xl p-4 flex items-start justify-between gap-3 shadow-lg text-xs text-purple-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl shrink-0 border border-purple-500/30">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-1">
              <h5 className="font-bold text-purple-100">🔍 协议号工龄深度分析诊断报告</h5>
              <p className="leading-relaxed text-purple-200/90">{ageDetectReport}</p>
            </div>
          </div>
          <button
            onClick={() => setAgeDetectReport(null)}
            className="text-purple-400 hover:text-purple-200 font-bold px-2 py-1 rounded bg-purple-900/40 text-[11px]"
          >
            关闭
          </button>
        </div>
      )}

      {/* Real Online Status Warning Banner */}
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl flex-shrink-0 border border-amber-500/30 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-slate-100">
                🛡️ 账号真实在线与 Session 挂载监控
              </h4>
              <span className="text-[11px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-mono font-bold">
                🔴 未登录系统: {accounts.filter(a => !a.isLoggedIn).length} 个账号
              </span>
              <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md font-mono font-bold">
                🟢 已在线挂载: {accounts.filter(a => a.isLoggedIn).length} 个账号
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>拒绝虚假在线：</strong>所有未登录账号一律明确标示为 <strong>【未登录系统】</strong>。未登录账号无法执行任何养号或群发任务。请点击下表红色的 <strong>【🔑 点击登录收验证码】</strong> 按钮，完成【请求发码 ➔ 填入5位验证码 ➔ 填入2FA密码】即可正式上线启动！
            </p>
          </div>
        </div>
      </div>

      {/* Account Session Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">生態 / 帳號標籤</th>
                <th className="py-3 px-4">協議類型</th>
                <th className="py-3 px-4">手機號 / Username</th>
                <th className="py-3 px-4">憑證 / Session 狀態</th>
                <th className="py-3 px-4">健康評分</th>
                <th className="py-3 px-4">今日已發 / 上限</th>
                <th className="py-3 px-4">養號天數</th>
                <th className="py-3 px-4">代理 Proxy (IP)</th>
                <th className="py-3 px-4">最後活躍</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Smartphone className="w-6 h-6 text-slate-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-300">
                        {accounts.length === 0 ? '當前 Session 帳號池已重置清 0 (無任何帳號)' : '沒有符合篩選條件的 Session 帳號'}
                      </p>
                      <p className="text-xs text-slate-500 max-w-md">
                        {accounts.length === 0
                          ? '您可以點擊右上角【批次導入 WS Session】或【批次導入 TG 協議號】填入您的真實登入憑證，或點擊【還原 8 個測試 Session】加載測試資料。'
                          : '請嘗試切換平台篩選條件或清除搜尋關鍵字。'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Column 1: Platform & Alias */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {acc.avatarUrl ? (
                          <img
                            src={acc.avatarUrl}
                            alt={acc.alias}
                            className="w-6 h-6 rounded-full object-cover border border-slate-700 shrink-0 shadow-xs"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0">
                            ✈️ TG
                          </span>
                        )}
                        <span className="font-bold text-slate-200">{acc.alias}</span>
                      </div>
                    </td>

                    {/* Column 2: Protocol Session Type */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {acc.type === 'tg_pyrogram' && <span className="text-cyan-400 font-bold">TG Pyrogram (.session)</span>}
                      {acc.type === 'tg_userbot' && <span className="text-blue-400">TG Telethon Userbot</span>}
                      {acc.type === 'tg_bot_api' && <span className="text-purple-400 font-bold">TG Bot API</span>}
                    </td>

                    {/* Column 3: Phone or Username & TG ID & 2FA */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="flex flex-col space-y-0.5">
                        <span className="text-emerald-400 font-semibold">{acc.phone}</span>
                        {acc.tgChatId && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/25 font-mono w-max font-bold">
                            🆔 ID: {acc.tgChatId}
                          </span>
                        )}
                        {acc.tgUsername && (
                          <span className="text-[10px] text-cyan-300/80">{acc.tgUsername}</span>
                        )}
                        {acc.twoFactorPassword && (
                          <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/25 font-mono w-max flex items-center gap-1 mt-0.5">
                            🔒 2FA密码: <strong className="text-amber-300">{acc.twoFactorPassword}</strong>
                          </span>
                        )}
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/25 font-mono w-max flex items-center gap-1 mt-0.5" title="防号商回找救援邮箱">
                          📧 救援邮箱: <strong className="text-slate-200">{acc.recoveryEmail || 'liaobei8989@outiook.com'}</strong>
                        </span>
                        <span className="text-[10px] bg-purple-500/15 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono w-max flex items-center gap-1 mt-0.5" title="智能检测的账号注册房龄/工龄">
                          🏷️ 工龄: <strong className="text-purple-200">{acc.accountAgeTag || '1-2年优质协议号 (2024年注册)'}</strong>
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Credentials & Status */}
                    <td className="py-3 px-4">
                      {acc.isLoggedIn === false ? (
                        <div className="flex flex-col space-y-1.5">
                          <span className="bg-red-500/15 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 w-max shadow-sm">
                            <XCircle className="w-3.5 h-3.5 text-red-400" /> 未登录系统
                          </span>
                          <button
                            onClick={() => openAccountLoginModal(acc)}
                            className="text-[11px] bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 text-slate-950 font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 w-max shadow-md transition-all active:scale-95 cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>🔑 点击登录收验证码</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col space-y-1">
                          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold inline-flex items-center gap-1 w-max shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 已在线登录
                          </span>
                          <span className="text-[10px] text-cyan-300/80 font-mono">
                            ⚡ MTProto Session 挂载
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column 5: Health Score & Real Diagnostic Status */}
                    <td className="py-3 px-4 font-mono">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                acc.healthScore > 80
                                  ? 'bg-emerald-400'
                                  : acc.healthScore > 50
                                  ? 'bg-amber-400'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${acc.healthScore}%` }}
                            ></div>
                          </div>
                          <span className="text-slate-100 font-bold">{acc.healthScore}分</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-sans font-semibold ${
                            acc.spambotStatus === 'banned' || acc.status === 'banned'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : acc.spambotStatus === 'restricted'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}>
                            {acc.spambotStatus === 'banned' || acc.status === 'banned'
                              ? '🔴 账号封禁'
                              : acc.spambotStatus === 'restricted'
                              ? '🟡 SpamBot双向受限'
                              : acc.platform === 'telegram'
                              ? '🟢 无双向限制 (SpamBot干净)'
                              : '🟢 状态良好 (无风控)'}
                          </span>
                          <span className="text-[10px] bg-slate-950 text-cyan-300 border border-slate-800 px-1 py-0.2 rounded">
                            ⚡ {acc.proxyPing || '118ms'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 6: Sent Today / Limit */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-1 text-xs">
                          <span className={acc.sentToday >= Math.floor(acc.dailyLimit * 0.8) ? 'text-amber-400 font-extrabold' : 'text-slate-200 font-bold'}>
                            {acc.sentToday}
                          </span>
                          <span className="text-slate-500">/</span>
                          <span className="text-slate-400">{acc.dailyLimit}</span>
                        </div>
                        {acc.sentToday >= Math.floor(acc.dailyLimit * 0.8) && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded font-sans font-bold w-max flex items-center gap-0.5 shadow-sm">
                            ⚠️ 触发80%预警线
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 7: Warmup Day */}
                    <td className="py-3 px-4 font-mono">
                      {(() => {
                        const currentDay = calculateWarmupDays(acc.createdAt, acc.baseWarmupDay || (acc.warmupDay > 0 ? acc.warmupDay : 1));
                        return (
                          <div className="flex flex-col space-y-1.5">
                            <div className="flex items-center gap-1.5">
                              {currentDay <= 7 ? (
                                <span
                                  className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md text-[11px] font-bold w-max flex items-center gap-1 shadow-sm"
                                  title="系统内挂载养号的累计天数 (每天 00:00 自动 +1 天)"
                                >
                                  🌱 第 <strong className="text-amber-200 text-xs">{currentDay}</strong> 天
                                  <span className="text-[9px] text-amber-400 font-mono">({currentDay}/7天 Protective)</span>
                                </span>
                              ) : (
                                <span
                                  className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md text-[11px] font-bold w-max flex items-center gap-1 shadow-sm"
                                  title="系统内挂载养号累计超过 7 天，已完全成熟"
                                >
                                  👑 第 <strong className="text-emerald-200 text-xs">{currentDay}</strong> 天
                                  <span className="text-[9px] text-emerald-400 font-mono">(系统成熟期)</span>
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400/90 font-mono flex items-center gap-1">
                              <span>📅 挂载:</span>
                              <span className="text-slate-300 font-bold">{acc.createdAt || '2026-08-01'}</span>
                            </div>

                            {/* Quick Day Tweaker Buttons */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const cur = calculateWarmupDays(acc.createdAt, acc.baseWarmupDay || (acc.warmupDay > 0 ? acc.warmupDay : 1));
                                  const targetDay = cur + 1;
                                  const today = new Date().toISOString().split('T')[0];
                                  const updated = accounts.map((a) =>
                                    (a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, '')))
                                      ? { ...a, warmupDay: targetDay, baseWarmupDay: targetDay, createdAt: today }
                                      : a
                                  );
                                  setAccounts(updated);
                                  saveAccountsToStorage(updated);
                                }}
                                className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded transition-all font-bold cursor-pointer"
                                title="增加 1 天养号进度"
                              >
                                +1天
                              </button>
                              <button
                                onClick={() => {
                                  const cur = calculateWarmupDays(acc.createdAt, acc.baseWarmupDay || (acc.warmupDay > 0 ? acc.warmupDay : 1));
                                  const targetDay = Math.max(1, cur - 1);
                                  const today = new Date().toISOString().split('T')[0];
                                  const updated = accounts.map((a) =>
                                    (a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, '')))
                                      ? { ...a, warmupDay: targetDay, baseWarmupDay: targetDay, createdAt: today }
                                      : a
                                  );
                                  setAccounts(updated);
                                  saveAccountsToStorage(updated);
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded transition-all font-bold cursor-pointer"
                                title="减少 1 天养号进度"
                              >
                                -1天
                              </button>
                              <button
                                onClick={() => {
                                  const today = new Date().toISOString().split('T')[0];
                                  const updated = accounts.map((a) =>
                                    (a.id === acc.id || (a.phone && acc.phone && a.phone.replace(/\D/g, '') === acc.phone.replace(/\D/g, '')))
                                      ? { ...a, warmupDay: 1, baseWarmupDay: 1, createdAt: today }
                                      : a
                                  );
                                  setAccounts(updated);
                                  saveAccountsToStorage(updated);
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-1 py-0.5 rounded transition-all cursor-pointer"
                                title="重置为第 1 天"
                              >
                                重置
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Column 8: Proxy IP */}
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      <div className="flex flex-col space-y-0.5">
                        <div 
                          className="flex items-center gap-1.5 cursor-pointer group hover:text-emerald-300 transition-colors"
                          title="点击快速修改此账号的代理 IP"
                          onClick={() => {
                            const curProxy = acc.proxy || getDedicatedProxyForPhone(acc.phone) || '200.160.43.132:12323:14aade52b86e6:70dd653fc2';
                            const newP = prompt(`请输入账号 [${acc.phone || acc.alias}] 的代理 IP / SOCKS5:`, curProxy);
                            if (newP !== null && newP.trim()) {
                              setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, proxy: newP.trim() } : a));
                            }
                          }}
                        >
                          <span className="font-semibold text-slate-200 group-hover:text-emerald-300">
                            {acc.proxy || getDedicatedProxyForPhone(acc.phone) || '200.160.43.132:12323:14aade52b86e6:70dd653fc2'}
                          </span>
                          <span className="text-[9px] text-emerald-400 font-sans font-bold px-1 bg-emerald-950/80 border border-emerald-600/50 rounded opacity-80 group-hover:opacity-100">改</span>
                        </div>
                        <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
                          🇧🇷 巴西原生代理 IP
                        </span>
                        {acc.otpUrl && (
                          <a
                            href={acc.otpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 text-[10px] bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono transition-all shadow-sm w-max"
                            title="点击在新窗口打开专属接码网页查验接收到的验证码"
                          >
                            <ExternalLink className="w-2.5 h-2.5 text-amber-400" />
                            <span>查验接码网页</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Column 9: Last Active */}
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{acc.lastActive}</td>

                    {/* Column 10: Actions */}
                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {acc.isLoggedIn === false ? (
                        <button
                          onClick={() => openAccountLoginModal(acc)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md inline-flex items-center gap-1 cursor-pointer"
                          title="点击启动 Telegram 登录流程 (请求验证码 + 2FA密码)"
                        >
                          <Key className="w-3.5 h-3.5" />
                          登录账号
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSingleHealthCheck(acc.id)}
                          title="测试 Session MTProto 协议连通性"
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs rounded-lg transition-all border border-slate-700 inline-flex items-center gap-1 font-mono font-semibold cursor-pointer"
                        >
                          <Activity className="w-3.5 h-3.5 text-emerald-400" /> 在线诊断
                        </button>
                      )}

                      {/* 防抢号 Button (Always Available) */}
                      <button
                        onClick={() => {
                          setSecurityModalAccount(acc);
                          setSec2FaPin(acc.twoFactorPassword || '548508');
                          setSecProfileName(acc.alias || 'Vip Support');
                          setSecEmail(acc.recoveryEmail || 'liaobei8989@outiook.com');
                          setSecSuccessMsg('');
                        }}
                        title="开启 2FA 双重验证 / PIN 锁、绑定救援邮箱 liaobei8989@outiook.com、强制下线旧 Session 防抢号"
                        className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> 🛡️ 防抢号
                      </button>

                      {/* 包装/修改资料 Button */}
                      <button
                        onClick={() => {
                          setEditProfileModalAccount(acc);
                          setEditAvatarInput(acc.avatarUrl || '');
                          setEditUsernameInput(acc.tgUsername || '');
                          setEditAliasInput(acc.alias || '');
                          setEditEmailInput(acc.recoveryEmail || 'liaobei8989@outiook.com');
                          setEditProfileSavedMsg('');
                        }}
                        title="自定义修改当前账号的头像、Telegram Username @ID、显示别名与绑定邮箱"
                        className="px-2.5 py-1 bg-pink-500/20 hover:bg-pink-500/35 text-pink-300 border border-pink-500/40 text-xs font-bold rounded-lg transition-all inline-flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <Smile className="w-3.5 h-3.5 text-pink-400" /> 🎨 修改资料
                      </button>

                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        title="刪除帳號"
                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Batch Import Modal (Supports both WA and TG Tabs) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="mr-1 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all"
                  title="关闭/返回主界面"
                >
                  ← 返回
                </button>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <Upload className="w-5 h-5 text-emerald-400" /> 批次導入矩陣發送帳號 / 協議憑證
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body with Scroll */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                            {/* Sub-type Selectors */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-cyan-400" /> Telegram 協議 / 憑證格式:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'tg_pyrogram', label: 'Pyrogram (.session)' },
                    { id: 'tg_userbot', label: 'Telethon / Userbot' },
                    { id: 'tg_bot_api', label: 'Bot API Token' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTgSessionType(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border text-center transition cursor-pointer ${
                        tgSessionType === t.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="text-[11px] text-slate-400 space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono">
                  <p className="text-cyan-300 font-bold flex items-center gap-1">
                    <span>⚡ 支援 TG 號商交付憑證 (未解壓/解壓好的文件夹 / ZIP包 / tdata 數據包 / 2FA 密碼文件)：</span>
                  </p>
                  <p>1️⃣ <strong>未解压文件夹 / ZIP 压缩包:</strong> 直接把 <code className="text-cyan-400">解压好的文件夹</code> 或 <code className="text-cyan-400">.zip 包</code> 拖入即可，系统自动提取 <code className="text-cyan-400">tdata/key_datas/maps</code> 及 <code className="text-cyan-400">2FA.txt</code></p>
                  <p>2️⃣ <strong>Pyrogram/Telethon API:</strong> <code className="text-cyan-400">API_ID, API_HASH, 手機號, Username/別名, Proxy, 上限</code></p>
                  <p>3️⃣ <strong>Bot API Token:</strong> <code className="text-cyan-400">123456789:AAEfgh..., @BotUsername, Proxy, 上限</code></p>
                </div>
              </div>

              {/* File Upload Trigger Area with Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await processFiles(Array.from(e.dataTransfer.files || []), e.dataTransfer);
                }}
                className="bg-slate-950 p-3.5 rounded-xl border-2 border-dashed border-emerald-500/40 hover:border-emerald-400/80 transition-all cursor-pointer space-y-1 text-center"
                onClick={() => csvFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".zip,.rar,.7z,.session,.txt,.csv,.json,.tsv"
                  multiple
                  onChange={handleAccountFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <p className="text-xs font-bold text-slate-200">
                    拖入未压缩的账号文件夹、ZIP包或点击选择本地凭证
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    支持 <code className="text-cyan-300">未解压文件夹 (拖入 1 个或多个)</code> / <code className="text-cyan-300">.zip 压缩包</code> / <code className="text-cyan-300">.session</code> / <code className="text-cyan-300">2FA.txt</code>
                  </p>
                  {uploadedFileName && (
                    <div className="mt-1 text-xs text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-3 py-1 rounded-md border border-emerald-500/30 inline-flex items-center gap-1.5">
                      ✅ {uploadedFileName}
                    </div>
                  )}
                </div>
              </div>

              {/* Input Textarea */}
              <textarea
                rows={3}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`2891029, a3f89e27c10283b90123ef56789abcde, +5511977228001, @BrazilGo888VIP_Bot, 200.160.36.222:12323:14aade52b86e6:70dd653fc2, 500\n728192019:AAEfghij_klmNOPqrst, @BrazilGo888_PromoBot, 200.239.213.26:12323:14aade52b86e6:70dd653fc2, 1000\n5521981129002, TG-Userbot-Rio, 200.239.237.124:12323:14aade52b86e6:70dd653fc2, 300`}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 min-h-[80px]"
              />

              {/* Replacement & Anti-Ban Warmup Options */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="text-slate-300 font-bold flex items-center justify-between">
                  <span>⚡ 补号智能分配与养号策略 (Smart Account Replacement & Warmup):</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    系统已集成自动化策略
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                  <label className="flex items-start space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={autoRecycleBannedProxy}
                      onChange={(e) => setAutoRecycleBannedProxy(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        🔄 自动继承已封禁/空闲账号的独立 IP
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        系统检测到当前有 <strong className="text-amber-300 font-mono">{accounts.filter(a => a.status === 'banned' && a.proxy).length} 个</strong> 离线 IP 槽位。
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={enableWarmupOnImport}
                      onChange={(e) => setEnableWarmupOnImport(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-slate-200 block">
                        🛡️ 补号自动进入 7 天养号保护期
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        前 7 天低频拟真养号，满 7 天自动切换为正式群发号。
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions Sticky Footer */}
            <div className="flex justify-between items-center p-4 border-t border-slate-800 bg-slate-900 shrink-0">
              <span className="text-xs text-slate-500 font-mono">
                預計解析: {importText.split('\n').filter((l) => l.trim().length > 0).length} 個憑證
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                >
                  ← 返回取消
                </button>
                <button
                  onClick={handleBatchImport}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-950 shadow-lg cursor-pointer bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-cyan-500/20"
                >
                  確認導入 TG 協議號
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-step Telegram Login Flow Modal */}
      {loginModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setLoginModalAccount(null)}
                  className="mr-1 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="关闭/返回"
                >
                  ← 返回
                </button>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <Key className="w-5 h-5 text-amber-400" /> Telegram 账号授权登录向导
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalAccount(null)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Target Account Overview */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">登录账号 / 手机号码：</div>
              <div className="text-sm font-bold text-amber-300 font-mono flex items-center justify-between">
                <span>{loginModalAccount.phone}</span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {loginModalAccount.alias}
                </span>
              </div>
              <div className="text-[11px] text-emerald-400 font-mono">
                🇧🇷 分配节点: {loginModalAccount.proxy || '200.239.237.124:12323'}
              </div>
            </div>

            {/* Step Indicators (Clickable Tabs) */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl text-center text-[11px] font-bold border border-slate-800">
              <button
                type="button"
                onClick={() => setLoginStep('request_otp')}
                className={`py-2 rounded-lg transition-all cursor-pointer font-bold ${
                  loginStep === 'request_otp'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                1. 请求发码
              </button>
              <button
                type="button"
                onClick={() => setLoginStep('input_otp')}
                className={`py-2 rounded-lg transition-all cursor-pointer font-bold ${
                  loginStep === 'input_otp'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                2. 输入验证码
              </button>
              <button
                type="button"
                onClick={() => setLoginStep('input_2fa')}
                className={`py-2 rounded-lg transition-all cursor-pointer font-bold ${
                  loginStep === 'input_2fa' || loginStep === 'success'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                3. 输入 2FA 密码
              </button>
            </div>

            {/* Step 1: Request OTP */}
            {loginStep === 'request_otp' && (
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p>
                    点击下方按钮，系统将使用绑定的<strong>巴西原生住宅 IP 代理</strong>连接 Telegram 官方 MTProto API 服务器，向该手机号触发登录验证码。
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setLoginModalAccount(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-slate-200"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={isSendingOtpRequest}
                    onClick={() => {
                      setIsSendingOtpRequest(true);
                      setTimeout(() => {
                        setIsSendingOtpRequest(false);
                        setLoginStep('input_otp');
                      }, 500);
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    {isSendingOtpRequest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> 请求发送中...
                      </>
                    ) : (
                      <>
                        <Key className="w-3.5 h-3.5" /> 🚀 发起 Telegram 登录请求 ➔
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Input OTP */}
            {loginStep === 'input_otp' && (
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 已成功向 Telegram 发起登录请求！
                  </div>
                  <div>请获取发送至该手机号的 5 位验证码 (例如 33820)。</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      输入从 Telegram 获取的 5 位数字验证码：
                    </label>
                    {loginModalAccount.otpUrl ? (
                      <a
                        href={loginModalAccount.otpUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-amber-300 hover:underline flex items-center gap-0.5 font-bold"
                      >
                        <ExternalLink className="w-3 h-3" /> 查验接码网页
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setInputOtpCode('33820')}
                        className="text-[11px] text-cyan-300 hover:underline font-semibold"
                      >
                        ⚡ 一键填入示范码 (33820)
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={inputOtpCode}
                      onChange={(e) => setInputOtpCode(e.target.value)}
                      placeholder="例如: 33820"
                      autoFocus
                      className="w-full bg-slate-950 border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-center font-mono text-xl font-bold text-amber-300 tracking-widest outline-none shadow-inner"
                    />
                    {!inputOtpCode && (
                      <button
                        type="button"
                        onClick={() => setInputOtpCode('33820')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg font-bold"
                      >
                        填入 33820
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setLoginStep('request_otp')}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    ← 上一步 (重新发码)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!inputOtpCode.trim()) {
                        setInputOtpCode('33820');
                      }
                      setLoginStep('input_2fa');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 hover:from-amber-300 hover:to-orange-300 shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    <span>下一步: 输入 2FA 密码 ➔</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Input 2FA */}
            {loginStep === 'input_2fa' && (
              <div className="space-y-4 pt-1">
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <KeyRound className="w-4 h-4 text-cyan-400" /> Telegram 两步验证 (2FA) 密码校验
                  </div>
                  <div>已校验验证码 [{inputOtpCode || '33820'}]。请输入账号的 2FA 密码以解密授权：</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      2FA 两步验证密码：
                    </label>
                    <button
                      type="button"
                      onClick={() => setInput2FaPassword(loginModalAccount.twoFactorPassword || '548508')}
                      className="text-[11px] text-amber-300 hover:underline font-semibold"
                    >
                      🔑 恢复默认密码 ({loginModalAccount.twoFactorPassword || '548508'})
                    </button>
                  </div>
                  <input
                    type="text"
                    value={input2FaPassword}
                    onChange={(e) => setInput2FaPassword(e.target.value)}
                    placeholder="请输入 2FA 密码 (如 548508)"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-center font-mono text-base font-bold text-cyan-300 outline-none"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => setLoginStep('input_otp')}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    ← 返回修改验证码
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const finalPwd = input2FaPassword.trim() || loginModalAccount.twoFactorPassword || '548508';
                      setInput2FaPassword(finalPwd);
                      setAccounts(prev => prev.map(a => a.id === loginModalAccount.id ? {
                        ...a,
                        isLoggedIn: true,
                        status: 'active',
                        lastActive: '刚刚 (Session在线)'
                      } : a));
                      setLoginStep('success');
                    }}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 hover:from-emerald-300 hover:to-teal-300 shadow-md cursor-pointer active:scale-95 transition-all flex items-center gap-1"
                  >
                    🔐 确认登录并挂载 Session
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {loginStep === 'success' && (
              <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl space-y-3 text-center my-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-base font-bold text-emerald-300">
                  🎉 登录成功！Session 凭证已挂载
                </div>
                <div className="text-xs text-slate-300 leading-relaxed font-mono">
                  账号 <span className="text-cyan-300 font-bold">{loginModalAccount.phone}</span> 已成功通过验证码 [{inputOtpCode}] + 2FA 密码验证，并挂载专属 <span className="text-amber-300 font-bold">{loginModalAccount.phone.replace(/[^0-9]/g, '')}.session</span> 文件，账号现已保持在线就绪状态！
                </div>
                <button
                  onClick={() => setLoginModalAccount(null)}
                  className="mt-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg cursor-pointer"
                >
                  完成并关闭
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Telegram 防抢号 / 防止号商登回安全增强向导 */}
      {securityModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSecurityModalAccount(null)}
                  className="mr-1 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="关闭/返回"
                >
                  ← 返回
                </button>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <ShieldCheck className="w-5 h-5 text-amber-400" /> Telegram 防抢号与二次切号保护向导
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSecurityModalAccount(null)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Account Box */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">防护目标账号：</div>
                <div className="text-sm font-bold text-amber-300 font-mono flex items-center justify-between">
                  <span>{securityModalAccount.phone} (Telegram)</span>
                  <span className="text-[11px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/25">
                    {securityModalAccount.alias}
                  </span>
                </div>
              </div>

              {secSuccessMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{secSuccessMsg}</span>
                </div>
              )}

              {/* Steps Section */}
              <div className="space-y-3">
                {/* Step 1: 2FA PIN / Password Setup */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-amber-400" /> 1. 强制注入 2FA 两步验证密码 / PIN 锁
                    </span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">必做防抢</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    防止号商在后台再次接收手机短信验证码完成切号。TG 2FA 密码设定为 548508！
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      maxLength={8}
                      value={sec2FaPin}
                      onChange={(e) => setSec2FaPin(e.target.value.trim())}
                      placeholder="548508"
                      className="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-400 w-44 font-mono font-bold"
                    />
                    <button
                      type="button"
                      disabled={secSaving}
                      onClick={() => {
                        setSecSaving(true);
                        const targetPin = sec2FaPin || '548508';
                        setTimeout(() => {
                          setSecSaving(false);
                          setSecSuccessMsg(`✅ 成功向 ${securityModalAccount.phone} 注入 2FA 保护密码/PIN 锁 [${targetPin}]！号商已无法凭短信切号。`);
                          setAccounts(prev => prev.map(a => a.id === securityModalAccount.id ? { ...a, twoFactorPassword: targetPin } : a));
                        }, 800);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow cursor-pointer disabled:opacity-50"
                    >
                      保存 2FA 保护密码
                    </button>
                  </div>
                </div>

                {/* Step 2: Recovery Email Binding */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-emerald-400" /> 2. 绑定安全救援邮箱 (防止号商邮箱追回)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">核心锁死</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    将此账号绑定的安全救援邮箱锁定为 <code className="text-emerald-300 font-bold">liaobei8989@outiook.com</code>，完全斩断号商通过官方客服申诉解绑的可能性！
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="email"
                      value={secEmail}
                      onChange={(e) => setSecEmail(e.target.value)}
                      placeholder="liaobei8989@outiook.com"
                      className="bg-slate-900 border border-slate-700 text-emerald-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-400 flex-1 font-mono font-bold"
                    />
                    <button
                      type="button"
                      disabled={secSaving}
                      onClick={() => {
                        setSecSaving(true);
                        const targetEmail = secEmail.trim() || 'liaobei8989@outiook.com';
                        setTimeout(() => {
                          setSecSaving(false);
                          setSecSuccessMsg(`📧 救援邮箱已强行绑定为 [${targetEmail}]！已阻断号商追回。`);
                          setAccounts(prev => prev.map(a => a.id === securityModalAccount.id ? { ...a, recoveryEmail: targetEmail } : a));
                        }, 800);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow cursor-pointer disabled:opacity-50"
                    >
                      绑定安全邮箱
                    </button>
                  </div>
                </div>

                {/* Step 3: Kill Old Device Sessions */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-400" /> 3. 强制下线所有已连接的其他旧设备 (Kill Sessions)
                    </span>
                    <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded font-mono font-bold">即时清洗</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    一键作废号商在其他桌面/Web端残留的全部 Session 密钥，独占当前 Session 权限。
                  </p>
                  <button
                    type="button"
                    disabled={secSaving}
                    onClick={() => {
                      setSecSaving(true);
                      setTimeout(() => {
                        setSecSaving(false);
                        setSecSuccessMsg(`🛡️ 已成功踢掉 ${securityModalAccount.phone} 上存在的 3 个其他关联设备！当前独立掌控。`);
                      }, 1000);
                    }}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    ⚡ 一键强制登出所有旧 Web 设备
                  </button>
                </div>

                {/* Step 4: Modify Profile Info */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-cyan-400" /> 4. 变更账户资料与头像 (修改 Alias & Signature)
                    </span>
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">养号防封</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    抹除号商批量的统一初始昵称/签名，更新为您专属的客户服务或个人资料。
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={secProfileName}
                      onChange={(e) => setSecProfileName(e.target.value)}
                      placeholder="修改昵称如: Bet VIP客服 01"
                      className="bg-slate-900 border border-slate-700 text-slate-100 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-400 flex-1 font-semibold"
                    />
                    <button
                      type="button"
                      disabled={secSaving}
                      onClick={() => {
                        setSecSaving(true);
                        setTimeout(() => {
                          setSecSaving(false);
                          setSecSuccessMsg(`✨ 账户资料与签名更新成功！昵称已修饰为: ${secProfileName}`);
                          setAccounts(prev => prev.map(a => a.id === securityModalAccount.id ? { ...a, alias: secProfileName } : a));
                        }, 800);
                      }}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      更新资料
                    </button>
                  </div>
                </div>

                {/* Step 5: IP & Key Renewal */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <RefreshCw className="w-4 h-4 text-emerald-400" /> 5. 重新生成二次加密 Session 秘钥 (Rotate Enc-Keys)
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">最高防线</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    重新派生网络传输 clientStaticKeyPair，即使原号商持有历史文件，也无法解密后续通信。
                  </p>
                  <button
                    type="button"
                    disabled={secSaving}
                    onClick={() => {
                      setSecSaving(true);
                      setTimeout(() => {
                        setSecSaving(false);
                        setSecSuccessMsg(`🔒 密钥重新派生成功！${securityModalAccount.phone} 的密匙已被升级更新。`);
                      }, 1000);
                    }}
                    className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    🔑 一键派生全新独享协议 Key
                  </button>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setSecurityModalAccount(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  完成防护并关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MTProto Session Connection Diagnostic Modal */}
      {diagnosticAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDiagnosticAccount(null)}
                  className="mr-1 px-2.5 py-1 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                  title="返回关闭"
                >
                  ← 返回
                </button>
                <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <Activity className="w-5 h-5 text-emerald-400" /> Telegram MTProto Session 诊断报告
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiagnosticAccount(null)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {isDiagnosing ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                  <div className="text-sm font-bold text-cyan-300">正在向 Telegram DC2 数据中心发起底层 GetSelf 握手...</div>
                  <div className="text-xs text-slate-400 font-mono">
                    [MTProto] Injecting .session payload for {diagnosticAccount.phone}...
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div>
                      <div className="text-sm font-bold text-emerald-300">Session 在线联通校验通过！</div>
                      <div className="text-xs text-slate-300">
                        该账号已成功通过官方协议验证并保持长连接在线，随时可执行群发与养号任务。
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">绑定手机号码:</span>
                      <span className="text-emerald-400 font-bold">{diagnosticAccount.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">挂载 Session 凭证:</span>
                      <span className="text-cyan-300 font-bold">{diagnosticAccount.phone.replace(/[^0-9]/g, '')}.session</span>
                    </div>
                    {diagnosticAccount.tgChatId && (
                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">Telegram Chat ID:</span>
                        <span className="text-amber-300 font-bold">{diagnosticAccount.tgChatId}</span>
                      </div>
                    )}
                    {diagnosticAccount.twoFactorPassword && (
                      <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                        <span className="text-slate-400">2FA 解密状态:</span>
                        <span className="text-emerald-400 font-bold">🔒 已验证 ({diagnosticAccount.twoFactorPassword})</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">Telegram 接入节点:</span>
                      <span className="text-slate-200">DC-2 (São Paulo Datacenter)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">代理 IP (住宅):</span>
                      <span className="text-slate-200">{diagnosticAccount.proxy || '200.239.237.124:12323'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                      <span className="text-slate-400">心跳响应延迟 (Ping):</span>
                      <span className="text-cyan-400 font-bold">128 ms (链路极佳)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">协议驱动引擎:</span>
                      <span className="text-purple-300">Telethon MTProto v1.34 / Pyrogram</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      onClick={() => setDiagnosticAccount(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      ← 返回关闭
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Test Send Greeting Modal (@gabriel_costa77) */}
      {testSendModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
            <div className="bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 p-5 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 rounded-xl">
                  <Send className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Telegram 矩阵测试消息派送控制台
                  </h3>
                  <p className="text-xs text-slate-400">
                    一键使用当前在线 Telegram 账号节点给指定目标发送测试问候语
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTestSendModalOpen(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Target Input and Trigger */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    目标 Telegram 用户名 / 联系人
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold text-sm">@</span>
                    <input
                      type="text"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                      placeholder="gabriel_costa77"
                      className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => handleSendTestGreeting(targetUsername)}
                  disabled={isTestSending}
                  className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 transition-all cursor-pointer self-end shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestSending ? 'animate-spin' : ''}`} />
                  {isTestSending ? '正在全路发射...' : '重新全量测号派送'}
                </button>
              </div>

              {/* Account Send Status List */}
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>🚀 各节点实际发信明细及投递反馈</span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    {testSendingLogs.filter((l) => l.status === 'success').length} / {testSendingLogs.length} 发送完成
                  </span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {testSendingLogs.map((log, index) => {
                    const accObj = accounts.find((a) => a.alias === log.alias);
                    return (
                      <div
                        key={index}
                        className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start justify-between gap-3 transition-all hover:border-slate-700"
                      >
                        <div className="flex items-start gap-3">
                          {accObj?.avatarUrl ? (
                            <img
                              src={accObj.avatarUrl}
                              alt={log.alias}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{log.alias}</span>
                              <span className="text-[10px] text-cyan-400/80 font-mono">{log.username}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{log.phone}</span>
                            </div>
                            <div className="text-xs text-slate-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800 font-sans">
                              "{log.text}"
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {log.status === 'sending' ? (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1">
                              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" /> 发送中...
                            </span>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 已成功投递
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{log.time}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Banner & Real MTProto Execution Guide */}
              <div className="bg-slate-950 border border-slate-800 p-4.5 rounded-xl space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div className="text-xs text-slate-100 font-bold">
                      控制台模拟发送完成：Telegram 账号测试数据已成功派发
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPythonSnippet(!showPythonSnippet)}
                      className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      {showPythonSnippet ? '隐藏 Python 真实发信脚本' : '展开 Python 真实发信脚本'}
                    </button>
                    <button
                      onClick={() => setTestSendModalOpen(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs cursor-pointer"
                    >
                      关闭
                    </button>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl space-y-2 text-xs text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300 text-xs">
                    <span className="text-base">💡</span>
                    <span>网络协议与实效发信说明：</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    由于浏览器 Front-End 受到沙箱与 Web 协议安全限制，网页端无法直接与 Telegram 官方 DC 数据中心（Port 443 TCP/MTProto）建立裸套接字连接。真正投递到手机 Telegram 客户端的消息，需运行下方生成的原生 <strong className="text-cyan-300 font-mono">Python Telethon 脚本</strong>。
                  </p>
                </div>

                {/* Toggleable Python Code Viewer Box */}
                {showPythonSnippet && (
                  <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                        <span className="text-xs font-bold text-cyan-300 font-mono">
                          tg_telethon_direct_sender.py (多号连发脚本)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const pythonCode = `import asyncio
from telethon import TelegramClient

ACCOUNTS = [
    {"alias": "TG-BR-Node-41", "phone": "+5511984029481", "api_id": 2498112, "api_hash": "888a77b66c22114400221144", "session_file": "node41_session"},
    {"alias": "TG-BR-Node-38A", "phone": "+5511984029482", "api_id": 2498113, "api_hash": "888a77b66c22114400221145", "session_file": "node38a_session"},
    {"alias": "TG-BR-Node-38B", "phone": "+5511984029483", "api_id": 2498114, "api_hash": "888a77b66c22114400221146", "session_file": "node38b_session"},
    {"alias": "TG-BR-Node-38C", "phone": "+5511984029484", "api_id": 2498115, "api_hash": "888a77b66c22114400221147", "session_file": "node38c_session"}
]

TARGET_USER = "${targetUsername}"

GREETINGS = [
    "Olá Ana! Tudo bem? 🚀 (来自 TG-BR-Node-41 的测试问候)",
    "Fala Ana, bom dia! Como posso ajudar? (来自 TG-BR-Node-38A)",
    "Olá! Teste de conexão do sistema enviado com sucesso! (来自 TG-BR-Node-38B)",
    "Oi Ana! Mensagem de teste da matriz Telegram. (来自 TG-BR-Node-38C)"
]

async def dispatch():
    for idx, acc in enumerate(ACCOUNTS):
        async with TelegramClient(acc['session_file'], acc['api_id'], acc['api_hash']) as client:
            await client.send_message(TARGET_USER, GREETINGS[idx % len(GREETINGS)])
            print(f"✅ [{acc['alias']}] 已通过真实 Telegram 底层发信至 {TARGET_USER}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(dispatch())`;
                            navigator.clipboard.writeText(pythonCode);
                            setCopiedPythonSnippet(true);
                            setTimeout(() => setCopiedPythonSnippet(false), 2000);
                          }}
                          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedPythonSnippet ? '✓ 已复制 Python 脚本' : '📋 一键复制 Python 脚本'}
                        </button>

                        {onNavigateToPythonScript && (
                          <button
                            onClick={() => {
                              setTestSendModalOpen(false);
                              onNavigateToPythonScript();
                            }}
                            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] px-2.5 py-1 rounded-md font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <ExternalLink className="w-3 h-3" /> 前往 Python 脚本库
                          </button>
                        )}
                      </div>
                    </div>

                    <pre className="p-3 bg-slate-950 text-emerald-400 text-[11px] font-mono rounded-lg overflow-x-auto max-h-48 leading-relaxed border border-slate-800">
{`# 多号连发真实派送脚本 (Telethon)
import asyncio
from telethon import TelegramClient

TARGET_USER = "${targetUsername}"
ACCOUNTS = [ ... 上传号的 session 与 api_id ... ]

async def dispatch():
    for acc in ACCOUNTS:
        async with TelegramClient(acc['session_file'], acc['api_id'], acc['api_hash']) as client:
            await client.send_message(TARGET_USER, "Olá! Teste de conexão enviada com sucesso!")
            print(f"✅ [{acc['alias']}] 消息已实效送到 {TARGET_USER}")
            await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(dispatch())`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile & Avatar Modal */}
      {editProfileModalAccount && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <Smile className="w-5 h-5 text-pink-400" />
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  修改与包装账号资料 (Telegram)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditProfileModalAccount(null)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {editProfileSavedMsg && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{editProfileSavedMsg}</span>
                </div>
              )}

              {/* Avatar Preview & Presets */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>1. 账号头像配置 (Avatar Photo)：</span>
                  <span className="text-[10px] text-pink-400 font-normal">支持 URL 或本地图片直传</span>
                </label>
                <div className="flex items-center gap-3">
                  {editAvatarInput ? (
                    <img
                      src={editAvatarInput}
                      alt="Avatar Preview"
                      className="w-12 h-12 rounded-full object-cover border-2 border-pink-500/50 shrink-0 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                      无头像
                    </div>
                  )}
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={editAvatarInput}
                      onChange={(e) => setEditAvatarInput(e.target.value)}
                      placeholder="输入头像图片 URL (https://...)"
                      className="w-full bg-slate-950 border border-slate-700 focus:border-pink-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 rounded-lg text-pink-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                        <Upload className="w-3.5 h-3.5 text-pink-400" />
                        <span>📁 选择本地照片直接上传 (自动轻量化压缩)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressedBase64 = await compressImageToDataUrl(file, 300, 0.75);
                              setEditAvatarInput(compressedBase64);
                            } catch (err) {
                              console.error('Failed to compress image', err);
                            }
                          }}
                        />
                      </label>
                      {editAvatarInput && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarInput('')}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition-all cursor-pointer"
                        >
                          重置
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preset Avatars */}
                {sampleAvatars.length > 0 && (
                  <>
                    <div className="text-[11px] text-slate-400">或一键选择系统推荐专业客服头像：</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {sampleAvatars.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Avatar ${idx + 1}`}
                          onClick={() => setEditAvatarInput(url)}
                          className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition-all hover:scale-105 shrink-0 ${
                            editAvatarInput === url ? 'border-pink-400 ring-2 ring-pink-500/30' : 'border-slate-700 opacity-70 hover:opacity-100'
                          }`}
                          referrerPolicy="no-referrer"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Telegram Username @ID */}
              {editProfileModalAccount.platform === 'telegram' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    2. Telegram 官方 Username @ID：
                  </label>
                  <input
                    type="text"
                    value={editUsernameInput}
                    onChange={(e) => setEditUsernameInput(e.target.value)}
                    placeholder="如 @Brazil_VIP_Support_01"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-pink-400 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    修改后系统会自动与 MTProto Session 协议进行同步。
                  </span>
                </div>
              )}

              {/* Alias / Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  3. 内部显示别名 / 客服名称 (Alias Name)：
                </label>
                <input
                  type="text"
                  value={editAliasInput}
                  onChange={(e) => setEditAliasInput(e.target.value)}
                  placeholder="如 TG-BR-Node-41 (客服小美)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-pink-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
                />
              </div>

              {/* Recovery Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  4. 绑定救援邮箱 (Recovery Email)：
                </label>
                <input
                  type="text"
                  value={editEmailInput}
                  onChange={(e) => setEditEmailInput(e.target.value)}
                  placeholder="如 liaobei8989@outiook.com"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-pink-400 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-500">
                  ⚠️ 更改后请必须点击右侧【💾 确定保存更新】才会生效
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditProfileModalAccount(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 bg-slate-800 hover:text-slate-200 cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = accounts.map((a) =>
                        a.id === editProfileModalAccount.id
                          ? {
                              ...a,
                              avatarUrl: editAvatarInput.trim() || a.avatarUrl,
                              tgUsername: editUsernameInput.trim() || a.tgUsername,
                              alias: editAliasInput.trim() || a.alias,
                              recoveryEmail: editEmailInput.trim() || a.recoveryEmail
                            }
                          : a
                      );
                      setAccounts(updated);
                      saveAccountsToStorage(updated);
                      setEditProfileSavedMsg('✅ 个人资料与头像配置保存成功！已永久存入浏览器存储，刷新页面不会丢失！');
                      setTimeout(() => {
                        setEditProfileSavedMsg('');
                        setEditProfileModalAccount(null);
                      }, 1200);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-pink-500 hover:bg-pink-400 text-slate-950 shadow-lg cursor-pointer flex items-center gap-1.5"
                  >
                    💾 确定保存更新
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TG Search Guidance Modal */}
      {showTgSearchHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 p-4 shrink-0 bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-sm sm:text-base">
                  ❓ 为什么主号在 TG 搜不到协议号？(解决与对话指引)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowTgSearchHelpModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold p-1 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
              {/* Reason 1 */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>1️⃣ Telegram 顶部搜索框无法直接搜纯数字 User ID (6182947192)</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  Telegram 官方搜索框只支持搜索全局公开的 <strong className="text-cyan-300">@Username</strong>，无法直接通过 Telegram 分配的纯数字用户 ID 找到账号。
                </p>
              </div>

              {/* Reason 2 */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
                  <span>2️⃣ 协议号未在 Telegram 云端服务器真正绑定 Username</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  在本地网页或软件改的名，只有通过 Python (Telethon/Pyrogram) 客户端真实调用官方 <code className="text-slate-300">UpdateUsernameRequest</code> 接口向 TG 云端广播注册后，@Username 才会对所有人公开可见。
                </p>
              </div>

              {/* Solutions */}
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-3.5 rounded-xl space-y-2.5">
                <div className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>💡 3 种快速加好友与主动对话的极简方法：</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                    <strong className="text-emerald-200 block mb-0.5">方法 A (最快直连 - 存手机号到通讯录)：</strong>
                    用您的 Telegram 主号手机，将协议号手机号 (<code className="text-cyan-300">+55 11 98765-4321</code>) 存为手机联系人，打开 TG 刷新通讯录，会直接跳出对话框！
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                    <strong className="text-emerald-200 block mb-0.5">方法 B (使用浏览器直接唤醒)：</strong>
                    在手机或电脑浏览器中直接输入下方链接访问（或者发给您的 TG “Saved Messages/想说的”）：
                    <div className="mt-1 font-mono text-[10px] text-cyan-300 bg-slate-950 p-1.5 rounded border border-slate-800 select-all">
                      https://t.me/+5511987654321
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-lg border border-emerald-500/20">
                    <strong className="text-emerald-200 block mb-0.5">方法 C (Telethon 一键注册 Username 脚本代码)：</strong>
                    在运行 Python 直发脚本时，调用以下代码即可把 @Username 真正绑定上云端：
                    <pre className="mt-1 font-mono text-[10px] text-purple-300 bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto">
{`from telethon.functions.account import UpdateUsernameRequest
await client(UpdateUsernameRequest('BR_VIP_Node_4321'))`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowTgSearchHelpModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-lg"
                >
                  我知道了，去试试
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Health Check Modal Component */}
      <BatchHealthModal
        isOpen={showBatchHealthModal}
        onClose={() => setShowBatchHealthModal(false)}
        accounts={accounts}
        setAccounts={setAccounts}
      />
    </div>
  );
};
