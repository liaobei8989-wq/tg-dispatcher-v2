import React, { useState, useEffect, useRef } from 'react';
import { PromotionalTemplate, MediaAsset, PlatformType } from '../types';
import { PRESET_TEMPLATES } from '../data/presetTemplates';
import {
  loadCustomMediaAssets,
  saveCustomMediaAssets,
  compressImageForStorage
} from '../utils/mediaAssetStorage';
import {
  generateSpintaxVariants,
  replaceVariables
} from '../utils/spintax';
import {
  Flame,
  Shuffle,
  Plus,
  Sparkles,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  Upload,
  Send,
  Trash2,
  Paperclip,
  X,
  Edit3
} from 'lucide-react';

interface TemplateLibraryProps {
  templates?: PromotionalTemplate[];
  setTemplates?: React.Dispatch<React.SetStateAction<PromotionalTemplate[]>>;
  selectedTemplateId: string;
  setSelectedTemplateId: (id: string) => void;
  onNavigateToCampaign?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  templates: parentTemplates,
  setTemplates: parentSetTemplates,
  selectedTemplateId,
  setSelectedTemplateId,
  onNavigateToCampaign,
}) => {
  const [localTemplates, setLocalTemplates] = useState<PromotionalTemplate[]>(PRESET_TEMPLATES);

  const templates = parentTemplates || localTemplates;
  const setTemplates = parentSetTemplates || setLocalTemplates;

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [spintaxVariants, setSpintaxVariants] = useState<string[]>([]);
  const [injectAntiHash, setInjectAntiHash] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // User-uploaded Media Assets persisted in IndexedDB
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);

  // Load custom media assets asynchronously from IndexedDB
  useEffect(() => {
    loadCustomMediaAssets().then((assets) => {
      if (assets && assets.length > 0) {
        setMediaAssets(assets);
      }
    }).catch((err) => {
      console.warn('Failed to load custom media assets from IndexedDB', err);
    });
  }, []);

  // Save custom media assets to IndexedDB (and safe fallback) whenever updated
  useEffect(() => {
    if (mediaAssets.length > 0) {
      saveCustomMediaAssets(mediaAssets).catch((err) => {
        console.warn('Failed to save media assets', err);
      });
    }
  }, [mediaAssets]);

  const currentTemplate =
    templates.find((t) => t.id === selectedTemplateId) || templates[0] || {
      id: 'custom-default',
      name: '自訂自由博彩宣傳文案',
      category: 'custom',
      platformTarget: 'dual',
      content: '【自由編寫博彩文案】請在此輸入您的推播訊息與優惠鏈接...',
      mediaType: 'image',
      variables: ['URL']
    };

  const [editingName, setEditingName] = useState<string>(currentTemplate.name);
  const [editingContent, setEditingContent] = useState<string>(currentTemplate.content);
  const [editingMediaUrl, setEditingMediaUrl] = useState<string>(currentTemplate.mediaUrl || '');
  const [editingMediaType, setEditingMediaType] = useState<'image' | 'video' | 'none'>(currentTemplate.mediaType || 'image');
  const [editingPlatformTarget, setEditingPlatformTarget] = useState<PlatformType>(currentTemplate.platformTarget || 'dual');

  // Modal State for creating new custom promotional template
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTplName, setNewTplName] = useState<string>('');
  const [newTplContent, setNewTplContent] = useState<string>('');
  const [newTplPlatformTarget, setNewTplPlatformTarget] = useState<PlatformType>('dual');
  const [newTplMediaUrl, setNewTplMediaUrl] = useState<string>('');
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Inline card editing state for individual templates in list
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardName, setEditingCardName] = useState<string>('');
  const [editingCardContent, setEditingCardContent] = useState<string>('');
  const [editingCardPlatform, setEditingCardPlatform] = useState<PlatformType>('dual');

  const startInlineEdit = (tpl: PromotionalTemplate) => {
    setEditingCardId(tpl.id);
    setEditingCardName(tpl.name);
    setEditingCardContent(tpl.content);
    setEditingCardPlatform(tpl.platformTarget || 'dual');
  };

  const cancelInlineEdit = () => {
    setEditingCardId(null);
  };

  const saveInlineEdit = (tplId: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === tplId
          ? {
              ...t,
              name: editingCardName,
              content: editingCardContent,
              platformTarget: editingCardPlatform
            }
          : t
      )
    );

    if (tplId === selectedTemplateId) {
      setEditingName(editingCardName);
      setEditingContent(editingCardContent);
      setEditingPlatformTarget(editingCardPlatform);
    }

    setEditingCardId(null);
  };

  // Handle local image / video file upload
  const handleLocalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video');
    const reader = new FileReader();

    reader.onload = async (event) => {
      const rawUrl = event.target?.result as string;
      const dataUrl = !isVideo ? await compressImageForStorage(rawUrl, 1200, 0.85) : rawUrl;

      const newAsset: MediaAsset = {
        id: `local-media-${Date.now()}`,
        name: file.name,
        type: isVideo ? 'video' : 'image',
        url: dataUrl,
        sizeMb: parseFloat((file.size / (1024 * 1024)).toFixed(2)),
        aspectRatio: '1:1'
      };

      setMediaAssets((prev) => [newAsset, ...prev]);
      setEditingMediaUrl(dataUrl);
      setEditingMediaType(newAsset.type);

      // Auto save to active template
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === currentTemplate.id
            ? { ...t, mediaUrl: dataUrl, mediaType: newAsset.type }
            : t
        )
      );
    };

    reader.readAsDataURL(file);
  };

  // Open modal for operator to write custom copy
  const handleOpenCreateModal = () => {
    setNewTplName(`自訂博彩文案 #${templates.length + 1}`);
    setNewTplContent(`{Olá|Oi|E aí}! 🎰 Venha jogar na melhor plataforma de cassino online do Brasil!\n\n🔥 Bônus de 200% no 1º depósito + Rodadas Grátis\n👉 Acesse agora: {URL}`);
    setNewTplPlatformTarget('dual');
    setNewTplMediaUrl(mediaAssets[0]?.url || '');
    setShowCreateModal(true);
  };

  // Save operator's newly typed custom template
  const handleSaveNewCustomTemplate = () => {
    if (!newTplName.trim()) {
      alert('請輸入文案名稱/標題！');
      return;
    }
    if (!newTplContent.trim()) {
      alert('請輸入文案內容！');
      return;
    }

    const newTpl: PromotionalTemplate = {
      id: `tpl-custom-${Date.now()}`,
      name: newTplName.trim(),
      category: 'custom',
      platformTarget: newTplPlatformTarget,
      content: newTplContent.trim(),
      mediaType: newTplMediaUrl ? 'image' : 'none',
      mediaUrl: newTplMediaUrl,
      variables: ['URL', 'NAME', 'BONUS', 'CODE']
    };

    setTemplates((prev) => [newTpl, ...prev]);
    setSelectedTemplateId(newTpl.id);
    setEditingName(newTpl.name);
    setEditingContent(newTpl.content);
    setEditingMediaUrl(newTpl.mediaUrl || '');
    setEditingMediaType(newTpl.mediaType || 'image');
    setEditingPlatformTarget(newTpl.platformTarget);
    setSpintaxVariants([]);
    setShowCreateModal(false);
  };

  // Delete current template if not the last one
  const handleDeleteTemplate = (idToDelete: string) => {
    if (templates.length <= 1) {
      alert('至少保留一個宣傳範本！');
      return;
    }
    const remaining = templates.filter((t) => t.id !== idToDelete);
    setTemplates(remaining);
    setSelectedTemplateId(remaining[0].id);
    setEditingName(remaining[0].name);
    setEditingContent(remaining[0].content);
    setEditingMediaUrl(remaining[0].mediaUrl || '');
    setEditingMediaType(remaining[0].mediaType || 'image');
    setEditingPlatformTarget(remaining[0].platformTarget);
  };

  // Generate live Spintax samples
  const handleGenerateVariants = () => {
    const rawWithVars = replaceVariables(editingContent, {
      NAME: 'Gabriel',
      PHONE: '+55 11 98765-4321',
      BONUS: '200%',
      URL: 'https://brazilgo888.com/tiger',
      CODE: 'VIP888',
      TG_LINK: 'https://t.me/BrazilGo888Official'
    });
    
    let samples = generateSpintaxVariants(rawWithVars, 5);

    if (injectAntiHash) {
      samples = samples.map((s) => s + '\u200B\u200C');
    }

    setSpintaxVariants(samples);
  };

  const handleCopyVariant = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsertVariable = (varName: string) => {
    setEditingContent((prev) => `${prev} {${varName}}`);
  };

  const handleInsertSpintaxSnippet = (snippet: string) => {
    setEditingContent((prev) => `${prev} ${snippet}`);
  };

  const handleSaveTemplateChanges = () => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === currentTemplate.id
          ? {
              ...t,
              name: editingName,
              content: editingContent,
              mediaUrl: editingMediaUrl,
              mediaType: editingMediaType,
              platformTarget: editingPlatformTarget
            }
          : t
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden local image/video input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLocalImageUpload}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-mono text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>MODULE 03 / PROMOTIONAL COPY & LOCAL MEDIA CENTER</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-400" />
              自由博彩文案編寫與本地圖片素材中心
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-2xl">
              操作員可自由撰寫不受限制的博彩宣傳文案，上傳本地宣傳圖片/海報，並支援 Spintax 語法動態洗牌去重。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>📷 上傳本地宣傳圖片/海報</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ 新建自訂宣傳文案</span>
            </button>

            <button
              onClick={handleGenerateVariants}
              className="bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
            >
              <Shuffle className="w-4 h-4" /> <span>實時解碼 Spintax 變態文案</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Template List & Media Asset Selector */}
        <div className="space-y-6">
          {/* Preset & Custom Templates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>宣傳文案列表</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">{templates.length} 個</span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                const isEditingThisCard = editingCardId === tpl.id;

                if (isEditingThisCard) {
                  return (
                    <div
                      key={tpl.id}
                      onClick={(e) => e.stopPropagation()}
                      className="p-3.5 rounded-xl border border-amber-500/60 bg-slate-900/95 shadow-xl space-y-2.5 animate-fadeIn"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> 在線修改文案內容
                        </span>
                        <select
                          value={editingCardPlatform}
                          onChange={(e) => setEditingCardPlatform(e.target.value as PlatformType)}
                          className="bg-slate-950 border border-slate-700 rounded text-[10px] px-2 py-0.5 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                        >
                          <option value="dual">⚡ 雙軌</option>
                          <option value="telegram">✈️ TG 限定</option>
                          
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 block">文案名稱</label>
                        <input
                          type="text"
                          value={editingCardName}
                          onChange={(e) => setEditingCardName(e.target.value)}
                          placeholder="請輸入文案名稱"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 block">宣傳內文 (TextArea)</label>
                        <textarea
                          rows={4}
                          value={editingCardContent}
                          onChange={(e) => setEditingCardContent(e.target.value)}
                          placeholder="在此直接修改文案內容..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed"
                        />
                      </div>

                      <div className="flex items-center justify-end space-x-2 pt-1 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={cancelInlineEdit}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition"
                        >
                          取消
                        </button>
                        <button
                          type="button"
                          onClick={() => saveInlineEdit(tpl.id)}
                          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-[11px] font-extrabold rounded-lg transition shadow flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>保存修改</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setEditingName(tpl.name);
                      setEditingContent(tpl.content);
                      setEditingMediaUrl(tpl.mediaUrl || '');
                      setEditingMediaType(tpl.mediaType || 'image');
                      setEditingPlatformTarget(tpl.platformTarget || 'dual');
                      setSpintaxVariants([]);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-xs text-slate-200 truncate max-w-[130px]" title={tpl.name}>
                        {tpl.name}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                          ✈️ TG 矩阵专用
                        </span>

                        {/* Inline Edit Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startInlineEdit(tpl);
                          }}
                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-700 hover:border-amber-500/40 rounded transition flex items-center gap-0.5 text-[10px] font-medium"
                          title="修改此文案"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" />
                          <span>修改</span>
                        </button>

                        {/* Delete Button */}
                        {templates.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`確定要刪除文案「${tpl.name}」嗎？`)) {
                                handleDeleteTemplate(tpl.id);
                              }
                            }}
                            className="p-1 hover:text-rose-400 text-slate-500 hover:bg-slate-800 rounded transition"
                            title="刪除此文案"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 font-mono">
                      {tpl.content}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Assets Library Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>宣傳圖片/短影音素材庫</span>
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Upload className="w-3 h-3" /> 上傳本地檔
              </button>
            </div>

            {/* Dropzone trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 p-4 rounded-xl text-center cursor-pointer transition-all group"
            >
              <Paperclip className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 mx-auto mb-1 transition-colors" />
              <p className="text-xs font-semibold text-slate-300">點擊上傳本地圖片或宣傳海報</p>
              <p className="text-[10px] text-slate-500 mt-0.5">支援 PNG, JPG, GIF, WebP, MP4</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {mediaAssets.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
                  尚無上傳的圖片/影片素材。請點擊上方上傳您的自訂海報！
                </div>
              ) : (
                mediaAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => {
                      setEditingMediaUrl(asset.url);
                      setEditingMediaType(asset.type);
                    }}
                    className={`p-2.5 bg-slate-950 rounded-xl border transition flex items-center space-x-3 cursor-pointer group ${
                      editingMediaUrl === asset.url
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-800"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-200 truncate block">
                        {asset.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {asset.type.toUpperCase()} • {asset.sizeMb} MB
                      </span>
                    </div>
                    {editingMediaUrl === asset.url && (
                      <span className="text-emerald-400 text-xs font-bold font-mono">已綁定</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMediaAssets((prev) => prev.filter((a) => a.id !== asset.id));
                        if (editingMediaUrl === asset.url) {
                          setEditingMediaUrl('');
                          setEditingMediaType('none');
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                      title="刪除素材"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Cols: Template Editor & Spintax Variants Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-slate-200 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> 自由編輯宣傳內容
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveTemplateChanges}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-1.5 rounded-xl text-xs transition-all"
                >
                  儲存修改
                </button>
                {onNavigateToCampaign && (
                  <button
                    onClick={() => {
                      handleSaveTemplateChanges();
                      onNavigateToCampaign();
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold px-4 py-1.5 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1"
                  >
                    <span>套用並前往群發</span>
                    <Send className="w-3.5 h-3.5 ml-1" />
                  </button>
                )}
              </div>
            </div>

            {/* Title & Platform Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  文案名稱 (Template Title)
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  placeholder="如：首儲優惠宣傳"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  目標發送平台 (Target Ecosystem)
                </label>
                <select
                  value={editingPlatformTarget}
                  onChange={(e) => setEditingPlatformTarget(e.target.value as PlatformType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="dual">⚡ TG 與 WS 雙生態同時矩陣群發</option>
                  <option value="telegram">✈️ Telegram 頻道 / ChatID 獨家</option>
                  
                </select>
              </div>
            </div>

            {/* Quick Inserter Tools */}
            <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">快速插入變數:</span>
                {['URL', 'NAME', 'BONUS', 'CODE', 'TG_LINK'].map((v) => (
                  <button
                    key={v}
                    onClick={() => handleInsertVariable(v)}
                    className="bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all"
                  >
                    +{v}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
                <span className="text-slate-400 text-[11px] font-semibold mr-1">Spintax 詞庫語法:</span>
                {[
                  '{Olá|Oi|E aí}',
                  '{ganhe|receba}',
                  '{Fortune Tiger|Jogo do Tigrinho}',
                  '{100%|200%}',
                  '{brazilgo888.com|brazilgo888.com/vip}'
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleInsertSpintaxSnippet(s)}
                    className="bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Textarea */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
                <span>博彩宣傳文案內容 (操作員可任意編寫，支援完整 Unicode 符號與鏈接)</span>
                <span className="text-slate-500 font-mono text-[10px]">字符數: {editingContent.length}</span>
              </label>
              <textarea
                rows={8}
                value={editingContent}
                onChange={(e) => setEditingContent(e.target.value)}
                placeholder="在此自由輸入博彩宣傳內容..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {/* Attached Media Asset Section */}
            <div className="space-y-2 border-t border-slate-800/80 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>附帶宣傳圖片 / 媒體附件 (Image or Video)</span>
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" /> 上傳本地圖片
                </button>
              </div>

              <input
                type="text"
                value={editingMediaUrl}
                onChange={(e) => setEditingMediaUrl(e.target.value)}
                placeholder="可直接貼上網址，或點擊「上傳本地圖片」選擇本地檔案"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500"
              />

              {editingMediaUrl && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                  <img
                    src={editingMediaUrl}
                    alt="Attached Preview"
                    className="w-20 h-16 object-cover rounded-lg border border-slate-800 shadow-sm"
                  />
                  <div className="text-xs text-slate-300 flex-1">
                    <span className="font-semibold block text-slate-100">已綁定宣傳媒體附件</span>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      類型: {editingMediaType.toUpperCase()} | 將在 Telegram 矩陣派發時作為頂部圖文卡片
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingMediaUrl('')}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    移除媒體
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Generated Spintax Sample Variants Display */}
          {spintaxVariants.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-lg animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> 實時解碼 5 組獨特發送文案 (Spintax Decoded Variants)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">每封訊息皆為全新唯一雜湊值</span>
              </div>

              <div className="space-y-2.5">
                {spintaxVariants.map((variant, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs text-slate-200 font-mono relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-amber-400 font-bold text-[10px] uppercase shrink-0">
                        變態 #{idx + 1}:
                      </span>
                      <p className="flex-1 whitespace-pre-wrap">{variant}</p>
                      <button
                        onClick={() => handleCopyVariant(variant, idx)}
                        className="p-1.5 text-slate-400 hover:text-slate-100 bg-slate-800 rounded-lg transition-all shrink-0"
                        title="複製文案"
                      >
                        {copiedIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Hidden file input for modal local upload */}
      <input
        type="file"
        ref={modalFileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (evt) => {
            if (evt.target?.result) {
              setNewTplMediaUrl(evt.target.result as string);
            }
          };
          reader.readAsDataURL(file);
        }}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* Modal: 新建自訂宣傳文案 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  新建自訂博彩宣傳文案 (New Custom Copy)
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Row 1: Title & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    文案名稱 / 標題
                  </label>
                  <input
                    type="text"
                    value={newTplName}
                    onChange={(e) => setNewTplName(e.target.value)}
                    placeholder="例: 巴西首儲 200% 爆率優惠"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">
                    目標發送平台
                  </label>
                  <select
                    value={newTplPlatformTarget}
                    onChange={(e) => setNewTplPlatformTarget(e.target.value as PlatformType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="dual">⚡ TG + WS 雙軌</option>
                    <option value="telegram">✈️ Telegram 限定</option>
                    
                  </select>
                </div>
              </div>

              {/* Quick Insert Spintax & Variables Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    宣傳內文 (支援 Spintax 詞庫與動態變數)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    字數: {newTplContent.length} 字符
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] bg-slate-950 p-2 rounded-xl border border-slate-800">
                  <span className="text-slate-400 font-medium mr-1">快捷插入:</span>
                  {['URL', 'NAME', 'BONUS', 'CODE', 'TG_LINK'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewTplContent((prev) => prev + ` {${v}}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono transition"
                    >
                      &#123;{v}&#125;
                    </button>
                  ))}
                  <span className="text-slate-600 mx-1">|</span>
                  <button
                    type="button"
                    onClick={() => setNewTplContent((prev) => prev + ' {Olá|Oi|E aí}')}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono transition"
                  >
                    + 問候詞Spintax
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTplContent((prev) => prev + ' {ganhe|receba|obtenha}')}
                    className="bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono transition"
                  >
                    + 動作詞Spintax
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  rows={6}
                  value={newTplContent}
                  onChange={(e) => setNewTplContent(e.target.value)}
                  placeholder="Escreva sua mensagem aqui, ex: {Olá|Oi}! 🎰 A melhor plataforma de cassino do Brasil!\n\n🔥 Bônus de 200% no 1º depósito\n👉 Cadastre-se: {URL}"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Media Attachment Bar */}
              <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    附帶圖片 / 媒體附件 (可選)
                  </label>
                  <button
                    type="button"
                    onClick={() => modalFileInputRef.current?.click()}
                    className="text-[11px] text-cyan-300 hover:bg-cyan-500/20 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition font-medium"
                  >
                    📷 上傳本地宣傳海報
                  </button>
                </div>

                <input
                  type="text"
                  value={newTplMediaUrl}
                  onChange={(e) => setNewTplMediaUrl(e.target.value)}
                  placeholder="貼上圖片 URL，或點擊右上方「上傳本地宣傳海報」"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500"
                />

                {newTplMediaUrl && (
                  <div className="flex items-center space-x-3 pt-1">
                    <img
                      src={newTplMediaUrl}
                      alt="New Preview"
                      className="w-14 h-12 object-cover rounded-lg border border-slate-800"
                    />
                    <div className="text-[11px] text-slate-300 flex-1">
                      <span className="font-semibold text-slate-200 block">已關聯海報素材</span>
                      <span className="text-slate-500 text-[10px]">派發時將隨文字訊息發送</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNewTplMediaUrl('')}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      移除
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveNewCustomTemplate}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 transition shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>儲存並新增文案</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

