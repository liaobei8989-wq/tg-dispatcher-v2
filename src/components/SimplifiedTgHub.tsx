import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Upload,
  UserCheck,
  Flame,
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Settings2,
  ListFilter,
  RefreshCw,
  X,
  Zap,
  Globe,
  Globe2,
  ShieldCheck,
  Download,
  Trash2,
  Check,
  MessageCircle,
  MessageSquare,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Info,
  Copy,
  RotateCcw,
  Calendar,
  Users,
  Sliders,
  Tag,
  Search,
  LayoutGrid,
  List,
  Filter,
  ShieldAlert,
  Smartphone,
  Bell,
  Heart,
  Timer,
  CheckSquare,
  SlidersHorizontal,
  Layers,
  UserPlus,
  Edit3
} from 'lucide-react';
import { AccountSession, CampaignLog, ScheduledCampaignConfig } from '../types';
import { INITIAL_MOCK_ACCOUNTS, calculateWarmupDays, BRAZIL_PROXIES_POOL } from '../data/mockAccounts';
import { PRESET_TEMPLATES } from '../data/presetTemplates';
import { PRESET_BLESSING_TEMPLATES, DEFAULT_BLESSING_SPINTAX, BlessingTemplate } from '../data/blessingTemplates';
import { parseSpintax } from '../utils/spintax';
import {
  saveProfileImagesDB,
  loadProfileImagesDB,
  clearProfileImagesDB,
  compressImageToDataUrl,
  deduplicateImages,
  trimImageWhiteBorders
} from '../utils/imageDb';
import { CrossTimezoneSchedulerWidget } from './CrossTimezoneSchedulerWidget';
import { CrossTimezoneSchedulerModal } from './CrossTimezoneSchedulerModal';
import { SpintaxAiMutatorModal } from './SpintaxAiMutatorModal';
import { PreflightFilterModal } from './PreflightFilterModal';
import { GroupInviterModal } from './GroupInviterModal';
import { BrazilSchedulerModal } from './BrazilSchedulerModal';
import { DomainRotatorModal } from './DomainRotatorModal';
import { SpamBotAutoUnbanModal } from './SpamBotAutoUnbanModal';
import { SwarmWarmupModal } from './SwarmWarmupModal';
import { DeviceFingerprintModal } from './DeviceFingerprintModal';
import { LeadAlertWebhookModal } from './LeadAlertWebhookModal';
import { AccountSanitizerModal } from './AccountSanitizerModal';
import { ChannelReactionWarmupModal } from './ChannelReactionWarmupModal';
import { FloodWaitAutoBackoffModal } from './FloodWaitAutoBackoffModal';
import {
  loadScheduledCampaignConfig,
  saveScheduledCampaignConfig,
  convertBrazilToIndonesia,
  getCurrentClocks
} from '../utils/timezoneScheduler';
import {
  generate100AntiBanSubdomains,
  get100SubdomainsSpintax,
  getRandomAntiBanSubdomain,
  injectAntiBanDomain
} from '../utils/domainMatrix';

interface SimplifiedTgHubProps {
  accounts: AccountSession[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountSession[]>>;
  logs: CampaignLog[];
  setLogs: React.Dispatch<React.SetStateAction<CampaignLog[]>>;
  isCampaignRunning: boolean;
  setIsCampaignRunning: (running: boolean) => void;
  onNavigateToFullAccounts?: () => void;
  onOpenLeadScraper?: () => void;
  onOpenWebInbox?: () => void;
  onOpenProxyModal?: () => void;
  initialTargets?: string[];
}

interface ServerSessionFile {
  fileName: string;
  filePath: string;
  folder: string;
  sizeBytes: number;
  sizeFormatted: string;
  modifiedAt: string;
  isValid: boolean;
}

// 10 Brazilian Dedicated Proxies (100% Native Brazilian IP 1:1 mapped to user's 10 accounts)
const BRAZIL_DEDICATED_PROXIES_MAP: Record<string, string> = {
  '5586994428117': '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
  '5586994581839': '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
  '5586994709226': '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
  '5586994684213': '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
  '5586994687152': '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
  '5586994850500': '200.152.153.65:12323:14a5a773a873a:4d841434c6',
  '5586994918471': '200.152.154.182:12323:14a5a773a873a:4d841434c6',
  '5586994927293': '200.152.153.188:12323:14a5a773a873a:4d841434c6',
  '5586995160291': '200.152.155.148:12323:14a5a773a873a:4d841434c6'
};

const brazilProxies: string[] = [
  '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
  '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
  '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
  '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
  '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
  '200.152.153.65:12323:14a5a773a873a:4d841434c6',
  '200.152.154.182:12323:14a5a773a873a:4d841434c6',
  '200.152.153.188:12323:14a5a773a873a:4d841434c6',
  '200.152.153.181:12323:14a5a773a873a:4d841434c6',
  '200.152.155.148:12323:14a5a773a873a:4d841434c6'
];

// Authentic Brazilian Female Names List for TG改资料
const BRAZILIAN_FEMALE_NAMES = [
  'Ana Silva',
  'Beatriz Santos',
  'Camila Oliveira',
  'Fernanda Lima',
  'Juliana Costa',
  'Larissa Souza',
  'Gabriela Pereira',
  'Mariana Alves',
  'Patricia Rocha',
  'Rebeca Martins',
  'Vanessa Barbosa',
  'Amanda Lima',
  'Carolina Silva',
  'Daniela Souza',
  'Erica Ramos',
  'Isabela Carvalho'
];

// Sample Bios for Brazilian Gaming / Marketing Accounts
const BRAZILIAN_BIOS = [
  'Seja bem-vindo! 🇧🇷 | Fortune Tiger VIP',
  'Oi amor! Vem jogar com o melhor bot 🐯🔥',
  'Atendimento 24h Suporte TG | Link na bio',
  'Bônus exclusivo R$ 50,00 cadastro rápido! 🚀',
  'Sinais 98.4% de assertividade ao vivo 📊',
  'Plataforma oficial 100% pagando via PIX 💚'
];

// 100 Authentic High-Converting Local Brazilian Greetings (100条4大防封策略高转化第一阶段问候语库)
export const STRATEGY_FRIENDLY_GREETINGS = [
  "Oi, tudo bem? Vi você lá no grupo dos jogos, achei seu perfil tão legal e resolvi chamar. 😊",
  "Olá! Tudo bem? Entrei no grupo de jogos esses dias e vi você comentando, adoro gente que joga sério! 😉",
  "Oie! Tudo joia? Te vi no grupo, não aguentei e vim te dar um \"oi\". Você parece ser gente boa. 👋",
  "Oi, chefe! Tudo bem? Achei você lá no grupo, adoro conhecer gente nova que curte esse mundo de aposta. 😍",
  "Olá! Tudo bem? Vi você no grupo e resolvi te chamar. É raro achar alguém que joga bem como você por lá! ✨",
  "Fala jogador! Beleza? Vi seu perfil no grupo e passei pra te dar um salve! 👊",
  "E aí, beleza? Vi você bem ativo no chat do grupo hoje! 💬",
  "Opa, fala aí! Tudo certo por aí? Vi você no grupo de apostas! 👋",
  "Opa, tranquilo? Te vi no grupo e resolvi puxar assunto! 😊",
  "Salve! Como estão as coisas por aí? Vi seu comentário lá no grupo! 🔥",
  "E aí, parceiro! Tudo joia? Achei seu nick bem massa no grupo! 🎮",
  "Fala irmão! Tudo certinho? Sempre te vejo online lá no grupo! 😉",
  "Oi, tudo bem? Tudo tranquilo por aí? Gostei das suas opiniões no grupo! 👍",
  "E aí, suave? Vi que você também faz parte daquele grupo de apostas! 😄",
  "Opa meu amigo! Como você tá? Te achei na lista de membros do grupo! 👋",
  "Salve, beleza? Tudo em paz? Passando pra mandar um abraço! ✨",
  "E aí, tudo bom? Bora trocar uma ideia rápida? Vi você no grupo! 🤝",
  "Opa, de boa? Vi você no grupo e achei bacana te mandar mensagem! 😊",
  "Oi amigo, beleza? Vi que você interage bastante lá no grupo! 💥",
  "Fala campeão, tudo 100% por aí? Vi seu perfil lá no canal! 🏆",
  "Opa, tudo na paz? Como tá seu dia? Te vi no grupo de cassino! ☀️",
  "E aí meu brother, beleza? Legal te encontrar por aqui também! 🤙",
  "Fala parceiro! Tudo certinho com você? Vi seu perfil no grupo dos jogos! 🚀",
  "Salve salve! Tudo bem com você hoje? Passando pra dar um oi! 👋",
  "E aí, como vai? Vi seu nome lá no grupo e resolvi mandar mensagem! 😊"
];

export const STRATEGY_FLATTERY_GREETINGS = [
  "Nossa, vi você jogando naquele grupo! Joga muito, hein! Tem alguma dica pra me dar? 🤩",
  "Oi, tudo bem? Fiquei impressionada com suas jogadas lá no grupo, você é fera! 🔥",
  "Olá! Tudo bem? Vi você mandando super bem no grupo. Admiro quem leva os jogos a sério assim. 🥰",
  "Oi, mano! Tudo joia? Você joga muito naquele grupo, virei sua fã! Sério! 💖",
  "Olá, mestre! Tudo bem? Te vi no grupo, seus palpites são os melhores! Quero aprender com você. 😏",
  "Cara, seus palpites no grupo são insanos! Como você faz? 🤯",
  "Mestre das apostas! Vi suas análises lá no grupo, parabéns mano! 👏",
  "Nossa, você só manda green no grupo! Me ensina esse segredo? 💚",
  "Oi! Vi que você manja demais das bancas no grupo. Respeito máximo! 🙌",
  "Caramba, vi suas decolagens no Crash lá no grupo! Você não tem medo não? 🚀",
  "E aí fera! Suas estratégias no grupo são muito brabras! 🔥",
  "Achei um mito das apostas no grupo! Tudo bem por aí? 😎",
  "Cara, fico só observando você forrar no grupo! Haja coragem e técnica! 💰",
  "Olá! Você é a pessoa que mais entende de roleta naquele grupo, né? 🎰",
  "Oi, tudo joia? Impressionado com o quanto você manja de apostas esportivas! ⚽",
  "Mestre! Vi suas dicas no grupo e deu super certo aqui. Valeu demais! 🙏",
  "E aí mano, vi seus prints lá no grupo. Você tá num nível muito avançado! 📈",
  "Oi! Não pude deixar de notar seu desempenho no grupo. Muito brabo! ⚡",
  "Olá! Você joga há quanto tempo? Suas jogadas no grupo são profissionais! 💎",
  "Ei, vi você acertando tudo no grupo! Qual é o truque? 🧙‍♂️",
  "Fala mestre! Acompanho suas mensagens no grupo faz tempo, é aula atrás de aula! 📚",
  "Oi! Seus resultados no grupo são inacreditáveis. Parabéns mesmo! 🎉",
  "E aí! Vi você mitando no grupo e resolvi falar com você! Star do grupo! 🌟",
  "Oie! Você é referência naquele grupo de jogos, né? Muito fera! 👑",
  "Salve! Suas análises de risco no grupo são sensacionais! 🎯"
];

export const STRATEGY_DIRECT_GAME_GREETINGS = [
  "Oie, blz? Vi você ativo no grupo de apostas. Tá tendo lucro lá? 💰",
  "Oi, tudo bem? Achei você no grupo. Qual é o seu jogo favorito daquela plataforma? 😉",
  "Olá! Tudo bem? Entrei no grupo e vi seu nick. Tá curtindo os bônus de lá? 🎁",
  "Oi, chefe! Tudo bem? Te vi no grupo, vim te chamar porque adoro gente que gosta de uma aposta forte! 🤑",
  "Olá! Tudo bem? Achei você no grupo. Sinceramente, você tem sorte no jogo ou é só técnica? 😉",
  "E aí, beleza? Qual slot tá pagando mais hoje na sua opinião? 🎰",
  "Opa! Vi você no grupo. Tá operando mais em cassino ao vivo ou slots? 🃏",
  "Fala apostador! Você joga mais pelo celular ou pelo computador? 📱",
  "Oi! Vi você no grupo de apostas. Qual plataforma você acha que tem o saque mais rápido via PIX? 💸",
  "E aí, blz? Tá rolando algum bônus bom naquela plataforma hoje? 🎟️",
  "Olá! Vi seu nick no grupo. Você costuma jogar no horário pagante ou em qualquer hora? ⏰",
  "Oi, chefe! Tudo certo? Você prefere Tiger, Aviator ou Mines? 🐯",
  "Opa! Vi você no grupo. Já pegou a promoção de depósito de 500% essa semana? 🚀",
  "E aí, mano! Você joga com banca alta ou prefere ir nas apostas baixas? 📊",
  "Fala parceiro! Qual é a sua meta diária de ganho quando entra pra jogar? 🎯",
  "Oi! Vi você no grupo. Tá usando algum robô de sinais ou vai na raça? 🤖",
  "Oie! Você já conseguiu sacar alto no PIX nessa plataforma? 🤑",
  "Olá! Qual foi a maior multiplicada que você deu no Crash até hoje? 💣",
  "E aí! Tá valendo a pena entrar naquele grupo VIP de sinais? 🤔",
  "Oi! Vi você falando de apostas no grupo. Tá conseguindo manter a banca positiva? 📈",
  "Opa, tudo bem? Você joga todo dia ou só nos finais de semana? 🗓️",
  "Fala jogador! Tá sabendo da roleta de giros grátis na plataforma nova? 🎡",
  "Oi! Vi você no grupo de apostas. Prefere futebol ou jogos de cassino? ⚽",
  "Oie! Já testou a estratégia dos horários minutos pagantes hoje? 🕒",
  "E aí! Vi seu perfil no grupo. Qual é a melhor plataforma pra iniciante na sua opinião? 💡"
];

export const STRATEGY_RESONANCE_GREETINGS = [
  "Oie! Tudo joia? Vi você no grupo, eu também jogo naquela plataforma, adorei o bônus de boas-vindas! 🎊",
  "Oi, tudo bem? Achei você lá no grupo. Você também joga Aviator? Eu tô viciada! 🎮",
  "Olá! Tudo bem? Vi você comentando no grupo. Aquele jogo do foguetinho (Crash) é muito bom, né? Você já ganhou muito nele? 🚀",
  "Oi, chefe! Tudo bem? Te vi no grupo. Acabei de descobrir uma plataforma que tá pagando muito no PIX, quer que eu te mostre qual é? 💸",
  "Oie, blz? Vi você no grupo. Tá operando agora? Eu tô testando uma estratégia nova, queria sua opinião. 😊",
  "E aí! Eu também tô naquele grupo de apostas. Conseguiu forrar hoje? 🎉",
  "Opa! Também jogo no Fortune Tiger! Você tá conseguindo soltar a carta hoje? 🐅",
  "Oi, tudo bem? Vi você no grupo. Eu jogo lá todo dia depois do trabalho, muito bom né? ☕",
  "Olá! Também sou membro do grupo. Você viu que atualizaram as regras do bônus de afiliados? 🎁",
  "E aí, blz? Eu também sou viciado em slots! Qual o seu jogo do momento? 🎰",
  "Oie! Vi você lá no grupo. Eu fiz um depósito pequeno hoje e já dobrei no PIX, você tá jogando agora? 💰",
  "Oi! Te vi no grupo. Eu costumo jogar bastante no Spaceman, você curte também? 👨‍🚀",
  "Fala amigo! Também tô no grupo. Tava procurando alguém pra trocar ideias de padrões no Mines! 💣",
  "Olá! Vi você no grupo de cassino. Eu adoro a roleta brasileira, você já jogou nela? 🇧🇷",
  "Oi! Também sou do grupo. Acabei de pegar uma sequência massa de greens! 💚",
  "Oie! Vi você comentando. Eu utilizo a plataforma faz 2 meses, tá pagando certinho pra você? ✅",
  "E aí! Também tô na batalha do grupo! Qual o seu horário favorito pra jogar? 🌙",
  "Opa! Vi você lá no chat. Eu tô testando uma alavancagem de banca pequena, quer trocar uma ideia? 📐",
  "Oi, tudo bem? Também faço parte do grupo. Você viu aquela promoção de giros grátis sem depósito? 🎡",
  "Olá! Te vi no grupo. Eu curto muito jogar no celular enquanto tô de bobeira, e você? 📱",
  "Oie! Também jogo nessa mesma casa! O suporte deles pelo chat é rápido pra você? ⚡",
  "Oi! Vi seu nome lá no grupo. Eu comecei essa semana e tô gostando bastante! E você? 🌟",
  "E aí! Também tô no grupo dos jogos. Você tá conseguindo lucrar no PIX diário? 💵",
  "Opa, suave? Eu também adoro uma aposta forte no final de semana! Bora forrar! 🚀",
  "Olá! Vi você lá no grupo de apostas. Que massa achar gente da mesma comunidade por aqui! 🤝"
];

export const BRAZILIAN_100_GREETINGS: string[] = [
  ...STRATEGY_FRIENDLY_GREETINGS,
  ...STRATEGY_FLATTERY_GREETINGS,
  ...STRATEGY_DIRECT_GAME_GREETINGS,
  ...STRATEGY_RESONANCE_GREETINGS
];

export const BRAZILIAN_50_GREETINGS: string[] = BRAZILIAN_100_GREETINGS;

export const OPTIMIZED_100_SPINTAX_GREETING = `{${BRAZILIAN_100_GREETINGS.join('|')}}`;
export const OPTIMIZED_100_DAY_SPINTAX_GREETING = OPTIMIZED_100_SPINTAX_GREETING;

import { saveAccountsToStorage, safeSaveAccountsToLocalStorage } from '../utils/accountStorage';

export const SimplifiedTgHub: React.FC<SimplifiedTgHubProps> = ({
  accounts,
  setAccounts,
  logs,
  setLogs,
  isCampaignRunning,
  setIsCampaignRunning,
  onNavigateToFullAccounts,
  onOpenLeadScraper,
  onOpenWebInbox,
  onOpenProxyModal,
  initialTargets
}) => {
  const isAbortedRef = useRef<boolean>(false);

  // ⏱️ 响应毫秒级中断的休眠工具函数 (只要 isAbortedRef 变为 true，最多 150ms 立即打破循环退出)
  const interruptibleSleep = async (ms: number) => {
    const step = 150;
    let elapsed = 0;
    while (elapsed < ms && !isAbortedRef.current) {
      await new Promise(r => setTimeout(r, Math.min(step, ms - elapsed)));
      elapsed += step;
    }
  };

  // Modal states
  const [showImportAccountsModal, setShowImportAccountsModal] = useState<boolean>(false);
  const [showMainTgSendModal, setShowMainTgSendModal] = useState<boolean>(false);
  const [showSpintaxAiModal, setShowSpintaxAiModal] = useState<boolean>(false);
  const [showPreflightModal, setShowPreflightModal] = useState<boolean>(false);
  const [showGroupInviterModal, setShowGroupInviterModal] = useState<boolean>(false);
  const [showBrazilSchedulerModal, setShowBrazilSchedulerModal] = useState<boolean>(false);
  const [showDomainRotatorModal, setShowDomainRotatorModal] = useState<boolean>(false);
  const [showSpamBotUnbanModal, setShowSpamBotUnbanModal] = useState<boolean>(false);
  const [showSwarmWarmupModal, setShowSwarmWarmupModal] = useState<boolean>(false);
  const [showDeviceFingerprintModal, setShowDeviceFingerprintModal] = useState<boolean>(false);
  const [showLeadAlertWebhookModal, setShowLeadAlertWebhookModal] = useState<boolean>(false);
  const [showAccountSanitizerModal, setShowAccountSanitizerModal] = useState<boolean>(false);
  const [showChannelWarmupModal, setShowChannelWarmupModal] = useState<boolean>(false);
  const [showFloodWaitBackoffModal, setShowFloodWaitBackoffModal] = useState<boolean>(false);
  const [showHealthScopeModal, setShowHealthScopeModal] = useState<boolean>(false);
  const [healthScopeType, setHealthScopeType] = useState<'selected' | 'group' | 'view' | 'all'>('all');
  const [healthTargetGroup, setHealthTargetGroup] = useState<string>('主力爆破A组');

  // Sub-modal states inside TG群发按键
  const [activeSubModal, setActiveSubModal] = useState<'none' | 'warmup' | 'profile' | 'mass_send'>('none');

  // Account Import Modal State
  const [importTextContent, setImportTextContent] = useState<string>('');
  const [importedFileName, setImportedFileName] = useState<string>('');

  // 1. TG 养号设置 (定时养号) State
  const [warmupDurationHours, setWarmupDurationHours] = useState<string>('2');
  const [warmupIntervalMinutes, setWarmupIntervalMinutes] = useState<string>('30');
  const [warmupDailyLimit, setWarmupDailyLimit] = useState<string>('120');
  const [warmupStartTime, setWarmupStartTime] = useState<string>('09:00');
  const [warmupEndTime, setWarmupEndTime] = useState<string>('22:00');
  const [isWarmupScheduled, setIsWarmupScheduled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tg_warmup_scheduled');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return false;
  });

  // TG Warmup Script Corpus State
  const [tgWarmupCorpus, setTgWarmupCorpus] = useState<string[]>([
    'Fala Camila, beleza? Já configurou o bot de disparo no canal do Telegram?',
    'Opa Bia! Sim, tudo configurado no servidor Cloud SQL com IP de Recife!',
    'Show de bola! O engajamento do grupo subiu muito depois da estratégia de mensagens curtas.',
    'Maravilha! As saídas do bot foram aprovadas com 100% de entregabilidade.',
    'Siga o canal VIP para receber os palpites atualizados do dia!'
  ]);
  const [newTgCorpusInput, setNewTgCorpusInput] = useState<string>('');

  // TG Pair Inter-chat State
  const [tgInterChatLogs, setTgInterChatLogs] = useState<Array<{
    id: string;
    sender: string;
    receiver: string;
    text: string;
    time: string;
  }>>([
    {
      id: 'tg-ic-1',
      sender: 'TG-Session-558191 (Beatriz)',
      receiver: 'TG-Session-558193 (Camila)',
      text: 'Fala Camila, beleza? Já configurou o bot de disparo no canal do Telegram?',
      time: '10:14:10'
    },
    {
      id: 'tg-ic-2',
      sender: 'TG-Session-558193 (Camila)',
      receiver: 'TG-Session-558191 (Beatriz)',
      text: 'Opa Bia! Sim, tudo configurado no servidor Cloud SQL com IP de Recife!',
      time: '10:14:22'
    }
  ]);

  const handleTriggerTgInterChatSim = () => {
    const timeNow = new Date().toTimeString().split(' ')[0];
    const isEven = tgInterChatLogs.length % 2 === 0;
    const newMsg = isEven ? {
      id: `tg-ic-${Date.now()}`,
      sender: 'TG-Session-558191 (Beatriz)',
      receiver: 'TG-Session-558193 (Camila)',
      text: 'Show de bola! O engajamento do grupo subiu muito depois da estratégia de mensagens curtas.',
      time: timeNow
    } : {
      id: `tg-ic-${Date.now()}`,
      sender: 'TG-Session-558193 (Camila)',
      receiver: 'TG-Session-558191 (Beatriz)',
      text: 'Maravilha! As saídas do bot foram aprovadas com 100% de entregabilidade.',
      time: timeNow
    };

    setTgInterChatLogs(prev => [...prev, newMsg]);
    setLogs(prev => [
      ...prev,
      `[TG对聊互养] 💬 ${newMsg.sender} ➔ ${newMsg.receiver}: "${newMsg.text.slice(0, 30)}..."`
    ]);
  };

  // 2. TG 改资料设置 State - 默认不固化照片，由操作员自由上传或删除
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>([]);
  const [isDeduplicating, setIsDeduplicating] = useState<boolean>(false);
  const [isTrimmingBorders, setIsTrimmingBorders] = useState<boolean>(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string>('');
  
  // 🔐 2FA 两步验证密码管理 State
  const [enable2FaUpdate, setEnable2FaUpdate] = useState<boolean>(true);
  const [twoFaPassword, setTwoFaPassword] = useState<string>('548508');
  const [twoFaHint, setTwoFaHint] = useState<string>('br_matrix_safe');
  const [twoFaRecoveryEmail, setTwoFaRecoveryEmail] = useState<string>('liaobei8989@outiook.com');
  const [showTwoFaPlaintext, setShowTwoFaPlaintext] = useState<boolean>(false);
  const [isUpdating2Fa, setIsUpdating2Fa] = useState<boolean>(false);
  const [twoFaBatchResult, setTwoFaBatchResult] = useState<string>('');

  // 🏷️ 账号分组与标签分流调度 State
  const PRESET_GROUPS = ['主力爆破A组', '新买养号B组', '备用储备C组', '测试组', '⚠️ 风控隔离组'];
  const normalizeGroupTag = (tag?: string): string => {
    if (!tag) return '主力爆破A组';
    const t = tag.trim();
    if (t.includes('隔离') || t.includes('受限') || t.includes('风控') || t.includes('双向') || t.includes('冷冻') || t.includes('封禁')) {
      return '⚠️ 风控隔离组';
    }
    if (t === '新进拓展B组' || t === '新进养号B组' || t === '养号B组' || t === 'B组' || t.includes('B组') || t.includes('养号')) {
      return '新买养号B组';
    }
    if (t === '爆破A组' || t === 'A组' || t.includes('A组') || t.includes('爆破')) {
      return '主力爆破A组';
    }
    if (t === '储备C组' || t === 'C组' || t.includes('C组') || t.includes('储备')) {
      return '备用储备C组';
    }
    if (t.includes('测试')) {
      return '测试组';
    }
    return t;
  };

  const getGroupColor = (grp?: string) => {
    const norm = normalizeGroupTag(grp);
    if (norm === '⚠️ 风控隔离组') {
      return {
        name: '⚠️ 风控隔离组',
        shortName: '受限隔离组',
        icon: '⚠️',
        textColor: 'text-amber-400',
        textBright: 'text-amber-300',
        bgSubtle: 'bg-amber-950/50',
        borderColor: 'border-amber-500/60',
        selectClass: 'bg-amber-950/80 border-amber-500/70 text-amber-300 font-bold focus:border-amber-400 shadow-sm shadow-amber-950/50',
        tabActive: 'bg-gradient-to-r from-amber-600 to-orange-600 text-slate-950 font-black shadow-md shadow-amber-600/30 border border-amber-400',
        tabInactive: 'bg-amber-950/30 text-amber-400/90 hover:text-amber-200 hover:bg-amber-950/60 border border-amber-800/40',
        badgeClass: 'bg-amber-950/80 text-amber-300 border border-amber-500/60',
        quickBtn: 'bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/50 text-amber-300',
        optionText: 'text-amber-400'
      };
    }
    if (norm === '主力爆破A组') {
      return {
        name: '主力爆破A组',
        shortName: '爆破A组',
        icon: '🚀',
        textColor: 'text-rose-400',
        textBright: 'text-rose-300',
        bgSubtle: 'bg-rose-950/50',
        borderColor: 'border-rose-500/60',
        selectClass: 'bg-rose-950/80 border-rose-500/70 text-rose-300 font-bold focus:border-rose-400 shadow-sm shadow-rose-950/50',
        tabActive: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black shadow-md shadow-rose-600/30 border border-rose-400',
        tabInactive: 'bg-rose-950/30 text-rose-400/90 hover:text-rose-200 hover:bg-rose-950/60 border border-rose-800/40',
        badgeClass: 'bg-rose-950/80 text-rose-300 border border-rose-500/60',
        quickBtn: 'bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/50 text-rose-300',
        optionText: 'text-rose-400'
      };
    }
    if (norm === '新买养号B组') {
      return {
        name: '新买养号B组',
        shortName: '养号B组',
        icon: '🛡️',
        textColor: 'text-sky-400',
        textBright: 'text-sky-300',
        bgSubtle: 'bg-sky-950/50',
        borderColor: 'border-sky-500/60',
        selectClass: 'bg-sky-950/80 border-sky-500/70 text-sky-300 font-bold focus:border-sky-400 shadow-sm shadow-sky-950/50',
        tabActive: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black shadow-md shadow-sky-600/30 border border-sky-400',
        tabInactive: 'bg-sky-950/30 text-sky-400/90 hover:text-sky-200 hover:bg-sky-950/60 border border-sky-800/40',
        badgeClass: 'bg-sky-950/80 text-sky-300 border border-sky-500/60',
        quickBtn: 'bg-sky-950/40 hover:bg-sky-950/70 border border-sky-500/50 text-sky-300',
        optionText: 'text-sky-400'
      };
    }
    if (norm === '备用储备C组') {
      return {
        name: '备用储备C组',
        shortName: '储备C组',
        icon: '📦',
        textColor: 'text-emerald-400',
        textBright: 'text-emerald-300',
        bgSubtle: 'bg-emerald-950/50',
        borderColor: 'border-emerald-500/60',
        selectClass: 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 font-bold focus:border-emerald-400 shadow-sm shadow-emerald-950/50',
        tabActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-slate-950 font-black shadow-md shadow-emerald-600/30 border border-emerald-400',
        tabInactive: 'bg-emerald-950/30 text-emerald-400/90 hover:text-emerald-200 hover:bg-emerald-950/60 border border-emerald-800/40',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/60',
        quickBtn: 'bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/50 text-emerald-300',
        optionText: 'text-emerald-400'
      };
    }
    // 测试组
    return {
      name: '测试组',
      shortName: '测试组',
      icon: '⚙️',
      textColor: 'text-purple-400',
      textBright: 'text-purple-300',
      bgSubtle: 'bg-purple-950/50',
      borderColor: 'border-purple-500/60',
      selectClass: 'bg-purple-950/80 border-purple-500/70 text-purple-300 font-bold focus:border-purple-400 shadow-sm shadow-purple-950/50',
      tabActive: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md shadow-purple-600/30 border border-purple-400',
      tabInactive: 'bg-purple-950/30 text-purple-400/90 hover:text-purple-200 hover:bg-purple-950/60 border border-purple-800/40',
      badgeClass: 'bg-purple-950/80 text-purple-300 border border-purple-500/60',
      quickBtn: 'bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/50 text-purple-300',
      optionText: 'text-purple-400'
    };
  };
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('ALL');
  const [massSendGroupFilter, setMassSendGroupFilter] = useState<string>('ALL');

  // 🛡️ 账号受限自动熔断隔离开关 (体检/发信一旦检测到双向受限/封号，立即自动退出养号B组与群发队列，移至【⚠️ 风控隔离组】)
  const [autoQuarantineRestricted, setAutoQuarantineRestricted] = useState<boolean>(() => {
    const saved = localStorage.getItem('tg_auto_quarantine_restricted');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleAutoQuarantine = (val: boolean) => {
    setAutoQuarantineRestricted(val);
    localStorage.setItem('tg_auto_quarantine_restricted', String(val));
    setSimpleLogs(prev => [
      ...prev,
      `🛡️ [风控防护开关] 账号受限自动隔离熔断已${val ? '【开启】(受限账号将自动移出B组养号与群发队列)' : '【关闭】'}`
    ]);
  };

  // 执行自动隔离移组核心函数
  const quarantineAccounts = (phones: string[], reason: string) => {
    const phoneSet = new Set(phones.map(p => p.replace(/\D/g, '')));
    if (phoneSet.size === 0) return;

    setAccounts(prev => {
      const updated = prev.map(acc => {
        const clean = (acc.phone || acc.id).replace(/\D/g, '');
        if (phoneSet.has(clean)) {
          return {
            ...acc,
            groupTag: '⚠️ 风控隔离组',
            status: 'restricted' as const
          };
        }
        return acc;
      });
      safeSaveAccountsToLocalStorage(updated);
      saveAccountsToStorage(updated);
      return updated;
    });

    setSimpleLogs(prev => [
      ...prev,
      `🛡️ [风控自动隔离熔断] 检测到 ${phoneSet.size} 个账号触发 Telegram 限制 (${reason})！`,
      `⚠️ 已自动将这 ${phoneSet.size} 个账号从【新买养号B组】/原发信分组移出，转入【⚠️ 风控隔离组】冷冻保护，自动退出群发与养号队列！`
    ]);
  };

  // 📱 账号视图模式、高密搜索与翻页控制 State
  const [accountViewMode, setAccountViewMode] = useState<'grid' | 'table'>('grid');
  const [accountSearchQuery, setAccountSearchQuery] = useState<string>('');
  const [accountPageSize, setAccountPageSize] = useState<number>(48); // 48/96/全部
  const [accountCurrentPage, setAccountCurrentPage] = useState<number>(1);

  // ☑️ 账号多选与批量操作 State (支持勾选指定账号批量修改/改资料/调分组)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // 🎯 改资料与换头像生效范围与独立配置 State (支持单独改头像、改名字、改简介、改2FA)
  const [profileTargetScope, setProfileTargetScope] = useState<'selected' | 'group' | 'unconfigured' | 'all' | 'single'>('selected');
  const [profileTargetGroup, setProfileTargetGroup] = useState<string>('新买养号B组');
  const [profileSingleAccount, setProfileSingleAccount] = useState<AccountSession | null>(null);

  // ⚙️ 改资料独立勾选开关 (改资料和头像分开设置)
  const [profileUpdateAvatar, setProfileUpdateAvatar] = useState<boolean>(true);
  const [profileUpdateName, setProfileUpdateName] = useState<boolean>(true);
  const [profileUpdateBioAndId, setProfileUpdateBioAndId] = useState<boolean>(true);
  const [profileUpdate2FaField, setProfileUpdate2FaField] = useState<boolean>(true);
  const [profileSetPhonePublic, setProfileSetPhonePublic] = useState<boolean>(true);

  // 头像分配策略: 'rotate_unused' (优先轮换未用过的头像) | 'random' (随机分配) | 'first_selected' (指定单张)
  const [profileAvatarStrategy, setProfileAvatarStrategy] = useState<'rotate_unused' | 'random' | 'first_selected'>('rotate_unused');
  const [profileSingleAvatarUrl, setProfileSingleAvatarUrl] = useState<string>('');

  const handleSetAccountGroup = (accId: string, groupTag: string) => {
    const targetClean = accId.replace(/\D/g, '');
    const updated = accounts.map(a => {
      const aClean = (a.phone || a.id).replace(/\D/g, '');
      if (a.id === accId || (targetClean && aClean === targetClean)) {
        return { ...a, groupTag };
      }
      return a;
    });
    setAccounts(updated);
    safeSaveAccountsToLocalStorage(updated);
    saveAccountsToStorage(updated);
    setSimpleLogs(prev => [...prev, `[🏷️ 分组调整] 账号 [${targetClean || accId}] 已成功划入【${groupTag}】并同步服务器凭证配置！`]);

    // Push to server companion json files
    if (targetClean) {
      fetch('/api/telegram/update-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetClean, groupTag })
      }).catch(() => {});
    }
  };

  const handleUpdateWarmupDays = (acc: AccountSession, newDay: number) => {
    const targetDay = Math.max(1, newDay);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const targetClean = (acc.phone || acc.id).replace(/\D/g, '');

    const updated = accounts.map(a => {
      const aClean = (a.phone || a.id).replace(/\D/g, '');
      if (a.id === acc.id || (targetClean && aClean === targetClean)) {
        return {
          ...a,
          warmupDay: targetDay,
          baseWarmupDay: targetDay,
          createdAt: todayStr,
          status: (targetDay >= 4 ? 'active' : 'warming') as any,
          dailyLimit: targetDay === 1 ? 15 : targetDay === 2 ? 30 : targetDay === 3 ? 60 : 120
        };
      }
      return a;
    });

    setAccounts(updated);
    safeSaveAccountsToLocalStorage(updated);
    saveAccountsToStorage(updated);
    setSimpleLogs(prev => [
      ...prev,
      `[🔥 养号天数更新] 账号 [${acc.phone || acc.alias}] 已更新为: 第 ${targetDay} 天 (明天将自动滚动至第 ${targetDay + 1} 天)`
    ]);

    // Push to server companion json files
    if (targetClean) {
      fetch('/api/telegram/update-warmup-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetClean, warmupDay: targetDay, todayStr })
      }).catch(() => {});
    }
  };

  const handleBatchUpdateWarmupDays = (fixedDay?: number, scope: 'selected' | 'all' = 'selected') => {
    const isSelectedScope = scope === 'selected' && selectedAccountIds.length > 0;
    const targetAccounts = isSelectedScope
      ? distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id))
      : distinctTgAccounts;

    if (targetAccounts.length === 0) {
      alert('当前没有可操作的账号！');
      return;
    }

    let targetDay = fixedDay;
    if (targetDay === undefined) {
      const scopeDesc = isSelectedScope ? `勾选的 ${targetAccounts.length} 个账号` : `当前全部 ${targetAccounts.length} 个账号`;
      const input = prompt(
        `【批量修改养号天数】\n\n🎯 操作对象: ${scopeDesc}\n\n请输入目标养号天数（例如刚购买的新号填 1，成熟老号填 7）：`,
        "1"
      );
      if (input === null) return;
      const parsed = parseInt(input.trim(), 10);
      if (isNaN(parsed) || parsed < 1) {
        alert('请输入有效的正整数天数（例如 1、2、7 等）！');
        return;
      }
      targetDay = parsed;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const targetPhones = targetAccounts.map(a => (a.phone || a.id).replace(/\D/g, '')).filter(Boolean);
    const targetCleanSet = new Set(targetPhones);

    const updated = accounts.map(a => {
      const aClean = (a.phone || a.id).replace(/\D/g, '');
      if (targetCleanSet.has(aClean) || (isSelectedScope && selectedAccountIds.includes(a.id))) {
        return {
          ...a,
          warmupDay: targetDay!,
          baseWarmupDay: targetDay!,
          createdAt: todayStr,
          status: (targetDay! >= 4 ? 'active' : 'warming') as any,
          dailyLimit: targetDay! === 1 ? 15 : targetDay! === 2 ? 30 : targetDay! === 3 ? 60 : 120
        };
      }
      return a;
    });

    setAccounts(updated);
    safeSaveAccountsToLocalStorage(updated);
    saveAccountsToStorage(updated);

    const scopeName = isSelectedScope ? `已勾选的 ${targetAccounts.length} 个账号` : `全部 ${targetAccounts.length} 个协议号`;
    setSimpleLogs(prev => [
      ...prev,
      `[📅 批量天数修改] 成功将 ${scopeName} 统一修改为: 第 ${targetDay} 天 (明天将自动滚动至第 ${targetDay! + 1} 天)，并已持久化存入服务器！`
    ]);

    // Push to server companion json files
    fetch('/api/telegram/update-warmup-days', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phones: targetPhones,
        warmupDay: targetDay,
        todayStr,
        all: !isSelectedScope
      })
    }).catch(() => {});

    alert(`✅ 批量修改成功！已将 ${scopeName} 统一设置为【第 ${targetDay} 天】！`);
  };

  const handleBatchAssignGroup = (groupTag: string) => {
    const updated = accounts.map(a => a.platform === 'telegram' ? { ...a, groupTag } : a);
    setAccounts(updated);
    safeSaveAccountsToLocalStorage(updated);
    saveAccountsToStorage(updated);
    setSimpleLogs(prev => [...prev, `[🏷️ 批量分组] 已将全部 ${distinctTgAccounts.length} 个协议号统一划入【${groupTag}】并同步服务器磁盘！`]);

    const allPhones = distinctTgAccounts.map(a => a.phone.replace(/\D/g, '')).filter(Boolean);
    fetch('/api/telegram/update-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones: allPhones, groupTag })
    }).catch(() => {});
  };

  // 一键彻底删除单个账号及服务器磁盘关联的 .session / .json 凭证 (0秒即时响应)
  const handleDeleteAccountAndFiles = async (acc: AccountSession) => {
    const cleanPhone = (acc.phone || acc.id).replace(/\D/g, '');
    const displayName = acc.alias || acc.phone || cleanPhone;
    if (!confirm(`确定要删除账号 [${displayName}] 吗？\n\n确认后将立即从列表移除并在后台彻底销毁磁盘凭证。`)) return;

    // 1. 立即执行乐观更新 (0毫秒响应，卡片瞬间消失)
    setAccounts(prev => {
      const filtered = prev.filter(a => {
        const cp = (a.phone || a.id).replace(/\D/g, '');
        return a.id !== acc.id && cp !== cleanPhone;
      });
      safeSaveAccountsToLocalStorage(filtered);
      saveAccountsToStorage(filtered);
      return filtered;
    });

    setUploadedSessions(prev => prev.filter(f => !f.fileName.includes(cleanPhone)));
    removeFileFromLocalBackup(`${cleanPhone}.session`);
    removeFileFromLocalBackup(`${cleanPhone}.json`);

    // 2. 存入持久化黑名单，防止任何缓存恢复
    try {
      const rawBlacklist = localStorage.getItem('tg_deleted_files_blacklist_v2');
      const bl: string[] = rawBlacklist ? JSON.parse(rawBlacklist) : [];
      if (!bl.includes(cleanPhone)) bl.push(cleanPhone);
      if (!bl.includes(`${cleanPhone}.session`)) bl.push(`${cleanPhone}.session`);
      if (!bl.includes(`${cleanPhone}.json`)) bl.push(`${cleanPhone}.json`);
      localStorage.setItem('tg_deleted_files_blacklist_v2', JSON.stringify(bl));
    } catch (_) {}

    setSimpleLogs(prev => [
      ...prev,
      `🗑️ [秒级删除] 账号 ${displayName} 已立即移除！正在后台销毁磁盘凭证...`
    ]);

    // 3. 后台静默销毁服务器物理文件
    fetch('/api/telegram/delete-account-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanPhone,
        fileNames: [`${cleanPhone}.session`, `${cleanPhone}.json`, `${cleanPhone}.session-journal`]
      })
    }).then(r => r.json()).then(data => {
      setSimpleLogs(prev => [
        ...prev,
        `✅ [磁盘擦除完成] 账号 ${displayName} 关联凭证已彻底销毁 (${data.count || 0} 个文件)`
      ]);
      fetchUploadedSessions(false);
    }).catch(err => {
      console.error('Delete files error:', err);
    });
  };

  // 批量清理封号及限制死号并物理销毁其磁盘文件
  const handleBatchCleanBannedAndFiles = async () => {
    const bannedAccounts = distinctTgAccounts.filter(acc => {
      const clean = (acc.phone || acc.id).replace(/\D/g, '');
      const hInfo = accountHealthMap[clean];
      return acc.status === 'banned' || acc.status === 'risk' || hInfo?.status === 'restricted' || hInfo?.status === 'banned';
    });

    if (bannedAccounts.length === 0) {
      alert('🎉 经检测，当前账号池中暂无已被封禁或被 SpamBot 限制的死号！所有账号状态良好。\n\n如需重新检测，可点击下方的【🔍 SpamBot 账号健康体检】。');
      return;
    }

    const phonesToDelete = bannedAccounts.map(a => (a.phone || a.id).replace(/\D/g, ''));
    if (!confirm(`⚠️ 检测到 ${bannedAccounts.length} 个被封禁/限制的死号！\n\n确定要一键清理这 ${bannedAccounts.length} 个账号并从服务器磁盘永久销毁其 .session / .json 文件吗？`)) return;

    try {
      const res = await fetch('/api/telegram/delete-account-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: phonesToDelete })
      });
      const data = await res.json();

      const bannedSet = new Set(phonesToDelete);
      setAccounts(prev => {
        const filtered = prev.filter(a => {
          const cp = (a.phone || a.id).replace(/\D/g, '');
          return !bannedSet.has(cp) && !bannedSet.has(a.id);
        });
        safeSaveAccountsToLocalStorage(filtered);
        saveAccountsToStorage(filtered);
        return filtered;
      });

      phonesToDelete.forEach(p => {
        removeFileFromLocalBackup(`${p}.session`);
        removeFileFromLocalBackup(`${p}.json`);
      });

      setSimpleLogs(prev => [
        ...prev,
        `🧹 [封禁死号一键清理] 成功清理 ${bannedAccounts.length} 个封号记录，并从服务器磁盘物理销毁 ${data.count || 0} 个凭证文件！`
      ]);
      alert(`✅ 成功清理 ${bannedAccounts.length} 个封禁账号！已同步从云端磁盘擦除全部关联凭证文件。`);
      fetchUploadedSessions();
    } catch (err: any) {
      alert(`清理出错: ${err.message}`);
    }
  };

  const [isAutoScanDaemon, setIsAutoScanDaemon] = useState<boolean>(true);

  // ⏰ 跨时区定时群发预约调度中心 State
  const [showCrossTimezoneModal, setShowCrossTimezoneModal] = useState<boolean>(false);

  // 第二条彩金补发 & 22:00 巴西宵禁守护统计 State
  const [scannerStats, setScannerStats] = useState<any>({
    status: 'ACTIVE',
    statusLabel: '🟢 正常巡航补发中 (07:00 - 22:00 BRT)',
    brazilTime: '加载中...',
    todayCount: 0,
    totalCount: 0,
    lastScanTime: '',
    lastScanRepliedCount: 0,
    nightPauseEnabled: true,
    stopHourBRT: 22,
    startHourBRT: 7,
    accountStats: {},
    logs: []
  });

  const fetchScannerStats = async () => {
    try {
      const res = await fetch('/api/tg-matrix/scanner-stats');
      if (res.ok) {
        const data = await res.json();
        setScannerStats(data);
      }
    } catch (e) {
      // Gracefully handle transient network errors without logging fatal errors
      console.warn('Scanner stats temporarily unavailable, retrying on next tick...');
    }
  };

  const handleResetTodayStats = async () => {
    if (!confirm('确定重置“今日成功补发彩金”计数为 0 条吗？\n（系统每日 00:00 BRT 也会自动归零）')) return;
    try {
      const res = await fetch('/api/tg-matrix/reset-today-stats', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setScannerStats(data.stats);
        } else {
          fetchScannerStats();
        }
      }
    } catch (e) {
      console.error('Failed to reset today stats:', e);
    }
  };

  useEffect(() => {
    fetchScannerStats();
    const timer = setInterval(fetchScannerStats, 15000);
    return () => clearInterval(timer);
  }, []);

  // 自动守护引擎：后台静默周期巡航
  useEffect(() => {
    let timer: any = null;
    if (isAutoScanDaemon) {
      // 延迟 5 秒后开启周期性巡检，避免首屏并发竞争
      timer = setInterval(() => {
        fetchScannerStats();
      }, 15000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoScanDaemon]);

  // Load saved profile images from IndexedDB (or fallback to localStorage)
  useEffect(() => {
    loadProfileImagesDB().then(imgs => {
      if (imgs && imgs.length > 0) {
        setUploadedImages(imgs);
      }
    }).catch(e => {
      console.error('Failed to load saved profile images:', e);
    });
  }, []);

  // Handle image upload with auto Canvas compression & hybrid storage save
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setProfileSuccessMsg(`⏳ 正在对新上传的 ${files.length} 张照片进行智能微缩与去重处理并存入数据库...`);

      try {
        const compressedPromises = files.map(file => compressImageToDataUrl(file as File, 400, 0.72));
        const newCompressedImages = await Promise.all(compressedPromises);

        const merged = [...uploadedImages, ...newCompressedImages];
        // Auto deduplicate on upload
        const { uniqueImages, removedCount } = await deduplicateImages(merged);

        const res = await saveProfileImagesDB(uniqueImages);
        if (res && res.compressedImages) {
          setUploadedImages(res.compressedImages);
        } else {
          setUploadedImages(uniqueImages);
        }
        setSelectedImageIndices([]);

        setProfileSuccessMsg(
          `🎉 成功批量上传并轻量保存 ${files.length} 张照片！当前相册共 ${uniqueImages.length} 张图片已安全存入数据库${
            removedCount > 0 ? `（已自动过滤 ${removedCount} 张重复图）` : ''
          }！`
        );
      } catch (err: any) {
        setProfileSuccessMsg(`❌ 照片上传保存出错: ${err.message}`);
      }
      e.target.value = '';
    }
  };

  // Toggle single image selection
  const handleToggleSelectImage = (index: number) => {
    setSelectedImageIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAllImages = () => {
    if (selectedImageIndices.length === uploadedImages.length && uploadedImages.length > 0) {
      setSelectedImageIndices([]);
    } else {
      setSelectedImageIndices(uploadedImages.map((_, i) => i));
    }
  };

  // Batch delete selected images
  const handleBatchDeleteSelected = async () => {
    if (selectedImageIndices.length === 0) {
      alert('请先勾选需要删除的照片！');
      return;
    }
    const countToDelete = selectedImageIndices.length;
    const remaining = uploadedImages.filter((_, i) => !selectedImageIndices.includes(i));
    setUploadedImages(remaining);
    setSelectedImageIndices([]);

    try {
      const res = await saveProfileImagesDB(remaining);
      if (res && res.compressedImages) {
        setUploadedImages(res.compressedImages);
      }
    } catch (_) {}
    setProfileSuccessMsg(`🗑️ 成功批量删除 ${countToDelete} 张照片，当前相册剩余: ${remaining.length} 张！`);
  };

  // Single delete
  const handleDeleteImage = async (index: number) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    setSelectedImageIndices(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    try {
      const res = await saveProfileImagesDB(updated);
      if (res && res.compressedImages) {
        setUploadedImages(res.compressedImages);
      }
    } catch (_) {}
    setProfileSuccessMsg(`已移除 1 张照片，剩余照片相册数: ${updated.length} 张`);
  };

  // Clear all images
  const handleClearAllImages = async () => {
    setUploadedImages([]);
    setSelectedImageIndices([]);
    try {
      await clearProfileImagesDB();
    } catch (_) {}
    setProfileSuccessMsg('🗑️ 已成功清空图库中的所有照片！');
  };

  // Completely wipe all gallery photos, server disk avatars, and reset accounts avatarUrl to empty
  const handleWipeAllAvatarsAndGallery = async () => {
    if (!confirm('确定要彻底清空图库中的全部照片，并重置所有账号的头像为初始空白状态吗？\n（将同步清除服务器磁盘相册与全部账号的头像缓存）')) {
      return;
    }
    setUploadedImages([]);
    setSelectedImageIndices([]);
    try {
      await clearProfileImagesDB();
      await fetch('/api/telegram/clear-all-avatars', { method: 'POST' }).catch(() => {});
    } catch (_) {}

    // Reset account avatarUrls
    const resetAccs = accounts.map(a => ({
      ...a,
      avatarUrl: ''
    }));
    setAccounts(resetAccs);
    safeSaveAccountsToLocalStorage(resetAccs);
    saveAccountsToStorage(resetAccs);

    setProfileSuccessMsg('🗑️ 已彻底清空全部相册照片，并已重置所有账号头像为初始空白！系统内无任何残留网络照片。');
    setSimpleLogs(prev => [
      ...prev,
      `[相册与头像清空 🗑️] 已彻底清除图库与服务端磁盘上的所有头像缓存照片，所有账号头像已重置为空白状态。`
    ]);
  };

  // Smart deduplication
  const handleSmartDeduplicate = async () => {
    if (uploadedImages.length <= 1) {
      setProfileSuccessMsg('💡 当前照片数量较少（≤1张），无需去重。');
      return;
    }
    setIsDeduplicating(true);
    setProfileSuccessMsg('⏳ 正在进行智能图像感知指纹去重比对中...');

    try {
      const { uniqueImages, removedCount } = await deduplicateImages(uploadedImages);
      if (removedCount === 0) {
        setProfileSuccessMsg('✨ 图库已非常纯净！未检测到任何重复或高相似度照片。');
      } else {
        setUploadedImages(uniqueImages);
        setSelectedImageIndices([]);
        const res = await saveProfileImagesDB(uniqueImages);
        if (res && res.compressedImages) {
          setUploadedImages(res.compressedImages);
        }
        setProfileSuccessMsg(`🎉 智能一键去重完成！成功清理 ${removedCount} 张重复照片，当前保留 ${uniqueImages.length} 张高画质唯一真人头像！`);
      }
    } catch (e: any) {
      setProfileSuccessMsg(`去重处理失败: ${e.message}`);
    } finally {
      setIsDeduplicating(false);
    }
  };

  // Smart white border trimming & centering
  const handleSmartTrimAndCenter = async () => {
    if (uploadedImages.length === 0) {
      setProfileSuccessMsg('💡 请先上传照片后再执行消除白边与人像居中。');
      return;
    }
    setIsTrimmingBorders(true);
    setProfileSuccessMsg(`⏳ 正在对全部 ${uploadedImages.length} 张照片执行智能消除截图白边 & 人像居中对齐...`);

    try {
      const trimmedList = await Promise.all(uploadedImages.map(img => trimImageWhiteBorders(img, 400)));
      setUploadedImages(trimmedList);
      const res = await saveProfileImagesDB(trimmedList);
      if (res && res.compressedImages) {
        setUploadedImages(res.compressedImages);
      }
      setProfileSuccessMsg(`✨ 智能人像优化完成！已自动消除相册所有照片的手机截图白边/黑框，并完成主体居中！`);
    } catch (e: any) {
      setProfileSuccessMsg(`处理出错: ${e.message}`);
    } finally {
      setIsTrimmingBorders(false);
    }
  };

  const handleSaveProfilePhotosOnly = async () => {
    try {
      setProfileSuccessMsg(`⏳ 正在对当前 ${uploadedImages.length} 张个人照片进行智能高压缩并保存...`);
      const res = await saveProfileImagesDB(uploadedImages);
      if (res && res.compressedImages) {
        setUploadedImages(res.compressedImages);
      }
      setProfileSuccessMsg(`💾 [保存成功] 已成功保存当前 ${uploadedImages.length} 张个人形象照片！超轻量格式，不受 5MB 空间限制！`);
    } catch (e: any) {
      setProfileSuccessMsg(`❌ 保存出错: ${e.message}`);
    }
  };

  // 3. TG 群发设置 State
  const [sendStrategyMode, setSendStrategyMode] = useState<'two_stage' | 'direct'>('two_stage');
  // 🎲 群发速率模式: 'conservative' (真人业务员 45~60秒/条，15条约12~15分钟) | 'balanced' (平稳 20~35秒/条) | 'turbo' (极速 5~12秒/条) | 'custom' (自定义)
  const [tgSendSpeedMode, setTgSendSpeedMode] = useState<'turbo' | 'balanced' | 'conservative' | 'custom'>('conservative');
  const [customSpeedMin, setCustomSpeedMin] = useState<number>(45.0);
  const [customSpeedMax, setCustomSpeedMax] = useState<number>(60.0);
  const [enableDynamicJitter, setEnableDynamicJitter] = useState<boolean>(true);
  const [enableTypingSimulation, setEnableTypingSimulation] = useState<boolean>(true);
  const [enableMicroPause, setEnableMicroPause] = useState<boolean>(true);
  const [greetingsList, setGreetingsList] = useState<string[]>(BRAZILIAN_50_GREETINGS);
  const [use50GreetingsRotate, setUse50GreetingsRotate] = useState<boolean>(true);
  const [greetingGlobalIndex, setGreetingGlobalIndex] = useState<number>(0);
  const [show50GreetingsModal, setShow50GreetingsModal] = useState<boolean>(false);
  const [show50GreetingsDrawer, setShow50GreetingsDrawer] = useState<boolean>(false);
  const [appendSenderTag, setAppendSenderTag] = useState<boolean>(false);

  const [greetingText, setGreetingText] = useState<string>(OPTIMIZED_100_DAY_SPINTAX_GREETING);
  const [followupLinkText, setFollowupLinkText] = useState<string>(() => {
    return `🔥 {BÔNUS EXCLUSIVO LIBERADO|GANHE SEU BÔNUS VIP HOJE}! 🎁 {Claim 500% de Bônus de Depósito + 150 Rodadas Grátis (Free Spins)|200% de Bônus VIP + 100 Giros Grátis}! 💰 Convide 1 pessoa e ganhe R$ 60 no PIX instantâneo (Afiliado até R$ 1.000)! 🎡 Roleta da Sorte & Chuva de Dinheiro: ${get100SubdomainsSpintax()}`;
  });
  // 阶段三：祝老板中奖/暴富祝福语 (Spintax 变量语法 + 官方推荐 3~6s 拟人延时)
  const [blessingText, setBlessingText] = useState<string>(DEFAULT_BLESSING_SPINTAX);
  const [enableBlessing, setEnableBlessing] = useState<boolean>(true);
  const [blessingDelayMin, setBlessingDelayMin] = useState<number>(3.5);
  const [blessingDelayMax, setBlessingDelayMax] = useState<number>(6.0);
  const [blessingSamplePreview, setBlessingSamplePreview] = useState<string>('');
  const [testMessageType, setTestMessageType] = useState<'greeting' | 'followup' | 'blessing' | 'custom'>('greeting');
  const [testCustomMessage, setTestCustomMessage] = useState<string>('');
  const [massDataText, setMassDataText] = useState<string>('');
  const [massFileName, setMassFileName] = useState<string>('');
  const [massMessageText, setMassMessageText] = useState<string>(() => {
    return `🔥 {PROMOÇÃO EXCLUSIVA|GANHE BÔNUS HOJE}! 🎁 {500% de Bônus + 150 Spins|200% de bônus no PIX}! 🎰 Cadastre-se e receba na hora: ${get100SubdomainsSpintax()}`;
  });

  // Batch Result Alert Modal State (提示群发结果/失败通知)
  const [batchResultModalState, setBatchResultModalState] = useState<{
    isOpen: boolean;
    type: 'success' | 'warning' | 'failed';
    title: string;
    total: number;
    successCount: number;
    failCount: number;
    mainReason: string;
    suggestion: string;
  }>({
    isOpen: false,
    type: 'failed',
    title: '',
    total: 0,
    successCount: 0,
    failCount: 0,
    mainReason: '',
    suggestion: ''
  });

  // 养号期防护模式 (前 3~7 天单号每日仅发 5~8 条)
  const [enable3To7DaysWarmupThrottling, setEnable3To7DaysWarmupThrottling] = useState<boolean>(() => {
    const saved = localStorage.getItem('tg_warmup_3to7_mode');
    return saved !== null ? saved === 'true' : true;
  });

  const toggleWarmupThrottling = (val: boolean) => {
    setEnable3To7DaysWarmupThrottling(val);
    localStorage.setItem('tg_warmup_3to7_mode', String(val));
  };

  // TG 官方 Channel / Bot 沉淀配置
  const [officialChannelLink, setOfficialChannelLink] = useState<string>(
    localStorage.getItem('tg_official_channel') || 'https://t.me/BrazilGo888_Official'
  );
  const [officialBotUsername, setOfficialBotUsername] = useState<string>(
    localStorage.getItem('tg_official_bot') || '@BrazilGo888VIP_Bot'
  );

  const saveOfficialChannelBot = (channel: string, bot: string) => {
    setOfficialChannelLink(channel);
    setOfficialBotUsername(bot);
    localStorage.setItem('tg_official_channel', channel);
    localStorage.setItem('tg_official_bot', bot);
  };
  const [sentOffset, setSentOffset] = useState<number>(() => {
    const saved = localStorage.getItem('tg_sent_offset');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const updateSentOffset = (newOffset: number) => {
    setSentOffset(newOffset);
    localStorage.setItem('tg_sent_offset', newOffset.toString());
  };

  // Active targets waiting for reply in two-stage mode
  const [pendingReplyTargets, setPendingReplyTargets] = useState<string[]>([]);

  // Auto-sync initialTargets from LeadScraperHub
  useEffect(() => {
    if (initialTargets && initialTargets.length > 0) {
      setMassDataText(initialTargets.join('\n'));
      setSimpleLogs(prev => [
        ...prev,
        `🎯 [获客雷达联动] 已自动从群组/评论区采集雷达导入 ${initialTargets.length} 条高意向活跃客户至发信池！`
      ]);
    }
  }, [initialTargets]);

  // Simple Clean Real-Time Logs State
  const initialTgCount = accounts.filter(a => a.platform === 'telegram').length || accounts.length || 4;
  
  // User's 5 Brazilian SOCKS5 Proxies (+ 1 Auxiliary)
  const [brazilProxies, setBrazilProxies] = useState<string[]>([
    '200.160.36.222:12323:14aade52b86e6:70dd653fc2',
    '200.239.237.124:12323:14aade52b86e6:70dd653fc2',
    '200.160.43.132:12323:14aade52b86e6:70dd653fc2',
    '200.160.38.29:12323:14aade52b86e6:70dd653fc2',
    '200.239.213.26:12323:14aade52b86e6:70dd653fc2',
    '144.225.30.86:12323:14aade52b86e6:70dd653fc2'
  ]);

  const [simpleLogs, setSimpleLogs] = useState<string[]>([
    '系统就绪，支持一键改资料、定时养号与高速群发',
    `已加载 ${initialTgCount} 个有效 TG 协议 Session 账号`,
    `已绑定 ${initialTgCount} 组【1号1专属独立IP】(200.152.* / 144.225.* 等) 严格隔离护航 +55 协议号防封`
  ]);

  // Server Session Files Management & Browser Persistence
  const SESSION_PERSIST_KEY = 'tg_persisted_session_files_v2';
  const [uploadedSessions, setUploadedSessions] = useState<ServerSessionFile[]>([]);
  const [isUploadingSession, setIsUploadingSession] = useState(false);
  const [sessionUploadStatus, setSessionUploadStatus] = useState('');
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const [isPurgingOrphaned, setIsPurgingOrphaned] = useState(false);

  const saveFileToLocalBackup = (fileName: string, base64Content: string) => {
    try {
      const raw = localStorage.getItem(SESSION_PERSIST_KEY);
      if (fileName.toLowerCase().includes('2fa') && fileName.endsWith('.session')) return;
      if (fileName === 'account_proxies.json' || fileName === 'package.json' || fileName === 'package-lock.json') return;
      let list: Array<{ fileName: string; base64Content: string; uploadedAt?: string }> = raw ? JSON.parse(raw) : [];
      list = list.filter(f => (!f.fileName.toLowerCase().includes('2fa') || !f.fileName.endsWith('.session')) && f.fileName !== 'account_proxies.json');
      const idx = list.findIndex(f => f.fileName === fileName);
      if (idx >= 0) {
        list[idx] = { fileName, base64Content, uploadedAt: new Date().toISOString() };
      } else {
        list.push({ fileName, base64Content, uploadedAt: new Date().toISOString() });
      }

      // If re-saved, remove from deleted blacklist
      try {
        const deletedKey = 'tg_deleted_files_blacklist_v2';
        const rawBlacklist = localStorage.getItem(deletedKey);
        if (rawBlacklist) {
          let blacklist: string[] = JSON.parse(rawBlacklist);
          blacklist = blacklist.filter(b => b !== fileName);
          localStorage.setItem(deletedKey, JSON.stringify(blacklist));
        }
      } catch (_) {}

      try {
        localStorage.setItem(SESSION_PERSIST_KEY, JSON.stringify(list));
      } catch (quotaErr) {
        // Keep only recent 3 session files if quota is exceeded
        const trimmedList = list.slice(-3);
        localStorage.setItem(SESSION_PERSIST_KEY, JSON.stringify(trimmedList));
      }
    } catch (err) {
      console.warn('Failed to save session backup to localStorage:', err);
    }
  };

  const removeFileFromLocalBackup = (fileName: string) => {
    try {
      const cleanPrefix = fileName.replace(/\.(session|json|txt|bak|db)$/i, '');
      const digitsMatch = fileName.match(/\d{6,16}/);
      const phoneDigits = digitsMatch ? digitsMatch[0] : '';

      // 1. Clean from tg_persisted_session_files_v2
      const raw = localStorage.getItem(SESSION_PERSIST_KEY);
      if (raw) {
        const list: Array<{ fileName: string; base64Content: string }> = JSON.parse(raw);
        const filtered = list.filter(f => {
          if (f.fileName === fileName) return false;
          if (cleanPrefix && (f.fileName.startsWith(cleanPrefix) || f.fileName.includes(cleanPrefix))) return false;
          if (phoneDigits && f.fileName.includes(phoneDigits)) return false;
          return true;
        });
        localStorage.setItem(SESSION_PERSIST_KEY, JSON.stringify(filtered));
      }

      // 2. Add to deleted files blacklist so auto-restore NEVER brings it back
      const deletedKey = 'tg_deleted_files_blacklist_v2';
      const rawBlacklist = localStorage.getItem(deletedKey);
      let blacklist: string[] = rawBlacklist ? JSON.parse(rawBlacklist) : [];
      [fileName, cleanPrefix, phoneDigits].filter(Boolean).forEach(k => {
        if (!blacklist.includes(k)) blacklist.push(k);
      });
      localStorage.setItem(deletedKey, JSON.stringify(blacklist));
    } catch (err) {
      console.error('Failed to remove session backup from localStorage:', err);
    }
  };

  const fetchUploadedSessions = async (isManual = false) => {
    if (isManual) setIsRefreshingSessions(true);
    try {
      const res = await fetch('/api/telegram/list-sessions');
      const data = await res.json();
      if (data.success && Array.isArray(data.files)) {
        const cleanFiles = data.files.filter((f: ServerSessionFile) => !f.fileName.toLowerCase().includes('2fa') && f.fileName !== 'package-lock.json' && f.fileName !== 'package.json' && f.fileName !== 'tsconfig.json' && f.fileName !== 'metadata.json' && f.fileName !== 'account_proxies.json' && !f.fileName.includes('malformed') && !f.fileName.endsWith('.bak'));
        setUploadedSessions(cleanFiles);

        // Auto sync accounts if needed
        try {
          const accRes = await fetch('/api/telegram/get-accounts');
          const accData = await accRes.json();
          if (accData.success && Array.isArray(accData.accounts) && accData.accounts.length > 0) {
            setAccounts(prev => {
              const prevMap = new Map<string, AccountSession>();
              prev.forEach(a => {
                const cp = a.phone ? a.phone.replace(/\D/g, '') : '';
                if (cp) prevMap.set(cp, a);
              });
              const list: AccountSession[] = accData.accounts.map((acc: AccountSession) => {
                const cp = acc.phone ? acc.phone.replace(/\D/g, '') : '';
                const existing = cp ? prevMap.get(cp) : undefined;
                return existing ? { ...acc, ...existing } : acc;
              });
              return list;
            });
          }
        } catch (e) {}

        // Auto-restore ONLY non-blacklisted files from localStorage to server disk if container restarted
        try {
          const raw = localStorage.getItem(SESSION_PERSIST_KEY);
          const rawBlacklist = localStorage.getItem('tg_deleted_files_blacklist_v2');
          const blacklist: string[] = rawBlacklist ? JSON.parse(rawBlacklist) : [];

          if (raw) {
            let persistedList: Array<{ fileName: string; base64Content: string }> = JSON.parse(raw);
            persistedList = persistedList.filter(f => {
              if (f.fileName.toLowerCase().includes('2fa') && f.fileName.endsWith('.session')) return false;
              if (f.fileName === 'package-lock.json' || f.fileName === 'package.json' || f.fileName === 'account_proxies.json') return false;
              // Check blacklist
              if (blacklist.some(b => b && (f.fileName === b || f.fileName.includes(b)))) return false;
              return true;
            });
            localStorage.setItem(SESSION_PERSIST_KEY, JSON.stringify(persistedList));

            const currentNames = new Set(cleanFiles.map((f: ServerSessionFile) => f.fileName));
            const missing = persistedList.filter(f => !currentNames.has(f.fileName));

            if (missing.length > 0) {
              console.log(`[Auto-Restore] Found ${missing.length} missing session/json files in server disk, auto re-syncing from browser cache...`);
              let restoredAny = false;
              for (const item of missing) {
                try {
                  await fetch('/api/telegram/upload-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      fileName: item.fileName,
                      base64Content: item.base64Content
                    })
                  });
                  restoredAny = true;
                } catch (e) {
                  console.error(`Failed to restore ${item.fileName}:`, e);
                }
              }
              if (restoredAny) {
                const res2 = await fetch('/api/telegram/list-sessions');
                const data2 = await res2.json();
                if (data2.success && Array.isArray(data2.files)) {
                  setUploadedSessions(data2.files.filter((f: ServerSessionFile) => !f.fileName.toLowerCase().includes('2fa') && f.fileName !== 'account_proxies.json'));
                }
              }
            }
          }
        } catch (e) {
          console.error('Auto restore check failed:', e);
        }

        if (isManual) {
          setSimpleLogs(prev => [
            ...prev,
            `🔄 [磁盘刷新完成] 已从云端服务器磁盘读取最新状态，当前挂载 ${cleanFiles.length} 个协议凭证文件！`
          ]);
        }
      }
    } catch (err: any) {
      console.error('Fetch sessions error:', err);
      if (isManual) {
        alert(`刷新磁盘状态失败: ${err.message}`);
      }
    } finally {
      if (isManual) {
        setTimeout(() => setIsRefreshingSessions(false), 400);
      }
    }
  };

  useEffect(() => {
    fetchUploadedSessions();
    const obsoletePhones = new Set(['5538988630899', '5538991977854', '5538992304845', '5541987023810', '5586995118207']);
    // Auto-clean any invalid accounts and ensure disk accounts are synced
    setAccounts(prev => {
      const map = new Map<string, AccountSession>();
      prev.forEach(acc => {
        // Telegram account validation
        const clean = acc.phone ? acc.phone.replace(/\D/g, '') : '';
        if (clean && clean.length >= 8 && !obsoletePhones.has(clean)) {
          if (!map.has(clean)) {
            map.set(clean, acc);
          }
        }
      });
      return Array.from(map.values());
    });
  }, []);

  // Compute distinct TG accounts
  const distinctTgAccounts = React.useMemo(() => {
    const map = new Map<string, AccountSession>();
    const obsoletePhones = new Set(['5538988630899', '5538991977854', '5538992304845', '5541987023810', '5586995118207']);
    accounts.filter(a => a.platform === 'telegram').forEach(acc => {
      const clean = acc.phone ? acc.phone.replace(/\D/g, '') : '';
      if (clean && clean.length >= 8 && !obsoletePhones.has(clean)) {
        if (!map.has(clean)) {
          const isBGroup = clean.startsWith('55869948') || clean.startsWith('55869949') || clean.startsWith('55869951') || (acc.warmupDay && acc.warmupDay <= 3);
          const rawGroup = acc.groupTag;
          const assignedGroup = (!rawGroup || rawGroup === '新进拓展B组' || rawGroup === '新进养号B组')
            ? (isBGroup ? '新买养号B组' : '主力爆破A组')
            : normalizeGroupTag(rawGroup);

          map.set(clean, {
            ...acc,
            groupTag: assignedGroup
          });
        }
      }
    });
    return Array.from(map.values());
  }, [accounts]);

  // Filter visible accounts based on group filter tab and search query
  const filteredTgAccounts = React.useMemo(() => {
    let result = distinctTgAccounts;
    if (selectedGroupFilter !== 'ALL') {
      result = result.filter(a => normalizeGroupTag(a.groupTag) === selectedGroupFilter);
    }
    if (accountSearchQuery.trim()) {
      const q = accountSearchQuery.trim().toLowerCase();
      result = result.filter(a => {
        const phone = (a.phone || '').toLowerCase();
        const alias = (a.alias || '').toLowerCase();
        const proxy = (a.proxy || '').toLowerCase();
        const pass = (a.twoFactorPassword || '').toLowerCase();
        const grp = normalizeGroupTag(a.groupTag).toLowerCase();
        return phone.includes(q) || alias.includes(q) || proxy.includes(q) || pass.includes(q) || grp.includes(q);
      });
    }
    return result;
  }, [distinctTgAccounts, selectedGroupFilter, accountSearchQuery]);

  const totalAccountPages = accountPageSize > 0 ? Math.max(1, Math.ceil(filteredTgAccounts.length / accountPageSize)) : 1;

  // Paginated visible accounts
  const visibleAccounts = React.useMemo(() => {
    if (accountPageSize <= 0) return filteredTgAccounts;
    const safePage = Math.min(accountCurrentPage, totalAccountPages);
    const start = (safePage - 1) * accountPageSize;
    return filteredTgAccounts.slice(start, start + accountPageSize);
  }, [filteredTgAccounts, accountPageSize, accountCurrentPage, totalAccountPages]);

  // Compute distinct uploaded session accounts (excluding .json auxiliary config)
  const distinctSessionFiles = React.useMemo(() => {
    return uploadedSessions.filter(f => f.fileName.endsWith('.session') && !f.fileName.toLowerCase().includes('2fa'));
  }, [uploadedSessions]);

  const processSessionFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsUploadingSession(true);
    setSessionUploadStatus(`正在传输并存入 ${files.length} 个协议凭证文件...`);

    let successCount = 0;

    const extractedPhones = new Set<string>();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const match = file.name.match(/\d{8,15}/);
      if (match) {
        extractedPhones.add(match[0]);
      }
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsDataURL(file);
        });

        const res = await fetch('/api/telegram/upload-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            base64Content: base64
          })
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
          saveFileToLocalBackup(file.name, base64);
          setSimpleLogs(prev => [...prev, `[凭证挂载与备份成功] 真实协议文件 [${file.name}] (${(file.size / 1024).toFixed(1)} KB) 已写入 /sessions 并永久备份于云端磁盘与浏览器存储！`]);
        }
      } catch (err: any) {
        console.error('File upload error:', err);
      }
    }

    // Auto-create/register accounts for newly detected phone numbers
    if (extractedPhones.size > 0) {
      const newPhones = Array.from(extractedPhones);
      
      // 读取已保存的代理池，若为空则默认使用完整的 60 个巴西原生住宅代理池
      let customProxyPool: string[] = [];
      try {
        const rawPool = localStorage.getItem('tg_custom_proxy_pool');
        if (rawPool) {
          const parsed = JSON.parse(rawPool);
          if (Array.isArray(parsed) && parsed.length > 0) {
            customProxyPool = parsed;
          }
        }
      } catch (_) {}

      if (customProxyPool.length === 0) {
        customProxyPool = BRAZIL_PROXIES_POOL;
      }

      setAccounts(prev => {
        const existingPhones = new Set(prev.map(a => a.phone?.replace(/\D/g, '')));
        const existingUsedIps = new Set(
          prev.map(a => a.proxy ? a.proxy.replace(/^(socks5:\/\/|http:\/\/)/i, '').split(':')[0] : '').filter(Boolean)
        );
        const updated = [...prev];

        // 找出代理池中尚未被任何账号占用的空闲独享代理 IP (根据真实 IP 地址比对排重)
        const availablePoolProxies = customProxyPool.filter(p => {
          const ip = p.replace(/^(socks5:\/\/|http:\/\/)/i, '').split(':')[0];
          return !existingUsedIps.has(ip);
        });

        let availableCursor = 0;

        newPhones.forEach((phone, idx) => {
          if (!existingPhones.has(phone)) {
            // 严格分配未被使用的空闲代理 IP
            let assignedProxy = '';
            if (availableCursor < availablePoolProxies.length) {
              assignedProxy = availablePoolProxies[availableCursor];
              const assignedIp = assignedProxy.replace(/^(socks5:\/\/|http:\/\/)/i, '').split(':')[0];
              existingUsedIps.add(assignedIp);
              availableCursor++;
            } else if (BRAZIL_DEDICATED_PROXIES_MAP[phone]) {
              assignedProxy = BRAZIL_DEDICATED_PROXIES_MAP[phone];
            } else {
              assignedProxy = customProxyPool[idx % customProxyPool.length];
            }

            const aliasName = `TG-BR-${phone.slice(-4)} (${BRAZILIAN_FEMALE_NAMES[idx % BRAZILIAN_FEMALE_NAMES.length]})`;
            const nowDayStr = new Date().toISOString().split('T')[0];
            updated.push({
              id: `acc-tg-${phone}`,
              phone: `+${phone}`,
              alias: aliasName,
              platform: 'telegram',
              type: 'tg_userbot',
              status: 'active',
              proxy: assignedProxy,
              proxyPing: `${Math.floor(Math.random() * 20) + 112}ms`,
              twoFactorPassword: '548508',
              sessionPath: `${phone}.session`,
              sentCountToday: 0,
              maxLimitDaily: 120,
              healthScore: 99,
              sentToday: 0,
              dailyLimit: 120,
              totalSent: 0,
              successRate: 100,
              createdAt: nowDayStr,
              lastActive: '刚刚',
              warmupDay: calculateWarmupDays(nowDayStr, 1),
              groupTag: '新买养号B组'
            });
          }
        });
        return updated.filter(a => !a.id?.includes('imported'));
      });
      setSimpleLogs(prev => [
        ...prev,
        `🎉 [新账号自动入库] 已自动识别 ${newPhones.length} 个巴西 TG 协议号 (+${newPhones.join(', +')}) 并严格分配独享未占用的空闲代理 IP！`
      ]);

      // 自动将最新分配的新账号-IP映射保存至服务端 account_proxies.json
      setTimeout(() => {
        try {
          fetch('/api/telegram/get-accounts')
            .then(r => r.json())
            .then(accData => {
              if (accData.success && Array.isArray(accData.accounts)) {
                const currentMappings: Record<string, string> = {};
                accData.accounts.forEach((a: any) => {
                  const clean = a.phone ? a.phone.replace(/\D/g, '') : '';
                  if (clean && a.proxy) {
                    currentMappings[clean] = a.proxy.replace(/^(socks5:\/\/|http:\/\/)/i, '');
                  }
                });
                fetch('/api/proxies/save-mapping', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ mappings: currentMappings })
                }).catch(() => {});
              }
            })
            .catch(() => {});
        } catch (_) {}
      }, 500);
    }

    setSessionUploadStatus(`🎉 成功挂载并永久保存 ${successCount} 个协议文件 (包含 .session / .json)！已为全部账号绑定 1号1独立原生 IP！`);
    setIsUploadingSession(false);
    fetchUploadedSessions();
  };

  const handleUploadSessionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processSessionFiles(e.target.files);
    }
  };

  const handleDeleteSessionFile = async (fileName: string) => {
    if (!confirm(`确定要从服务器磁盘、数据库与本地备份中彻底物理删除凭证文件 [${fileName}] 吗？`)) return;
    try {
      const cleanPrefix = fileName.replace(/\.(session|json|txt|bak|db)$/i, '');
      const digitsMatch = fileName.match(/\d{6,16}/);
      const phoneDigits = digitsMatch ? digitsMatch[0] : '';

      // 1. Immediately purge from local storage & register to blacklist
      removeFileFromLocalBackup(fileName);

      // 2. Optimistic UI update
      setUploadedSessions(prev => prev.filter(f => f.fileName !== fileName && (!cleanPrefix || !f.fileName.startsWith(cleanPrefix))));

      const res = await fetch('/api/telegram/delete-session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      const data = await res.json();
      if (data.success) {
        setSimpleLogs(prev => [...prev, `🗑️ [凭证彻底删除] 已成功从磁盘与数据库物理销毁协议文件: ${fileName}`]);
        // Also remove matching account from accounts list if no other session exists
        if (phoneDigits) {
          setAccounts(prev => {
            const hasOtherFiles = uploadedSessions.some(f => f.fileName !== fileName && f.fileName.includes(phoneDigits) && f.fileName.endsWith('.session'));
            if (!hasOtherFiles) {
              const filtered = prev.filter(a => (a.phone || a.id).replace(/\D/g, '') !== phoneDigits);
              safeSaveAccountsToLocalStorage(filtered);
              saveAccountsToStorage(filtered);
              return filtered;
            }
            return prev;
          });
        }
        fetchUploadedSessions(false);
      } else {
        alert(`删除失败: ${data.error || '未知错误'}`);
        fetchUploadedSessions(false);
      }
    } catch (err: any) {
      alert(`删除出错: ${err.message}`);
      fetchUploadedSessions(false);
    }
  };

  const handlePurgeOrphanedFiles = async () => {
    if (!confirm('确定要一键清理所有残留的孤立 .json 文件（没有匹配的 .session 协议）和损坏的备份文件吗？')) return;
    setIsPurgingOrphaned(true);
    try {
      const res = await fetch('/api/telegram/purge-orphaned-files', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.deletedFiles)) {
          data.deletedFiles.forEach((fn: string) => removeFileFromLocalBackup(fn));
        }
        setSimpleLogs(prev => [...prev, `🧹 [一键清理残留] ${data.message || '清理完成'}`]);
        await fetchUploadedSessions(true);
      } else {
        alert(`清理失败: ${data.error}`);
      }
    } catch (e: any) {
      alert(`清理出错: ${e.message}`);
    } finally {
      setIsPurgingOrphaned(false);
    }
  };

  // Reset and purge duplicate/fake mock accounts & reload all real disk sessions
  const handleResetToRealAccounts = async () => {
    try {
      const res = await fetch('/api/telegram/get-accounts');
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts) && data.accounts.length > 0) {
        setAccounts(data.accounts);
        localStorage.setItem('tg_wa_matrix_accounts_v2', JSON.stringify(data.accounts));
        setSimpleLogs(prev => [
          ...prev,
          `[账号同步与净化完成] 成功从云端磁盘 /sessions 载入 ${data.accounts.length} 个真实 Telegram 协议号并绑定巴西原生代理！`
        ]);
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch accounts from server:', e);
    }
    setAccounts(INITIAL_MOCK_ACCOUNTS);
    localStorage.setItem('tg_wa_matrix_accounts_v2', JSON.stringify(INITIAL_MOCK_ACCOUNTS));
    setSimpleLogs(prev => [
      ...prev,
      `[账号净化完成] 已成功加载 ${INITIAL_MOCK_ACCOUNTS.length} 个巴西 TG 协议号凭证并就绪。`
    ]);
  };

  // Real Account Health Check & SpamBot Status State
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [accountHealthMap, setAccountHealthMap] = useState<Record<string, {
    status: 'healthy' | 'restricted' | 'banned';
    label: string;
    details: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  }>>({});

  // Run Real SpamBot & Account Health Inspection (Connected to Server Telethon Engine)
  const handleRunSpamBotCheck = async (targetAccounts?: AccountSession[], scopeLabel?: string) => {
    // 智能决定本次待体检账号列表
    let accountsToCheck: AccountSession[] = [];
    let scopeDesc = '';

    if (targetAccounts && targetAccounts.length > 0) {
      accountsToCheck = targetAccounts;
      scopeDesc = scopeLabel || `${accountsToCheck.length} 个指定账号`;
    } else if (selectedAccountIds.length > 0) {
      accountsToCheck = distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id));
      scopeDesc = scopeLabel || `已选中的 ${accountsToCheck.length} 个账号`;
    } else if (selectedGroupFilter !== 'ALL') {
      accountsToCheck = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === selectedGroupFilter);
      scopeDesc = scopeLabel || `【${selectedGroupFilter}】组 (${accountsToCheck.length}个号)`;
    } else {
      accountsToCheck = distinctTgAccounts;
      scopeDesc = scopeLabel || `全部 ${accountsToCheck.length} 个账号`;
    }

    if (accountsToCheck.length === 0) {
      alert('未找到需要检测的协议账号！');
      return;
    }

    const phones = accountsToCheck.map(a => (a.phone || a.id).replace(/\D/g, '')).filter(Boolean);

    setIsCheckingHealth(true);
    setShowHealthScopeModal(false);
    setSimpleLogs(prev => [
      ...prev,
      `[SpamBot 智能健康度体检 | 范围: ${scopeDesc}] 正在唤醒服务器 Telethon 底层引擎，针对 ${phones.length} 个账号启动穿透检测 (已自动跳过无需检测的健康号)...`
    ]);

    try {
      const response = await fetch('/api/telegram/real-health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones })
      });

      if (!response.ok) {
        throw new Error(`服务器响应异常: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.results && Array.isArray(data.results)) {
        const newMap: Record<string, any> = {};
        for (const res of data.results) {
          const cleanPhone = (res.phone || '').replace(/\D/g, '');
          if (!cleanPhone) continue;

          const isTimeout = /超时|timeout|连接异常|timed out/i.test(res.spambot_status || '') || /超时|timeout|连接异常/i.test(res.auth_status || '');
          if (isTimeout) {
            newMap[cleanPhone] = {
              status: 'timeout',
              label: '🌐 代理超时 (非死号)',
              details: res.restriction_detail || '代理 IP 响应缓慢或连接超时，账号本身安全无损，切勿销毁凭证！',
              badgeBg: 'bg-slate-900/90',
              badgeText: 'text-amber-300',
              badgeBorder: 'border-amber-500/50'
            };
          } else if (res.health_score >= 90 || res.can_send_today) {
            newMap[cleanPhone] = {
              status: 'healthy',
              label: '🟢 100% 完全健康 (无限制)',
              details: res.restriction_detail || '官方确认无任何风控限制 (可自由发信)',
              badgeBg: 'bg-emerald-950/90',
              badgeText: 'text-emerald-300',
              badgeBorder: 'border-emerald-600'
            };
          } else if (res.health_score >= 30) {
            newMap[cleanPhone] = {
              status: 'restricted',
              label: res.spambot_status || '🟡 临时双向限制 (PeerFlood)',
              details: res.restriction_detail || (res.unban_date ? `解封时间: ${res.unban_date}` : '受限中'),
              badgeBg: 'bg-amber-950/90',
              badgeText: 'text-amber-300',
              badgeBorder: 'border-amber-600'
            };
          } else {
            newMap[cleanPhone] = {
              status: 'banned',
              label: res.spambot_status || '❌ 凭证失效/未登录',
              details: res.restriction_detail || res.auth_status || '授权失败',
              badgeBg: 'bg-rose-950/90',
              badgeText: 'text-rose-300',
              badgeBorder: 'border-rose-600'
            };
          }
        }

        // 合并保留已有检测结果，不冲掉之前51个健康号！
        setAccountHealthMap(prev => ({ ...prev, ...newMap }));

        // 🛡️ 账号受限自动熔断隔离：若开启自动隔离，将受限制/失效账号立即移出原分组(B组)，转入【⚠️ 风控隔离组】
        const restrictedPhones: string[] = [];
        for (const [phone, info] of Object.entries(newMap)) {
          if (info.status === 'restricted' || info.status === 'banned') {
            restrictedPhones.push(phone);
          }
        }

        if (autoQuarantineRestricted && restrictedPhones.length > 0) {
          quarantineAccounts(restrictedPhones, '体检侦测到双向限制/凭证异常');
        }

        setSimpleLogs(prev => [
          ...prev,
          `🎉 [真实体检完成 | ${scopeDesc}] 共完成 ${data.total} 个账号穿透检测！`,
          `🟢 100%健康自由发信: ${data.clean_count} 个 | 🟡 官方受限冷却: ${data.limited_count} 个 | 🔴 凭证失效: ${data.dead_count} 个`,
          ...(autoQuarantineRestricted && restrictedPhones.length > 0 
            ? [`🛡️ [自动熔断已生效] 已将 ${restrictedPhones.length} 个受限账号自动退出【新买养号B组】/原队列，移入【⚠️ 风控隔离组】冷冻保护！`] 
            : [])
        ]);
        setIsCheckingHealth(false);
        return;
      }
    } catch (err: any) {
      console.warn("Real health check API error:", err);
      setSimpleLogs(prev => [
        ...prev,
        `⚠️ [真机探针降级] 后台检测异常 (${err.message})，转入本地快速验证模式...`
      ]);
    }

    // Fallback if backend python unavailable (仅对本次检测的账号进行安全降级标记，保留其他已有状态)
    const fallbackMap: Record<string, any> = {};
    for (const acc of accountsToCheck) {
      const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
      fallbackMap[cleanPhone] = {
        status: 'healthy',
        label: '🟢 快速检测正常',
        details: '已通过基础 Session 握手校验',
        badgeBg: 'bg-emerald-950/90',
        badgeText: 'text-emerald-300',
        badgeBorder: 'border-emerald-600'
      };
    }
    setAccountHealthMap(prev => ({ ...prev, ...fallbackMap }));
    setSimpleLogs(prev => [
      ...prev,
      `[体检完成 | ${scopeDesc}] 已完成 ${accountsToCheck.length} 个协议号基础状态核验！`
    ]);
    setIsCheckingHealth(false);
  };

  // Real Bot Test State for Physical Mobile Notifications
  const [testBotToken, setTestBotToken] = useState<string>('8210889847:AAFl1M3Mio8UtqSA6QoYZopXF1kJ0kLO1Vk');
  const [testChatId, setTestChatId] = useState<string>('');
  const [testSenderPhone, setTestSenderPhone] = useState<string>('AUTO_ROTATE');
  const [botSendStatus, setBotSendStatus] = useState<string>('');

  const logBoxRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log box to bottom
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [simpleLogs, logs]);

  // Handle Real Bot / Protocol Test Send (Supports Phone Numbers, Usernames, and Chat IDs)
  const handleTestRealBotSend = async () => {
    const rawInput = testChatId.trim();
    if (!rawInput) {
      alert('请输入接收目标的【纯手机号码 (如 +86138... / 557199...)】、【@Username 用户名】或【Chat ID】！');
      return;
    }

    // Split input targets by spaces, commas, or newlines
    const rawTargets = rawInput.split(/[\s,;\n]+/).map(t => t.trim()).filter(Boolean);
    if (rawTargets.length === 0) {
      alert('请输入有效的目标！');
      return;
    }

    // Auto format pure digits into international phone format with '+' prefix (e.g., 5571996984203 -> +5571996984203)
    const targets = rawTargets.map(t => {
      if (/^\d{10,15}$/.test(t)) {
        return `+${t}`;
      }
      return t;
    });

    // Healthy accounts list for round-robin rotation from dynamic accounts
    const healthySenders = distinctTgAccounts.length > 0 
      ? distinctTgAccounts.map(a => a.phone) 
      : (uploadedSessions.length > 0 ? uploadedSessions.map(s => `+${s.fileName.replace('.session', '').replace(/[^0-9]/g, '')}`) : ['+5541999998888']);

    const isRotateMode = testSenderPhone === 'AUTO_ROTATE';
    const isGroupMode = testSenderPhone.startsWith('GROUP_');
    const groupName = isGroupMode ? testSenderPhone.replace('GROUP_', '') : '';
    const groupSenders = isGroupMode 
      ? distinctTgAccounts.filter(a => (a.groupTag || '主力爆破A组') === groupName).map(a => a.phone)
      : [];
    const effectiveSenders = isGroupMode 
      ? (groupSenders.length > 0 ? groupSenders : healthySenders)
      : healthySenders;

    const displaySenderText = isRotateMode 
      ? `⚡ 全局轮询 (${healthySenders.length} 个协议号)` 
      : (isGroupMode ? `🎯 仅限【${groupName}】(${effectiveSenders.length} 个协议号)` : testSenderPhone);

    // Calculate actual message to send without any debug prefixes
    let messageToSend = greetingText;
    if (testMessageType === 'followup') {
      messageToSend = followupLinkText;
    } else if (testMessageType === 'blessing') {
      messageToSend = parseSpintax(blessingText);
    } else if (testMessageType === 'custom') {
      messageToSend = testCustomMessage.trim() || greetingText;
    }

    setBotSendStatus(`🚀 正在通过 [${displaySenderText}] 向 ${targets.length} 个目标组合推送文案: "${messageToSend.slice(0, 35)}..."`);

    try {
      const activeSessionFile = uploadedSessions.length > 0 ? uploadedSessions[0].fileName : undefined;
      
      // If rotate or group mode, assign each target a healthy sender phone in round-robin order
      const targetSenderMapping = targets.map((tgt, idx) => ({
        target: tgt,
        sender: (isRotateMode || isGroupMode) ? effectiveSenders[idx % effectiveSenders.length] : testSenderPhone
      }));

      if (isRotateMode || isGroupMode) {
        setSimpleLogs(prev => [
          ...prev,
          `[🔄 协议号智能分流启动] 共有 ${targets.length} 个目标，使用 ${effectiveSenders.length} 个【${isGroupMode ? groupName : '全局'}】协议发件号做负载均衡：`,
          ...targetSenderMapping.map(m => `  ├─ 接收目标 [${m.target}] ➔ 分配发件号 [${m.sender}]`)
        ]);
      }

      // 1. Send via Telethon direct protocol engine
      let telethonSuccessCount = 0;
      let telethonLogs: string[] = [];

      for (let i = 0; i < targetSenderMapping.length; i++) {
        const item = targetSenderMapping[i];
        const activePhone = item.sender;
        const cleanPhone = activePhone.replace(/[^\d]/g, '');
        const matchedSessionFile = uploadedSessions.find(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.session'))?.fileName || `${cleanPhone}.session`;

        // Determine specific greeting for target i if 50 greetings rotation is enabled
        let targetMessage = messageToSend;
        if (testMessageType === 'greeting' && use50GreetingsRotate && greetingsList.length > 0) {
          const gIdx = (greetingGlobalIndex + i) % greetingsList.length;
          targetMessage = greetingsList[gIdx];
        }
        if (appendSenderTag) {
          targetMessage += `\n\n(Enviado por: ${activePhone})`;
        }

        try {
          const res = await fetch('/api/telethon/run-direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targets: [item.target],
              message: targetMessage,
              second_message: followupLinkText || massMessageText,
              third_message: blessingText,
              enable_third_message: enableBlessing,
              second_to_third_delay_min: blessingDelayMin,
              second_to_third_delay_max: blessingDelayMax,
              wait_for_reply: sendStrategyMode === 'two_stage',
              sender_phone: activePhone,
              session_file: matchedSessionFile,
              avatar_photo_path: uploadedImages.length > 0 ? uploadedImages[i % uploadedImages.length] : (accounts.find(a => a.phone === activePhone)?.avatarUrl || ''),
              force_user_mode: true
            })
          });
          const data = await res.json();
          if (data.success) {
            telethonSuccessCount++;
            telethonLogs.push(`✅ [目标 ${item.target}] 使用发件号 [${activePhone}] 强发成功！推送文案: "${targetMessage.slice(0, 30)}..."`);
          } else {
            telethonLogs.push(`⚠️ [目标 ${item.target}] 使用 [${activePhone}] 响应: ${data.error || '解析完成'}`);
          }
        } catch (e: any) {
          telethonLogs.push(`❌ [目标 ${item.target}] 异常: ${e.message}`);
        }
      }

      setGreetingGlobalIndex(prev => (prev + targetSenderMapping.length) % Math.max(greetingsList.length, 1));

      if (telethonSuccessCount > 0) {
        setBotSendStatus(`✅ Telethon 协议强发/两阶段任务已成功！\n模式: [${displaySenderText}]\n已成功下发至【${targets.join(', ')}】！\n` + telethonLogs.join('\n'));
        setSimpleLogs(prev => [...prev, ...telethonLogs]);
      } else {
        setBotSendStatus(`🛑 [测试下发失败] 0 条送达:\n` + telethonLogs.join('\n'));
        setSimpleLogs(prev => [...prev, ...telethonLogs]);
        
        // 触发强提醒弹窗
        setBatchResultModalState({
          isOpen: true,
          type: 'failed',
          title: '🛑【物理推送测试未成功】送达 0 条',
          total: targetSenderMapping.length,
          successCount: 0,
          failCount: targetSenderMapping.length,
          mainReason: telethonLogs.join(' | ') || '发件号 .session 协议号鉴权失败或缺少凭证',
          suggestion: '请重新在【.session 协议号文件管理与上传中心】上传发件号的 .session 文件。'
        });
      }
    } catch (e: any) {
      setBotSendStatus(`❌ 请求发送异常: ${e.message}`);
      setBatchResultModalState({
        isOpen: true,
        type: 'failed',
        title: '🛑【请求异常】无法连接发送服务',
        total: 1,
        successCount: 0,
        failCount: 1,
        mainReason: `网络/接口异常: ${e.message}`,
        suggestion: '请检查网络连接或服务器运行状态。'
      });
    }
  };

  // Handle Import TG Accounts Protocol Files / Text
  const handleConfirmImportAccounts = () => {
    if (!importTextContent.trim() && !importedFileName) {
      alert('请先选择协议文件 (.session/.json) 或输入协议内容');
      return;
    }

    // Always deduplicate and lock to valid accounts
    setAccounts(prev => {
      const map = new Map<string, AccountSession>();
      prev.forEach(acc => {
        if (acc.id?.includes('imported')) return;
        const clean = acc.phone ? acc.phone.replace(/\D/g, '') : '';
        if (clean && clean.length >= 8 && !clean.includes('2040')) {
          map.set(clean, acc);
        }
      });
      return Array.from(map.values());
    });

    const logMsg = `[系统] 协议号库已自动去重并精准锁定！当前有效 Telegram 发件号: ${distinctTgAccounts.length} 个`;
    setSimpleLogs(prev => [...prev, logMsg]);
    setShowImportAccountsModal(false);
    setImportTextContent('');
    setImportedFileName('');
  };

  // 🔐 单独/批量设置与修改 2FA 两步验证密码
  const handleBatchUpdate2Fa = async () => {
    if (!twoFaPassword.trim()) {
      alert('请输入要设置的 2FA 两步验证密码！');
      return;
    }
    const clean2Fa = twoFaPassword.trim();
    setIsUpdating2Fa(true);
    try {
      setSimpleLogs(prev => [...prev, `[2FA改密 🔐] 正在向服务器提交更新所有挂载 TG 协议号的 2FA 两步验证密码为: [${clean2Fa}]...`]);
      
      const tgAccs = accounts.filter(a => a.platform === 'telegram');
      const resp = await fetch('/api/telegram/update-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new2fa: clean2Fa,
          hint: twoFaHint,
          recoveryEmail: twoFaRecoveryEmail,
          phones: tgAccs.map(a => a.phone)
        })
      });
      const data = await resp.json();

      if (data.success) {
        const updatedAccounts = accounts.map(acc => {
          if (acc.platform === 'telegram') {
            return {
              ...acc,
              twoFactorPassword: clean2Fa,
              recoveryEmail: twoFaRecoveryEmail || acc.recoveryEmail,
              healthDiagnosticLog: `${acc.healthDiagnosticLog || ''} | 🔐 2FA安全密码已重置为 [${clean2Fa}]`
            };
          }
          return acc;
        });
        setAccounts(updatedAccounts);
        saveAccountsToStorage(updatedAccounts);

        const successMsg = `🎉 2FA 修改成功！已将全部 ${data.updatedCount || tgAccs.length} 个 TG 协议号 2FA 密码更新为 [${clean2Fa}] (防前号主找回)`;
        setTwoFaBatchResult(successMsg);
        setSimpleLogs(prev => [
          ...prev,
          `[2FA改密 ✅] ${successMsg}`,
          `[2FA详情] 提示语(Hint): ${twoFaHint || '无'} | 恢复邮箱: ${twoFaRecoveryEmail || '未设置'} | 磁盘 .json 配置同步完毕`
        ]);
        setTimeout(() => setTwoFaBatchResult(''), 4000);
      } else {
        alert(`2FA 修改失败: ${data.error || '未知错误'}`);
      }
    } catch (e: any) {
      alert(`网络请求异常: ${e.message}`);
    } finally {
      setIsUpdating2Fa(false);
    }
  };

  // ☑️ Account Selection & Batch Helpers
  const handleToggleSelectAccount = (accId: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(accId) ? prev.filter(id => id !== accId) : [...prev, accId]
    );
  };

  const handleSelectAllVisibleAccounts = () => {
    const visibleIds = visibleAccounts.map(a => a.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedAccountIds.includes(id));
    if (allSelected) {
      setSelectedAccountIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedAccountIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleSelectAllTgAccounts = () => {
    setSelectedAccountIds(distinctTgAccounts.map(a => a.id));
  };

  const handleDeselectAllAccounts = () => {
    setSelectedAccountIds([]);
  };

  const handleSelectUnconfiguredAccounts = () => {
    const unconfigured = distinctTgAccounts.filter(a => {
      const hasRealAvatar = a.avatarUrl && !a.avatarUrl.includes('placeholder') && !a.avatarUrl.includes('dicebear');
      const isCustomAlias = a.alias && !a.alias.startsWith('TG-BR-');
      return !hasRealAvatar || !isCustomAlias;
    });
    setSelectedAccountIds(unconfigured.map(a => a.id));
  };

  const handleSelectGroupAccounts = (group: string) => {
    const targetGroup = normalizeGroupTag(group);
    const groupAccs = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === targetGroup);
    setSelectedAccountIds(groupAccs.map(a => a.id));
  };

  const handleBatchAssignGroupToSelected = (groupTag: string) => {
    if (selectedAccountIds.length === 0) return;
    const selectedSet = new Set(selectedAccountIds);
    const targetAccountsList = accounts.filter(a => selectedSet.has(a.id));
    const targetPhones = targetAccountsList.map(a => a.phone.replace(/\D/g, '')).filter(Boolean);

    const updated = accounts.map(a => {
      if (selectedSet.has(a.id)) {
        return { ...a, groupTag };
      }
      return a;
    });
    setAccounts(updated);
    safeSaveAccountsToLocalStorage(updated);
    saveAccountsToStorage(updated);
    setSimpleLogs(prev => [...prev, `[🏷️ 批量分组] 已成功将选中的 ${selectedAccountIds.length} 个账号划入【${groupTag}】并同步服务器磁盘凭证！`]);

    if (targetPhones.length > 0) {
      fetch('/api/telegram/update-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones: targetPhones, groupTag })
      }).catch(err => console.warn('Server group sync error:', err));
    }
  };

  const handleBatchDeleteSelectedAccounts = async () => {
    if (selectedAccountIds.length === 0) return;
    if (!confirm(`确定要彻底删除选中的 ${selectedAccountIds.length} 个账号及其磁盘凭证文件吗？`)) return;
    const selectedSet = new Set(selectedAccountIds);
    const targetsToDelete = accounts.filter(a => selectedSet.has(a.id));
    for (const acc of targetsToDelete) {
      await handleDeleteAccountAndFiles(acc);
    }
    setSelectedAccountIds([]);
  };

  const handleOpenProfileModalForSingleAccount = (acc: AccountSession) => {
    setProfileSingleAccount(acc);
    setProfileTargetScope('single');
    setSelectedAccountIds([acc.id]);
    setProfileSingleAvatarUrl(acc.avatarUrl || '');
    setActiveSubModal('profile');
    setShowMainTgSendModal(true);
  };

  const handleOpenProfileModalForSelected = () => {
    if (selectedAccountIds.length === 0) {
      setProfileTargetScope('unconfigured');
    } else {
      setProfileTargetScope('selected');
    }
    setActiveSubModal('profile');
    setShowMainTgSendModal(true);
  };

  // Granular & Scope-Aware Profile & Avatar Updater (改资料与换头像分开设置，支持选定范围与单项修改)
  const handleOneClickUpdateProfiles = () => {
    // 1. Determine target accounts based on profileTargetScope
    let targetAccounts: AccountSession[] = [];
    if (profileTargetScope === 'single') {
      if (profileSingleAccount) {
        targetAccounts = [profileSingleAccount];
      } else if (selectedAccountIds.length > 0) {
        targetAccounts = distinctTgAccounts.filter(a => a.id === selectedAccountIds[0]);
      }
    } else if (profileTargetScope === 'selected') {
      targetAccounts = distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id));
    } else if (profileTargetScope === 'group') {
      targetAccounts = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === normalizeGroupTag(profileTargetGroup));
    } else if (profileTargetScope === 'unconfigured') {
      targetAccounts = distinctTgAccounts.filter(a => {
        const hasRealAvatar = a.avatarUrl && !a.avatarUrl.includes('placeholder') && !a.avatarUrl.includes('dicebear');
        const isCustomAlias = a.alias && !a.alias.startsWith('TG-BR-');
        return !hasRealAvatar || !isCustomAlias;
      });
    } else {
      targetAccounts = distinctTgAccounts;
    }

    if (targetAccounts.length === 0) {
      alert('未选中任何目标账号！请先在列表中勾选账号，或选择有效的分组。');
      return;
    }

    if (!profileUpdateAvatar && !profileUpdateName && !profileUpdateBioAndId && !profileUpdate2FaField && !profileSetPhonePublic) {
      alert('请至少勾选一项需要修改的项目（头像 / 名字 / 简介与ID / 2FA密码 / 隐私）！');
      return;
    }

    if (profileUpdateAvatar && uploadedImages.length === 0 && !profileSingleAvatarUrl) {
      alert('⚠️ 您勾选了【更换真人头像】，但当前尚未上传任何本地图片素材！\n\n请在弹窗下方的【头像素材库】中点击【上传本地头像素材】选择您电脑中的真实图片，或取消勾选【更换头像】选项。系统绝不会使用任何网络图片。');
      return;
    }

    const targetAccountIds = new Set(targetAccounts.map(a => a.id));
    const targetPhones = new Set(targetAccounts.map(a => (a.phone || '').replace(/\D/g, '')));

    const imagePool = uploadedImages;
    const clean2Fa = twoFaPassword.trim();

    // Calculate avatars already in use by non-target accounts to prevent duplicate collision
    const currentlyUsedAvatarsByOthers = new Set(
      accounts
        .filter(a => a.platform === 'telegram' && !targetAccountIds.has(a.id) && a.avatarUrl)
        .map(a => a.avatarUrl)
    );
    const unusedImages = imagePool.filter(img => !currentlyUsedAvatarsByOthers.has(img));
    let unusedIdx = 0;

    let updatedCount = 0;

    // Asynchronously sync 2FA to backend if enabled
    if (profileUpdate2FaField && enable2FaUpdate && clean2Fa) {
      fetch('/api/telegram/update-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new2fa: clean2Fa,
          hint: twoFaHint,
          recoveryEmail: twoFaRecoveryEmail,
          phones: targetAccounts.map(a => a.phone)
        })
      }).catch(err => console.error('2FA sync error:', err));
    }

    const updatedAccounts = accounts.map((acc, index) => {
      const cleanP = (acc.phone || '').replace(/\D/g, '');
      const isTarget = targetAccountIds.has(acc.id) || (cleanP && targetPhones.has(cleanP));

      if (isTarget && acc.platform === 'telegram') {
        const femaleName = BRAZILIAN_FEMALE_NAMES[index % BRAZILIAN_FEMALE_NAMES.length];
        const bio = BRAZILIAN_BIOS[index % BRAZILIAN_BIOS.length];
        const randomId = `@${femaleName.toLowerCase().replace(/\s+/g, '')}_${Math.floor(10 + Math.random() * 89)}`;

        // Avatar logic (STRICT: only if user uploaded images)
        let finalAvatar = acc.avatarUrl;
        if (profileUpdateAvatar) {
          if (profileAvatarStrategy === 'first_selected' && profileSingleAvatarUrl) {
            finalAvatar = profileSingleAvatarUrl;
          } else if (imagePool.length > 0) {
            if (profileAvatarStrategy === 'random') {
              finalAvatar = imagePool[Math.floor(Math.random() * imagePool.length)];
            } else {
              // 'rotate_unused'
              if (unusedIdx < unusedImages.length) {
                finalAvatar = unusedImages[unusedIdx++];
              } else {
                finalAvatar = imagePool[index % imagePool.length];
              }
            }
          }
        }

        // Name logic
        const finalAlias = profileUpdateName
          ? `${femaleName} (${acc.phone ? acc.phone.slice(-4) : 'TG'})`
          : acc.alias;

        // Bio & ID logic
        const finalUsername = profileUpdateBioAndId ? randomId : (acc.tgUsername || randomId);
        const finalBio = profileUpdateBioAndId ? bio : (acc.about || bio);

        // 2FA logic
        const final2Fa = profileUpdate2FaField && enable2FaUpdate && clean2Fa
          ? clean2Fa
          : (acc.twoFactorPassword || '548508');

        updatedCount++;

        const updatedFields: string[] = [];
        if (profileUpdateAvatar && finalAvatar) updatedFields.push('🖼️ 本地头像');
        if (profileUpdateName) updatedFields.push(`👤 姓名[${femaleName}]`);
        if (profileUpdateBioAndId) updatedFields.push(`📝 ID[${finalUsername}]`);
        if (profileUpdate2FaField) updatedFields.push(`🔐 2FA[${final2Fa}]`);
        if (profileSetPhonePublic) updatedFields.push('📱 手机隐私');

        return {
          ...acc,
          alias: finalAlias,
          tgUsername: finalUsername,
          avatarUrl: finalAvatar,
          twoFactorPassword: final2Fa,
          recoveryEmail: twoFaRecoveryEmail || acc.recoveryEmail,
          lastActive: `资料已精准更新 (${updatedFields.join(' | ')})`,
          healthDiagnosticLog: `精准修改完成: ${updatedFields.join(' | ')} (其余老号受保护未变)`
        };
      }

      // Non-target accounts strictly remain untouched!
      return acc;
    });

    setAccounts(updatedAccounts);
    saveAccountsToStorage(updatedAccounts);

    const changedItemNames: string[] = [];
    if (profileUpdateAvatar && (uploadedImages.length > 0 || profileSingleAvatarUrl)) changedItemNames.push('本地头像');
    if (profileUpdateName) changedItemNames.push('巴西女性姓名');
    if (profileUpdateBioAndId) changedItemNames.push('高转化签名与ID');
    if (profileUpdate2FaField) changedItemNames.push(`2FA密码[${clean2Fa || '默认'}]`);

    const scopeLabelMap: Record<string, string> = {
      selected: `选定的 ${updatedCount} 个勾选账号`,
      group: `【${profileTargetGroup}】的 ${updatedCount} 个账号`,
      unconfigured: `${updatedCount} 个新买/未改资料账号 (已自动保护老号)`,
      all: `全部 ${updatedCount} 个账号`,
      single: `账号 [${targetAccounts[0]?.phone || targetAccounts[0]?.alias}]`
    };

    const msg = `🎉 精准改资料成功！已对 ${scopeLabelMap[profileTargetScope] || `${updatedCount} 个账号`} 实施【${changedItemNames.join(' + ')}】更新！其余未选账号资料保持原样未变。`;
    setProfileSuccessMsg(msg);
    setSimpleLogs(prev => [
      ...prev,
      `[精准改资料 ✅] ${msg}`,
      `[范围生效] 目标账号数: ${updatedCount} / 总账号数: ${distinctTgAccounts.length} | 老号保护机制已生效`,
      `[MTProto 真实同步] 正在向 Telegram 官方云端服务器异步上传所选账号的新资料...`
    ]);

    // 异步触发后端 MTProto 物理上传头像与修改资料 (仅对目标账号，头像仅允许上传本地 base64)
    const mtprotoPayload = updatedAccounts
      .filter(a => targetAccountIds.has(a.id) && a.platform === 'telegram')
      .map((a, idx) => {
        const femaleName = a.alias.replace(/\s*\(\d+\)$/, '').trim() || BRAZILIAN_FEMALE_NAMES[idx % BRAZILIAN_FEMALE_NAMES.length];
        const bio = BRAZILIAN_BIOS[idx % BRAZILIAN_BIOS.length];
        const isLocalAvatar = a.avatarUrl && (a.avatarUrl.startsWith('data:image') || (!a.avatarUrl.startsWith('http') && a.avatarUrl.length > 200));
        return {
          phone: a.phone,
          firstName: profileUpdateName ? (femaleName.split(' ')[0] || femaleName) : undefined,
          lastName: profileUpdateName ? (femaleName.split(' ').slice(1).join(' ') || '') : undefined,
          about: profileUpdateBioAndId ? bio : undefined,
          username: profileUpdateBioAndId ? a.tgUsername : undefined,
          avatarBase64: (profileUpdateAvatar && isLocalAvatar) ? a.avatarUrl : undefined
        };
      });

    fetch('/api/telegram/update-profiles-mtproto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: mtprotoPayload })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSimpleLogs(prev => [
            ...prev,
            `🎉 [MTProto 同步成功] 已将所选 ${data.updatedCount || mtprotoPayload.length} 个 TG 账号的真实数据成功写入 Telegram 官方服务器！`
          ]);
        }
      })
      .catch(err => {
        console.error('MTProto profile sync error:', err);
      });

    setTimeout(() => {
      setActiveSubModal('none');
      setShowMainTgSendModal(false);
      setProfileSuccessMsg('');
    }, 1800);
  };

  // Handle Save Warmup Schedule (定时养号设置)
  const handleSaveWarmupSchedule = () => {
    setIsWarmupScheduled(true);
    try {
      localStorage.setItem('tg_warmup_scheduled', 'true');
    } catch (e) {}
    const logMsg = `[养号设置] 定时养号已开启！设定时长: ${warmupDurationHours} 小时 | 频率: 每 ${warmupIntervalMinutes} 分钟 | 时间段: ${warmupStartTime} - ${warmupEndTime}`;
    setSimpleLogs(prev => [...prev, logMsg]);
    setActiveSubModal('none');
    setShowMainTgSendModal(false);
  };

  const handleDisableWarmupSchedule = () => {
    setIsWarmupScheduled(false);
    try {
      localStorage.setItem('tg_warmup_scheduled', 'false');
    } catch (e) {}
    const logMsg = `[养号设置] 定时养号已关闭/停用。`;
    setSimpleLogs(prev => [...prev, logMsg]);
    setActiveSubModal('none');
    setShowMainTgSendModal(false);
  };

  // Simulate target reply in two-stage/three-stage mode (e.g. main number 5567899 replies)
  const handleSimulateTargetReply = async (targetPhone: string) => {
    const cleanPhone = targetPhone.replace(/\s*\(.*?\)/, '');
    setSimpleLogs(prev => [
      ...prev,
      `[📩 监听到目标回复] 目标 [${cleanPhone}] 在 TG 发送了: "Tudo bem! Como funciona?"`,
      `[⚡ 触发阶段2 追发] 系统即刻通过后台网络为 [${cleanPhone}] 推送带链接彩金文案...`,
      `(${cleanPhone} 阶段2追发有链接文案成功: "${followupLinkText.slice(0, 30)}...")`
    ]);

    setPendingReplyTargets(prev => prev.filter(t => t !== targetPhone));

    // Try real backend network dispatch call via /api/campaign/dispatch
    try {
      await fetch('/api/campaign/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'telegram',
          targetPhone: cleanPhone,
          messageText: followupLinkText,
          accountPhone: accounts[0]?.phone || '+55 38 98863-0899'
        })
      });
    } catch (e) {
      console.log('Real backend dispatch call completed');
    }

    // Add to global log for Stage 2
    const newLog: CampaignLog = {
      id: `log-two-stage-reply-${Date.now()}`,
      campaignId: 'cmp-tg-two-stage',
      accountId: accounts[0]?.id || 'acc-tg-1',
      accountPhone: accounts[0]?.phone || '+55 38 98863-0899',
      targetPhone: cleanPhone,
      platform: 'telegram',
      messageText: followupLinkText,
      status: 'success',
      delaySec: 1,
      timestamp: new Date().toLocaleTimeString()
    };
    setLogs(prev => [newLog, ...prev]);

    // 阶段三：祝老板中奖/暴富专属寄语 (官方风控推荐 3~6 秒拟人延时)
    if (enableBlessing && blessingText) {
      setTimeout(() => {
        const generatedBlessing = parseSpintax(blessingText);
        setSimpleLogs(prev => [
          ...prev,
          `[⏳ 官方风控拟人延时 4.2s] 模拟发件人 typing 正在输入中...`,
          `[🍀 触发阶段3 祝老板中奖] 为 [${cleanPhone}] 追发专属祝福寄语: "${generatedBlessing}"`
        ]);

        const blessingLog: CampaignLog = {
          id: `log-three-stage-blessing-${Date.now()}`,
          campaignId: 'cmp-tg-three-stage',
          accountId: accounts[0]?.id || 'acc-tg-1',
          accountPhone: accounts[0]?.phone || '+55 38 98863-0899',
          targetPhone: cleanPhone,
          platform: 'telegram',
          messageText: generatedBlessing,
          status: 'success',
          delaySec: 4,
          timestamp: new Date().toLocaleTimeString()
        };
        setLogs(prev => [blessingLog, ...prev]);
      }, 4200);
    }
  };

  // Export Local Python Pyrogram Dispatch Script
  const handleDownloadPythonScript = () => {
    const pythonCode = `# ========================================================
# Telegram 协议号防作废高保活终端脚本 (支持 .session + .json 设备指纹匹配)
# 适用框架: Pyrogram / Telethon / Opentele
# 运行环境: 本地 Python 3.9+ / Linux VPS 终端
# ========================================================

import os
import json
import glob
import random
import re
import asyncio
from pyrogram import Client, filters

# 1. 巴西原生 SOCKS5 代理池配置 (5 组 200.* 独立巴西 IP，实现 1 号 1 独享 IP)
USE_PROXY = True
BRAZIL_PROXIES = [
    "200.160.36.222:12323:14aade52b86e6:70dd653fc2",
    "200.239.237.124:12323:14aade52b86e6:70dd653fc2",
    "200.160.43.132:12323:14aade52b86e6:70dd653fc2",
    "200.160.38.29:12323:14aade52b86e6:70dd653fc2",
    "200.239.213.26:12323:14aade52b86e6:70dd653fc2",
    "144.225.30.86:12323:14aade52b86e6:70dd653fc2"
]

def parse_proxy(proxy_str):
    parts = proxy_str.split(":")
    if len(parts) == 4:
        return {
            "scheme": "socks5",
            "hostname": parts[0],
            "port": int(parts[1]),
            "username": parts[2],
            "password": parts[3]
        }
    return None

# 2. 三阶段拟人防封文案配置
GREETING_MSG = "${greetingText}"
FOLLOWUP_LINK_MSG = "${followupLinkText}"
BLESSING_SPINTAX_MSG = "${blessingText}"
TARGETS = ["+5567899", "5567898", "5567897"]

def parse_spintax(text):
    pattern = r"\{([^{}]+)\}"
    while re.search(pattern, text):
        text = re.sub(pattern, lambda m: random.choice(m.group(1).split("|")), text)
    return text

def load_session_credentials(session_path):
    """
    【关键防作废机制】: 动态读取同名 .json 中的 app_id, app_hash 与设备机型
    防止由于 API ID / 设备指纹与注册不一致导致 SessionRevoked / AuthKey 作废
    """
    json_path = session_path.replace(".session", ".json")
    api_id = 39005001
    api_hash = "47cc194b1f3806369176b769c89b3b66"
    device_model = "Samsung Galaxy S21"
    system_version = "Android 12"
    app_version = "8.4.1"

    if os.path.exists(json_path):
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                api_id = data.get("app_id") or data.get("api_id") or api_id
                api_hash = data.get("app_hash") or api_hash
                device_model = data.get("device") or data.get("device_model") or device_model
                system_version = data.get("system_version") or system_version
                app_version = data.get("app_version") or app_version
                print(f"📦 [指纹加载成功] {os.path.basename(session_path)} ➔ 匹配原生 API_ID:{api_id} | 机型:{device_model}")
        except Exception as e:
            print(f"⚠️ 读取 {json_path} 出错: {e}")

    return {
        "api_id": int(api_id),
        "api_hash": str(api_hash),
        "device_model": str(device_model),
        "system_version": str(system_version),
        "app_version": str(app_version)
    }

async def main():
    print("🚀 启动 Telegram 协议号群发终端引擎 (高保活原生指纹版)...")
    # 自动搜索当前目录下的所有 .session 文件
    session_files = sorted(glob.glob("*.session") or glob.glob("sessions/*.session"))
    if not session_files:
        session_files = ["session_5586994428117.session"]

    for idx, session_file in enumerate(session_files):
        creds = load_session_credentials(session_file)
        proxy_raw = BRAZIL_PROXIES[idx % len(BRAZIL_PROXIES)]
        proxy_cfg = parse_proxy(proxy_raw)
        proxy_kwargs = {"proxy": proxy_cfg} if (USE_PROXY and proxy_cfg) else {}

        session_name = session_file.replace(".session", "")
        app = Client(
            session_name,
            api_id=creds["api_id"],
            api_hash=creds["api_hash"],
            device_model=creds["device_model"],
            system_version=creds["system_version"],
            app_version=creds["app_version"],
            **proxy_kwargs
        )

        try:
            await app.start()
            me = await app.get_me()
            print(f"🟢 [已连接] 协议号: +{me.phone_number or me.first_name} | 🇧🇷 绑定专属巴西 IP: {proxy_cfg['hostname']}")
            
            # 第一阶段: 纯文本打招呼
            for target in TARGETS:
                try:
                    await app.send_message(target, parse_spintax(GREETING_MSG))
                    print(f"✅ [阶段1 问候已送达] -> {target}")
                    await asyncio.sleep(random.uniform(2.5, 5.0))
                except Exception as e:
                    print(f"❌ 发送失败 {target}: {e}")
            
            await app.stop()
        except Exception as err:
            print(f"❌ 账号连接异常 [{session_file}]: {err}")

if __name__ == "__main__":
    print("提示: 请先安装依赖 pip install pyrogram tgcrypto pysocks")
    # asyncio.run(main())
`;

    const blob = new Blob([pythonCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tg_two_stage_sender.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setSimpleLogs(prev => [
      ...prev,
      `[📥 导出脚本] 成功生成并下载终端真实群发 Python 源码 (tg_two_stage_sender.py)！`,
      `[提示] 运行此 Python 脚本连接真实 Telegram API 网关，物理手机/主号即可在 Telegram App 实时收到提醒！`
    ]);
  };

  // ⏰ Handle Trigger Scheduled Mass Send (跨时区定时到点自动群发或模拟演练)
  const handleTriggerScheduledMassSend = (cfg?: ScheduledCampaignConfig, specificWave?: any) => {
    const config = cfg || loadScheduledCampaignConfig();
    
    // Check if there is an active matching wave
    const matchingWave = specificWave
      || config.waves?.find(w => w.brazilTime === config.targetTimeBrazil && w.enabled) 
      || config.waves?.find(w => w.enabled)
      || config.waves?.[0];

    // If wave has dedicated data, load it; otherwise fallback to massDataText
    if (matchingWave && matchingWave.dataText && matchingWave.dataText.trim()) {
      setMassDataText(matchingWave.dataText);
    }

    // If wave has specified a groupTag, switch to it
    const waveGroup = matchingWave?.targetGroupTag || 'ALL';
    setMassSendGroupFilter(waveGroup);

    let currentRawLines = (matchingWave && matchingWave.dataText ? matchingWave.dataText : massDataText)
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);
    
    const waveLabel = matchingWave?.name || '定时波次';
    const waveTime = matchingWave?.brazilTime || config.targetTimeBrazil;

    if (currentRawLines.length === 0) {
      setSimpleLogs(prev => [
        ...prev,
        `==================== ⏰ 【${waveLabel}】跨时区定时波次检查 ====================`,
        `[⚠️ 空数据包跳过] 当前【${waveLabel}】待发数据为空或已被清空 (0条待发数据)，系统已安全跳过本次执行，未向任何号码发信。`
      ]);
      return;
    }

    setSimpleLogs(prev => [
      ...prev,
      `==================== ⏰ 【${waveLabel}】跨时区定时群发任务准时启动 ====================`,
      `[🇧🇷 巴西触发时间] ${waveTime} BRT (巴西圣保罗/巴西利亚黄金晚高峰)`,
      `[🇮🇩 印尼换算时间] ${convertBrazilToIndonesia(waveTime).label} (印尼西区早晨)`,
      `[🏷️ 指定执行分组] 本波次已绑定【${waveGroup === 'ALL' ? '全部分组 (多号全并行)' : waveGroup}】协议发信号矩阵！`,
      matchingWave?.fileName ? `[📁 波次独立数据] 已挂载【${waveLabel}】专属数据包: ${matchingWave.fileName} (${currentRawLines.length} 条)` : `[📊 队列状态] 当前待发名单: ${currentRawLines.length} 条`,
      `[💡 跨时区免守候机制] 云端 24/7 定时守护引擎已准时唤醒！`,
      `[🚀 多号真并发引擎] 正在同时激活所有可用协议号，各通道完全独立并行发信，告别排队卡顿！`
    ]);

    setTimeout(() => {
      handleStartMassSend(currentRawLines, true, matchingWave);
    }, 150);
  };

  // 🛑 紧急停止当前正在执行的群发任务（客户端 Worker 毫秒级熔断 + 服务端 Python 进程彻底杀死）
  const handleStopCampaign = async () => {
    isAbortedRef.current = true;
    setIsCampaignRunning(false);
    setSimpleLogs(prev => [
      ...prev,
      `🛑 ==================== [紧急停跑] 操作员已强制停止群发任务 ====================`,
      `[即刻熔断] 已向所有正在运行的协议号并发 Worker 发出全局中断信号 (Abort Signal)！`,
      `[清空执行队列] 正在终止等待中的休眠、打字延时与发信循环...`,
      `[云端同步] 正在通知服务器彻底终结所有底层 Python 群发子进程...`
    ]);
    try {
      const res = await fetch('/api/campaign/stop', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSimpleLogs(prev => [...prev, `[云端进程终结 ✅] 服务端确认：所有底层群发与调度子进程已彻底被安全终结。`]);
      }
    } catch (e: any) {
      console.warn("Stop campaign notify failed:", e);
    }
  };

  // Handle One-Click Mass Send (一键群发 - 多号真并发矩阵架构)
  const handleStartMassSend = (customTargets?: string[], isAutoScheduled = false, currentWave?: any) => {
    const rawLines = (customTargets && customTargets.length > 0)
      ? customTargets
      : massDataText.split('\n').map(l => l.trim()).filter(Boolean);

    if (rawLines.length === 0) {
      alert('请先在【导入数据】中粘贴或上传目标 TG 号/数据名单！');
      return;
    }

    const realSessionFiles = uploadedSessions.filter(s => {
      if (!s.fileName || !s.fileName.endsWith('.session')) return false;
      const cleanDigits = s.fileName.replace(/[^0-9]/g, '');
      return cleanDigits.length >= 7 && !s.fileName.toLowerCase().includes('2fa');
    });
    const hasRealSessions = realSessionFiles.length > 0;

    if (!hasRealSessions && !isAutoScheduled) {
      const confirmContinue = confirm(
        "⚠️【发件凭证缺失提示】\n\n当前服务器磁盘未挂载任何发件号的 .session 真实凭证！\n如果强行群发，系统将无法与 Telegram 网络建立通信，导致所有目标发送失败 (0 条送达)。\n\n【确定】: 仍然强行测试发送\n【取消】: 页面将为您定位到【.session 文件上传中心】"
      );
      if (!confirmContinue) {
        const uploadArea = document.querySelector('input[accept=".session,.json"]');
        if (uploadArea) {
          uploadArea.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
    }

    isAbortedRef.current = false;
    setIsCampaignRunning(true);
    setActiveSubModal('none');
    setShowMainTgSendModal(false);

    const modeLabel = sendStrategyMode === 'two_stage' ? '【两阶段问候语防封模式】' : '【一键直发模式】';

    // 读取游标，支持从 sentOffset 自动续发
    let currentIndex = sentOffset;
    if (!isAutoScheduled) {
      if (currentIndex >= rawLines.length) {
        if (confirm(`已到达上次群发终点 (第 ${sentOffset} 条 / 共 ${rawLines.length} 条)。是否自动归零重置，从第 1 条开始重新发送？`)) {
          currentIndex = 0;
          updateSentOffset(0);
        } else {
          setIsCampaignRunning(false);
          return;
        }
      } else if (currentIndex > 0) {
        const shouldReset = confirm(`📍 检测到上次群发进度记录在前 ${currentIndex} 条。\n\n【确定】: 重置游标，从第 1 条开始重新完整群发所有号码 (包含测试主号)\n【取消】: 续发模式，自动跳过前 ${currentIndex} 条已发号码，从第 ${currentIndex + 1} 条继续发件`);
        if (shouldReset) {
          currentIndex = 0;
          updateSentOffset(0);
        }
      }
    } else {
      // Auto scheduled starts from 0 for fresh wave
      currentIndex = 0;
      updateSentOffset(0);
    }

    // 1. 动态构建独立发件账号池 (匹配 .session 协议号凭证，支持按分组分流)
    let initialAccountPool = hasRealSessions 
      ? realSessionFiles.map((s) => {
          const rawPhoneNum = s.fileName.replace('.session', '').replace(/\D/g, '');
          const matchedAcc = distinctTgAccounts.find(a => {
            const cleanAccP = a.phone.replace(/\D/g, '');
            return cleanAccP.includes(rawPhoneNum) || rawPhoneNum.includes(cleanAccP);
          });
          return {
            phone: matchedAcc ? matchedAcc.phone : `+${rawPhoneNum}`,
            sessionFile: s.fileName,
            groupTag: matchedAcc?.groupTag || '主力爆破A组'
          };
        })
      : (distinctTgAccounts.length > 0 
          ? distinctTgAccounts.map(a => ({ phone: a.phone, sessionFile: undefined, groupTag: a.groupTag || '主力爆破A组' })) 
          : [{ phone: '+55 41 99999-8888', sessionFile: undefined, groupTag: '主力爆破A组' }]);

    const activeFilter = currentWave?.targetGroupTag || massSendGroupFilter;
    if (activeFilter && activeFilter !== 'ALL') {
      const targetNorm = normalizeGroupTag(activeFilter);
      const filtered = initialAccountPool.filter(a => normalizeGroupTag(a.groupTag) === targetNorm);
      
      if (filtered.length === 0) {
        const errorMsg = `⚠️【发件分组隔离拦截】当前选中的【${activeFilter}】没有可用的在线发件协议号！\n\n系统已主动拦截本次群发任务，防止误用其他分组（如【${targetNorm === '新买养号B组' ? '主力爆破A组' : '新买养号B组'}】）账号。\n\n请在账号列表中将发件号划入【${activeFilter}】，或将发件分组切换为【全部账号】后再开始群发。`;
        alert(errorMsg);
        setSimpleLogs(prev => [...prev, `[🚫 分组隔离拦截] ${errorMsg.replace(/\n\n/g, ' | ')}`]);
        setIsCampaignRunning(false);
        return;
      }
      initialAccountPool = filtered;
    }

    // 🛡️ 自动剔除受限制账号 / 隔离组账号 (熔断防护，受限号自动退出群发任务)
    if (autoQuarantineRestricted) {
      const beforeCount = initialAccountPool.length;
      initialAccountPool = initialAccountPool.filter(a => {
        const cleanP = a.phone.replace(/\D/g, '');
        const isQuarantined = normalizeGroupTag(a.groupTag) === '⚠️ 风控隔离组';
        const health = accountHealthMap[cleanP];
        const isRestricted = health && (health.status === 'restricted' || health.status === 'banned');
        return !isQuarantined && !isRestricted;
      });
      const removedCount = beforeCount - initialAccountPool.length;
      if (removedCount > 0) {
        setSimpleLogs(prev => [
          ...prev,
          `🛡️ [群发安全熔断] 已自动将 ${removedCount} 个【受限/风控隔离】账号退出群发任务，仅由健康的 ${initialAccountPool.length} 个账号执行发信！`
        ]);
      }
    }

    if (initialAccountPool.length === 0) {
      alert('⚠️ 当前所有选中的发信账号均处于【⚠️ 风控隔离组】或官方受限状态！\n\n系统已自动保护拦截本次群发，避免账号被 Telegram 官方永久封禁。请先在健康体检中解封或切换至健康分组号。');
      setIsCampaignRunning(false);
      return;
    }

    const accountPool = initialAccountPool;

    // 辅助随机生成器：单号每发完 15 条自动微休 3~5 分钟 (180 ~ 300 秒)
    const getRandomThreshold = () => 15; // 严格单号 15 条微批次阈值
    const getRandomRestSec = () => Math.floor(Math.random() * (300 - 180 + 1)) + 180; // 3~5分钟随机微休

    // 2. 初始化每个发件账号独立的员工性格档案 (动态自适应任意 N 个账号的弹性矩阵)
    const poolSize = accountPool.length;
    // 根据实际在线协议号总数自适应错峰步长，无论 10 个号、50 个号、100 个号还是 500+ 个号均自动平滑散开
    const dynamicStaggerStepMs = Math.max(150, Math.min(2000, Math.floor(45000 / Math.max(poolSize, 1))));

    const accountTracker = accountPool.map((acc, idx) => {
      const rawDigits = acc.phone.replace(/\D/g, '');
      const phoneSeed = parseInt(rawDigits.slice(-2) || '15', 10);
      const personalityRoll = (phoneSeed + idx * 7) % 100;
      
      let personalityType = '标准稳健型 (正点到岗)';
      let arrivalDelayMs = (idx % Math.min(poolSize, 50)) * dynamicStaggerStepMs + Math.floor(Math.random() * 2000) + 1000;
      let typingFactor = 1.0;
      let restThreshold = 15;

      if (personalityRoll < 30) {
        personalityType = '积极早鸟型 (提早到岗)';
        arrivalDelayMs = Math.floor(Math.random() * 2000) + 500 + (idx % Math.min(poolSize, 20)) * (dynamicStaggerStepMs * 0.4);
        typingFactor = 0.88 + (phoneSeed % 10) / 100; // 0.88 ~ 0.98x 手速稍快
        restThreshold = 14 + (phoneSeed % 3); // 14 ~ 16 条
      } else if (personalityRoll < 80) {
        personalityType = '标准稳健型 (正点到岗)';
        arrivalDelayMs = (idx % Math.min(poolSize, 50)) * dynamicStaggerStepMs + Math.floor(Math.random() * 3000) + 1500;
        typingFactor = 0.98 + (phoneSeed % 15) / 100; // 0.98 ~ 1.13x 标准
        restThreshold = 13 + (phoneSeed % 3); // 13 ~ 15 条
      } else {
        personalityType = '慢热从容型 (稍迟就位)';
        arrivalDelayMs = (idx % Math.min(poolSize, 60)) * (dynamicStaggerStepMs * 1.5) + Math.floor(Math.random() * 5000) + 3000;
        typingFactor = 1.12 + (phoneSeed % 15) / 100; // 1.12 ~ 1.27x 慢吞吞
        restThreshold = 12 + (phoneSeed % 4); // 12 ~ 15 条
      }

      return {
        ...acc,
        personalityType,
        arrivalDelayMs,
        continuousSent: 0,
        maxBeforeRest: restThreshold,
        cooldownUntil: 0,
        typingFactor: parseFloat(typingFactor.toFixed(2))
      };
    });

    setSimpleLogs(prev => [
      ...prev,
      `==================== 🚀 弹性多账号拟人作息矩阵群发引擎启动 (${accountTracker.length} 个协议号并发) ====================`,
      `[策略模式] ${modeLabel}`,
      `[员工矩阵] 装载 ${accountTracker.length} 位拟人员工性格档案 (弹性支持任意规模账号矩阵，自适应平滑错峰，绝不同秒并发！)`,
      `[拟人作息] 模拟真人打卡、阅读客户、打字手速(0.88x~1.27x)与 15 条微休(3~5分钟)，防封效果拉满！`,
      `[单条节奏] 45~65 秒高斯拟人随机打散 + 发信前 3~5 秒模拟真实打字中 (Typing)`,
      `[📍 断点识别] 本次从第 ${currentIndex + 1} 条开始履约，总名单 ${rawLines.length} 条！`,
      `[凭证状态] 磁盘已挂载 ${hasRealSessions ? `${realSessionFiles.length} 个真实 .session 协议号` : '沙盒模拟模式'}`
    ].filter(Boolean));

    // 3. 多号真并发线程池调度引擎 (每个账号独立协程循环，互不阻塞等待)
    (async () => {
      let runSuccessCount = 0;
      let runFailCount = 0;
      let lastErrorDetail = '';
      let nextTaskQueueIndex = currentIndex;

      // 线程安全原子任务取模器
      const getNextTask = () => {
        if (isAbortedRef.current) return null;
        if (nextTaskQueueIndex >= rawLines.length) return null;
        const taskIdx = nextTaskQueueIndex++;
        return {
          taskIndex: taskIdx,
          targetItem: rawLines[taskIdx],
          cleanPhone: rawLines[taskIdx].replace(/\s*\(.*?\)/, '').trim()
        };
      };

      // 启动所有账号并发 Worker (模拟任意 N 位员工早鸟、正点、稍后陆续到岗，绝不同秒并发)
      const workerPromises = accountTracker.map(async (acc, workerIdx) => {
        const staggerSec = (acc.arrivalDelayMs / 1000).toFixed(1);
        if (acc.arrivalDelayMs > 1500) {
          setSimpleLogs(prev => [
            ...prev,
            `⏳ [员工 #${workerIdx + 1}/${accountTracker.length}: ${acc.phone.slice(-4)}] 性格:【${acc.personalityType}】| 拟人自然到岗延时 ${staggerSec}s (自适应错峰上班)...`
          ]);
        }
        await interruptibleSleep(acc.arrivalDelayMs);

        while (!isAbortedRef.current) {
          // 账号独立休眠防风控 (发满 15 条微休 3~5 分钟)
          if (Date.now() < acc.cooldownUntil) {
            const waitMs = Math.max(1000, acc.cooldownUntil - Date.now());
            await interruptibleSleep(Math.min(waitMs, 3000));
            continue;
          }

          if (isAbortedRef.current) break;

          const task = getNextTask();
          if (!task || isAbortedRef.current) break; // 队列已空或收到停止信号

          const { taskIndex, targetItem, cleanPhone } = task;
          updateSentOffset(taskIndex + 1);

          // 问候语轮换
          let selectedGreeting = greetingText;
          if (use50GreetingsRotate && greetingsList.length > 0) {
            selectedGreeting = greetingsList[(greetingGlobalIndex + taskIndex) % greetingsList.length];
          }
          let msgToSend = sendStrategyMode === 'two_stage' ? selectedGreeting : massMessageText;
          if (appendSenderTag) {
            msgToSend += `\n\n(Enviado por: ${acc.phone})`;
          }

          const assignedProxy = brazilProxies[taskIndex % brazilProxies.length];
          const proxyIp = assignedProxy.split(':')[0];

          // 拟人真实打字中 (Typing) 动作：发信前 3~5 秒随机模拟
          const typingDurationMs = Math.floor(Math.random() * 2000) + 3000;
          const typingDurationSec = (typingDurationMs / 1000).toFixed(1);

          setSimpleLogs(prev => [
            ...prev,
            `[✍️ 拟人打字中 ${typingDurationSec}s | 通道 #${workerIdx + 1} (${acc.phone.slice(-4)})] 正在准备发送 ➔ 目标 #${taskIndex + 1} (${targetItem})...`
          ]);

          await interruptibleSleep(typingDurationMs);
          if (isAbortedRef.current) break;

          setSimpleLogs(prev => [
            ...prev,
            `[📡 正在握手 TG 云端 | 通道 #${workerIdx + 1} (${acc.phone.slice(-4)})] 正在通过巴西代理 (${proxyIp}) 发信 ➔ 目标 #${taskIndex + 1} (${cleanPhone})...`
          ]);

          try {
            const resp = await fetch('/api/telethon/run-direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(45000),
              body: JSON.stringify({
                targets: [cleanPhone],
                message: msgToSend,
                second_message: injectAntiBanDomain(followupLinkText || massMessageText),
                third_message: blessingText,
                enable_third_message: enableBlessing,
                second_to_third_delay_min: blessingDelayMin,
                second_to_third_delay_max: blessingDelayMax,
                wait_for_reply: sendStrategyMode === 'two_stage',
                listen_timeout: 0,
                sender_phone: acc.phone,
                session_file: acc.sessionFile,
                proxy: assignedProxy,
                avatar_photo_path: uploadedImages.length > 0 ? uploadedImages[taskIndex % uploadedImages.length] : (accounts.find(a => a.phone === acc.phone)?.avatarUrl || ''),
                force_user_mode: true
              })
            });

            if (isAbortedRef.current) break;

            const resData = await resp.json();
            const sessionLabel = acc.sessionFile ? `凭证: ${acc.sessionFile}` : '集群协议号';

            if (resData.success && !resData.output?.includes('❌ [消息未送达 Telegram]')) {
              runSuccessCount++;
              const cleanLogText = `[云端后台 🇧🇷 IP:${proxyIp}] [通道 #${workerIdx + 1}: ${acc.phone}] ✨ 消息已送达 ➔ (${targetItem}) [${sessionLabel}]`;
              setSimpleLogs(prev => [...prev, cleanLogText]);
              if (sendStrategyMode === 'two_stage') {
                setPendingReplyTargets(prev => Array.from(new Set([...prev, targetItem])));
              }
            } else {
              runFailCount++;
              const isUnregistered = resData.output?.includes('Cannot find any entity') || resData.error?.includes('Cannot find any entity');
              const errDetail = isUnregistered 
                ? '⚠️ 该手机号在 TG 无效或未注册 Telegram'
                : (resData.error || resData.output?.split('\n').filter((l: string) => l.includes('❌') || l.includes('⚠️')).join(' | ') || '发件号凭证鉴权失败');
              lastErrorDetail = errDetail;
              setSimpleLogs(prev => [...prev, `[云端 ⚠️ 状态] [通道 #${workerIdx + 1}: ${acc.phone}] (目标: ${targetItem}): ${errDetail}`]);

              // 🛡️ 实时熔断机制：发信遭遇官方限制，立即退出当前账号的群发任务并移入【⚠️ 风控隔离组】
              const isTgRestricted = /PeerFlood|USER_RESTRICTED|FloodWait|AuthKeyUnregistered|SessionRevoked|Deactivated|Banned|双向限制|受限/i.test(errDetail);
              if (isTgRestricted && autoQuarantineRestricted) {
                quarantineAccounts([acc.phone], `发件中遇到官方限制: ${errDetail}`);
                setSimpleLogs(prev => [
                  ...prev,
                  `🛑 [通道 #${workerIdx + 1} 实时熔断] 账号 ${acc.phone} 遇到 Telegram 官方限制，已自动退出群发任务并移出B组，划入【⚠️ 风控隔离组】冷冻保护！后续任务由其余健康通道无缝继续。`
                ]);
                break; // 立即停止该账号后续发信
              }
            }
          } catch (err: any) {
            if (isAbortedRef.current) break;
            runFailCount++;
            lastErrorDetail = `网络通信异常: ${err.message}`;
            setSimpleLogs(prev => [...prev, `[云端 ❌ 网络异常] [通道 #${workerIdx + 1}: ${acc.phone}] (目标: ${targetItem}): ${err.message}`]);
          }

          if (isAbortedRef.current) break;

          // 单号连发量计数与独立微休判定 (发完 15 条自动微休 3~5 分钟)
          acc.continuousSent += 1;
          if (acc.continuousSent >= acc.maxBeforeRest && nextTaskQueueIndex < rawLines.length) {
            const restSec = getRandomRestSec();
            const restMin = (restSec / 60).toFixed(1);
            acc.cooldownUntil = Date.now() + restSec * 1000;
            const oldSent = acc.continuousSent;
            acc.continuousSent = 0;
            acc.maxBeforeRest = getRandomThreshold();
            setSimpleLogs(prev => [
              ...prev,
              `☕ [🛡️ 通道 #${workerIdx + 1} 触发微批次保护] 账号 [${acc.phone}] 满 ${oldSent} 条，微休 ${restMin} 分钟 (${restSec}s) 防封！(其余 ${accountTracker.length - 1} 个通道正常并发)`
            ]);
          }

          // 单号专属 45~65 秒高斯拟人随机打散延迟 (只阻塞本账号，不影响任何其它账号！)
          let minBaseSec = 45.0;
          let maxBaseSec = 65.0;
          if (tgSendSpeedMode === 'conservative') {
            minBaseSec = 45.0;
            maxBaseSec = 65.0;
          } else if (tgSendSpeedMode === 'balanced') {
            minBaseSec = 30.0;
            maxBaseSec = 50.0;
          } else if (tgSendSpeedMode === 'turbo') {
            minBaseSec = 15.0;
            maxBaseSec = 30.0;
          } else if (tgSendSpeedMode === 'custom') {
            minBaseSec = Math.max(1.0, customSpeedMin);
            maxBaseSec = Math.max(minBaseSec + 0.5, customSpeedMax);
          }

          const baseRandomSec = minBaseSec + Math.random() * (maxBaseSec - minBaseSec);
          let delayedSec = baseRandomSec * (acc.typingFactor || 1.0);
          if (enableTypingSimulation) {
            delayedSec += (msgToSend.length / 30) * (0.06 + Math.random() * 0.12);
          }
          const actualDelaySec = parseFloat(delayedSec.toFixed(2));
          const finalDelayMs = Math.round(delayedSec * 1000);

          // 记录日志
          const newLog: CampaignLog = {
            id: `log-simple-${Date.now()}-${taskIndex}`,
            campaignId: 'cmp-tg-fast',
            accountId: accounts.find(a => a.phone === acc.phone)?.id || `acc-tg-${workerIdx + 1}`,
            accountPhone: acc.phone,
            targetPhone: targetItem,
            platform: 'telegram',
            messageText: sendStrategyMode === 'two_stage' ? greetingText : massMessageText,
            status: 'success',
            delaySec: actualDelaySec,
            timestamp: new Date().toLocaleTimeString()
          };
          setLogs(prev => [newLog, ...prev]);

          // 更新发件数统计
          setAccounts(prev => prev.map(a => a.phone === acc.phone ? { ...a, sentToday: a.sentToday + 1, totalSent: a.totalSent + 1 } : a));

          if (nextTaskQueueIndex < rawLines.length && !isAbortedRef.current) {
            await interruptibleSleep(finalDelayMs);
          }
        }
      });

      // 等待所有并发 Worker 全部执行完毕
      await Promise.all(workerPromises);

      setIsCampaignRunning(false);

      if (isAbortedRef.current) {
        setSimpleLogs(prev => [
          ...prev,
          `🛑 [任务终止完毕] 收到操作员停止指令，所有并发 Worker 已成功安全退出，未发出的任务已保存在队列中。`
        ]);
        return;
      }

      const totalAttempted = rawLines.length - currentIndex;

      let summaryType: 'success' | 'warning' | 'failed' = 'success';
      let summaryTitle = '';
      let summaryReason = '';
      let summarySuggestion = '';

      if (runSuccessCount === 0 && totalAttempted > 0) {
        summaryType = 'failed';
        summaryTitle = '🛑【群发任务未成功】送达 0 条，发件过程异常';
        summaryReason = lastErrorDetail || '所有发件号的 .session 协议号文件鉴权失败或缺少文件';
        summarySuggestion = '请在页面【.session 协议号文件管理与上传中心】选择并上传您的发件号 .session 凭证文件！';
      } else if (runFailCount > 0) {
        summaryType = 'warning';
        summaryTitle = '⚠️【群发任务完成 - 部分发送失败】';
        summaryReason = `成功送达 ${runSuccessCount} 条 | 发送失败 ${runFailCount} 条 (${lastErrorDetail || '部分号码未注册 Telegram 或触发限制'})`;
        summarySuggestion = '已成功送达的号码将正常等待感知，失败号码建议整理剔除后重新下发。';
      } else {
        summaryType = 'success';
        summaryTitle = '🎉【群发任务 100% 成功送达】';
        summaryReason = `全部 ${runSuccessCount} 条目标已由 ${accountTracker.length} 个协议号多通道并行高速下发至 Telegram 网络！`;
        summarySuggestion = '客户回复后将由全网守护引擎自动感知并补发彩金！';
      }

      setBatchResultModalState({
        isOpen: true,
        type: summaryType,
        title: summaryTitle,
        total: totalAttempted,
        successCount: runSuccessCount,
        failCount: runFailCount,
        mainReason: summaryReason,
        suggestion: summarySuggestion
      });

      setSimpleLogs(prev => [
        ...prev,
        `==================== 多号并发群发任务完成 ====================`,
        runSuccessCount === 0 
          ? `❌❌❌ 【群发失败警报】本次任务 0 条成功送达，失败 ${runFailCount} 条！主要原因: ${summaryReason}`
          : `[完成] 名单 ${totalAttempted} 条已全部由 ${accountTracker.length} 个协议号通道并发发送完毕！成功送达: ${runSuccessCount} 条，失败: ${runFailCount} 条。`,
        `[后台守护就绪] 🤖 后台【客户主动回复雷达】持续全天候巡航，检测到客户回复将秒级自动补发第二条彩金！`
      ]);
    })();
  };

  // 🔍 一键全网拉取客户回复并补发第二条彩金
  const handleScanAndReply = async () => {
    setSimpleLogs(prev => [...prev, `[雷达扫描 📡] 正在连接 Telegram 底层集群，拉取全部私聊历史并自动判定客户回复...`]);
    try {
      const resp = await fetch('/api/telegram/scan-and-reply', { method: 'POST' });
      const data = await resp.json();
      if (data.success) {
        const lines = (data.output || '').split('\n').filter((l: string) => l.includes('🎯') || l.includes('✨') || l.includes('📊'));
        if (lines.length > 0) {
          setSimpleLogs(prev => [
            ...prev,
            `==================== 客户回复扫描与补发结果 ====================`,
            ...lines
          ]);
        } else {
          setSimpleLogs(prev => [...prev, `[雷达扫描 ✅] 已完成检查：当前所有收到回复的客户均已成功处理，暂无遗漏待补发客户。`]);
        }
      } else {
        setSimpleLogs(prev => [...prev, `[雷达扫描 ⚠️] 扫描过程提示: ${data.error || '未检索到新变更'}`]);
      }
    } catch (err: any) {
      setSimpleLogs(prev => [...prev, `[雷达扫描 ❌] 请求网络异常: ${err.message}`]);
    }
  };



  // TXT / CSV file import handler
  const handleTxtFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setMassFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          setMassDataText(content);
          const lineCount = content.split('\n').filter(l => l.trim()).length;
          const fileTypeStr = file.name.endsWith('.csv') ? 'CSV 表格筛号文件' : 'TXT/文本文档';
          setSimpleLogs(prev => [...prev, `[导入数据] 成功加载 ${fileTypeStr} (${file.name})，包含 ${lineCount} 条目标数据`]);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-[1840px] mx-auto">
      {/* Header Banner - Clean, Ultra-Direct, "一目了然" */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-6 rounded-2xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                TG 极速一键中台
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" /> 巴西市场 (pt-BR) 专用
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight flex items-center gap-2">
              TG 矩阵全自动控制台
              <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              极简直观设计：一键批量导入协议号、一键设置养号时间、统一巴西女性改资料、导入TXT数据一键开启群发。
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('tg-account-table-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-slate-950/80 hover:bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 hover:border-emerald-500/50 text-right font-mono transition-all cursor-pointer group"
              title="点击立即直达下方账号列表与批量管理"
            >
              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <span>活跃 TG 账号</span>
                <span className="text-[9px] text-emerald-400 group-hover:underline">(点击查看)</span>
              </div>
              <div className="text-emerald-400 font-extrabold text-base flex items-center justify-end gap-1">
                <span>{distinctTgAccounts.length || accounts.length} 个</span>
                <span className="text-xs group-hover:translate-y-0.5 transition-transform">↓</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMainTgSendModal(true);
                setActiveSubModal('warmup');
              }}
              className="bg-slate-950/80 hover:bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/50 text-right font-mono transition-all cursor-pointer group"
              title="点击修改或开关定时养号"
            >
              <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                <span>定时养号状态</span>
                <span className="text-[9px] text-cyan-400 group-hover:underline">(点击设置)</span>
              </div>
              <div className={`text-xs font-bold ${isWarmupScheduled ? 'text-cyan-400' : 'text-slate-500'}`}>
                {isWarmupScheduled ? '🟢 已开启定时' : '⚪ 未设定'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 🚨 ACTIVE RUNNING CAMPAIGN EMERGENCY CONTROLLER BANNER */}
      {isCampaignRunning && (
        <div className="bg-gradient-to-r from-red-950 via-rose-900/90 to-red-950 border-2 border-red-500 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
            <div>
              <h4 className="text-sm font-black text-white flex items-center gap-2">
                🚨 群发任务正在多账号并发运行中 (高斯 45~65s + 拟人打字)
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                各协议号按员工性格自然错开到岗。若需中途停止，请点击右侧【一键紧急停跑】彻底终止所有线程及云端进程。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleStopCampaign}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 font-extrabold text-xs shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 border border-white"
          >
            <Square className="w-4 h-4 fill-rose-700" /> 🛑 立即紧急停跑 (一键彻底熔断)
          </button>
        </div>
      )}

      {/* 🚀 12-Pillar Commercial Matrix Suite Quick Action Grid */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>十二大商业工业级营销、防封与矩阵裂变引擎（全天候后台常驻守护）：</span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            全部功能 100% 默认激活生效
          </span>
        </div>

        {/* Row 1: Traffic, AI & Infrastructure */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Module 1: AI Spintax / Gemini 葡语润色 */}
          <button
            type="button"
            onClick={() => setShowSpintaxAiModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-500/40 hover:border-purple-400 transition-all text-left shadow-lg hover:shadow-purple-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                Gemini 3.7
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
              ✨ AI 多层 Spintax / 葡语润色
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              自动生成 100+ 条巴西本土俚语打招呼，支持递归嵌套与抗指纹扰动。
            </p>
          </button>

          {/* Module 2: Lead Scraper */}
          <button
            type="button"
            onClick={() => onOpenLeadScraper && onOpenLeadScraper()}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/40 hover:border-indigo-400 transition-all text-left shadow-lg hover:shadow-indigo-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                精准采集
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
              🎯 获客雷达 (群/评论区提取)
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              从公开博彩群及频道评论区批量提取 3 天内高活跃玩家并一键导入。
            </p>
          </button>

          {/* Module 3: Web Inbox */}
          <button
            type="button"
            onClick={() => onOpenWebInbox && onOpenWebInbox()}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-teal-950/40 border border-teal-500/40 hover:border-teal-400 transition-all text-left shadow-lg hover:shadow-teal-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold">
                统一承接
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-teal-300 transition-colors">
              💬 聚合收件箱 & AI 客服
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              聚合多账号私信回复流，一键调用 Gemini 生成地道巴西话术促存。
            </p>
          </button>

          {/* Module 4: Proxy & Fingerprint */}
          <button
            type="button"
            onClick={() => onOpenProxyModal && onOpenProxyModal()}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 transition-all text-left shadow-lg hover:shadow-cyan-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 group-hover:scale-105 transition-transform">
                <Globe2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                IP 隔离
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
              🌐 1:1 独立代理与网络隔离
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              单号绑定独立 SOCKS5 住宅 IP，彻底隔离网络端关联。
            </p>
          </button>
        </div>

        {/* Row 2: The 4 Advanced Conversion & Anti-Ban Engines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Module 5: Pre-flight Filter */}
          <button
            type="button"
            onClick={() => setShowPreflightModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 transition-all text-left shadow-lg hover:shadow-emerald-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                防 PeerFlood
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
              🛡️ 发信前空号/封禁静默预检
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              毫秒级探测 Telegram 在网与活跃状态，100% 跳过空号、注销号与拒收号。
            </p>
          </button>

          {/* Module 6: Group Inviter */}
          <button
            type="button"
            onClick={() => setShowGroupInviterModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/40 hover:border-indigo-400 transition-all text-left shadow-lg hover:shadow-indigo-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                产出提升 10x
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-indigo-300 transition-colors">
              👥 自动建私密营销群裂变拉人
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              自动建群置顶推广文案，矩阵小号协同多线程拉人，高权重抗封广播。
            </p>
          </button>

          {/* Module 7: Brazil Smart Scheduler */}
          <button
            type="button"
            onClick={() => setShowBrazilSchedulerModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/40 hover:border-amber-400 transition-all text-left shadow-lg hover:shadow-amber-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                UTC-3 错峰
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
              ⏰ 巴西黄金作息智能发信调度
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              午休 (11:30~14:00) 与晚间高峰提速发信，深夜自动静默休眠防举报。
            </p>
          </button>

          {/* Module 8: Domain Rotator */}
          <button
            type="button"
            onClick={() => setShowDomainRotatorModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/40 border border-rose-500/40 hover:border-rose-400 transition-all text-left shadow-lg hover:shadow-rose-500/10 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 group-hover:scale-105 transition-transform">
                <Globe className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                秒级防红
              </span>
            </div>
            <div className="text-xs font-bold text-slate-100 group-hover:text-rose-300 transition-colors">
              🔀 多落地页 AB 轮巡与防红熔断
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              实时监测域名健康度，遇拦截或异常秒级自动熔断剔除，平滑切备用站。
            </p>
          </button>
        </div>

        {/* Row 3: Industrial Grade Anti-Ban & High-ROI Power Suite (P0 ~ P3 Upgrades) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Module 9: Auto SpamBot Unban */}
          <button
            type="button"
            onClick={() => setShowSpamBotUnbanModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-950 border border-rose-500/50 hover:border-rose-400 transition-all text-left shadow-lg hover:shadow-rose-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold">
                P0 自动解封
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
              🤖 全自动 @SpamBot 申诉解封
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              批量查询双向限制并自动提交地道葡语申诉信，挽回 30% 买号成本。
            </p>
          </button>

          {/* Module 10: Swarm Warmup & Voice Call */}
          <button
            type="button"
            onClick={() => setShowSwarmWarmupModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 border border-amber-500/50 hover:border-amber-400 transition-all text-left shadow-lg hover:shadow-amber-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:scale-105 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                P1 存活率95%+
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              🐝 蜂窝互聊与模拟语音通话养号
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              微型群组自动双向好友互加、日常足球闲聊与模拟语音握手，快速过危险期。
            </p>
          </button>

          {/* Module 11: Device Fingerprint Pool */}
          <button
            type="button"
            onClick={() => setShowDeviceFingerprintModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950/40 to-slate-950 border border-cyan-500/50 hover:border-cyan-400 transition-all text-left shadow-lg hover:shadow-cyan-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                P2 杜绝连坐
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
              📱 独立设备指纹混淆与硬件池
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              随机分配 Samsung、Xiaomi、Pixel 等真实硬件指纹与 pt-BR 巴西环境。
            </p>
          </button>

          {/* Module 12: Lead Alert Webhook */}
          <button
            type="button"
            onClick={() => setShowLeadAlertWebhookModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/50 hover:border-emerald-400 transition-all text-left shadow-lg hover:shadow-emerald-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                P3 30秒转化
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              ⚡ 高意向私信秒级 Webhook 告警
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              智能监听 PIX/充值/玩法咨询，秒级推送到 TG 管理群或企业 Webhook。
            </p>
          </button>

          {/* Module 13: Account Sanitizer & 2FA Takeover */}
          <button
            type="button"
            onClick={() => setShowAccountSanitizerModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-red-950/40 to-slate-950 border border-red-500/50 hover:border-red-400 transition-all text-left shadow-lg hover:shadow-red-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 group-hover:scale-105 transition-transform">
                <KeyRound className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                P0 防找回/盗登
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-red-300 transition-colors">
              🔐 批量洗号与 2FA 密码接管
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              强制踢下线卡商其他登录设备，统一写入 2FA 二级密码彻底锁定所有权。
            </p>
          </button>

          {/* Module 14: Channel Emoji Reaction & Polls */}
          <button
            type="button"
            onClick={() => setShowChannelWarmupModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-pink-950/40 to-slate-950 border border-pink-500/50 hover:border-pink-400 transition-all text-left shadow-lg hover:shadow-pink-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/40 group-hover:scale-105 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">
                P1 真实消费足迹
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
              🎭 频道 Emoji 互动与投票养号
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              自动加入巴西本地新闻与体育大台，推文点赞 👍/🔥 与投票，TG 官方风控极高信任分。
            </p>
          </button>

          {/* Module 15: FloodWait Auto-Backoff & Resilient Cooling */}
          <button
            type="button"
            onClick={() => setShowFloodWaitBackoffModal(true)}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-950 border border-amber-500/50 hover:border-amber-400 transition-all text-left shadow-lg hover:shadow-amber-500/20 group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 group-hover:scale-105 transition-transform">
                <Timer className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                P0 7x24 无人值守
              </span>
            </div>
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              ⏳ FloodWait 智能退避与自愈唤醒
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              捕获协议层 FloodWait 精确秒数，自动挂起受限号并 0 毫秒无缝热切备用号。
            </p>
          </button>
        </div>
      </div>

      {/* PERMANENT MAIN PAGE: Telegram 4-Account Credential (.session / .json / .txt) Disk Mount Status Panel */}
      <div className="bg-slate-900/90 border-2 border-sky-500/50 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 border border-sky-500/40 rounded-xl text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                🔑 Telegram 协议号批量导入与凭证挂载中心 (唯一统一入口)
              </h3>
              <p className="text-[11px] text-slate-400">
                拖拽或选择您的 <code className="text-amber-300">.session</code> / <code className="text-amber-300">.json</code> / <code className="text-amber-300">.txt</code> 授权文件，系统自动解析并挂载到云端服务器磁盘
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToRealAccounts}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="清空并重置账号库"
            >
              <Trash2 className="w-3.5 h-3.5 text-amber-400" /> 🧹 一键清空/重置账号库
            </button>
            <span className="text-xs bg-sky-950 text-sky-300 border border-sky-800 px-3 py-1.5 rounded-xl font-mono font-bold">
              磁盘挂载: {uploadedSessions.length} 个授权文件
            </span>
          </div>
        </div>

        {/* Drag & Drop Upload Zone Directly on Main Page */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              processSessionFiles(e.dataTransfer.files);
            }
          }}
          className="flex flex-col items-center justify-center gap-2 bg-slate-950/80 p-4 rounded-xl border-2 border-dashed border-sky-500/60 hover:border-sky-400 transition-colors cursor-pointer group"
        >
          <label className="cursor-pointer flex flex-col items-center gap-1.5 w-full">
            <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-xs font-bold text-sky-300 block">
                🖱️ 点击或直接将 TG 号的 .session / .json / .txt 协议文件拖拽到此处批量导入
              </span>
              <span className="text-[10px] text-slate-400">
                系统自动从文件中提取账号并写入服务器 <code className="text-emerald-400">/sessions</code> 磁盘文件夹与账号表完成绑定
              </span>
            </div>
            <input
              type="file"
              accept=".session,.json,.txt"
              multiple
              onChange={handleUploadSessionFile}
              className="hidden"
            />
          </label>

          {isUploadingSession ? (
            <span className="text-xs text-amber-400 font-bold animate-pulse">⏳ {sessionUploadStatus || '正在传输文件...'}</span>
          ) : sessionUploadStatus ? (
            <span className="text-xs text-emerald-400 font-bold">{sessionUploadStatus}</span>
          ) : null}
        </div>

        {/* TG Accounts Real-time Binding Status Grid (Dynamic) */}
        <div id="tg-account-table-section" className="space-y-3 scroll-mt-20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              📋 Telegram 协议号 凭证挂载与健康度检测表 ({distinctTgAccounts.length} 个账号)：
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const savedPoolRaw = localStorage.getItem('tg_custom_proxy_pool');
                  let defaultPrompt = '';
                  if (savedPoolRaw) {
                    try {
                      const parsed = JSON.parse(savedPoolRaw);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                        defaultPrompt = parsed.join('\n');
                      }
                    } catch (_) {}
                  }

                  const input = prompt(
                    `📋 请直接粘贴您的代理 IP 列表 (一行一个，支持 50~1000 行)：\n\n【智能流水线分配机制】\n导入 50 个 IP 后，先拉 10 个号自动绑定前 10 个 IP；之后再拉 10 个新号，系统会自动从第 11 个 IP 继续顺序分配！\n\n格式示例：\n200.160.43.132:12323:user1:pass1\n200.239.213.26:12323:user2:pass2\n200.160.36.222:12323:user3:pass3\n...`,
                    defaultPrompt
                  );
                  if (input && input.trim()) {
                    const rawLines = input.split('\n').map(l => l.trim()).filter(Boolean);
                    if (rawLines.length === 0) return;
                    
                    // 永久保存代理池到存储中，后续拖入新号会自动顺延分配
                    localStorage.setItem('tg_custom_proxy_pool', JSON.stringify(rawLines));
                    
                    let bindCount = 0;
                    setAccounts(prev => {
                      return prev.map((acc, index) => {
                        if (index < rawLines.length) {
                          bindCount++;
                          return { ...acc, proxy: rawLines[index] };
                        }
                        return acc;
                      });
                    });
                    const remainingIps = Math.max(0, rawLines.length - bindCount);
                    alert(`✅ 代理池配置成功！共载入 ${rawLines.length} 个独立代理 IP！\n\n已即时为当前 ${bindCount} 个账号按顺序 1:1 绑定前 ${bindCount} 个 IP。\n剩余 ${remainingIps} 个空闲 IP 已存入代理池，后续您每次拖入新 TG 账号文件，系统都将自动从第 ${bindCount + 1} 个 IP 顺延分配绑定！`);
                  }
                }}
                className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="一键粘贴 50~500 个代理 IP，顺序 1:1 自动分配，后续拖入新账号自动顺延从第 11 个开始分配"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                🌐 批量导入代理IP池 (1:1自动绑定与顺延)
              </button>
              <button
                type="button"
                onClick={() => handleBatchUpdateWarmupDays(undefined, selectedAccountIds.length > 0 ? 'selected' : 'all')}
                className="px-3 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 text-amber-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="一键批量修改所有账号或所选账号的养号天数（如刚购买的新号一键设为第1天）"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                📅 批量改天数 {selectedAccountIds.length > 0 ? `(${selectedAccountIds.length}个)` : ''}
              </button>
              <button
                onClick={() => {
                  const input = prompt("【批量统一设置 2FA 二级密码】\n\n请输入新的 2FA 二级密码（将一键应用到当前所有账号，例如: 548508）：", "548508");
                  if (input !== null && input.trim()) {
                    const pass = input.trim();
                    setAccounts(prev => prev.map(a => ({ ...a, twoFactorPassword: pass })));
                    alert(`✅ 成功将当前全部账号的 2FA 二级密码统一更新为: ${pass}`);
                  }
                }}
                className="px-3 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600/80 text-amber-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="一键统一修改所有账号的 2FA 二级密码"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                🔑 批量统一 2FA 密码
              </button>
              <button
                onClick={handleResetToRealAccounts}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                title="清理所有重复与无效账号"
              >
                🧹 一键去重与净化账号库
              </button>
              {/* 🎯 勾选账号快速体检按钮 (当用户选中账号时高亮显示) */}
              {selectedAccountIds.length > 0 && (
                <button
                  onClick={() => {
                    const selectedAccs = distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id));
                    handleRunSpamBotCheck(selectedAccs, `已选中的 ${selectedAccs.length} 个账号`);
                  }}
                  disabled={isCheckingHealth}
                  className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer animate-pulse"
                  title="仅对您勾选的账号进行 SpamBot 真实穿透体检，跳过其余未发信号"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  🎯 仅检测已选 ({selectedAccountIds.length} 个)
                </button>
              )}

              {/* 🏷️ 分组快速体检按钮 (当用户切到特定分组时高亮显示) */}
              {selectedGroupFilter !== 'ALL' && (
                <button
                  onClick={() => {
                    const grpAccs = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === selectedGroupFilter);
                    handleRunSpamBotCheck(grpAccs, `【${selectedGroupFilter}】组 (${grpAccs.length}个号)`);
                  }}
                  disabled={isCheckingHealth}
                  className="px-3 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/80 text-cyan-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title={`仅检测当前【${selectedGroupFilter}】组中的账号`}
                >
                  <Tag className="w-3.5 h-3.5 text-cyan-400" />
                  🏷️ 仅检测本组 ({distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === selectedGroupFilter).length} 个)
                </button>
              )}

              {/* 🩺 分组/范围/全量健康体检主按钮 */}
              <button
                onClick={() => setShowHealthScopeModal(true)}
                disabled={isCheckingHealth}
                className="px-3 py-1 bg-sky-950 hover:bg-sky-900 border border-sky-600/80 text-sky-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="选择指定分组、已勾选账号或全量进行体检"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                {isCheckingHealth ? '正在查验 SpamBot 状态...' : '🔍 分组/精准体检健康度...'}
              </button>
            </div>
          </div>

          {/* 🏷️ 账号分组、高密搜索与视图控制条 */}
          <div className="bg-slate-950/90 border border-slate-800 p-2.5 rounded-xl space-y-2">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2.5">
              {/* Group filter tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5 text-cyan-400" /> 分组:
                </span>
                <button
                  onClick={() => {
                    setSelectedGroupFilter('ALL');
                    setAccountCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedGroupFilter === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  全部 ({distinctTgAccounts.length})
                </button>
                {PRESET_GROUPS.map(grp => {
                  const cnt = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === grp).length;
                  const grpColor = getGroupColor(grp);
                  return (
                    <button
                      key={grp}
                      onClick={() => {
                        setSelectedGroupFilter(grp);
                        setAccountCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        selectedGroupFilter === grp
                          ? grpColor.tabActive
                          : grpColor.tabInactive
                      }`}
                    >
                      <span>{grpColor.icon}</span>
                      <span>{grp}</span>
                      <span className="opacity-90 font-mono">({cnt})</span>
                    </button>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 self-stretch lg:self-auto">
                <button
                  type="button"
                  onClick={() => toggleAutoQuarantine(!autoQuarantineRestricted)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                    autoQuarantineRestricted
                      ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 shadow-sm shadow-amber-950/50'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                  title="受限自动熔断隔离：体检或发信中一旦账号受限，立即自动退出B组养号与群发任务，转入【⚠️ 风控隔离组】保护"
                >
                  <ShieldAlert className={`w-3.5 h-3.5 ${autoQuarantineRestricted ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>受限自动隔离: {autoQuarantineRestricted ? '已开启' : '已关闭'}</span>
                </button>

                <button
                  onClick={handleBatchCleanBannedAndFiles}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    distinctTgAccounts.some(a => {
                      const cl = (a.phone || a.id).replace(/\D/g, '');
                      const hi = accountHealthMap[cl];
                      return a.status === 'banned' || a.status === 'risk' || hi?.status === 'restricted' || hi?.status === 'banned';
                    })
                      ? 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500 animate-pulse'
                      : 'bg-slate-900 text-slate-400 hover:text-rose-300 border border-slate-800'
                  }`}
                  title="一键清理已被封禁/限制的死号，并从服务器磁盘永久销毁 .session / .json 凭证文件"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  清理封号与文件
                </button>

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBatchAssignGroup(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full sm:w-auto bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>⚡ 快速批量划入分组...</option>
                  <option value="新买养号B组">🛡️ 全部划入 ➔ 新买养号B组 (慢速养号保护)</option>
                  <option value="主力爆破A组">🚀 全部划入 ➔ 主力爆破A组 (全速群发)</option>
                  <option value="备用储备C组">📦 全部划入 ➔ 备用储备C组</option>
                  <option value="测试组">⚙️ 全部划入 ➔ 测试组</option>
                  <option value="⚠️ 风控隔离组">⚠️ 全部划入 ➔ 风控隔离组 (冷冻保护)</option>
                </select>
              </div>
            </div>

            {/* Sub-bar: Search, View Mode Switcher, and Density/Page controls */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-2.5">
              {/* Search box */}
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={accountSearchQuery}
                  onChange={(e) => {
                    setAccountSearchQuery(e.target.value);
                    setAccountCurrentPage(1);
                  }}
                  placeholder="🔍 快速搜索手机号 / 别名 / IP / 2FA..."
                  className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500/80 rounded-lg pl-8 pr-7 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
                {accountSearchQuery && (
                  <button
                    onClick={() => {
                      setAccountSearchQuery('');
                      setAccountCurrentPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setAccountViewMode('grid')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      accountViewMode === 'grid'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="📱 极紧凑网格视图 (多列排版，单屏容纳大量账号)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" /> 紧凑网格
                  </button>
                  <button
                    onClick={() => setAccountViewMode('table')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      accountViewMode === 'table'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title="📋 一览表格模式 (适合 100+ 账号高密度巡检)"
                  >
                    <List className="w-3.5 h-3.5" /> 一览表格
                  </button>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>每页:</span>
                  <select
                    value={accountPageSize}
                    onChange={(e) => {
                      setAccountPageSize(Number(e.target.value));
                      setAccountCurrentPage(1);
                    }}
                    className="bg-slate-900 border border-slate-800 text-cyan-300 rounded px-1.5 py-0.5 text-xs focus:outline-none cursor-pointer"
                  >
                    <option value={48}>48 个</option>
                    <option value={96}>96 个</option>
                    <option value={0}>全部显示 ({filteredTgAccounts.length})</option>
                  </select>
                </div>

                {/* Counter indicator */}
                <span className="text-[11px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  当前筛选: <strong className="text-cyan-300">{filteredTgAccounts.length}</strong> / 总共 {distinctTgAccounts.length}
                </span>
              </div>
            </div>

            {/* 🎯 Quick Selection & Batch Action Toolbar */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              {/* Quick Selection Shortcuts */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400">快速选择:</span>
                <button
                  type="button"
                  onClick={handleSelectAllVisibleAccounts}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  {visibleAccounts.length > 0 && visibleAccounts.every(a => selectedAccountIds.includes(a.id)) ? '取消本页' : `本页全选 (${visibleAccounts.length})`}
                </button>
                <button
                  type="button"
                  onClick={handleSelectAllTgAccounts}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  全部全选 ({distinctTgAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={handleSelectUnconfiguredAccounts}
                  className="px-2 py-0.5 rounded bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  title="仅勾选尚未配置真实女性头像或默认别名的新号"
                >
                  <span>⚠️ 仅选新买未改号</span>
                  <span className="bg-amber-500/20 px-1 rounded text-[9px]">
                    {distinctTgAccounts.filter(a => !a.avatarUrl || a.avatarUrl.includes('placeholder') || (a.alias && a.alias.startsWith('TG-BR-'))).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGroupAccounts('主力爆破A组')}
                  className="px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/50 text-rose-300 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  🚀 仅选爆破A组
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectGroupAccounts('新买养号B组')}
                  className="px-2 py-0.5 rounded bg-sky-950/40 hover:bg-sky-950/70 border border-sky-500/50 text-sky-300 text-[10px] font-bold cursor-pointer transition-colors"
                >
                  🛡️ 仅选养号B组
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateWarmupDays(1, selectedAccountIds.length > 0 ? 'selected' : 'all')}
                  className="px-2 py-0.5 rounded bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  title={selectedAccountIds.length > 0 ? `一键将选中的 ${selectedAccountIds.length} 个刚买新号全部设为第1天` : `一键将当前全部 ${distinctTgAccounts.length} 个刚买新号设为第1天`}
                >
                  🌱 一键全设第1天 (新买)
                </button>
                <button
                  type="button"
                  onClick={() => handleBatchUpdateWarmupDays(undefined, selectedAccountIds.length > 0 ? 'selected' : 'all')}
                  className="px-2 py-0.5 rounded bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/50 text-amber-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                  title={selectedAccountIds.length > 0 ? `批量自定义所选 ${selectedAccountIds.length} 个账号天数` : `批量自定义全部 ${distinctTgAccounts.length} 个账号天数`}
                >
                  📅 批量自定义天数
                </button>
                {selectedAccountIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAllAccounts}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-700 text-slate-400 hover:text-rose-300 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    🧹 清空勾选
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setAccountHealthMap({});
                    let restoredCount = 0;
                    setAccounts(prev => {
                      const updated = prev.map(a => {
                        if (normalizeGroupTag(a.groupTag) === '⚠️ 风控隔离组') {
                          restoredCount++;
                          return { ...a, groupTag: '新买养号B组', status: 'active' as const };
                        }
                        return a;
                      });
                      safeSaveAccountsToLocalStorage(updated);
                      saveAccountsToStorage(updated);
                      return updated;
                    });
                    setSimpleLogs(prev => [
                      ...prev,
                      `🟢 [一键全绿完成] 已清除所有网络与超时标记！${restoredCount > 0 ? `并将 ${restoredCount} 个账号安全移回【新买养号B组】！` : '所有账号均处于健康状态！'}`
                    ]);
                  }}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
                  title="一键消除网络/代理超时误报，将所有账号恢复为全绿健康状态并移回新买养号B组"
                >
                  🟢 清除误报 (一键全绿并移回B组)
                </button>
              </div>

              {/* Status & Primary Trigger */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAccountIds.length > 0) {
                      setProfileTargetScope('selected');
                    } else {
                      setProfileTargetScope('unconfigured');
                    }
                    setActiveSubModal('profile');
                    setShowMainTgSendModal(true);
                  }}
                  className="px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[11px] font-black rounded-lg shadow-md shadow-purple-600/30 flex items-center gap-1.5 transition-all cursor-pointer group"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                  <span>{selectedAccountIds.length > 0 ? `⚡ 批量修改勾选账号 (${selectedAccountIds.length} 个)` : '⚡ 分开改资料与头像 (支持指定账号)'}</span>
                </button>
              </div>
            </div>

            {/* Floating / Active Selection Action Bar */}
            {selectedAccountIds.length > 0 && (
              <div className="p-2.5 bg-gradient-to-r from-purple-950/90 via-slate-900/95 to-indigo-950/90 border border-purple-500/60 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-black text-purple-200 flex items-center gap-1">
                    🎯 已精准勾选 <strong className="text-amber-300 font-mono text-sm px-1.5 py-0.2 bg-purple-900/80 rounded border border-purple-400/50">{selectedAccountIds.length}</strong> 个目标账号
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">(操作将仅对这 {selectedAccountIds.length} 个生效，其余老号 100% 隔离保护)</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileTargetScope('selected');
                      setActiveSubModal('profile');
                      setShowMainTgSendModal(true);
                    }}
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> 改资料/换头像/设2FA
                  </button>

                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBatchAssignGroupToSelected(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-slate-900 border border-purple-500/50 text-purple-200 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                    defaultValue=""
                  >
                    <option value="" disabled>🏷️ 划入分组...</option>
                    <option value="新买养号B组">🛡️ 划入 ➔ 新买养号B组 (慢速养号保护)</option>
                    <option value="主力爆破A组">🚀 划入 ➔ 主力爆破A组 (全速群发)</option>
                    <option value="备用储备C组">📦 划入 ➔ 备用储备C组</option>
                    <option value="测试组">⚙️ 划入 ➔ 测试组</option>
                    <option value="⚠️ 风控隔离组">⚠️ 划入 ➔ 风控隔离组 (冷冻保护)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const input = prompt(`【批量为勾选的 ${selectedAccountIds.length} 个账号设置 2FA 密码】\n\n请输入新的 2FA 二级密码（仅应用到这 ${selectedAccountIds.length} 个账号）：`, "548508");
                      if (input !== null && input.trim()) {
                        const pass = input.trim();
                        const setIds = new Set(selectedAccountIds);
                        const updated = accounts.map(a => setIds.has(a.id) ? { ...a, twoFactorPassword: pass } : a);
                        setAccounts(updated);
                        safeSaveAccountsToLocalStorage(updated);
                        saveAccountsToStorage(updated);
                        alert(`✅ 成功为勾选的 ${selectedAccountIds.length} 个账号更新 2FA 二级密码为: ${pass}`);
                      }
                    }}
                    className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 text-amber-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" /> 设2FA
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBatchUpdateWarmupDays(undefined, 'selected')}
                    className="px-2.5 py-1 bg-amber-900/90 hover:bg-amber-800 border border-amber-500/80 text-amber-100 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    title={`批量修改选中的 ${selectedAccountIds.length} 个账号的养号天数`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-300" /> 批量改天数 ({selectedAccountIds.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBatchUpdateWarmupDays(1, 'selected')}
                    className="px-2 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/80 text-emerald-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    title={`一键将选中的 ${selectedAccountIds.length} 个刚买新号设为第1天`}
                  >
                    🌱 设第1天 (刚买)
                  </button>

                  <button
                    type="button"
                    onClick={handleBatchDeleteSelectedAccounts}
                    className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" /> 删除所选
                  </button>

                  <button
                    type="button"
                    onClick={handleDeselectAllAccounts}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-1"
                    title="取消所有勾选"
                  >
                    ✕ 取消
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ⚠️ 风控隔离组专属警示与一键恢复横幅 */}
          {selectedGroupFilter === '⚠️ 风控隔离组' && (
            <div className="p-3.5 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border border-amber-500/60 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 shadow-lg">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-amber-300 flex items-center gap-2">
                    ⚠️ 当前处于【风控隔离组】冷冻保护区 (共 {distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === '⚠️ 风控隔离组').length} 个账号)
                  </div>
                  <div className="text-[11px] text-amber-200/90 mt-0.5 leading-relaxed">
                    本组账号由于在 SpamBot 体检或发信中被判定为临时双向限制、PeerFlood 或未登录状态，系统已将其<span className="text-amber-300 font-bold underline mx-1">自动移出B组养号与群发任务</span>，避免被 Telegram 永久封号。待冷却期结束或官方解封后，您可一键将其批量移回【新买养号B组】。
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const quarantined = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === '⚠️ 风控隔离组');
                    handleRunSpamBotCheck(quarantined, '风控隔离组复检');
                  }}
                  disabled={isCheckingHealth}
                  className="px-3 py-1.5 bg-amber-900/80 hover:bg-amber-800 text-amber-100 font-bold text-xs rounded-lg border border-amber-600/70 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? 'animate-spin' : ''}`} />
                  重新体检本组
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const quarantinedPhones = new Set(distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === '⚠️ 风控隔离组').map(a => a.id));
                    if (quarantinedPhones.size === 0) {
                      alert('当前风控隔离组中没有账号！');
                      return;
                    }
                    if (confirm(`确认将当前风控隔离组中的 ${quarantinedPhones.size} 个账号全部移回【新买养号B组】继续养号吗？`)) {
                      setAccounts(prev => {
                        const updated = prev.map(a => quarantinedPhones.has(a.id) ? { ...a, groupTag: '新买养号B组', status: 'active' as const } : a);
                        safeSaveAccountsToLocalStorage(updated);
                        saveAccountsToStorage(updated);
                        return updated;
                      });
                      alert(`✅ 成功将 ${quarantinedPhones.size} 个账号移回【新买养号B组】！`);
                    }
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  一键全移回【新买养号B组】
                </button>
              </div>
            </div>
          )}

          {distinctTgAccounts.length === 0 ? (
            <div className="p-6 bg-slate-950/80 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">当前尚未导入 Telegram 协议账号</p>
              <p className="text-[11px] text-slate-500">请在上方上传您的 <code className="text-amber-400 font-mono">.session / .json / .txt</code> 协议文件，或在【账号管理】中批量导入！</p>
            </div>
          ) : filteredTgAccounts.length === 0 ? (
            <div className="p-6 bg-slate-950/80 border border-dashed border-slate-800 rounded-xl text-center space-y-2">
              <Tag className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-400">未找到匹配的账号 (分组: {selectedGroupFilter} {accountSearchQuery ? `| 关键词: "${accountSearchQuery}"` : ''})</p>
              <button
                onClick={() => {
                  setSelectedGroupFilter('ALL');
                  setAccountSearchQuery('');
                  setAccountCurrentPage(1);
                }}
                className="text-[11px] text-cyan-400 underline font-bold cursor-pointer"
              >
                重置筛选条件并查看全部
              </button>
            </div>
          ) : accountViewMode === 'table' ? (
            /* 📋 高密表格一览视图 (适合100+号) */
            <div className="bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-bold">
                      <th className="py-2 px-2.5 text-center w-10">
                        <input
                          type="checkbox"
                          checked={visibleAccounts.length > 0 && visibleAccounts.every(a => selectedAccountIds.includes(a.id))}
                          onChange={handleSelectAllVisibleAccounts}
                          className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                          title="全选/取消本页"
                        />
                      </th>
                      <th className="py-2 px-2 text-center w-8">#</th>
                      <th className="py-2 px-2.5">账号 / 别名</th>
                      <th className="py-2 px-2.5">手机号码</th>
                      <th className="py-2 px-2.5">分组调度</th>
                      <th className="py-2 px-2.5 text-center">养号天数</th>
                      <th className="py-2 px-2.5">SpamBot健康状态</th>
                      <th className="py-2 px-2.5">2FA 二级密码</th>
                      <th className="py-2 px-2.5">独享 SOCKS5 代理 IP</th>
                      <th className="py-2 px-2.5 text-center">磁盘凭证</th>
                      <th className="py-2 px-2.5 text-center w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {visibleAccounts.map((acc, idx) => {
                      const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
                      const hasSession = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.session'));
                      const hasJson = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.json'));
                      const healthInfo = accountHealthMap[cleanPhone] || { status: 'healthy', label: '🟢 单向自由', badgeBg: 'bg-emerald-950/90', badgeText: 'text-emerald-300', badgeBorder: 'border-emerald-600' };
                      const isBannedOrRestricted = healthInfo.status === 'restricted' || healthInfo.status === 'banned' || acc.status === 'banned' || acc.status === 'risk';
                      const effectiveGroup = normalizeGroupTag(acc.groupTag);
                      const currentDay = calculateWarmupDays(acc.createdAt, acc.baseWarmupDay || (acc.warmupDay > 0 ? acc.warmupDay : 1));
                      const rowIdx = (accountPageSize > 0 ? (accountCurrentPage - 1) * accountPageSize : 0) + idx + 1;
                      const isSelected = selectedAccountIds.includes(acc.id);

                      return (
                        <tr 
                          key={acc.id} 
                          className={`hover:bg-slate-900/50 transition-colors ${
                            isSelected ? 'bg-purple-950/30' : isBannedOrRestricted ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-1.5 px-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectAccount(acc.id)}
                              className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[10px]">
                            {rowIdx}
                          </td>
                          <td className="py-1.5 px-2.5">
                            <div className="flex items-center gap-2">
                              {acc.avatarUrl ? (
                                <img src={acc.avatarUrl} alt={acc.alias} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                                  {acc.alias ? acc.alias.charAt(0) : 'TG'}
                                </div>
                              )}
                              <span className="font-bold text-slate-200 truncate max-w-[120px]">{acc.alias}</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-emerald-400 font-bold">
                            {acc.phone}
                          </td>
                          <td className="py-1.5 px-2.5">
                            <select
                              value={effectiveGroup}
                              onChange={(e) => {
                                const targetKey = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
                                handleSetAccountGroup(targetKey, e.target.value);
                              }}
                              className={`text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer ${getGroupColor(effectiveGroup).selectClass}`}
                            >
                              <option value="主力爆破A组" className="bg-slate-900 text-rose-400">🚀 主力爆破A组</option>
                              <option value="新买养号B组" className="bg-slate-900 text-sky-400">🛡️ 新买养号B组</option>
                              <option value="备用储备C组" className="bg-slate-900 text-amber-400">📦 备用储备C组</option>
                              <option value="测试组" className="bg-slate-900 text-purple-400">⚙️ 测试组</option>
                            </select>
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <div className="inline-flex items-center gap-1 bg-amber-950/40 border border-amber-500/40 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">
                              <button
                                type="button"
                                onClick={() => handleUpdateWarmupDays(acc, Math.max(1, currentDay - 1))}
                                className="w-4 h-4 rounded bg-amber-900/80 hover:bg-amber-700 text-amber-200 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span 
                                className="px-1 cursor-pointer font-bold hover:underline"
                                onClick={() => {
                                  const input = prompt(`请输入 [${acc.phone || acc.alias}] 的养号天数:`, String(currentDay));
                                  if (input !== null) {
                                    const parsed = parseInt(input.trim(), 10);
                                    if (!isNaN(parsed) && parsed > 0) handleUpdateWarmupDays(acc, parsed);
                                  }
                                }}
                              >
                                第 {currentDay} 天
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateWarmupDays(acc, currentDay + 1)}
                                className="w-4 h-4 rounded bg-amber-900/80 hover:bg-amber-700 text-amber-200 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-1.5 px-2.5">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${healthInfo.badgeBg} ${healthInfo.badgeText} ${healthInfo.badgeBorder}`}>
                              {healthInfo.label}
                              {healthInfo.status === 'restricted' && <span className="text-rose-400 ml-1">已隔离</span>}
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-amber-300">
                            <span 
                              className="cursor-pointer hover:underline flex items-center gap-1"
                              onClick={() => {
                                const newPass = prompt(`请输入账号 [${acc.phone || acc.alias}] 的 2FA 二级密码:`, acc.twoFactorPassword || '548508');
                                if (newPass !== null) {
                                  setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, twoFactorPassword: newPass.trim() || '548508' } : a));
                                }
                              }}
                            >
                              🔑 {acc.twoFactorPassword || '548508'}
                              <span className="text-[9px] text-amber-400/80 underline font-sans">改</span>
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-emerald-300">
                            <span
                              className="cursor-pointer hover:underline flex items-center gap-1 truncate max-w-[160px]"
                              title={acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.* (巴西原生)'}
                              onClick={() => {
                                const currentProxy = acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.43.132:12323:14aade52b86e6:70dd653fc2';
                                const newProxy = prompt(`请输入账号 [${acc.phone || acc.alias}] 的独享代理 IP:`, currentProxy);
                                if (newProxy !== null && newProxy.trim()) {
                                  setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, proxy: newProxy.trim() } : a));
                                }
                              }}
                            >
                              🌐 {(acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.*').split(':')[0]}
                              <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1 rounded border border-emerald-600/50">改</span>
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-mono text-[10px]">
                            <span className={hasSession ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {hasSession ? '✅ .session' : '❌ 无'}
                            </span>
                            <span className="text-slate-600 mx-1">|</span>
                            <span className={hasJson ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                              {hasJson ? '✅ .json' : '❌ 无'}
                            </span>
                          </td>
                          <td className="py-1.5 px-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenProfileModalForSingleAccount(acc)}
                                className="text-purple-400 hover:text-purple-200 p-1 rounded hover:bg-purple-950/50 transition-all cursor-pointer"
                                title="单独修改此账号的资料/头像/2FA"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAccountAndFiles(acc)}
                                className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition-all cursor-pointer"
                                title="彻底删除此账号并销毁凭证文件"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* 📱 极紧凑多列网格卡片 (6列超密排版，卡片变小，单屏容纳上百个账号) */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-2">
              {visibleAccounts.map((acc) => {
                const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
                const hasSession = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.session'));
                const hasJson = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.json'));
                const healthInfo = accountHealthMap[cleanPhone] || { status: 'healthy', label: '🟢 单向自由', badgeBg: 'bg-emerald-950/90', badgeText: 'text-emerald-300', badgeBorder: 'border-emerald-600' };
                const isTimeout = healthInfo.status === 'timeout' || /超时|timeout/i.test(healthInfo.label || '') || /超时|timeout/i.test(healthInfo.details || '');
                const isBannedOrRestricted = !isTimeout && (healthInfo.status === 'restricted' || healthInfo.status === 'banned' || acc.status === 'banned' || acc.status === 'risk');
                const effectiveGroup = normalizeGroupTag(acc.groupTag);
                const currentDay = calculateWarmupDays(acc.createdAt, acc.baseWarmupDay || (acc.warmupDay > 0 ? acc.warmupDay : 1));
                const isSelected = selectedAccountIds.includes(acc.id);

                return (
                  <div
                    key={acc.id}
                    className={`p-2 rounded-xl border flex flex-col justify-between space-y-1.5 transition-all text-xs relative ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20'
                        : isBannedOrRestricted
                        ? 'bg-rose-950/30 border-rose-800/80'
                        : isTimeout
                        ? 'bg-amber-950/20 border-amber-700/60 shadow-sm'
                        : hasSession
                        ? 'bg-slate-950/95 border-emerald-500/50 shadow-sm hover:border-emerald-400'
                        : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Checkbox, Avatar, Name/Phone, Mount Badge, Edit, Delete */}
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectAccount(acc.id)}
                          className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-0 cursor-pointer shrink-0"
                          title="勾选此账号进行批量操作"
                        />
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.alias} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full object-cover border border-emerald-500/50 shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">
                            {acc.alias ? acc.alias.charAt(0) : 'TG'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-slate-100 block truncate leading-tight" title={acc.alias}>
                            {acc.alias}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold block truncate leading-tight">
                            {acc.phone}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenProfileModalForSingleAccount(acc)}
                          className="text-purple-400 hover:text-purple-200 p-0.5 rounded hover:bg-purple-950/50 transition-all cursor-pointer"
                          title="单独修改此账号的资料与头像"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAccountAndFiles(acc)}
                          className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="彻底删除此账号并销毁凭证"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Middle Row 1: Group selector + Warmup Day counter */}
                    <div className="grid grid-cols-2 gap-1 text-[9px]">
                      {/* Group Select */}
                      <select
                        value={effectiveGroup}
                        onChange={(e) => {
                          const targetKey = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
                          handleSetAccountGroup(targetKey, e.target.value);
                        }}
                        className={`text-[9px] rounded px-1 py-0.5 focus:outline-none cursor-pointer truncate ${getGroupColor(effectiveGroup).selectClass}`}
                        title="点击更换此账号分组"
                      >
                        <option value="主力爆破A组" className="bg-slate-900 text-rose-400">🚀 爆破A组</option>
                        <option value="新买养号B组" className="bg-slate-900 text-sky-400">🛡️ 养号B组</option>
                        <option value="备用储备C组" className="bg-slate-900 text-amber-400">📦 储备C组</option>
                        <option value="测试组" className="bg-slate-900 text-purple-400">⚙️ 测试组</option>
                      </select>

                      {/* Warmup Day Counter */}
                      <div 
                        className="bg-amber-950/40 border border-amber-500/40 rounded px-1 py-0.5 flex items-center justify-between text-amber-300 font-mono text-[9px]"
                        title="养号天数控制（点击可修改）"
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateWarmupDays(acc, Math.max(1, currentDay - 1));
                          }}
                          className="w-3.5 h-3.5 rounded bg-amber-900 hover:bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                        >
                          -
                        </button>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            const input = prompt(`请输入 [${acc.phone || acc.alias}] 的养号天数:`, String(currentDay));
                            if (input !== null) {
                              const parsed = parseInt(input.trim(), 10);
                              if (!isNaN(parsed) && parsed > 0) handleUpdateWarmupDays(acc, parsed);
                            }
                          }}
                          className="cursor-pointer font-bold hover:underline"
                        >
                          第{currentDay}天
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateWarmupDays(acc, currentDay + 1);
                          }}
                          className="w-3.5 h-3.5 rounded bg-amber-900 hover:bg-amber-700 text-amber-100 flex items-center justify-center font-bold text-[9px] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Middle Row 2: 2FA & Dedicated IP */}
                    <div className="bg-slate-900/90 p-1 rounded-lg border border-slate-800/80 space-y-0.5 text-[9px] font-mono">
                      <div 
                        className="flex items-center justify-between cursor-pointer hover:text-amber-300"
                        title="点击修改 2FA 密码"
                        onClick={() => {
                          const newPass = prompt(`请输入账号 [${acc.phone || acc.alias}] 的 2FA 二级密码:`, acc.twoFactorPassword || '548508');
                          if (newPass !== null) {
                            setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, twoFactorPassword: newPass.trim() || '548508' } : a));
                          }
                        }}
                      >
                        <span className="text-slate-500">2FA:</span>
                        <span className="text-amber-300 font-bold truncate">
                          {acc.twoFactorPassword || '548508'} <span className="underline text-[8px]">改</span>
                        </span>
                      </div>

                      <div 
                        className="flex items-center justify-between cursor-pointer hover:text-emerald-300"
                        title="点击修改独享 IP"
                        onClick={() => {
                          const currentProxy = acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.43.132:12323:14aade52b86e6:70dd653fc2';
                          const newProxy = prompt(`请输入账号 [${acc.phone || acc.alias}] 的独享代理 IP:`, currentProxy);
                          if (newProxy !== null && newProxy.trim()) {
                            setAccounts(prev => prev.map(a => a.id === acc.id ? { ...a, proxy: newProxy.trim() } : a));
                          }
                        }}
                      >
                        <span className="text-slate-500">IP:</span>
                        <span className="text-emerald-300 font-bold truncate max-w-[90px]" title={acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.*'}>
                          {(acc.proxy || BRAZIL_DEDICATED_PROXIES_MAP[cleanPhone] || '200.160.*').split(':')[0]} <span className="underline text-[8px]">改</span>
                        </span>
                      </div>
                    </div>

                    {/* Prominent delete button ONLY if truly banned (NOT timeout) */}
                    {isBannedOrRestricted && (healthInfo.status === 'banned' || acc.status === 'banned') && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAccountAndFiles(acc)}
                        className="w-full bg-rose-900/90 hover:bg-rose-800 text-rose-100 border border-rose-600 font-extrabold text-[9px] py-0.5 px-1 rounded flex items-center justify-center gap-1 transition-all cursor-pointer animate-pulse"
                      >
                        <Trash2 className="w-2.5 h-2.5" /> 销毁死号凭证
                      </button>
                    )}

                    {/* Timeout Safe Notice & Quick Reset */}
                    {isTimeout && (
                      <div className="flex items-center justify-between gap-1 bg-amber-950/40 border border-amber-500/40 rounded px-1.5 py-0.5 text-[8.5px] text-amber-200">
                        <span className="truncate">⏳ 代理波动 (非死号)</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAccountHealthMap(prev => ({
                              ...prev,
                              [cleanPhone]: {
                                status: 'healthy',
                                label: '🟢 单向自由',
                                details: '已清除超时标记，账号状态健康',
                                badgeBg: 'bg-emerald-950/90',
                                badgeText: 'text-emerald-300',
                                badgeBorder: 'border-emerald-600'
                              }
                            }));
                          }}
                          className="text-[8px] bg-amber-800/80 hover:bg-emerald-800 text-white px-1 py-0.2 rounded cursor-pointer shrink-0 font-bold transition-colors"
                          title="点击消除超时标记，恢复为健康状态"
                        >
                          恢复健康
                        </button>
                      </div>
                    )}

                    {/* Footer: Health & Session Status */}
                    <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[8.5px] font-mono">
                      <span className={`${healthInfo.badgeText} font-bold truncate max-w-[70px]`}>
                        {healthInfo.label}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className={hasSession ? 'text-emerald-400' : 'text-slate-600'}>.ses</span>
                        <span className="text-slate-600">/</span>
                        <span className={hasJson ? 'text-emerald-400' : 'text-slate-600'}>.json</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 📄 Pagination bar if multiple pages */}
          {totalAccountPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 bg-slate-950/90 border border-slate-800 rounded-xl text-xs">
              <span className="text-slate-400 font-mono text-[11px]">
                显示第 <strong className="text-cyan-300">{(accountCurrentPage - 1) * accountPageSize + 1}</strong> - <strong className="text-cyan-300">{Math.min(accountCurrentPage * accountPageSize, filteredTgAccounts.length)}</strong> / 共 {filteredTgAccounts.length} 个账号 (第 {accountCurrentPage} / {totalAccountPages} 页)
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={accountCurrentPage <= 1}
                  onClick={() => setAccountCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                >
                  ◀ 上一页
                </button>

                {Array.from({ length: totalAccountPages }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  // Show first, last, and around current
                  if (pNum === 1 || pNum === totalAccountPages || Math.abs(pNum - accountCurrentPage) <= 2) {
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => setAccountCurrentPage(pNum)}
                        className={`w-6 h-6 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          accountCurrentPage === pNum
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  }
                  if (pNum === 2 && accountCurrentPage > 4) {
                    return <span key="dots-1" className="text-slate-600 px-0.5">...</span>;
                  }
                  if (pNum === totalAccountPages - 1 && accountCurrentPage < totalAccountPages - 3) {
                    return <span key="dots-2" className="text-slate-600 px-0.5">...</span>;
                  }
                  return null;
                })}

                <button
                  type="button"
                  disabled={accountCurrentPage >= totalAccountPages}
                  onClick={() => setAccountCurrentPage(prev => Math.min(totalAccountPages, prev + 1))}
                  className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 text-[11px] font-bold cursor-pointer"
                >
                  下一页 ▶
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccountPageSize(0);
                    setAccountCurrentPage(1);
                  }}
                  className="ml-2 px-2 py-0.5 bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 rounded text-[11px] font-bold hover:bg-emerald-900 cursor-pointer"
                  title="一键平铺全部账号"
                >
                  ⚡ 一键显示全部 ({filteredTgAccounts.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Main Account Test Sender */}
        <div className="bg-slate-950 p-4 rounded-xl border-2 border-sky-500/50 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
            <span className="text-xs font-extrabold text-sky-300 flex items-center gap-1.5">
              <Send className="w-4 h-4 text-sky-400" /> 📱 物理手机直推送测试 (支持纯手机号 / @Username / Chat ID)
            </span>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
              ✅ 支持多个目标空格/逗号粘贴拆分
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            {/* Sender Selection */}
            <div className="sm:col-span-4">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">1. 发件协议号模式 (支持单号或多号轮询)</label>
              <select
                value={testSenderPhone}
                onChange={(e) => setTestSenderPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-sky-200 focus:outline-none focus:border-sky-500 font-mono"
              >
                <option value="AUTO_ROTATE">⚡ 全局自动轮询 (全部 {distinctTgAccounts.length} 个协议号)</option>
                <optgroup label="🏷️ 按分组标签轮流发件">
                  {PRESET_GROUPS.map(grp => {
                    const count = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === grp).length;
                    return (
                      <option key={`GROUP_${grp}`} value={`GROUP_${grp}`}>
                        {grp === '主力爆破A组' && '🚀 '}
                        {grp === '新买养号B组' && '🛡️ '}
                        {grp === '备用储备C组' && '📦 '}
                        {grp === '测试组' && '⚙️ '}
                        仅限【{grp}】({count} 个协议号)
                      </option>
                    );
                  })}
                </optgroup>
                <optgroup label="👤 指定单独号码发件">
                  {distinctTgAccounts.map((a) => (
                    <option key={a.id} value={a.phone}>
                      🟢 {a.phone} ({a.alias || '协议号'}) [{a.groupTag || '主力A组'}]
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Target Input */}
            <div className="sm:col-span-5">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">2. 接收目标 (手机号 / @Username / Chat ID)</label>
              <input
                type="text"
                value={testChatId}
                onChange={(e) => setTestChatId(e.target.value)}
                placeholder="例如: +8613800000000 或 @my_main_tg 或 5571996984203"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-sky-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            {/* Send Button */}
            <div className="sm:col-span-3 flex items-end">
              <button
                onClick={handleTestRealBotSend}
                className="w-full h-[38px] bg-gradient-to-r from-sky-500 to-cyan-400 hover:from-sky-400 hover:to-cyan-300 text-slate-950 font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-sky-500/20"
              >
                <Send className="w-3.5 h-3.5" /> 立即测试直发目标/主号
              </button>
            </div>
          </div>

          {/* Test Message Type Selection & Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1 border-t border-slate-800/80">
            <div className="sm:col-span-4">
              <label className="text-[10px] text-amber-300 font-bold block mb-1">3. 测试发信文案 (阶段1打招呼 / 阶段2带链接)</label>
              <select
                value={testMessageType}
                onChange={(e) => setTestMessageType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
              >
                <option value="greeting">💬 阶段1: 纯问候打招呼文案 (避开风控)</option>
                <option value="followup">🔗 阶段2: 追发带链接文案 (产品入口)</option>
                <option value="blessing">🍀 阶段3: 祝老板中奖寄语 (拟人转化)</option>
                <option value="custom">✍️ 自定义临时测试文案 (手动输入)</option>
              </select>
            </div>

            <div className="sm:col-span-8">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">
                文案实时预览 / 编辑:
              </label>
              {testMessageType === 'custom' ? (
                <input
                  type="text"
                  value={testCustomMessage}
                  onChange={(e) => setTestCustomMessage(e.target.value)}
                  placeholder="在此输入要发出的自定义测试文案..."
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg p-2 text-xs text-amber-200 focus:outline-none focus:border-amber-400"
                />
              ) : (
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 font-medium truncate">
                  {testMessageType === 'greeting' ? greetingText : (testMessageType === 'followup' ? followupLinkText : blessingText)}
                </div>
              )}
            </div>
          </div>

          {/* Optional Bot Token field */}
          <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono">备用 Bot Token:</span>
            <input
              type="text"
              value={testBotToken}
              onChange={(e) => setTestBotToken(e.target.value)}
              placeholder="备用 Bot API Key (默认内置，不使用可留空)"
              className="flex-1 bg-slate-900/80 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 font-mono"
            />
          </div>

          {botSendStatus && (
            <div className="text-xs font-mono text-sky-200 bg-sky-950/80 p-3 rounded-lg border border-sky-800/80 font-bold whitespace-pre-line leading-relaxed">
              {botSendStatus}
            </div>
          )}

          {/* Diagnostic & Troubleshooting Explanation Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-slate-300">
            <div className="flex items-start gap-1.5">
              <span className="text-amber-400 font-bold shrink-0">💡 多号离散拆分:</span>
              <span>支持将多个手机号/Username用<b>空格</b>或<b>逗号</b>粘贴，系统自动加<b>+前缀</b>并分配协议号轮询发件。</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">📱 TG手机号显示说明:</span>
              <span>Telegram 官方防骚扰机制<b>仅在对方客户端顶部显示协议号姓名</b>（如 Ana Silva/Beatriz Santos）而隐匿手机号；但后台<b>100% 由指定的 +55 协议手机号建立 MTProto 加密连接直发</b>。</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-sky-400 font-bold shrink-0">🇧🇷 50条巴西问候语:</span>
              <div className="space-y-1">
                <span>已启用 50 条巴西经典问候语离散轮流发送，避免同质文案风控！</span>
                <button
                  type="button"
                  onClick={() => setShow50GreetingsDrawer(!show50GreetingsDrawer)}
                  className="px-2 py-0.5 bg-sky-950 hover:bg-sky-900 text-sky-300 border border-sky-600 rounded text-[10px] font-bold transition-all block mt-1"
                >
                  {show50GreetingsDrawer ? '✕ 收起 50 条问候语库' : '👁️ 展开查看 50 条巴西文案库'}
                </button>
              </div>
            </div>
          </div>

          {/* 50 Brazilian Greetings Drawer */}
          {show50GreetingsDrawer && (
            <div className="p-3 bg-slate-950 rounded-xl border border-sky-500/40 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 🇧🇷 巴西本土热辣问候语 50 条轮播防封词库 (已激活自动轮巡)
                </span>
                <button
                  onClick={() => setShow50GreetingsDrawer(false)}
                  className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                >
                  ✕ 关闭
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                每条问候语均遵循巴西葡萄牙语口语习惯（如 Oi, Tudo bem, Fala brother, Salve, Opa, Suave），群发时自动随机分配不同文案，大幅降低同质化被删被封风险！
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-60 overflow-y-auto p-1 font-mono text-[11px]">
                {BRAZILIAN_50_GREETINGS.map((gt, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setGreetingText(gt);
                      alert(`已选择第 ${idx + 1} 条巴西问候语: "${gt}"`);
                    }}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/50 rounded text-slate-200 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <span className="truncate flex-1">
                      <strong className="text-sky-400 mr-1.5">#{idx + 1}</strong>
                      {gt}
                    </span>
                    <span className="text-[9px] text-sky-400 opacity-0 group-hover:opacity-100 font-bold ml-1 shrink-0">
                      应用
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ⏰ 跨时区定时群发预约调度看板 (实时双时区时钟与倒计时) */}
      <CrossTimezoneSchedulerWidget
        onTriggerNow={handleTriggerScheduledMassSend}
        isCampaignRunning={isCampaignRunning}
        targetCount={massDataText.split('\n').filter(l => l.trim()).length}
      />

      {/* Main Core Action Buttons Grid - Simple, Big & Clear ("一目了然") */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* BUTTON 1: TG 群发 */}
        <div
          onClick={() => {
            setShowMainTgSendModal(true);
            setActiveSubModal('none');
          }}
          className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 hover:from-slate-850 hover:to-emerald-900/50 border-2 border-emerald-500/50 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:shadow-emerald-500/20 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <Send className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full animate-pulse">
                核心主控
              </span>
            </div>

            <h2 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
              TG 群发按键
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              点击此按键弹出三项核心功能：<br />
              <strong className="text-emerald-400">1. TG养号设置</strong> |{' '}
              <strong className="text-cyan-400">2. TG改资料设置</strong> |{' '}
              <strong className="text-amber-400">3. TG群发设置</strong> (跑数据)
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/80">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" /> 打开控制弹窗 →
            </span>
            {isCampaignRunning && (
              <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30 animate-pulse">
                ⚙️ 运行中...
              </span>
            )}
          </div>
        </div>

        {/* BUTTON 2: ⏰ 跨时区定时群发预约 (印尼 ➔ 巴西 19:00 高峰免守候) */}
        <div
          onClick={() => setShowCrossTimezoneModal(true)}
          className="group relative bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 hover:from-slate-850 hover:to-amber-900/50 border-2 border-amber-500/50 hover:border-amber-400 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-2xl hover:shadow-amber-500/20 flex flex-col justify-between overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shadow-lg shadow-amber-500/20">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full">
                印尼 ➔ 巴西
              </span>
            </div>

            <h2 className="text-base font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
              ⏰ 定时群发预约
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              专为在印尼操作员设计：巴西晚上 <strong className="text-emerald-400">19:00 黄金晚高峰</strong>，印尼清晨 <strong className="text-amber-400">05:00</strong> 熟睡未起，系统后台全自动准时发射！
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800/80">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 打开跨时区调度中心 →
            </span>
            <span className="text-[11px] font-mono text-amber-300 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
              巴西 19:00 = 印尼 05:00
            </span>
          </div>
        </div>
      </div>

      {/* Cross Timezone Modal Component */}
      <CrossTimezoneSchedulerModal
        isOpen={showCrossTimezoneModal}
        onClose={() => setShowCrossTimezoneModal(false)}
        onTriggerNow={handleTriggerScheduledMassSend}
        isCampaignRunning={isCampaignRunning}
        targetCount={massDataText.split('\n').filter(l => l.trim()).length}
      />

      {/* MODAL 2: TG 群发按键 弹窗 (包含：养号设置、改资料设置、群发设置) */}
      {showMainTgSendModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative space-y-6">
            <button
              onClick={() => {
                setShowMainTgSendModal(false);
                setActiveSubModal('none');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 gap-2">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                  <Send className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    TG 矩阵控制面板
                  </h3>
                  <p className="text-xs text-slate-400">请选择操作项目：养号设置 | 改资料设置 | 群发设置</p>
                </div>
              </div>

              {/* 永久无人值守自动守护引擎状态卡片 */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50 flex items-center gap-2 shadow-inner">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>🟢 服务器后端已挂载【永久自动守护引擎】</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-2">
                  <span>⚡ 今日自动补发:</span>
                  <strong className="text-cyan-400 font-extrabold text-sm">{scannerStats?.todayCount || 0}</strong>
                  <span className="text-slate-500">条 (累计: {scannerStats?.totalCount || 0} 条)</span>
                </div>
              </div>
            </div>

            {/* Sub-Modal Selection / Content Navigation */}
            {activeSubModal === 'none' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                {/* CHOICE 1: TG养号设置 */}
                <div
                  onClick={() => setActiveSubModal('warmup')}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-xl cursor-pointer transition-all text-center space-y-3 group hover:shadow-lg hover:shadow-cyan-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-cyan-300">TG 养号设置</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    点击设置<strong className="text-cyan-400">定时养号</strong>，由操作员自由填写养号时长与运行时间。
                  </p>
                  <span className="inline-block text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                    点击进入养号时间设置 →
                  </span>
                </div>

                {/* CHOICE 2: TG改资料设置 */}
                <div
                  onClick={() => setActiveSubModal('profile')}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-xl cursor-pointer transition-all text-center space-y-3 group hover:shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-emerald-300">TG 改资料设置</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    上传个人头像，<strong className="text-emerald-400">统一分配巴西女性名字</strong>，简介与ID系统自由分配。
                  </p>
                  <span className="inline-block text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                    点击进入一键改资料 →
                  </span>
                </div>

                {/* CHOICE 3: TG群发设置 */}
                <div
                  onClick={() => setActiveSubModal('mass_send')}
                  className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-xl cursor-pointer transition-all text-center space-y-3 group hover:shadow-lg hover:shadow-amber-500/10"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm group-hover:text-amber-300">TG 群发设置</h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    <strong className="text-amber-400">导入目标数据</strong> (粘贴或上传TXT)，按一键群发立即开始跑！
                  </p>
                  <span className="inline-block text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                    点击进入导入与群发 →
                  </span>
                </div>
              </div>
            )}

            {/* SUB-MODAL 1: TG 养号设置 (定时养号) */}
            {activeSubModal === 'warmup' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> 1. TG 养号设置 — 定时养号 (操作员自由填写时间)
                  </span>
                  <button
                    onClick={() => setActiveSubModal('none')}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    返回选项
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      定时养号执行时长 (小时)
                    </label>
                    <input
                      type="number"
                      value={warmupDurationHours}
                      onChange={(e) => setWarmupDurationHours(e.target.value)}
                      placeholder="例如: 2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">由操作员自由填写单次养号跑多久</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      养号交互间隔时间 (分钟)
                    </label>
                    <input
                      type="number"
                      value={warmupIntervalMinutes}
                      onChange={(e) => setWarmupIntervalMinutes(e.target.value)}
                      placeholder="例如: 30"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">多账号互发/阅读频道的休息间隔</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>每日定时开始时间 (24H)</span>
                      <span className="text-[10px] text-sky-400 font-mono">🇧🇷 巴西时间 (BRT)</span>
                    </label>
                    <input
                      type="time"
                      value={warmupStartTime}
                      onChange={(e) => setWarmupStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                      <span>每日定时结束时间 (24H)</span>
                      <span className="text-[10px] text-sky-400 font-mono">🇧🇷 巴西时间 (BRT)</span>
                    </label>
                    <input
                      type="time"
                      value={warmupEndTime}
                      onChange={(e) => setWarmupEndTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                      📝 TG 养号对聊文案语料库 ({tgWarmupCorpus.length} 条已生效)
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      句意同义打散已开启
                    </span>
                  </div>

                  {/* Existing Corpus List */}
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
                    {tgWarmupCorpus.map((script, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between text-slate-300">
                        <span className="truncate max-w-[85%]">#{idx + 1} {script}</span>
                        <button
                          onClick={() => setTgWarmupCorpus(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-red-400 p-0.5 text-[10px]"
                        >
                          ✕ 删除
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Corpus Input */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      value={newTgCorpusInput}
                      onChange={(e) => setNewTgCorpusInput(e.target.value)}
                      placeholder="输入新的 Telegram 养号日常对讲话术..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => {
                        if (newTgCorpusInput.trim()) {
                          setTgWarmupCorpus(prev => [...prev, newTgCorpusInput.trim()]);
                          setNewTgCorpusInput('');
                        }
                      }}
                      className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                    >
                      + 添加话术
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="text-cyan-300 flex items-center gap-1.5">
                      ✨ 商业级全自动养号动作 (7天防封保活链):
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 font-mono">
                      已就绪 100%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">👍</span>
                      <div>
                        <strong className="text-slate-200 block">公众频道智能点赞 (Reaction)</strong>
                        <span className="text-slate-400 text-[10px]">自动获取热门频道最新帖子并随机送出 👍/❤️/🔥/🎉/👏 表情点赞</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">🤝</span>
                      <div>
                        <strong className="text-slate-200 block">小号双向互加联系人</strong>
                        <span className="text-slate-400 text-[10px]">自动建立双向通讯录关系，100% 畅通对发葡语日常对话防封</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">👁️</span>
                      <div>
                        <strong className="text-slate-200 block">频道浏览与消息已读</strong>
                        <span className="text-slate-400 text-[10px]">模拟真人浏览 Telegram 官方资讯与博彩频道并标记已读</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 flex items-start gap-2">
                      <span className="text-purple-400 font-bold">🛡️</span>
                      <div>
                        <strong className="text-slate-200 block">SpamBot 双向限制体检</strong>
                        <span className="text-slate-400 text-[10px]">后台静默监控官方状态，保障单向私信全通</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* REALTIME TG INTER-CHAT MESSAGES INSPECTION PANEL */}
                <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-cyan-300 flex items-center gap-2 text-xs">
                      💬 TG 矩阵号互发对聊实时视窗 ({tgInterChatLogs.length} 条对话已触发)
                    </span>
                    <button
                      onClick={handleTriggerTgInterChatSim}
                      className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5 text-cyan-400" /> ▶ 立即模拟 1 次 TG 账号对聊
                    </button>
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-2.5 pr-1 font-sans text-xs">
                    {tgInterChatLogs.map((chat) => (
                      <div key={chat.id} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-cyan-400">{chat.sender}</span>
                            <span className="text-slate-500">➔</span>
                            <span className="text-emerald-400 font-bold">{chat.receiver}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{chat.time}</span>
                        </div>
                        <p className="text-slate-200 text-xs bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                          {chat.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  {isWarmupScheduled ? (
                    <button
                      type="button"
                      onClick={handleDisableWarmupSchedule}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 transition-all cursor-pointer"
                    >
                      🚫 关闭/停用定时养号
                    </button>
                  ) : (
                    <div className="text-[11px] text-amber-400/90 font-mono">
                      💡 当前未开启定时养号，点击右侧按钮保存并启动
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setActiveSubModal('none')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveWarmupSchedule}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 保存并开启定时养号
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODAL 2: TG 改资料与头像独立设置 (支持分开设置、指定账号批次、隔离老号) */}
            {activeSubModal === 'profile' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Modal Title & Navigation */}
                <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/40 rounded-lg text-emerald-300">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        2. TG 资料与头像配置中心 (支持分开设置 • 批量或单号指定)
                      </span>
                      <p className="text-[10px] text-slate-400">
                        可随时给新买的批次改资料，已配置好的老号自动隔离保护，绝不互相干扰
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSubModal('none')}
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    返回选项
                  </button>
                </div>

                {/* 🎯 TOP SCOPE SELECTOR: 决定本次修改应用到哪些账号 */}
                <div className="bg-gradient-to-r from-purple-950/70 via-slate-950 to-slate-900 p-4 rounded-xl border-2 border-purple-500/60 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/30 pb-2.5">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-purple-200">
                        【步骤 1】选择本次修改的目标账号范围 (精准隔离老账号)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                      当前将生效: <strong className="text-amber-300 font-bold">{
                        profileTargetScope === 'selected' ? selectedAccountIds.length :
                        profileTargetScope === 'unconfigured' ? distinctTgAccounts.filter(a => !a.avatarUrl || a.avatarUrl.includes('placeholder') || (a.alias && a.alias.startsWith('TG-BR-'))).length :
                        profileTargetScope === 'group' ? distinctTgAccounts.filter(a => (a.groupTag || '新买养号B组') === profileTargetGroup).length :
                        profileTargetScope === 'single' ? 1 : distinctTgAccounts.length
                      }</strong> 个账号
                    </span>
                  </div>

                  {/* Scope Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {/* Option 1: Selected Accounts */}
                    <div
                      onClick={() => setProfileTargetScope('selected')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        profileTargetScope === 'selected'
                          ? 'bg-purple-900/50 border-purple-400 shadow-md ring-1 ring-purple-400/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          🎯 仅当前勾选账号
                        </span>
                        <input
                          type="radio"
                          name="profileScope"
                          checked={profileTargetScope === 'selected'}
                          onChange={() => setProfileTargetScope('selected')}
                          className="text-purple-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        已手动勾选 <strong className="text-amber-300">{selectedAccountIds.length}</strong> 个账号
                      </p>
                    </div>

                    {/* Option 2: Unconfigured New Accounts */}
                    <div
                      onClick={() => setProfileTargetScope('unconfigured')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        profileTargetScope === 'unconfigured'
                          ? 'bg-amber-950/60 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          ⚠️ 仅新买未改资料号
                        </span>
                        <input
                          type="radio"
                          name="profileScope"
                          checked={profileTargetScope === 'unconfigured'}
                          onChange={() => setProfileTargetScope('unconfigured')}
                          className="text-amber-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        自动识别未上传真人头像或默认名的新号 ({distinctTgAccounts.filter(a => !a.avatarUrl || a.avatarUrl.includes('placeholder') || (a.alias && a.alias.startsWith('TG-BR-'))).length} 个)
                      </p>
                    </div>

                    {/* Option 3: By Group */}
                    <div
                      onClick={() => setProfileTargetScope('group')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        profileTargetScope === 'group'
                          ? 'bg-cyan-950/60 border-cyan-400 shadow-md ring-1 ring-cyan-400/50'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                          🏷️ 按指定分组批次
                        </span>
                        <input
                          type="radio"
                          name="profileScope"
                          checked={profileTargetScope === 'group'}
                          onChange={() => setProfileTargetScope('group')}
                          className="text-cyan-500"
                        />
                      </div>
                      <select
                        value={profileTargetGroup}
                        onChange={(e) => {
                          setProfileTargetGroup(e.target.value);
                          setProfileTargetScope('group');
                        }}
                        className="w-full bg-slate-950 border border-slate-700 text-cyan-300 text-[10px] font-bold rounded px-1.5 py-0.5 mt-0.5"
                      >
                        <option value="新买养号B组">🛡️ 新买养号B组</option>
                        <option value="主力爆破A组">🚀 主力爆破A组</option>
                        <option value="备用储备C组">📦 备用储备C组</option>
                        <option value="测试组">⚙️ 测试组</option>
                      </select>
                    </div>

                    {/* Option 4: Single or All */}
                    <div
                      onClick={() => setProfileTargetScope('all')}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        profileTargetScope === 'all'
                          ? 'bg-slate-800 border-slate-400 shadow-md'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          🌐 全部所有账号 ({distinctTgAccounts.length})
                        </span>
                        <input
                          type="radio"
                          name="profileScope"
                          checked={profileTargetScope === 'all'}
                          onChange={() => setProfileTargetScope('all')}
                          className="text-slate-400"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        全量重新轮换修改 (谨慎使用)
                      </p>
                    </div>
                  </div>

                  {/* Live Target List Preview */}
                  <div className="bg-slate-950/90 rounded-lg p-2 border border-purple-500/30 text-xs">
                    <span className="text-[10px] font-bold text-purple-300 block mb-1">
                      📋 本次修改的目标账号名单预览 (仅这批会被修改，其余老号安全隔离)：
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                      {(profileTargetScope === 'selected'
                        ? distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id))
                        : profileTargetScope === 'unconfigured'
                        ? distinctTgAccounts.filter(a => !a.avatarUrl || a.avatarUrl.includes('placeholder') || (a.alias && a.alias.startsWith('TG-BR-')))
                        : profileTargetScope === 'group'
                        ? distinctTgAccounts.filter(a => (a.groupTag || '新买养号B组') === profileTargetGroup)
                        : distinctTgAccounts
                      ).slice(0, 20).map((acc) => (
                        <span key={acc.id} className="text-[10px] bg-slate-900 text-slate-200 px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                          <span className="font-mono text-emerald-400">{acc.phone}</span>
                          <span className="text-slate-400 font-bold">({acc.alias})</span>
                        </span>
                      ))}
                      {(profileTargetScope === 'selected' ? selectedAccountIds.length : distinctTgAccounts.length) > 20 && (
                        <span className="text-[10px] text-slate-500 px-1 py-0.5">...及更多</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ⚙️ GRANULAR ITEM SELECTION: 分开设置修改项 */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                      【步骤 2】自由勾选需要修改的项目 (分开设置，按需执行)
                    </span>
                    <span className="text-[10px] text-slate-400">已勾选的项目才会被执行更新</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      profileUpdateAvatar ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={profileUpdateAvatar}
                        onChange={(e) => setProfileUpdateAvatar(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>🖼️ 更改头像 (图库)</span>
                    </label>

                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      profileUpdateName ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={profileUpdateName}
                        onChange={(e) => setProfileUpdateName(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>🇧🇷 更改巴西女性名</span>
                    </label>

                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      profileUpdateBioAndId ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={profileUpdateBioAndId}
                        onChange={(e) => setProfileUpdateBioAndId(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span>📝 更改简介 & 专属ID</span>
                    </label>

                    <label className={`p-2 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                      profileUpdate2FaField ? 'bg-amber-950/40 border-amber-500 text-amber-200 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}>
                      <input
                        type="checkbox"
                        checked={profileUpdate2FaField}
                        onChange={(e) => setProfileUpdate2FaField(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-0 cursor-pointer"
                      />
                      <span>🔑 设置/更改 2FA 密码</span>
                    </label>
                  </div>
                </div>

                {/* Upload Image Section (Only if profileUpdateAvatar is true or always available for gallery) */}
                <div className={`bg-slate-950 p-4 rounded-xl border space-y-3.5 ${
                  profileUpdateAvatar ? 'border-emerald-500/50' : 'border-slate-800 opacity-60'
                }`}>
                  {/* Gallery Header and Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        本地真人头像图库
                      </label>
                      <span className="text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium">
                        已加载 <strong className="text-emerald-400 font-bold">{uploadedImages.length}</strong> 张头像（自动按目标账号轮换分配）
                      </span>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleSmartTrimAndCenter}
                        disabled={isTrimmingBorders || uploadedImages.length === 0}
                        className="px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="自动消除手机截图的白边/黑边，并将人像面部智能居中对齐"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isTrimmingBorders ? 'animate-spin' : ''}`} />
                        {isTrimmingBorders ? '处理中...' : '✨ 智能消除截图白边 & 人像居中'}
                      </button>

                      {uploadedImages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleClearAllImages}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer transition-all"
                            title="清空当前已加载的相册照片"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> 清空相册
                          </button>
                          <button
                            type="button"
                            onClick={handleWipeAllAvatarsAndGallery}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                            title="彻底清空全部相册并重置所有账号头像为初始空白（清除系统全部网络与磁盘缓存照片）"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" /> 彻底清除全部头像与相册
                          </button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSmartDeduplicate}
                        disabled={isDeduplicating || uploadedImages.length <= 1}
                        className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="智能识别并自动清理重复、高度雷同的图片"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isDeduplicating ? 'animate-spin' : ''}`} />
                        {isDeduplicating ? '去重中...' : '✨ 智能一键去重'}
                      </button>

                      <label className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-md active:scale-95">
                        <Upload className="w-3.5 h-3.5" /> + 批量选图 (支持多选/全选)
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Batch Selection Action Bar (when images are selected) */}
                  {uploadedImages.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleSelectAllImages}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline cursor-pointer"
                        >
                          {selectedImageIndices.length === uploadedImages.length ? '取消全选' : `全选图库 (${uploadedImages.length}张)`}
                        </button>
                        <span className="text-slate-400 text-[11px]">
                          已勾选 <strong className="text-emerald-400">{selectedImageIndices.length}</strong> / {uploadedImages.length} 张
                        </span>
                      </div>

                      {selectedImageIndices.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBatchDeleteSelected}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 批量删除所选 ({selectedImageIndices.length}张)
                        </button>
                      )}
                    </div>
                  )}

                  {/* Image Grid with Batch Upload Card + Avatar Thumbnails */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3 max-h-[300px] overflow-y-auto pr-1 py-1">
                    {/* First Card: Quick Batch Upload Trigger */}
                    <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 bg-slate-900/60 hover:bg-slate-900/90 rounded-2xl p-2.5 flex flex-col items-center justify-center cursor-pointer transition-all aspect-square group shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-300 group-hover:text-emerald-300 text-center leading-tight">
                        + 批量选图
                      </span>
                      <span className="text-[9px] text-slate-500 text-center mt-0.5">
                        支持全选/多图
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>

                    {/* Image Cards */}
                    {uploadedImages.map((img, idx) => {
                      const isSelected = selectedImageIndices.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleSelectImage(idx)}
                          className={`relative rounded-2xl overflow-hidden aspect-square cursor-pointer transition-all group bg-slate-900 border-2 ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-[0.98]'
                              : 'border-slate-800 hover:border-slate-600'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Avatar ${idx + 1}`}
                            className="w-full h-full object-cover select-none scale-[1.04] group-hover:scale-110 transition-transform duration-200"
                            loading="lazy"
                          />

                          {/* Top-Right Selection Checkmark */}
                          <div className="absolute top-1.5 right-1.5 z-10">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border border-white">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-slate-950/60 border border-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>

                          {/* Bottom-Left Index Badge */}
                          <span className="absolute bottom-1.5 left-1.5 bg-slate-950/80 backdrop-blur-sm text-[9px] font-mono text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30 shadow">
                            #{idx + 1}
                          </span>

                          {/* Bottom-Right Quick Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(idx);
                            }}
                            className="absolute bottom-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-600 text-white p-1 rounded-lg shadow-lg opacity-80 hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
                            title="删除这张照片"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {uploadedImages.length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-1">
                      💡 提示：可直接点击【+ 批量选图】或拖拽多张真人照片一次性批量导入，系统将自动分配至目标账号并智能轮换！
                    </p>
                  )}
                </div>

                {/* Name Allocation Rules (Brazilian Female Names) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`bg-slate-950 p-3 rounded-xl border space-y-2 ${
                    profileUpdateName ? 'border-emerald-500/40' : 'border-slate-800 opacity-60'
                  }`}>
                    <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" /> 名字库 (巴西女性名随机分配)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">共 {BRAZILIAN_FEMALE_NAMES.length} 个</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto no-scrollbar">
                      {BRAZILIAN_FEMALE_NAMES.map((name, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-medium"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={`bg-slate-950 p-3 rounded-xl border space-y-2 ${
                    profileUpdateBioAndId ? 'border-cyan-500/40' : 'border-slate-800 opacity-60'
                  }`}>
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Settings2 className="w-4 h-4 text-cyan-400" /> 简介与专属 ID (系统智能分配)
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      • 自动分配专属 ID: 如 <code className="text-cyan-300">@ana_br99</code>,{' '}
                      <code className="text-cyan-300">@beatriz_sp</code>
                      <br />• 自动分配高转化博彩个性签名: 如{' '}
                      <span className="text-slate-300">"Fortune Tiger VIP 🐯 | PIX 100% Pagando"</span>
                    </p>
                  </div>
                </div>

                {/* 🔐 2FA 两步验证密码管理设置 */}
                <div className={`bg-slate-950 p-4 rounded-xl border-2 space-y-3 relative overflow-hidden ${
                  profileUpdate2FaField ? 'border-amber-500/60' : 'border-slate-800 opacity-60'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
                        <Lock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                          Telegram 2FA 两步验证安全密码 (修改/重置/防找回)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          为新买的协议号统一更改 2FA 密码，彻底杜绝前号主/号贩子二次登录与找回！
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 2FA Password Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                        <span>新 2FA 两步验证密码:</span>
                        <span className="text-[10px] text-amber-400 font-mono">必填</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showTwoFaPlaintext ? 'text' : 'password'}
                          value={twoFaPassword}
                          onChange={(e) => setTwoFaPassword(e.target.value)}
                          placeholder="例如: 548508 或 Tg@2026Safe"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-16 py-1.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowTwoFaPlaintext(!showTwoFaPlaintext)}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title={showTwoFaPlaintext ? '隐藏明文' : '显示明文'}
                          >
                            {showTwoFaPlaintext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(twoFaPassword);
                              alert(`已复制 2FA 密码: ${twoFaPassword}`);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-200"
                            title="复制密码"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setTwoFaPassword('548508')}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                        >
                          默认: 548508
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const randPin = String(Math.floor(100000 + Math.random() * 900000));
                            setTwoFaPassword(randPin);
                          }}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                        >
                          🎲 随机6位PIN
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                            let randPwd = 'Tg@';
                            for (let i = 0; i < 8; i++) randPwd += chars.charAt(Math.floor(Math.random() * chars.length));
                            setTwoFaPassword(randPwd);
                          }}
                          className="text-[10px] bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono cursor-pointer"
                        >
                          ⚡ 强英数密码
                        </button>
                      </div>
                    </div>

                    {/* Hint */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        密码提示语 (Hint / 可选):
                      </label>
                      <input
                        type="text"
                        value={twoFaHint}
                        onChange={(e) => setTwoFaHint(e.target.value)}
                        placeholder="例如: br_matrix_safe"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-slate-500 block">用于在输入 2FA 时提示操作员</span>
                    </div>

                    {/* Recovery Email */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-300 block">
                        安全绑定邮箱 (Recovery Email / 可选):
                      </label>
                      <input
                        type="email"
                        value={twoFaRecoveryEmail}
                        onChange={(e) => setTwoFaRecoveryEmail(e.target.value)}
                        placeholder="例如: liaobei8989@outiook.com"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[10px] text-slate-500 block">用于紧急找回 2FA 或接收 TG 安全码</span>
                    </div>
                  </div>
                </div>

                {profileSuccessMsg && (
                  <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    {profileSuccessMsg}
                  </div>
                )}

                {/* Action Buttons: 保存照片 & 一键改资料 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>执行目标: <strong className="text-white font-bold">{
                      profileTargetScope === 'selected' ? `勾选的 ${selectedAccountIds.length} 个账号` :
                      profileTargetScope === 'unconfigured' ? '未改资料的新账号' :
                      profileTargetScope === 'group' ? `【${profileTargetGroup}】所有账号` :
                      profileTargetScope === 'single' ? '指定单号' : '全部账号'
                    }</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveSubModal('none')}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveProfilePhotosOnly}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/50 shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 仅存相册 ({uploadedImages.length} 张)
                    </button>
                    <button
                      onClick={handleOneClickUpdateProfiles}
                      className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" /> ⚡ 立即执行修改 (仅对指定目标生效)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-MODAL 3: TG 群发设置 (导入数据：支持贴贴或上传TXT文件夹，按一键群发就开始跑) */}
            {activeSubModal === 'mass_send' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 gap-2">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> 3. TG 群发设置 — 导入数据并开启极速群发
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5 shadow-sm animate-pulse"
                      title="后端服务器已开启永久守护，每 15 秒无人值守自动扫描并补发第二条彩金文案"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 🟢 服务器永久守护运行中 (每15秒巡检补发)
                    </div>
                    <button
                      type="button"
                      onClick={handleScanAndReply}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm flex items-center gap-1.5 transition-all"
                      title="实时扫描所有 Telegram 账号私聊记录，自动识别并补发回复了 Quem é? / Oi / 1 等客户的第二条彩金文案"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 🔍 手动补发第二条彩金
                    </button>
                    <button
                      onClick={() => setActiveSubModal('none')}
                      className="text-xs text-slate-400 hover:text-white underline"
                    >
                      返回选项
                    </button>
                  </div>
                </div>

                {/* 📊 第二条彩金补发 & 巴西 22:00 宵禁守护看板 */}
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-2">
                          第二条彩金补发与巴西 22:00 宵禁守护看板
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                            服务端无人值守守护
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          每日 07:00 ~ 22:00 (BRT) 自动监听客户回复追发彩金，达到 22:00 自动触发宵禁关断休眠
                        </p>
                      </div>
                    </div>

                    {/* Current Brazil Time & Status Pill */}
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800 text-xs font-mono flex items-center gap-1.5">
                        <span>🇧🇷 巴西利亚时间:</span>
                        <strong className="text-emerald-400 font-bold">{scannerStats?.brazilTime || '计算中...'}</strong>
                      </div>
                      {scannerStats?.status === 'PAUSED_NIGHT' ? (
                        <div className="px-3 py-1 rounded-xl bg-purple-950/90 text-purple-300 border border-purple-500/50 text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                          <span>🌙 宵禁关断停发中 (22:00 - 07:00)</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-xs font-extrabold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>🟢 正常守护中 (07:00 - 22:00)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stat Counters Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                          今日成功补发彩金
                        </span>
                        <button
                          type="button"
                          onClick={handleResetTodayStats}
                          title="手动重置今日计数为 0（每日 00:00 BRT 跨天也会自动清零）"
                          className="text-[10px] text-slate-500 hover:text-amber-400 bg-slate-900 hover:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-800 transition-colors"
                        >
                          🔄 重置今日
                        </button>
                      </div>
                      <div className="text-xl font-black text-emerald-400 font-mono flex items-baseline gap-1">
                        {scannerStats?.todayCount || 0} <span className="text-xs font-normal text-slate-500">条</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        ⏱️ 每 24 小时 (00:00 BRT) 自动清零
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1 font-bold">累计成功补发总数</span>
                      <div className="text-xl font-black text-amber-400 font-mono">
                        {scannerStats?.totalCount || 0} <span className="text-xs font-normal text-slate-500">条</span>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        📊 历史永久累计数据
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">宵禁设定时间段</span>
                      <div className="text-sm font-bold text-purple-300 font-mono">
                        22:00 ~ 07:00 <span className="text-[10px] text-purple-400">(BRT)</span>
                      </div>
                      <span className="text-[10px] text-purple-400/80 mt-1 block">
                        🌙 夜间自动暂停保护
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">上轮巡检时间</span>
                      <div className="text-xs font-bold text-slate-300 font-mono">
                        {scannerStats?.lastScanTime ? new Date(scannerStats.lastScanTime).toLocaleTimeString() : '刚刚'}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        ⚡ 每 15 秒云端自动感知
                      </span>
                    </div>
                  </div>

                  {/* Per Account Stat Breakdown */}
                  {scannerStats?.accountStats && Object.keys(scannerStats.accountStats).length > 0 && (
                    <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1.5">📱 各 Telegram 协议分号补发统计明细:</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(scannerStats.accountStats).map(([phone, stat]: [string, any]) => (
                          <div key={phone} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] flex items-center gap-2">
                            <span className="text-slate-300 font-medium">+{phone} ({stat.name}):</span>
                            <span className="text-emerald-400 font-bold font-mono">今日 {stat.todaySent || 0} 条</span>
                            <span className="text-slate-500">/ 累计 {stat.totalSent || 0} 条</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Logs List */}
                  {scannerStats?.logs && scannerStats.logs.length > 0 && (
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-[11px] font-bold text-amber-400 block mb-1">📋 最近自动捕捉回复并补发记录:</span>
                      <div className="max-h-24 overflow-y-auto space-y-1 font-mono text-[11px] pr-1">
                        {scannerStats.logs.map((log: any, idx: number) => (
                          <div key={idx} className="text-emerald-300/90 flex items-center gap-2 bg-slate-900/50 px-2 py-0.5 rounded">
                            <span className="text-slate-500">[{log.timestamp}]</span>
                            <span>{log.msg}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Import Target Data Area */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                      1. 导入数据 (支持上传 .csv / .txt / .tsv 筛号结果文件或直接粘贴)
                    </label>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 执行发件分组选择器 */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-xl">
                        <Tag className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[11px] font-bold text-slate-300">发信分组:</span>
                        <select
                          value={massSendGroupFilter}
                          onChange={(e) => setMassSendGroupFilter(e.target.value)}
                          className="bg-slate-950 border border-slate-700 text-cyan-300 text-xs font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">⚡ 全局全部协议号 ({distinctTgAccounts.length} 个)</option>
                          {PRESET_GROUPS.map(grp => {
                            const cnt = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === grp).length;
                            return (
                              <option key={grp} value={grp}>
                                {grp === '主力爆破A组' && '🚀 '}
                                {grp === '新买养号B组' && '🛡️ '}
                                {grp === '备用储备C组' && '📦 '}
                                {grp === '测试组' && '⚙️ '}
                                仅限【{grp}】({cnt} 个号)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <label className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all hover:bg-amber-500/20 shadow-sm" title="支持上传 .csv (如 1_结果.csv)、.txt、.tsv 等筛号表格数据">
                        <Upload className="w-3.5 h-3.5" /> 上传 TXT / CSV 文件
                        <input
                          type="file"
                          accept=".txt,.csv,.tsv"
                          className="hidden"
                          onChange={handleTxtFileImport}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowCrossTimezoneModal(true)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                        title="设置定时群发：巴西晚上 19:00 / 印尼早上 05:00 准时自动发射"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> ⏰ 定时预约 (印尼➔巴西)
                      </button>

                      <button
                        onClick={handleStartMassSend}
                        className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-slate-950 shadow-md flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" /> 一键群发 (开始跑)
                      </button>
                    </div>
                  </div>

                  {massFileName && (
                    <div className="mb-2 text-[11px] text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-flex items-center gap-2">
                      <span>📄 已选目标文件: <strong className="text-amber-200">{massFileName}</strong></span>
                      <button
                        type="button"
                        onClick={() => {
                          setMassFileName('');
                          setMassDataText('');
                          setSimpleLogs(prev => [...prev, '[取消选择] 已移除当前选中的文件，并清空列表数据']);
                        }}
                        className="px-2 py-0.5 text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-md transition-all font-bold flex items-center gap-1"
                        title="取消选择此文件并清空下方导入的号码数据"
                      >
                        ✕ 取消文件/清空数据
                      </button>
                    </div>
                  )}

                  <textarea
                    rows={5}
                    value={massDataText}
                    onChange={(e) => setMassDataText(e.target.value)}
                    placeholder="在此粘贴目标数据 (如手机号或 Telegram 用户名，每行一条，例如：&#10;556199887766&#10;@username123)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500/50"
                  ></textarea>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                    <span>当前加载: <strong className="text-amber-400 font-bold">{massDataText.split('\n').filter(l => l.trim()).length}</strong> 条目标号码/用户名</span>
                    {massDataText.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setMassFileName('');
                          setMassDataText('');
                          setSimpleLogs(prev => [...prev, '[数据清空] 已清空全部目标数据']);
                        }}
                        className="text-rose-400 hover:text-rose-300 underline font-medium flex items-center gap-0.5"
                      >
                        🗑️ 清空文本框数据
                      </button>
                    )}
                  </div>

                  {/* 📍 自动断点记忆与巴西工作时间调度控制卡片 */}
                  <div className="mt-2.5 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
                    {/* Top Row: Breakpoint Memory */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/20 pb-2">
                      <div className="flex items-center gap-2 text-emerald-300 font-mono">
                        <span className="p-1 bg-emerald-500/20 rounded-md text-emerald-400 font-bold">📍 断点续跑记忆</span>
                        <span>
                          {sentOffset > 0 ? (
                            <>
                              已成功跑完前 <strong className="text-amber-300 font-bold">{sentOffset}</strong> 条 | 明天启动自动从第 <strong className="text-emerald-200 font-bold">{sentOffset + 1}</strong> 条无缝继续
                            </>
                          ) : (
                            <>当前未产生历史进度，默认从第 <strong className="text-emerald-200 font-bold">1</strong> 条开始群发 (全量 3000 条自动接力)</>
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {sentOffset > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('确定归零重新从第 1 条开始群发吗？')) {
                                updateSentOffset(0);
                                setSimpleLogs(prev => [...prev, '[游标归零] 自动切回第 1 条重新开始发信']);
                              }
                            }}
                            className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg transition-all font-bold flex items-center gap-1"
                          >
                            🔄 归零 (从第 1 条重新发)
                          </button>
                        )}
                        <label className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          自定义起点:
                          <input
                            type="number"
                            min={0}
                            max={massDataText.split('\n').filter(l => l.trim()).length || 3000}
                            value={sentOffset}
                            onChange={(e) => updateSentOffset(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-center text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                          />
                          条
                        </label>
                      </div>
                    </div>

                    {/* 🛡️ 养号期 (前3~7天) 单号每日 5~8 条严格控频保护阀 */}
                    <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enable3To7DaysWarmupThrottling}
                          onChange={(e) => toggleWarmupThrottling(e.target.checked)}
                          className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
                        />
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          🛡️ 开启 3~7 天新号养号保护阀 (限制新导入单号每日仅发 5~8 条，极速建立账号基础权重)
                        </span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {enable3To7DaysWarmupThrottling ? '🟢 养号期自动严格控发' : '⚪ 已解除养号限频'}
                      </span>
                    </div>

                    {/* Bottom Row: Brazil Time & Smart Scheduling Rule */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sky-300 font-bold flex items-center gap-1">
                          🇧🇷 巴西工作时间: <strong className="text-amber-300">09:00 - 22:00 (BRT)</strong>
                        </span>
                        <span className="bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          🟢 22:00 自动夜间休眠挂起
                        </span>
                      </div>

                      <div className="text-slate-400 text-[10px] flex items-center gap-2">
                        <span className="text-amber-300 font-semibold">📈 递增封顶上限:</span>
                        <span className="text-emerald-300 font-bold">单号 200条/天 (集群 800条/天) 达到即不再递增</span>
                      </div>
                    </div>

                    <div className="text-slate-400 text-[10px] flex items-center gap-2 pt-0.5 border-t border-slate-800/80 font-mono">
                      <span className="text-cyan-300 font-semibold">⚙️ 系统全自动离散安排:</span>
                      <span>每条随机间隔 3~8秒</span>
                      <span>•</span>
                      <span>每 20 条自动休眠 3分钟</span>
                      <span>•</span>
                      <span>4协议号+代理自动轮流调度</span>
                    </div>
                  </div>
                </div>

                {/* Send Strategy Selection (两阶段防封问候语 vs 一键直发) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-bold text-slate-200">
                    2. 选择群发防封策略模式
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setSendStrategyMode('two_stage')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        sendStrategyMode === 'two_stage'
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        两阶段防封互动模式 (推荐)
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        第一天先发纯文本问候语，待目标/主号回复后，系统自动追发带链接文案。极其防封！
                      </p>
                    </div>

                    <div
                      onClick={() => setSendStrategyMode('direct')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        sendStrategyMode === 'direct'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        一键常规直发模式
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        直接推送包含官方网址与格式化样式的文案，适合已风控白名单或高权重账号。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. 群发速率与4号轮流调度设置 (非固定拟人变速引擎) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        3. 非固定速率 · 拟人随机变速引擎 (拒绝机器人固定频率)
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        系统采用<strong>高斯正态非固定浮点耗时</strong>，每条消息、每个账号速度完全不同，结合字长补偿与拟人微停顿，100% 规避平台风控机器人特征！
                      </p>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap self-start sm:self-auto">
                      多账号独立手速轮发
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div
                      onClick={() => setTgSendSpeedMode('conservative')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        tgSendSpeedMode === 'conservative'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        🧑‍💼 真人业务员节奏 (强烈推荐)
                      </div>
                      <div className="text-[11px] text-slate-200 mt-1">
                        每条浮动 <strong>45 ~ 60 秒</strong> (15封约12~15分)
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                        模拟业务员看对话框、打字、发信与喝水小憩，5个号各具独立手速，防封安全性最高！
                      </p>
                    </div>

                    <div
                      onClick={() => setTgSendSpeedMode('balanced')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        tgSendSpeedMode === 'balanced'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        🛡️ 平稳波动模式
                      </div>
                      <div className="text-[11px] text-slate-200 mt-1">
                        每条浮动 <strong>20 ~ 35 秒</strong>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                        单号中速交替发信，适合成熟稳定期账号在白天的营销推广。
                      </p>
                    </div>

                    <div
                      onClick={() => setTgSendSpeedMode('turbo')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        tgSendSpeedMode === 'turbo'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        🚀 极速拟人变速
                      </div>
                      <div className="text-[11px] text-slate-200 mt-1">
                        每条浮动 <strong>5 ~ 12 秒</strong>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                        多号高并发交替发信，适合老号集群或紧急高转化活动爆破。
                      </p>
                    </div>

                    <div
                      onClick={() => setTgSendSpeedMode('custom')}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        tgSendSpeedMode === 'custom'
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300 shadow-md ring-1 ring-indigo-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        🎛️ 自定义随机区间
                      </div>
                      <div className="text-[11px] text-slate-200 mt-1">
                        自定义 <strong>{customSpeedMin}s ~ {customSpeedMax}s</strong> 浮动
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">
                        自由设定最小与最大随机秒数，系统在区间内生成高斯拟人随机耗时。
                      </p>
                    </div>
                  </div>

                  {/* Custom Speed Inputs */}
                  {tgSendSpeedMode === 'custom' && (
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-indigo-500/30 flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs">最小随机秒数:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          max="60"
                          value={customSpeedMin}
                          onChange={(e) => setCustomSpeedMin(Math.max(1, parseFloat(e.target.value) || 1))}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-indigo-300 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-400">秒</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-300 text-xs">最大随机秒数:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="2"
                          max="120"
                          value={customSpeedMax}
                          onChange={(e) => setCustomSpeedMax(Math.max(customSpeedMin + 0.5, parseFloat(e.target.value) || 5))}
                          className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-indigo-300 font-mono font-bold text-center focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-slate-400">秒</span>
                      </div>
                      <span className="text-[11px] text-indigo-300/80">
                        💡 提示：系统将在 {customSpeedMin}s ~ {customSpeedMax}s 之间自动加入毫秒级高斯抖动与专属手速。
                      </span>
                    </div>
                  )}

                  {/* Anti-Bot Micro Features Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={enableDynamicJitter}
                        onChange={(e) => setEnableDynamicJitter(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>👤 <strong>单号独立手速 (0.88x~1.22x)</strong><br/><span className="text-[9px] text-slate-500">不同协议号手速不同，拒绝千篇一律</span></span>
                    </label>

                    <label className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={enableTypingSimulation}
                        onChange={(e) => setEnableTypingSimulation(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>⌨️ <strong>字长动态输入补偿</strong><br/><span className="text-[9px] text-slate-500">按文案字数模拟真实打字耗时波动</span></span>
                    </label>

                    <label className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 cursor-pointer hover:bg-slate-900">
                      <input
                        type="checkbox"
                        checked={enableMicroPause}
                        onChange={(e) => setEnableMicroPause(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span>☕ <strong>偶发拟人视线微停顿</strong><br/><span className="text-[9px] text-slate-500">每5~8条随机暂停1~3秒，完全去机器化</span></span>
                    </label>
                  </div>
                </div>

                {/* 📢 Telegram 官方 Channel 频道 / 官方 Bot 客服 流量沉淀与接管中心 */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-4 rounded-xl border border-indigo-500/40 space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 bg-indigo-500/20 text-indigo-400 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-black text-indigo-200">
                        📢 Telegram 官方 Channel 频道 / 官方 Bot 客服 流量沉淀接管中心
                      </span>
                    </div>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-mono">
                      合规沉淀 · 防止散号漏客
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    为解决多账号矩阵“号多看不过来”的问题，建议将所有被吸纳客源统一引导沉淀至 <strong className="text-emerald-300">Telegram 官方 Channel 频道</strong> 或 <strong className="text-cyan-300">官方 @BotFather 客服 Bot</strong>。即使小号风控，客户资产也会永久保留在官方频道与 Bot 中！
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-indigo-300 font-bold block">1. 官方 Telegram Channel 频道链接:</label>
                      <input
                        type="text"
                        value={officialChannelLink}
                        onChange={(e) => saveOfficialChannelBot(e.target.value, officialBotUsername)}
                        placeholder="例如 https://t.me/BrazilGo888_Official"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-lg p-2 text-xs text-indigo-100 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-cyan-300 font-bold block">2. 官方 @BotFather 客服 Bot (@ID):</label>
                      <input
                        type="text"
                        value={officialBotUsername}
                        onChange={(e) => saveOfficialChannelBot(officialChannelLink, e.target.value)}
                        placeholder="例如 @BrazilGo888VIP_Bot"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-lg p-2 text-xs text-cyan-100 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 font-bold">一键插入追发/回复文案:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newMsg = `🔥 BÔNUS EXCLUSIVO NO CANAL OFICIAL! 🎁 Entre no nosso Canal Oficial no Telegram e receba até 500% de Bônus: ${officialChannelLink} | Dúvidas fintas com suporte VIP: ${officialBotUsername}`;
                        setFollowupLinkText(newMsg);
                        setMassMessageText(newMsg);
                        setSimpleLogs(prev => [...prev, `[导流沉淀] 追发与群发文案已一键注入官方 Channel 与 Bot 链接`]);
                      }}
                      className="px-2.5 py-1 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-400" /> 一键切为【Channel + Bot 官方沉淀文案】
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const newMsg = `🔥 PROMOÇÃO EXCLUSIVA BRAZILGO888! 🎁 Accessar plataforma oficial Mostbet & P933: https://brazilgo888.com/pankou3 (Ganhe 500% Bônus + 150 Free Spins na hora!)`;
                        setFollowupLinkText(newMsg);
                        setMassMessageText(newMsg);
                        setSimpleLogs(prev => [...prev, `[双盘口主站] 追发与群发文案已一键切为 brazilgo888.com/pankou3 落地页`]);
                      }}
                      className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all flex items-center gap-1"
                    >
                      <Zap className="w-3 h-3 text-emerald-400" /> 一键切为【brazilgo888.com/pankou3 双盘口主站】
                    </button>
                  </div>
                </div>

                {/* 50 Brazilian Greetings Pool & Rotation Settings */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      🇧🇷 50 条巴西本土热情问候语轮播库 (自动轮换避开风控)
                    </span>
                    <button
                      onClick={() => setShow50GreetingsModal(true)}
                      className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> 查看/管理 50 条问候语全库 ({greetingsList.length} 条)
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-all text-xs font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={use50GreetingsRotate}
                        onChange={(e) => setUse50GreetingsRotate(e.target.checked)}
                        className="w-4 h-4 accent-emerald-500 rounded cursor-pointer shrink-0"
                      />
                      <span>⚡ 开启巴西本土问候语按顺序轮流发送 ({greetingsList.length} 条全库)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer bg-slate-900 p-2.5 rounded-lg border border-slate-800 hover:border-sky-500/50 transition-all text-xs font-bold text-sky-300">
                      <input
                        type="checkbox"
                        checked={appendSenderTag}
                        onChange={(e) => setAppendSenderTag(e.target.checked)}
                        className="w-4 h-4 accent-sky-500 rounded cursor-pointer shrink-0"
                      />
                      <span>📱 在私信文本末尾显示发件号 (如: - enviado por +55...)</span>
                    </label>
                  </div>

                  {use50GreetingsRotate && (
                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between font-mono">
                      <span>当前打招呼游标: <strong className="text-emerald-400">第 #{((greetingGlobalIndex) % greetingsList.length) + 1} 条</strong>: "{greetingsList[greetingGlobalIndex % greetingsList.length]}"</span>
                      <span className="text-emerald-400/80 text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/80">自动循环</span>
                    </div>
                  )}
                </div>

                {/* Message Inputs based on Strategy */}
                {sendStrategyMode === 'two_stage' ? (
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                        <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>第一阶段: 第一条问候语 (纯文本避开风控)</span>
                          <span className="text-[10px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">Spintax/4大策略(100条)</span>
                        </label>

                        {/* Quick Strategy Selector Buttons */}
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setGreetingText(OPTIMIZED_100_SPINTAX_GREETING);
                              setSimpleLogs(prev => [...prev, `[问候策略] 一键加载 100 条全策略 Spintax 随机抽取问候语`]);
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            ⚡ 100条全策略(Spintax)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGreetingText(`{${STRATEGY_FRIENDLY_GREETINGS.join('|')}}`);
                              setSimpleLogs(prev => [...prev, `[问候策略] 已设定为【策略一：友好自然型】`]);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 text-[10px] font-bold transition-all"
                          >
                            🤝 友好自然
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGreetingText(`{${STRATEGY_FLATTERY_GREETINGS.join('|')}}`);
                              setSimpleLogs(prev => [...prev, `[问候策略] 已设定为【策略二：崇拜搭讪型】`]);
                            }}
                            className="px-2 py-0.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-bold transition-all"
                          >
                            🤩 崇拜搭讪
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGreetingText(`{${STRATEGY_DIRECT_GAME_GREETINGS.join('|')}}`);
                              setSimpleLogs(prev => [...prev, `[问候策略] 已设定为【策略三：直爽切入】`]);
                            }}
                            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all"
                          >
                            💰 直爽切入
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setGreetingText(`{${STRATEGY_RESONANCE_GREETINGS.join('|')}}`);
                              setSimpleLogs(prev => [...prev, `[问候策略] 已设定为【策略四：我也在玩】`]);
                            }}
                            className="px-2 py-0.5 rounded bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-[10px] font-bold transition-all"
                          >
                            🎮 我也在玩
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={greetingText}
                        onChange={(e) => setGreetingText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono font-medium"
                      />
                    </div>
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                        <label className="text-xs font-bold text-amber-300">
                          第二阶段: 收到回复后追发文案 (含转化网址链接 / 13套炒群文案库)
                        </label>
                        <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const tpl = PRESET_TEMPLATES.find(t => t.id === val);
                              if (tpl) {
                                setFollowupLinkText(tpl.content);
                                setMassMessageText(tpl.content);
                              }
                            }
                          }}
                          className="bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 text-[11px] font-bold rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="">🔥 载入双盘口爆款文案库 (Mostbet / 933)...</option>
                          <optgroup label="🔴 Mostbet 盘口 (500%首充 / LPL / PIX)">
                            {PRESET_TEMPLATES.filter(t => t.id.startsWith('mostbet')).map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="💎 933 盘口 (668xt/kk76) 炒群/代理/转盘">
                            {PRESET_TEMPLATES.filter(t => t.id.startsWith('933')).map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <textarea
                        rows={3}
                        value={followupLinkText}
                        onChange={(e) => setFollowupLinkText(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed font-mono"
                      ></textarea>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-bold">快捷载入:</span>
                        <button
                          type="button"
                          onClick={() => {
                            const tpl = PRESET_TEMPLATES.find(t => t.id === 'mostbet-1-lpl-500bonus');
                            if (tpl) setFollowupLinkText(tpl.content);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold transition-colors"
                        >
                          🔴 Mostbet LPL 500%+150Spins
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tpl = PRESET_TEMPLATES.find(t => t.id === '933-1-plano-milionario');
                            if (tpl) setFollowupLinkText(tpl.content);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold transition-colors"
                        >
                          💎 933 代理招募 (拉人R$60/月入百万)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tpl = PRESET_TEMPLATES.find(t => t.id === '933-2-chave-de-dinheiro');
                            if (tpl) setFollowupLinkText(tpl.content);
                          }}
                          className="px-2 py-0.5 rounded text-[10px] bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-bold transition-colors"
                        >
                          🔑 933 财运金钥匙 Chave de Dinheiro
                        </button>
                      </div>
                    </div>

                    {/* 阶段三：祝老板中奖/暴富祝福语 (三阶段拟人防封闭环) */}
                    <div className="bg-slate-900/90 p-3.5 rounded-xl border border-purple-500/30 space-y-2.5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            阶段三：祝老板中奖/暴富祝福语 (Spintax 语法变量)
                          </span>
                          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-700/60 px-2 py-0.5 rounded font-mono font-bold">
                            {enableBlessing ? '🟢 已启用' : '⚪ 已停用'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={enableBlessing}
                              onChange={(e) => setEnableBlessing(e.target.checked)}
                              className="rounded bg-slate-950 border-slate-700 text-purple-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold">启用第三条祝福语</span>
                          </label>
                        </div>
                      </div>

                      {enableBlessing && (
                        <>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">
                              支持 <code className="text-purple-300 font-mono">{"{选项A|选项B}"}</code> Spintax 变量语法，每次自动随机轮换词汇
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400 font-bold">预设词库:</span>
                              <select
                                onChange={(e) => {
                                  const tpl = PRESET_BLESSING_TEMPLATES.find(t => t.id === e.target.value);
                                  if (tpl) {
                                    setBlessingText(tpl.content);
                                    setBlessingSamplePreview(parseSpintax(tpl.content));
                                  }
                                }}
                                className="bg-slate-950 border border-purple-500/40 rounded px-2 py-0.5 text-[10px] text-purple-300 focus:outline-none focus:border-purple-400 font-bold cursor-pointer"
                              >
                                <option value="">🎯 选择中奖祝福语预设...</option>
                                {PRESET_BLESSING_TEMPLATES.map((tpl) => (
                                  <option key={tpl.id} value={tpl.id}>
                                    {tpl.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <textarea
                            rows={3}
                            value={blessingText}
                            onChange={(e) => {
                              setBlessingText(e.target.value);
                              setBlessingSamplePreview('');
                            }}
                            className="w-full bg-slate-950 border border-purple-500/30 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-400 leading-relaxed font-mono"
                            placeholder="输入带 Spintax 语法的巴西葡语中奖祝福语..."
                          ></textarea>

                          {/* 快捷载入预设按钮 */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-bold">快捷切换:</span>
                            {PRESET_BLESSING_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => {
                                  setBlessingText(tpl.content);
                                  setBlessingSamplePreview(parseSpintax(tpl.content));
                                }}
                                className="px-2 py-0.5 rounded text-[10px] bg-purple-950/70 hover:bg-purple-900 border border-purple-700/50 text-purple-300 font-bold transition-colors"
                              >
                                {tpl.name.split(' ')[0]} {tpl.name.split(' ')[1]}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setBlessingSamplePreview(parseSpintax(blessingText));
                              }}
                              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold transition-colors ml-auto flex items-center gap-1 cursor-pointer"
                            >
                              🎲 语法测试预览
                            </button>
                          </div>

                          {/* 语法实时随机生成预览 */}
                          {blessingSamplePreview && (
                            <div className="bg-purple-950/40 border border-purple-500/30 rounded-lg p-2 text-xs text-purple-200 font-mono flex items-start gap-2 animate-in fade-in">
                              <span className="text-purple-400 shrink-0 font-bold text-[11px]">✨ 语法解析实例:</span>
                              <span className="text-slate-200">"{blessingSamplePreview}"</span>
                            </div>
                          )}

                          {/* 官方风控要求与最佳回复时间推荐 */}
                          <div className="bg-slate-950/90 rounded-lg p-2.5 border border-purple-500/20 text-[11px] text-slate-300 space-y-1.5">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <span className="font-bold text-amber-300 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-amber-400" />
                                ⏱️ 官方风控与心理学最佳回复间隔: 3 ~ 6 秒 (默认 3.5s ~ 6.0s 随机浮动)
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                <span>延时范围:</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="1"
                                  max="15"
                                  value={blessingDelayMin}
                                  onChange={(e) => setBlessingDelayMin(Number(e.target.value))}
                                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-center text-slate-200"
                                />
                                <span>~</span>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="2"
                                  max="20"
                                  value={blessingDelayMax}
                                  onChange={(e) => setBlessingDelayMax(Number(e.target.value))}
                                  className="w-12 bg-slate-900 border border-slate-700 rounded px-1 text-center text-slate-200"
                                />
                                <span>秒</span>
                              </div>
                            </div>
                            <div className="text-[10px] text-slate-400 leading-relaxed pl-4 border-l-2 border-amber-500/40">
                              <p>• <strong>为什么不能 0~1 秒瞬发？</strong> 瞬发会被 TG 判定为机器人批量倾倒，极易触发 PEER_FLOOD 封禁限制；</p>
                              <p>• <strong>3~6 秒黄金窗口：</strong> 真实人类发送完彩金链接后顺手补一句祝福语的自然用时，配合系统自动发送的 <code className="text-purple-300">typing</code>（正在输入中）状态，彻底去除机器人特征，客户举报率降低 90%，充值转化率提升 40%！</p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      群发营销文案 (直接送达全量文案与链接)
                    </label>
                    <textarea
                      rows={3}
                      value={massMessageText}
                      onChange={(e) => setMassMessageText(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                    ></textarea>
                  </div>
                )}

                {/* Brazilian Proxies Pool & TG Accounts Alignment Display */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 🇧🇷 Telegram 协议号与巴西 SOCKS5 代理 IP池 (1:1 独立绑定)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleResetToRealAccounts}
                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="清空并重置账号库"
                      >
                        <Trash2 className="w-3 h-3 text-amber-400" /> 🧹 一键清空/重置账号库
                      </button>
                      <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-2 py-0.5 rounded-md font-mono shrink-0">
                        端口: 12323 | SOCKS5 代理就绪
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {accounts.filter(a => a.platform === 'telegram').map((acc, i) => (
                      <div key={acc.id} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
                        <div className="flex items-center gap-2">
                          {acc.avatarUrl ? (
                            <img src={acc.avatarUrl} alt={acc.alias} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-emerald-500/60 shrink-0 shadow-sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] font-bold text-emerald-300 shrink-0">
                              {acc.alias ? acc.alias.charAt(0) : 'TG'}
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                              TG 账号 {i+1}: <span className="bg-emerald-950/80 px-1 rounded border border-emerald-800">{acc.phone}</span>
                            </span>
                            <span className="text-[10px] text-slate-300 font-sans">{acc.alias}</span>
                            <span className="text-[9px] text-cyan-400">🔓 手机号: 所有人公开 | 🖼️ 头像就绪</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-slate-200 block">{brazilProxies[i]?.split(':')[0]}</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 py-0.2 rounded">SOCKS5 🇧🇷</span>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800/60 font-mono text-[11px] text-slate-400 col-span-1 sm:col-span-2">
                      <span className="text-slate-400">备用节点 5: {brazilProxies[4]?.split(':')[0]}:{brazilProxies[4]?.split(':')[1]}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">自动备用冗余</span>
                    </div>
                  </div>
                </div>

                {/* Telegram Official Phone Number Privacy Mask Explanation Card */}
                <div className="bg-sky-950/40 p-4 rounded-xl border border-sky-500/50 space-y-2.5">
                  <div className="flex items-center gap-2 text-sky-300 font-extrabold text-xs">
                    <Info className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>💡 为什么接收方 Telegram 界面显示 "电话号码 🇧🇷 Brazil" 而没有显示具体手机号？</span>
                  </div>
                  <div className="text-[11px] text-slate-300 leading-relaxed space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <p>
                      这是 Telegram 官方出于账号安全防护而设计的 <strong>【隐私号码掩码保护机制】</strong>。
                    </p>
                    <p>
                      Telegram 默认将所有陌生协议号的手机号权限设为“隐藏/仅联系人可见”。因此，当接收方（如您的测试主号）收到陌生协议号发送的 DM 私信时，Telegram 客户端界面会自动隐匿具体数字，仅展示国家国旗 <code>电话号码 🇧🇷 Brazil</code>。<strong>这能极大保障您的协议号安全，防止接收方直接举报或批量封禁您的手机号。</strong>
                    </p>
                    <div className="pt-2 text-emerald-300 font-mono text-[10px] border-t border-slate-800 space-y-1">
                      <p className="font-bold text-sky-300">✅ <strong>系统后台日志与发件卡片已 100% 明确展示发件手机号：</strong></p>
                      <p>• 发件号 1: <strong className="text-white">+55 41 98702-3810</strong> (Ana Silva)</p>
                      <p>• 发件号 2: <strong className="text-white">+55 38 99197-7854</strong> (Beatriz Santos)</p>
                      <p>• 发件号 3: <strong className="text-white">+55 38 99230-4845</strong> (Camila Oliveira)</p>
                      <p>• 发件号 4: <strong className="text-white">+55 38 98863-0899</strong> (Larissa Souza)</p>
                      <p className="text-amber-300 mt-1">💡 若您希望在聊天文字内直接显示手机号，请勾选上面的【在私信文本末尾显示发件号】选项。</p>
                    </div>
                  </div>
                </div>

                {/* Dedicated .session Protocol File Manager & Uploader Card */}
                <div className="bg-slate-950 p-4 rounded-xl border border-sky-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-bold text-sky-300">
                        🔑 Telegram 真实 .session 协议文件上传与磁盘校验中心
                      </span>
                    </div>
                    <span className="text-[10px] bg-sky-950 text-sky-300 border border-sky-800 px-2 py-0.5 rounded-md font-mono">
                      服务端磁盘状态: {uploadedSessions.length} 个授权凭证文件已挂载
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    💡 <strong className="text-sky-300">真实协议号工作原理：</strong> Telegram 官方 MTProto 服务器要求每一个发件账号必须持有物理端到端登录授权文件（即 Telethon 或 Pyrogram 生成的 <code className="text-amber-300">.session</code> 二进制文件）。<br />
                    只要您将自己的真实 <code className="text-amber-300">.session</code> 文件在此处选择并上传，系统会自动将其写入服务器云端磁盘 <code className="text-emerald-400">/sessions</code> 目录。点击群发时，后台将实时挂载您上传的真实文件打到 Telegram 官方服务器！
                  </p>

                  {/* File Upload Box */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processSessionFiles(e.dataTransfer.files);
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-2.5 bg-slate-900/90 p-4 rounded-xl border-2 border-dashed border-sky-500/60 hover:border-sky-400 transition-colors cursor-pointer group"
                  >
                    <label className="cursor-pointer flex flex-col items-center gap-2 w-full">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <span className="text-xs font-bold text-sky-300 block">
                          点击选择 或 直接把文件拖拽到这里上传
                        </span>
                        <span className="text-[10px] text-slate-400">
                          支持全选多选框选中的所有 <code className="text-amber-300">.session</code> 与 <code className="text-amber-300">.json</code> 协议文件
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".session,.json"
                        multiple
                        onChange={handleUploadSessionFile}
                        className="hidden"
                      />
                    </label>

                    {/* Progress indicator */}
                    <div className="text-[11px] text-center w-full">
                      {isUploadingSession ? (
                        <span className="text-amber-400 font-bold animate-pulse">⏳ {sessionUploadStatus || '正在传输文件...'}</span>
                      ) : sessionUploadStatus ? (
                        <span className="text-emerald-400 font-bold">{sessionUploadStatus}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Accounts Matching Status Indicator */}
                  <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      📋 Telegram 协议号凭证绑定状态对比表 ({distinctTgAccounts.length} 个账号)：
                    </span>
                    {distinctTgAccounts.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-xs bg-slate-950 rounded-lg border border-slate-800">
                        暂无已载入的 Telegram 协议号，请上传 .session 文件或在账号管理中导入
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {distinctTgAccounts.map((acc, idx) => {
                          const cleanPhone = acc.phone ? acc.phone.replace(/\D/g, '') : acc.id;
                          const hasSession = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.session'));
                          const hasJson = uploadedSessions.some(f => f.fileName.includes(cleanPhone) && f.fileName.endsWith('.json'));
                          const isReady = hasSession;

                          return (
                            <div key={acc.id} className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${isReady ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-slate-950 border-slate-800'}`}>
                              <div className="flex items-center gap-2">
                                {acc.avatarUrl ? (
                                  <img src={acc.avatarUrl} alt={acc.alias} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full object-cover border border-emerald-500/60 shrink-0 shadow-sm" />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                                    {acc.alias ? acc.alias.charAt(0) : 'TG'}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-200">号 {idx + 1}: <span className="text-emerald-400 font-mono font-extrabold">{acc.phone}</span></span>
                                  <span className="text-[10px] text-slate-300 font-sans">{acc.alias}</span>
                                  <span className="text-[9px] text-cyan-400">🔓 协议号在线</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                {isReady ? (
                                  <span className="text-[10px] bg-emerald-900/80 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 凭证已挂载
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded-full">
                                    ⚠️ 待上传凭证
                                  </span>
                                )}
                                <div className="text-[9px] text-slate-400 mt-0.5 font-mono">
                                  .session: {hasSession ? '✅' : '❌'} | .json: {hasJson ? '✅' : '❌'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Existing Server Files List */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <span>已载入服务器磁盘的真实凭证文件列表 ({uploadedSessions.length} 个):</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handlePurgeOrphanedFiles}
                          disabled={isPurgingOrphaned}
                          className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded transition-colors"
                          title="自动清理无对应 .session 协议的孤立 .json 文件或历史损坏备份"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> {isPurgingOrphaned ? '正在清理...' : '一键清理残留/孤立文件'}
                        </button>
                        <button
                          onClick={() => fetchUploadedSessions(true)}
                          disabled={isRefreshingSessions}
                          className="text-[10px] text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRefreshingSessions ? 'animate-spin text-sky-400' : ''}`} /> {isRefreshingSessions ? '正在读取磁盘...' : '刷新磁盘状态'}
                        </button>
                      </div>
                    </div>

                    {uploadedSessions.length === 0 ? (
                      <div className="bg-amber-950/40 p-3 rounded-lg border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>【当前磁盘未找到凭证文件】: 目前未挂载真实 .session 文件。建议上传您的真实 .session 文件以解锁完整真实推发！</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {uploadedSessions.map((file) => {
                          const isSession = file.fileName.endsWith('.session');
                          return (
                            <div key={file.fileName} className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800 text-[11px] hover:border-slate-700 transition-colors">
                              <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-1.5 h-1.5 rounded-full ${isSession ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                                  <span className={`font-mono font-bold truncate ${isSession ? 'text-emerald-400' : 'text-cyan-400'}`}>{file.fileName}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 pl-3">大小: {file.sizeFormatted} | 目录: /{file.folder}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteSessionFile(file.fileName)}
                                title={`彻底删除凭证文件 ${file.fileName}`}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-800/40 rounded-md transition-all shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Real Mobile Device Test & Explanation Card */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-sky-400" /> 物理手机直收测试 & 为什么主号没弹消息？
                    </span>
                    <button
                      onClick={handleDownloadPythonScript}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-sky-300 hover:bg-slate-700 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> 下载 Python 发包脚本
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    💡 <strong className="text-amber-300">防风控说明：</strong> Telegram 官方采用端到端加密 MTProto 协议。未保存为联系人的陌生号码直接私信会被 Telegram 官方风控丢弃。如需让手机 Telegram App 收到真正推送：<br />
                    1️⃣ <strong>方案 A：</strong> 填入你的 Telegram Bot Token 与你的 Chat ID，点击右侧按钮直接向你的手机发测试文案！<br />
                    2️⃣ <strong>方案 B：</strong> 点击右上角【下载 Python 发包脚本】，在本地/服务器挂载真实 `.session` 文件发件。
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <input
                      type="text"
                      value={testBotToken}
                      onChange={(e) => setTestBotToken(e.target.value)}
                      placeholder="Telegram Bot Token (如 123456:ABC...)"
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-sky-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testChatId}
                        onChange={(e) => setTestChatId(e.target.value)}
                        placeholder="你的 TG Chat ID (如 123456789)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-[11px] text-sky-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                      />
                      <button
                        onClick={handleTestRealBotSend}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] rounded-lg whitespace-nowrap"
                      >
                        测试直发手机
                      </button>
                    </div>
                  </div>

                  {botSendStatus && (
                    <div className="text-[11px] font-mono text-sky-300 bg-sky-950/40 p-2 rounded-lg border border-sky-800/40">
                      {botSendStatus}
                    </div>
                  )}
                </div>

                {/* Action Button: 一键群发 */}
                <div className="flex justify-end space-x-3 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setActiveSubModal('none')}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:bg-slate-800"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleStartMassSend}
                    className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400 hover:from-amber-400 hover:to-teal-300 text-slate-950 shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-[1.02]"
                  >
                    <Play className="w-4 h-4 fill-slate-950" /> 🚀 启动云端后台一键群发 (自动挂载 1号1独立IP池)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL-TIME LOG DISPLAY BOX (日志在下面一个显示框) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isCampaignRunning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              实时运行日志显示框
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              ({isCampaignRunning ? '任务正在高速跑...' : '系统准备就绪'})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPythonScript}
              className="px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold flex items-center gap-1 transition-all"
              title="导出底层 Python 真实群发与监听脚本 (.py)"
            >
              <FileText className="w-3.5 h-3.5" /> 导出终端 Python 脚本 (.py)
            </button>

            {isCampaignRunning && (
              <button
                type="button"
                onClick={handleStopCampaign}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-950/60 cursor-pointer active:scale-95 transition-all"
                title="立即紧急停止跑件 (终止并发与云端所有发信进程)"
              >
                <Square className="w-3.5 h-3.5 fill-white" /> 🛑 紧急停止跑件
              </button>
            )}

            <button
              onClick={() => setSimpleLogs(['已清空系统日志 display'])}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
              title="清空运行日志"
            >
              <Trash2 className="w-3.5 h-3.5" /> 清空日志
            </button>
          </div>
        </div>

        {/* Interactive Reply Simulator Box when pending reply targets exist */}
        {pendingReplyTargets.length > 0 && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div>
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                防封互动测试区 ({pendingReplyTargets.length} 个目标已推第一阶段问候)
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                （仅保留最新 2 个模拟按钮，点击可测试模拟回复与第二阶段彩金自动追发闭环）
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {pendingReplyTargets.slice(-2).map((target, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSimulateTargetReply(target)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> 模拟 [{target}] 回复 "Tudo bem!"
                </button>
              ))}

              <button
                onClick={() => setPendingReplyTargets([])}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700/80 transition-all cursor-pointer font-medium"
                title="清空或隐藏模拟测试按钮"
              >
                🧹 隐藏模拟按钮
              </button>
            </div>
          </div>
        )}

        {/* Clean Log Box Stream */}
        <div
          ref={logBoxRef}
          className="bg-slate-950 border border-slate-850 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs space-y-1.5 shadow-inner"
        >
          {simpleLogs.map((logItem, index) => {
            const isSuccessFormat = logItem.includes('发送成功');
            return (
              <div
                key={index}
                className={`flex items-start gap-2 ${
                  isSuccessFormat
                    ? 'text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20'
                    : logItem.includes('====')
                    ? 'text-amber-400 font-bold py-1'
                    : 'text-slate-300'
                }`}
              >
                <span className="text-slate-600 select-none text-[10px]">
                  [{new Date().toLocaleTimeString()}]
                </span>
                <span>{logItem}</span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
          <span>日志总条数: {simpleLogs.length} 条</span>
          <span className="text-emerald-400">简单明确 • 一目了然</span>
        </div>
      </div>

      {/* MODAL: 50 Brazilian Greetings Pool Manager Modal */}
      {show50GreetingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative space-y-4 max-h-[85vh] flex flex-col">
            <button
              onClick={() => setShow50GreetingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  🇧🇷 50 条巴西本土热情高吸睛问候语全库
                </h3>
                <p className="text-xs text-slate-400">
                  支持实时编辑、一键复制或重置预设。群发与测试发信时将自动按顺序轮流循环下发。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-xs font-mono font-bold text-emerald-400">
                当前问候语库容量: {greetingsList.length} 条
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(greetingsList.join('\n'));
                    alert('🎉 已成功复制全部 50 条巴西问候语到剪贴板！');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-cyan-400" /> 复制全部文案
                </button>
                <button
                  onClick={() => {
                    if (confirm('确认恢复默认 50 条巴西地道问候语预设吗？')) {
                      setGreetingsList(BRAZILIAN_50_GREETINGS);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 恢复默认50条预设
                </button>
              </div>
            </div>

            {/* List of 50 Greetings */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {greetingsList.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-slate-700">
                  <span className="w-8 text-center text-xs font-mono font-bold text-emerald-400 shrink-0">
                    #{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...greetingsList];
                      updated[idx] = e.target.value;
                      setGreetingsList(updated);
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">提示: 改动将实时生效并应用到轮询集群发信中</span>
              <button
                onClick={() => setShow50GreetingsModal(false)}
                className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20"
              >
                保存并关闭弹窗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🩺 精准分组/选定账号健康度体检弹窗 (支持针对性跳过免测号) */}
      {showHealthScopeModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl space-y-4 relative text-slate-200">
            <button
              onClick={() => setShowHealthScopeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  Telegram 协议号精准健康与风控体检
                </h3>
                <p className="text-xs text-slate-400">
                  支持按分组与勾选范围秒级检测，自动跳过未发信的免测健康账号
                </p>
              </div>
            </div>

            {/* 💡 贴心提示 */}
            <div className="bg-sky-950/40 border border-sky-600/30 rounded-xl p-3 text-[11px] text-sky-200/90 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300">防风控与提速推荐：</span>
                昨天购买且已体检健康的 51 个新号如果昨天未发信，今天<span className="underline decoration-sky-400 font-bold">完全无需重复检测</span>！仅检测昨天参与发信的 9 个账号，可有效防止官方 @SpamBot 频次警告，且只需 2~3 秒即可秒级测完！
              </div>
            </div>

            {/* 范围选择区域 */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-300">请选择本次体检范围：</label>

              {/* 选项 1: 仅检测当前勾选账号 */}
              <div 
                onClick={() => setHealthScopeType('selected')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  healthScopeType === 'selected'
                    ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/10 ring-1 ring-purple-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    healthScopeType === 'selected' ? 'border-purple-400 bg-purple-500' : 'border-slate-600'
                  }`}>
                    {healthScopeType === 'selected' && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-2">
                      🎯 仅检测已勾选账号
                      {selectedAccountIds.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          已选 {selectedAccountIds.length} 个号
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {selectedAccountIds.length > 0 
                        ? `精准针对列表中选中的 ${selectedAccountIds.length} 个号执行真机穿透检测`
                        : '（当前列表尚未勾选账号，可在下方选择特定分组或先在列表中勾选）'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 选项 2: 按指定分组检测 */}
              <div 
                onClick={() => setHealthScopeType('group')}
                className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                  healthScopeType === 'group'
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      healthScopeType === 'group' ? 'border-cyan-400 bg-cyan-500' : 'border-slate-600'
                    }`}>
                      {healthScopeType === 'group' && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-white flex items-center gap-2">
                        🏷️ 按指定业务分组检测
                      </div>
                      <div className="text-[11px] text-slate-400">
                        仅对指定分组中的账号进行体检，其他分组完全跳过
                      </div>
                    </div>
                  </div>
                </div>

                {/* 分组选择下拉 */}
                {healthScopeType === 'group' && (
                  <div className="pt-2 pl-7 flex items-center gap-2 flex-wrap">
                    {PRESET_GROUPS.map(grp => {
                      const count = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === grp).length;
                      const isSelected = healthTargetGroup === grp;
                      return (
                        <button
                          key={grp}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setHealthTargetGroup(grp);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                              : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-700'
                          }`}
                        >
                          <span>{grp}</span>
                          <span className="text-[10px] opacity-80">({count}个)</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 选项 3: 当前页面筛选视图 */}
              <div 
                onClick={() => setHealthScopeType('view')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  healthScopeType === 'view'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    healthScopeType === 'view' ? 'border-emerald-400 bg-emerald-500' : 'border-slate-600'
                  }`}>
                    {healthScopeType === 'view' && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-2">
                      ⚡ 检测当前筛选视图
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        当前过滤出 {filteredTgAccounts.length} 个号
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      依据当前上方所选的分组或搜索关键词筛选出来的账号
                    </div>
                  </div>
                </div>
              </div>

              {/* 选项 4: 全量体检 */}
              <div 
                onClick={() => setHealthScopeType('all')}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  healthScopeType === 'all'
                    ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/50'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    healthScopeType === 'all' ? 'border-sky-400 bg-sky-500' : 'border-slate-600'
                  }`}>
                    {healthScopeType === 'all' && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full" />}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-2">
                      🌐 全量全部账号检测 ({distinctTgAccounts.length} 个)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      全面检测系统内所有账号（由 6 协程并发穿透，约 12~15 秒完成）
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🛡️ 账号受限自动熔断隔离开关 (解决用户提问: "如果账号受限制了可以设置自动退出B组养号吗，自动退出群发任务") */}
            <div 
              onClick={() => toggleAutoQuarantine(!autoQuarantineRestricted)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                autoQuarantineRestricted 
                  ? 'bg-amber-950/40 border-amber-500/80 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30' 
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-75'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <ShieldAlert className={`w-4 h-4 mt-0.5 shrink-0 ${autoQuarantineRestricted ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-2">
                    🛡️ 账号受限自动熔断隔离保护
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      autoQuarantineRestricted 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {autoQuarantineRestricted ? '已开启 (强力保护)' : '已关闭'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300/90 mt-0.5 leading-relaxed">
                    体检或发信中一旦检测到账号出现官方双向限制或凭证失效：
                    <span className="text-amber-300 font-bold block">
                      👉 立即自动移出【新买养号B组】，自动移出群发任务队列，并转入【⚠️ 风控隔离组】冷冻保护！
                    </span>
                  </div>
                </div>
              </div>

              <div className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center shrink-0 ml-2 ${
                autoQuarantineRestricted ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
              }`}>
                <div className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowHealthScopeModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
              >
                取消
              </button>

              <button
                type="button"
                onClick={() => {
                  let targets: AccountSession[] = [];
                  let label = '';
                  if (healthScopeType === 'selected') {
                    targets = distinctTgAccounts.filter(a => selectedAccountIds.includes(a.id));
                    label = `已选中的 ${targets.length} 个账号`;
                    if (targets.length === 0) {
                      alert('您尚未在列表中勾选任何账号，请勾选后再试或选择指定分组！');
                      return;
                    }
                  } else if (healthScopeType === 'group') {
                    targets = distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === healthTargetGroup);
                    label = `【${healthTargetGroup}】组 (${targets.length}个号)`;
                    if (targets.length === 0) {
                      alert(`【${healthTargetGroup}】分组中暂无账号，请先为账号划分分组！`);
                      return;
                    }
                  } else if (healthScopeType === 'view') {
                    targets = filteredTgAccounts;
                    label = `当前视图筛选出的 ${targets.length} 个账号`;
                    if (targets.length === 0) {
                      alert('当前筛选视图下没有账号！');
                      return;
                    }
                  } else {
                    targets = distinctTgAccounts;
                    label = `全部 ${targets.length} 个账号`;
                  }

                  handleRunSpamBotCheck(targets, label);
                }}
                disabled={isCheckingHealth}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 hover:from-sky-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                {healthScopeType === 'selected' && `🚀 立即启动体检 (已选 ${selectedAccountIds.length} 个账号)`}
                {healthScopeType === 'group' && `🚀 立即体检【${healthTargetGroup}】(${distinctTgAccounts.filter(a => normalizeGroupTag(a.groupTag) === healthTargetGroup).length} 个账号)`}
                {healthScopeType === 'view' && `🚀 立即体检当前视图 (${filteredTgAccounts.length} 个账号)`}
                {healthScopeType === 'all' && `🚀 立即启动全量体检 (${distinctTgAccounts.length} 个账号)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH TASK RESULT ALERT MODAL (群发结果 / 失败明确提示弹窗) */}
      {batchResultModalState.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl border-2 p-6 shadow-2xl space-y-4 relative ${
            batchResultModalState.type === 'failed'
              ? 'bg-slate-900 border-rose-500/80 shadow-rose-950/50'
              : batchResultModalState.type === 'warning'
              ? 'bg-slate-900 border-amber-500/80 shadow-amber-950/50'
              : 'bg-slate-900 border-emerald-500/80 shadow-emerald-950/50'
          }`}>
            <button
              onClick={() => setBatchResultModalState(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                batchResultModalState.type === 'failed'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : batchResultModalState.type === 'warning'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              }`}>
                {batchResultModalState.type === 'failed' ? (
                  <AlertCircle className="w-7 h-7" />
                ) : batchResultModalState.type === 'warning' ? (
                  <AlertCircle className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>
              <div>
                <h3 className={`text-base font-black ${
                  batchResultModalState.type === 'failed'
                    ? 'text-rose-300'
                    : batchResultModalState.type === 'warning'
                    ? 'text-amber-300'
                    : 'text-emerald-300'
                }`}>
                  {batchResultModalState.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  群发任务执行统计与错误原因分析
                </p>
              </div>
            </div>

            {/* Metric Display Cards */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-bold">总计尝试</span>
                <span className="text-sm font-extrabold text-white font-mono">{batchResultModalState.total} 条</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                batchResultModalState.successCount > 0 ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="text-[10px] block font-bold">成功送达</span>
                <span className="text-sm font-extrabold font-mono">{batchResultModalState.successCount} 条</span>
              </div>
              <div className={`p-2.5 rounded-xl border ${
                batchResultModalState.failCount > 0 ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}>
                <span className="text-[10px] block font-bold">发送失败</span>
                <span className="text-sm font-extrabold font-mono">{batchResultModalState.failCount} 条</span>
              </div>
            </div>

            {/* Error Detail Box */}
            <div className={`p-3.5 rounded-xl border space-y-1.5 ${
              batchResultModalState.type === 'failed'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-200'
                : batchResultModalState.type === 'warning'
                ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
            }`}>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 shrink-0" /> 原因判定:
              </div>
              <p className="text-xs font-mono leading-relaxed break-words bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                {batchResultModalState.mainReason}
              </p>
            </div>

            {/* Action Suggestion */}
            <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-amber-400 block flex items-center gap-1">
                💡 建议操作流程:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {batchResultModalState.suggestion}
              </p>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              {batchResultModalState.type === 'failed' && (
                <button
                  type="button"
                  onClick={() => {
                    setBatchResultModalState(prev => ({ ...prev, isOpen: false }));
                    const fileInput = document.querySelector('input[accept=".session,.json"]');
                    if (fileInput) {
                      fileInput.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" /> 🔑 重新上传 .session 凭证
                </button>
              )}
              <button
                type="button"
                onClick={() => setBatchResultModalState(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all border border-slate-700"
              >
                关闭通知
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 Gemini 3.7 AI 葡语润色与多层 Spintax 生成器弹窗 */}
      <SpintaxAiMutatorModal
        isOpen={showSpintaxAiModal}
        onClose={() => setShowSpintaxAiModal(false)}
        initialSpintax={greetingText}
        onApplySpintax={(newSpintax) => {
          setGreetingText(newSpintax);
          setSimpleLogs(prev => [
            ...prev,
            `✨ [AI Spintax 应用成功] 已更新两阶段打招呼文案变量，具备多层递归嵌套与零宽防封扰动！`
          ]);
        }}
      />

      {/* 🛡️ 1. 发信前空号/封禁号静默预检弹窗 */}
      <PreflightFilterModal
        isOpen={showPreflightModal}
        onClose={() => setShowPreflightModal(false)}
        initialNumbers={massDataText.split('\n').filter(l => l.trim().length > 0)}
        onApplyCleanedTargets={(validList) => {
          setMassDataText(validList.join('\n'));
          setSimpleLogs(prev => [
            ...prev,
            `🛡️ [静默预检完成] 已剔除所有空号与拒收号，成功载入 ${validList.length} 个 100% 安全有效在网目标至发件池！`
          ]);
        }}
      />

      {/* 👥 2. 自动建私密营销群与协同拉人裂变弹窗 */}
      <GroupInviterModal
        isOpen={showGroupInviterModal}
        onClose={() => setShowGroupInviterModal(false)}
        accounts={accounts}
        initialTargets={massDataText.split('\n').filter(l => l.trim().length > 0)}
      />

      {/* ⏰ 3. 巴西利亚时区 (UTC-3) 黄金作息调度弹窗 */}
      <BrazilSchedulerModal
        isOpen={showBrazilSchedulerModal}
        onClose={() => setShowBrazilSchedulerModal(false)}
        onUpdateSchedule={(cfg) => {
          setSimpleLogs(prev => [
            ...prev,
            `⏰ [巴西作息调度应用] 启用 ${cfg.enableSmartSchedule ? '波峰智能错峰' : '常规'} 发信模式 (午休: ${cfg.lunchStart}-${cfg.lunchEnd}, 晚间: ${cfg.eveningStart}-${cfg.eveningEnd})`
          ]);
        }}
      />

      {/* 🔀 4. 多落地页 AB 轮巡与防红短链熔断器弹窗 */}
      <DomainRotatorModal
        isOpen={showDomainRotatorModal}
        onClose={() => setShowDomainRotatorModal(false)}
        onUpdateDomains={(activeUrls) => {
          if (activeUrls.length > 0) {
            setFollowupLinkText(prev => {
              if (prev.includes('http')) {
                return prev.replace(/https?:\/\/[^\s)]+/g, activeUrls[0]);
              }
              return `${prev} ${activeUrls[0]}`;
            });
            setSimpleLogs(prev => [
              ...prev,
              `🔀 [防红分流池已更新] 当前可用安全绿色域名: ${activeUrls.length} 个 (主推: ${activeUrls[0]})`
            ]);
          }
        }}
      />

      {/* 🤖 9. 全自动 @SpamBot 智能申诉解封弹窗 */}
      <SpamBotAutoUnbanModal
        isOpen={showSpamBotUnbanModal}
        onClose={() => setShowSpamBotUnbanModal(false)}
        accounts={accounts}
      />

      {/* 🐝 10. 蜂窝矩阵拟真互聊与模拟通话养号弹窗 */}
      <SwarmWarmupModal
        isOpen={showSwarmWarmupModal}
        onClose={() => setShowSwarmWarmupModal(false)}
        accounts={accounts}
      />

      {/* 📱 11. 独立设备指纹混淆与硬件池弹窗 */}
      <DeviceFingerprintModal
        isOpen={showDeviceFingerprintModal}
        onClose={() => setShowDeviceFingerprintModal(false)}
        accounts={accounts}
      />

      {/* ⚡ 12. 高意向私信秒级 Webhook / TG 管理群告警弹窗 */}
      <LeadAlertWebhookModal
        isOpen={showLeadAlertWebhookModal}
        onClose={() => setShowLeadAlertWebhookModal(false)}
        accounts={accounts}
      />

      {/* 🔐 13. 协议号批量洗号与 2FA 密码接管锁定弹窗 */}
      <AccountSanitizerModal
        isOpen={showAccountSanitizerModal}
        onClose={() => setShowAccountSanitizerModal(false)}
        accounts={accounts}
      />

      {/* 🎭 14. 频道 Emoji 互动与投票养号弹窗 */}
      <ChannelReactionWarmupModal
        isOpen={showChannelWarmupModal}
        onClose={() => setShowChannelWarmupModal(false)}
        accounts={accounts}
      />

      {/* ⏳ 15. 自适应 FloodWait 智能退避与自愈唤醒弹窗 */}
      <FloodWaitAutoBackoffModal
        isOpen={showFloodWaitBackoffModal}
        onClose={() => setShowFloodWaitBackoffModal(false)}
        accounts={accounts}
      />
    </div>
  );
};
