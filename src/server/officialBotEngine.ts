import fs from "fs";
import path from "path";

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups?: boolean;
  can_read_all_group_messages?: boolean;
  supports_inline_queries?: boolean;
}

export interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface AutoReplyRule {
  id: string;
  trigger: string;
  matchType: "exact" | "contains" | "prefix";
  replyText: string;
  buttons?: InlineButton[];
  enabled: boolean;
}

export interface DeepLinkCampaign {
  id: string;
  code: string;
  name: string;
  channel: "tiktok" | "meta" | "telegram_ads" | "kol" | "website" | "other";
  visits: number;
  subscribersCount: number;
  conversionRate: string;
  createdAt: string;
  notes?: string;
}

export interface Subscriber {
  id: string; // chat_id as string
  username?: string;
  first_name: string;
  last_name?: string;
  source_campaign: string;
  language_code?: string;
  status: "active" | "vip" | "lead" | "blocked";
  tags: string[];
  notes?: string;
  first_seen: string;
  last_active: string;
  messages_count: number;
  last_message?: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: "user" | "bot" | "agent";
  text: string;
  timestamp: string;
  buttons?: InlineButton[];
}

export interface BroadcastTask {
  id: string;
  title: string;
  text: string;
  targetCampaign?: string;
  targetTag?: string;
  status: "draft" | "running" | "completed" | "failed";
  total: number;
  sent: number;
  failed: number;
  createdAt: string;
  completedAt?: string;
}

export interface MarketPreset {
  id: string;
  name: string;
  flag: string;
  region: string;
  langCode: string;
  currencyInfo: string;
  targetChannels: string;
  welcomeMessage: string;
  welcomeButtons: InlineButton[];
  autoReplies: AutoReplyRule[];
  suggestedDeepLinks: Array<{ code: string; name: string; channel: 'tiktok' | 'meta' | 'telegram_ads' | 'kol' | 'website' | 'other'; notes: string }>;
  vipSupportText: string;
  tutorialText: string;
}

export interface BotConfig {
  botToken: string;
  botInfo: BotInfo | null;
  mode: "polling" | "webhook" | "standby";
  webhookUrl: string;
  welcomeMessage: string;
  welcomeButtons: InlineButton[];
  autoReplies: AutoReplyRule[];
  deepLinks: DeepLinkCampaign[];
  isConfigured: boolean;
  currentPresetId?: string;
  autoMultiLanguage?: boolean;
}

export const GLOBAL_MARKET_PRESETS: MarketPreset[] = [
  {
    id: "us_en",
    name: "美国 / 欧美全球 (US English)",
    flag: "🇺🇸",
    region: "北美与全球市场",
    langCode: "en",
    currencyInfo: "USDT / BTC / ETH, CashApp, Apple Pay, Cards (USD)",
    targetChannels: "TikTok US, X/Twitter, Reddit, TG Alpha Groups",
    welcomeMessage: `🎉 Welcome to the Official VIP Lounge, {first_name}!

🔥 Enjoy our exclusive 100% First Deposit Match + 50 Free Spins upon registration!
⚡ 24/7 VIP Concierge available for instant crypto deposits, 3-minute payouts, and high-roller perks.

Select an option below to get started:`,
    welcomeButtons: [
      { text: "🎰 Claim Exclusive 100% Bonus", url: "https://brazilgo888.com" },
      { text: "👥 Join Official VIP Community", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_us_1",
        trigger: "bonus",
        matchType: "contains",
        replyText: "🎁 *VIP Welcome Package Activated!*\n\nGet up to 100% deposit match on your first crypto deposit with instant automated crediting!",
        buttons: [{ text: "👉 Claim Bonus Now", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_us_2",
        trigger: "crypto",
        matchType: "contains",
        replyText: "⚡ *Instant Crypto Deposits & Withdrawals*\n\nWe support USDT (TRC20/ERC20), BTC, and ETH. Automated payouts processed within 3 minutes, 24/7 with zero network fees!",
        buttons: [{ text: "💳 Deposit Crypto", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_us_3",
        trigger: "support",
        matchType: "contains",
        replyText: "🙋‍♂️ A live VIP Concierge manager has been notified and will reply in this chat shortly!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tiktok_us_viral", name: "TikTok US 游戏短视频", channel: "tiktok", notes: "美区爆款游戏集锦主页Bio导流" },
      { code: "meta_ads_us", name: "Meta Ads 欧美高净值玩家", channel: "meta", notes: "定位美/加 25-45 岁高客单群体" },
      { code: "tg_crypto_us", name: "Telegram 加密与投研群赞助", channel: "telegram_ads", notes: "置顶官方赞助广告" },
      { code: "kol_kick_us", name: "Kick/Twitch 美区主播合作", channel: "kol", notes: "直播间置顶评论带参引导" }
    ],
    vipSupportText: `🙋‍♂️ *VIP Concierge Support Activated!*

Hello *{first_name}*, our dedicated VIP account manager has been assigned to your chat and will assist you shortly.

⚡ *Quick Shortcuts:*
• Type your questions directly in this chat
• Type *CRYPTO* for instant deposit addresses
• Type *BONUS* to verify your tier rewards`,
    tutorialText: `📖 *Quick Start Guide (Step-by-Step)*

1️⃣ *Access Portal*: Click the link below to open the official web app.
2️⃣ *Instant Register*: Takes under 30 seconds with no complex verification.
3️⃣ *First Deposit*: Deposit via USDT/Crypto for an immediate 100% match bonus.
4️⃣ *Play & Cash Out*: Enjoy premium slots & live tables, withdraw winnings in 3 minutes!

Need direct assistance? Our team is online 24/7!`
  },
  {
    id: "br_pt",
    name: "巴西 (Português do Brasil)",
    flag: "🇧🇷",
    region: "拉美第一大市场",
    langCode: "pt",
    currencyInfo: "PIX instantâneo, Boleto Bancário (BRL R$)",
    targetChannels: "TikTok Brasil, Instagram Reels, Grupos de Sinais TG",
    welcomeMessage: `🎉 Olá, {first_name}! Bem-vindo ao canal oficial de atendimento VIP!

🔥 Aproveite nossa promoção exclusiva de boas-vindas com bônus direto na sua conta.
⚡ Suporte 24/7 disponível em português para tirar dúvidas sobre depósitos PIX instantâneos, saques e bônus.

Escolha uma das opções abaixo para começar:`,
    welcomeButtons: [
      { text: "🎰 Resgatar Bônus Exclusivo", url: "https://brazilgo888.com" },
      { text: "👥 Entrar no Canal Oficial", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_br_1",
        trigger: "bonus",
        matchType: "contains",
        replyText: "🎁 *Bônus Disponível!*\n\nCadastre-se pelo link oficial e receba até 500% de bônus no seu primeiro depósito via PIX instantâneo!",
        buttons: [{ text: "👉 Ativar Bônus Agora", url: "https://brazilgo888.com/bonus" }],
        enabled: true
      },
      {
        id: "ar_br_2",
        trigger: "pix",
        matchType: "contains",
        replyText: "⚡ *Depósitos e Saques via PIX*\n\nNossos pagamentos são processados em segundos, 24 horas por dia, sem taxas adicionais!",
        buttons: [{ text: "💳 Fazer Depósito", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_br_3",
        trigger: "suporte",
        matchType: "contains",
        replyText: "🙋‍♂️ Nosso atendente já foi notificado e responderá sua mensagem em breve por este chat!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tiktok_viral", name: "TikTok 巴西游戏短视频引流", channel: "tiktok", notes: "置顶短视频主页Bio链接转化" },
      { code: "meta_feed", name: "Meta / Instagram 故事广告", channel: "meta", notes: "巴西圣保罗/里约 21-35岁男性" },
      { code: "tg_ads_official", name: "Telegram 官方赞助广告投放", channel: "telegram_ads", notes: "精准投放至巴西游戏大频道" },
      { code: "kol_felipe", name: "YouTube 巴西博主 Felipe 专场", channel: "kol", notes: "视频置顶评论引导进 Bot" }
    ],
    vipSupportText: `🙋‍♂️ *Suporte VIP Oficial Ativado!*

Olá *{first_name}*, nosso atendente VIP já foi notificado e responderá sua mensagem por aqui em instantes.

⚡ *Atalhos Rápidos:*
• Digite sua dúvida diretamente no chat
• Digite *PIX* para informações sobre depósitos e saques rápidos
• Digite *BONUS* para saber sobre promoções ativas`,
    tutorialText: `📖 *Guia Rápido de Início (Passo a Passo)*

1️⃣ *Acesse*: Clique no botão abaixo para abrir a plataforma oficial.
2️⃣ *Cadastre-se*: Leva menos de 1 minuto.
3️⃣ *Primeiro Depósito*: Pague via PIX instantâneo e ganhe até 500% de bônus automático.
4️⃣ *Jogue e Lucre*: Escolha seus jogos preferidos e saque seus lucros direto no seu PIX!

Qualquer dúvida, envie uma mensagem que nossa equipe ajuda você!`
  },
  {
    id: "latam_es",
    name: "西语拉美 / 墨西哥 (Español Latino)",
    flag: "🇲🇽",
    region: "墨西哥、哥伦比亚、阿根廷、秘鲁",
    langCode: "es",
    currencyInfo: "SPEI (México), OXXO, PSE, USDT, Tarjetas (MXN/COP/USD)",
    targetChannels: "TikTok Latam, Meta Ads México/Colombia, Canales de Apuestas TG",
    welcomeMessage: `🎉 ¡Hola, {first_name}! ¡Bienvenido al canal oficial de atención VIP!

🔥 Aprovecha nuestro bono exclusivo de bienvenida del 100% + giros gratis en tu primer depósito.
⚡ Soporte VIP 24/7 en español para resolver dudas sobre depósitos locales (SPEI, OXXO, USDT) y retiros inmediatos.

Elige una opción para comenzar:`,
    welcomeButtons: [
      { text: "🎰 Reclamar Bono de Bienvenida", url: "https://brazilgo888.com" },
      { text: "👥 Unirse al Canal Oficial", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_es_1",
        trigger: "bono",
        matchType: "contains",
        replyText: "🎁 *¡Bono Exclusivo Activado!*\n\n¡Regístrate hoy y recibe el 100% de bonificación en tu primer depósito con acreditación automática!",
        buttons: [{ text: "👉 Reclamar Bono", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_es_2",
        trigger: "spei",
        matchType: "contains",
        replyText: "⚡ *Depósitos y Retiros Inmediatos*\n\nProcesamos pagos vía SPEI y transferencias en segundos, 24 horas al día sin comisiones ocultas.",
        buttons: [{ text: "💳 Recargar Saldo", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_es_3",
        trigger: "soporte",
        matchType: "contains",
        replyText: "🙋‍♂️ ¡Un asesor VIP ha sido asignado a tu consulta y te responderá por este chat en breve!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tiktok_mexico", name: "TikTok 墨西哥短视频引流", channel: "tiktok", notes: "墨西哥本土老虎机高光剪辑" },
      { code: "meta_colombia", name: "Meta Ads 哥伦比亚精准投流", channel: "meta", notes: "定向波哥大/麦德林年轻男性" },
      { code: "tg_latam_vip", name: "拉美博彩情报频道合作", channel: "telegram_ads", notes: "TG 官方赞助贴文" }
    ],
    vipSupportText: `🙋‍♂️ *¡Soporte VIP Oficial Activado!*

Hola *{first_name}*, nuestro asesor VIP ha sido notificado y responderá por este chat en unos instantes.

⚡ *Accesos Rápidos:*
• Escribe tu consulta directamente en el chat
• Escribe *SPEI* para recarga y retiro inmediato
• Escribe *BONO* para ver promociones activas`,
    tutorialText: `📖 *Guía Rápida para Comenzar (Paso a Paso)*

1️⃣ *Ingresa*: Haz clic en el botón de abajo para acceder a la plataforma oficial.
2️⃣ *Regístrate*: Completa tu registro en menos de 1 minuto.
3️⃣ *Primer Depósito*: Paga vía SPEI o USDT y recibe tu bono del 100% al instante.
4️⃣ *Juega y Cobra*: Elige tus juegos favoritos y retira tus ganancias directo a tu cuenta!

¿Dudas? ¡Escríbenos, estamos en línea las 24 horas!`
  },
  {
    id: "vn_vi",
    name: "越南 (Tiếng Việt)",
    flag: "🇻🇳",
    region: "东南亚高增速市场",
    langCode: "vi",
    currencyInfo: "Ngân Hàng 24/7, Ví Momo, ZaloPay, ViettelPay, USDT (VND)",
    targetChannels: "TikTok Việt Nam, Nhóm Kéo Telegram, Facebook Reels",
    welcomeMessage: `🎉 Xin chào, {first_name}! Chào mừng bạn đến với kênh Chăm Sóc Khách Hàng VIP chính thức!

🔥 Nhận ngay gói khuyến mãi chào mừng 100% nạp đầu + vòng quay may mắn!
⚡ Hỗ trợ nạp rút siêu tốc 24/7 qua Ngân Hàng, Momo, USDT không giới hạn.

Vui lòng chọn một tùy chọn bên dưới để bắt đầu:`,
    welcomeButtons: [
      { text: "🎰 Nhận Thưởng Nạp Đầu 100%", url: "https://brazilgo888.com" },
      { text: "👥 Tham Gia Kênh VIP", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_vn_1",
        trigger: "thuong",
        matchType: "contains",
        replyText: "🎁 *Khuyến Mãi Độc Quyền!*\n\nĐăng ký ngay để nhận thưởng nạp đầu 100% và hoàn trả cược mỗi ngày lên đến 1.5%!",
        buttons: [{ text: "👉 Kích Hoạt Thưởng", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_vn_2",
        trigger: "nap",
        matchType: "contains",
        replyText: "⚡ *Nạp Rút Siêu Tốc 24/7*\n\nHệ thống xử lý lệnh nạp rút tự động qua ngân hàng nội địa và ví Momo trong 3 phút!",
        buttons: [{ text: "💳 Nạp Tiền Ngay", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_vn_3",
        trigger: "cskh",
        matchType: "contains",
        replyText: "🙋‍♂️ Chuyên viên tư vấn VIP đã nhận thông tin và sẽ phản hồi bạn ngay tại đây!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tiktok_vietnam", name: "TikTok Việt Nam 引流", channel: "tiktok", notes: "短视频 Bio 挂链接" },
      { code: "fb_group_vn", name: "Facebook 越南游戏社群", channel: "kol", notes: "社群管理人员置顶合作" }
    ],
    vipSupportText: `🙋‍♂️ *Chăm Sóc Khách Hàng VIP Đã Kích Hoạt!*

Xin chào *{first_name}*, chuyên viên VIP của chúng tôi đã nhận được yêu cầu và sẽ phản hồi bạn ngay tại đây.

⚡ *Phím Tắt Nhanh:*
• Gửi thắc mắc của bạn vào đây
• Nhập *NAP* để lấy số tài khoản nạp tiền
• Nhập *THUONG* để xem các gói khuyến mãi`,
    tutorialText: `📖 *Hướng Dẫn Bắt Đầu Nhanh (Từng Bước)*

1️⃣ *Truy cập*: Nhấp vào nút bên dưới để mở trang web chính thức.
2️⃣ *Đăng ký*: Hoàn tất tài khoản trong vòng chưa đầy 1 phút.
3️⃣ *Nạp đầu*: Thanh toán qua Ngân Hàng/Momo và nhận ngay 100% tiền thưởng.
4️⃣ *Rút tiền*: Rút tiền thắng cược về tài khoản ngân hàng siêu tốc 24/7!

Đội ngũ hỗ trợ luôn sẵn sàng phục vụ bạn!`
  },
  {
    id: "id_id",
    name: "印尼 (Bahasa Indonesia)",
    flag: "🇮🇩",
    region: "东南亚第一大国",
    langCode: "id",
    currencyInfo: "QRIS, DANA, OVO, GoPay, Bank Transfer (IDR)",
    targetChannels: "TikTok Indonesia, Komunitas Slot TG, YouTube Shorts",
    welcomeMessage: `🎉 Halo, {first_name}! Selamat datang di Layanan Pelanggan VIP Resmi!

🔥 Nikmati Bonus New Member 100% dan event freespin eksklusif untuk member baru!
⚡ Layanan deposit & withdraw kilat 24 jam via QRIS, DANA, OVO, GoPay, dan Bank Lokal.

Pilih menu di bawah ini untuk memulai:`,
    welcomeButtons: [
      { text: "🎰 Klaim Bonus New Member", url: "https://brazilgo888.com" },
      { text: "👥 Gabung Channel VIP", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_id_1",
        trigger: "bonus",
        matchType: "contains",
        replyText: "🎁 *Bonus New Member 100%!*\n\nDaftar sekarang dan klaim bonus deposit pertama Anda dengan proses otomatis instan!",
        buttons: [{ text: "👉 Klaim Sekarang", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_id_2",
        trigger: "qris",
        matchType: "contains",
        replyText: "⚡ *Deposit Kilat via QRIS*\n\nTransaksi cepat dalam hitungan detik 24 jam nonstop tanpa potongan via QRIS / DANA!",
        buttons: [{ text: "💳 Deposit QRIS", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_id_3",
        trigger: "bantuan",
        matchType: "contains",
        replyText: "🙋‍♂️ Customer Service VIP kami sedang membaca pesan Anda dan akan segera membalas!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tiktok_indo_viral", name: "TikTok 印尼 Slot 视频", channel: "tiktok", notes: "短视频引导主页 Bio" },
      { code: "tg_group_id", name: "印尼 Telegram 玩家群合作", channel: "telegram_ads", notes: "群位置赞助广告" }
    ],
    vipSupportText: `🙋‍♂️ *Layanan CS VIP Telah Aktif!*

Halo *{first_name}*, CS VIP kami telah menerima pemberitahuan dan akan segera melayani Anda di sini.

⚡ *Pintasan Cepat:*
• Ketik pertanyaan Anda langsung di chat ini
• Ketik *QRIS* untuk info deposit cepat
• Ketik *BONUS* untuk cek promo member baru`,
    tutorialText: `📖 *Panduan Mudah Memulai (Langkah demi Langkah)*

1️⃣ *Akses*: Klik tombol di bawah untuk membuka situs resmi.
2️⃣ *Daftar*: Pembuatan akun cepat hanya 1 menit.
3️⃣ *Deposit Pertama*: Bayar via QRIS/DANA dan dapatkan Bonus 100% langsung masuk.
4️⃣ *Main & Withdraw*: Mainkan game favorit Anda dan tarik kemenangan langsung ke rekening!

CS online 24 jam siap membantu Anda!`
  },
  {
    id: "ja_jp",
    name: "日本 (日本語)",
    flag: "🇯🇵",
    region: "高客单高留存优质市场",
    langCode: "ja",
    currencyInfo: "暗号資産 (USDT/BTC/ETH), 銀行振込 (JPY)",
    targetChannels: "Twitter/X オンカジ界隈, Telegram オンカジ攻略チャンネル",
    welcomeMessage: `🎉 {first_name}様、公式VIPカスタマーサポートラウンジへようこそ！

🔥 新規限定：初回入金100%ボーナス＋フリースピンをプレゼント中！
⚡ 暗号資産 (USDT/BTC) や各種決済対応、24時間日本語対応の専属VIPサポートがサポートいたします。

以下のメニューからお選びください：`,
    welcomeButtons: [
      { text: "🎰 初回特典ボーナスを受け取る", url: "https://brazilgo888.com" },
      { text: "👥 公式Telegramチャンネルに参加", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_ja_1",
        trigger: "ボーナス",
        matchType: "contains",
        replyText: "🎁 *限定入金ボーナス特典*\n\n初回ご入金で最大100%のマッチボーナスが自動反映されます！",
        buttons: [{ text: "👉 特典を有効化", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_ja_2",
        trigger: "入金",
        matchType: "contains",
        replyText: "⚡ *暗号資産による即時入出金*\n\nUSDTおよび主要暗号資産で24時間365日、最速3分で自動送金処理されます。",
        buttons: [{ text: "💳 入金案内", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_ja_3",
        trigger: "サポート",
        matchType: "contains",
        replyText: "🙋‍♂️ 専属の日本語VIPコンシェルジュが対応いたします。少々お待ちくださいませ。",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "x_twitter_jp", name: "Twitter/X 日本推广", channel: "other", notes: "置顶推文引导进群" },
      { code: "tg_japan_vip", name: "日本 Telegram 攻略频道", channel: "telegram_ads", notes: "官方置顶广告赞助" }
    ],
    vipSupportText: `🙋‍♂️ *日本語VIPサポートが開始されました*

{first_name}様、専属のVIPコンシェルジュが通知を受け取りました。まもなくこちらのチャットよりご案内申し上げます。

⚡ *クイックコマンド:*
• ご質問内容をそのままメッセージでお送りください
• *入金* と入力で即時入金手順をご案内
• *ボーナス* と入力で適用中プロモーションを確認`,
    tutorialText: `📖 *かんたんスタートガイド（ステップ別）*

1️⃣ *アクセス*: 下のボタンより公式サイトを開きます。
2️⃣ *アカウント登録*: 約1分で登録完了、即座にご利用可能です。
3️⃣ *初回入金*: 暗号資産(USDT)または銀行決済で入金し、100%ボーナスを獲得。
4️⃣ *プレイ＆出金*: お好きなゲームをプレイし、勝利金は最短3分で着金！

ご不明点がございましたら、24時間お気軽にお声がけください。`
  },
  {
    id: "zh_cn",
    name: "全球华语 / 东南亚华语 (Chinese)",
    flag: "🇨🇳",
    region: "海外华人与东南亚华语区",
    langCode: "zh",
    currencyInfo: "USDT (TRC20/ERC20), 银行卡, 支付宝, 微信 (CNY/USD)",
    targetChannels: "Telegram 推广大群, 独立站落地页, 海外自媒体矩阵",
    welcomeMessage: `🎉 您好，{first_name}！欢迎来到官方 7x24 VIP 贵宾接待中心！

🔥 新人专享：首充尊享 100% 礼金回馈 + 高额每日返水！
⚡ 支持 USDT (TRC20/ERC20) 极速充提，大额无忧，3分钟秒级到账，全天候专属 VIP 客服为您服务。

请点击下方按钮快速体验：`,
    welcomeButtons: [
      { text: "🎰 领取新人首充彩金", url: "https://brazilgo888.com" },
      { text: "👥 加入官方 VIP 频道", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_zh_1",
        trigger: "彩金",
        matchType: "contains",
        replyText: "🎁 *尊享新人大礼包*\n\n首充即可获得高达 100% 彩金加赠，系统全自动结算派发，随时畅玩！",
        buttons: [{ text: "👉 立即领彩金", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_zh_2",
        trigger: "usdt",
        matchType: "contains",
        replyText: "⚡ *USDT 极速充提服务*\n\n全天候 24 小时支持 TRC20/ERC20 极速到账，单笔无上限，财务专线秒批！",
        buttons: [{ text: "💳 充值通道", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_zh_3",
        trigger: "客服",
        matchType: "contains",
        replyText: "🙋‍♂️ 您的专属 VIP 客户经理已就绪，正在接入会话，请稍候！",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tg_group_cn", name: "TG 华语交流大群引流", channel: "telegram_ads", notes: "置顶群公告引流" },
      { code: "seo_portal_cn", name: "独立站导航与落地页", channel: "website", notes: "右下角挂 Bot 咨询链接" }
    ],
    vipSupportText: `🙋‍♂️ *VIP 专属客服通道已接入！*

您好 *{first_name}*，您的专属 1v1 客户经理已接到通知，正在调阅资料并为您处理，请稍候。

⚡ *快捷指令：*
• 直接在此输入您的疑问即可
• 输入 *USDT* 获取专属充提地址
• 输入 *彩金* 查询最新活动力度`,
    tutorialText: `📖 *新人开户与秒存指南（4步上手）*

1️⃣ *进入官网*：点击下方按钮进入官方直达入口。
2️⃣ *极速开户*：无需繁琐资料，30秒完成注册。
3️⃣ *USDT 首充*：支持 TRC20 链上秒到账，自动加发 100% 首充红利。
4️⃣ *大额提款*：全自动化出款通道，3分钟即刻到账私人钱包！

如需帮助，专属客服随时在线为您解答！`
  },
  {
    id: "kr_ko",
    name: "韩国 (한국어)",
    flag: "🇰🇷",
    region: "东亚高客单高转化市场",
    langCode: "ko",
    currencyInfo: "가상화폐 (USDT TRC20), 원화 계좌이체 (KRW ₩)",
    targetChannels: "텔레그램 커뮤니티, 트위터/X 프로모션, 해외 배팅 채널",
    welcomeMessage: `🎉 안녕하세요, {first_name}님! 공식 VIP 고객센터에 오신 것을 환영합니다!

🔥 신규 회원 단독 혜택: 첫 충전 100% 보너스 + 무료 스핀 증정!
⚡ USDT (TRC20) 및 실시간 입출금 지원, 24시간 한국어 1:1 VIP 전담 상담 운영 중입니다.

아래 버튼을 클릭하여 바로 시작해 보세요:`,
    welcomeButtons: [
      { text: "🎰 신규 첫충 보너스 받기", url: "https://brazilgo888.com" },
      { text: "👥 공식 VIP 커뮤니티 입장", url: "https://t.me/brazilgo_chat" }
    ],
    autoReplies: [
      {
        id: "ar_kr_1",
        trigger: "보너스",
        matchType: "contains",
        replyText: "🎁 *신규 회원 첫충 보너스 혜택!*\n\n지금 바로 공식 링크로 가입하고 첫 입금 시 100% 보너스가 자동으로 지급됩니다!",
        buttons: [{ text: "👉 보너스 받기", url: "https://brazilgo888.com" }],
        enabled: true
      },
      {
        id: "ar_kr_2",
        trigger: "충전",
        matchType: "contains",
        replyText: "⚡ *USDT 초고속 입출금 서비스*\n\n24시간 무제한 TRC20 체인 실시간 자동 반영, 3분 이내 개인 지갑으로 즉시 출금!",
        buttons: [{ text: "💳 입금 바로가기", url: "https://brazilgo888.com/deposit" }],
        enabled: true
      },
      {
        id: "ar_kr_3",
        trigger: "고객센터",
        matchType: "contains",
        replyText: "🙋‍♂️ 전담 한국어 VIP 상담원이 배정되었습니다. 잠시만 기다려 주시면 바로 답변드리겠습니다!",
        buttons: [],
        enabled: true
      }
    ],
    suggestedDeepLinks: [
      { code: "tg_korea_vip", name: "TG 韩国玩家社群推广", channel: "telegram_ads", notes: "置顶公告与赞助推广" },
      { code: "x_korea_promo", name: "Twitter/X 韩国推特矩阵", channel: "other", notes: "个人主页挂引导链接" }
    ],
    vipSupportText: `🙋‍♂️ *한국어 VIP 상담 채널이 연결되었습니다!*

안녕하세요 *{first_name}*님, 전담 VIP 매니저가 확인 중이며 곧 이곳에서 1:1로 안내해 드리겠습니다.

⚡ *빠른 명령어:*
• 궁금하신 점을 채팅창에 바로 남겨주세요
• *충전* 입력 시 입출금 안내
• *보너스* 입력 시 현재 진행 중인 프로모션 안내`,
    tutorialText: `📖 *초보자 이용 안내 (간단 4단계)*

1️⃣ *공식 사이트 접속*: 아래 버튼을 눌러 공식 접속 주소로 이동합니다.
2️⃣ *간편 회원가입*: 복잡한 인증 없이 30초 만에 가입 완료.
3️⃣ *첫 충전*: USDT(TRC20) 입금 시 100% 보너스 자동 추가 지급.
4️⃣ *게임 & 출금*: 승리 시 3분 이내 개인 지갑으로 실시간 즉시 출금!

24시간 연중무휴 고객센터가 도와드립니다.`
  }
];

export function getPresetByLang(langCode?: string): MarketPreset {
  const enPreset = GLOBAL_MARKET_PRESETS.find(p => p.id === "us_en") || GLOBAL_MARKET_PRESETS[0];
  const ptPreset = GLOBAL_MARKET_PRESETS.find(p => p.id === "br_pt") || GLOBAL_MARKET_PRESETS[1];
  if (!langCode) return enPreset;
  const code = langCode.toLowerCase().trim();
  
  // 仅保留英语和葡萄牙语
  if (code.startsWith("pt")) return ptPreset;
  return enPreset; // 其它所有情况一律默认英语
}

const DATA_DIR = path.join(process.cwd(), "sessions");
const CONFIG_FILE = path.join(DATA_DIR, "official_bot_config.json");
const SUBSCRIBERS_FILE = path.join(DATA_DIR, "bot_subscribers.json");
const CHATS_FILE = path.join(DATA_DIR, "bot_chats.json");
const BROADCASTS_FILE = path.join(DATA_DIR, "bot_broadcasts.json");

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {}
}

const DEFAULT_WELCOME_MESSAGE = `🎉 Olá, {first_name}! Bem-vindo ao canal oficial de atendimento VIP!

🔥 Aproveite nossa promoção exclusiva de boas-vindas com bônus direto na sua conta.
⚡ Suporte 24/7 disponível em português para tirar dúvidas sobre depósitos, saques e bônus.

Escolha uma das opções abaixo para começar:`;

const DEFAULT_WELCOME_BUTTONS: InlineButton[] = [
  { text: "🎰 Resgatar Bônus Exclusivo", url: "https://brazilgo888.com" },
  { text: "👥 Entrar no Canal Oficial", url: "https://t.me/brazilgo_chat" }
];

const DEFAULT_AUTO_REPLIES: AutoReplyRule[] = [
  {
    id: "ar_1",
    trigger: "bonus",
    matchType: "contains",
    replyText: "🎁 *Bônus Disponível!*\n\nCadastre-se pelo link oficial e receba até 500% de bônus no seu primeiro depósito via PIX instantâneo!",
    buttons: [{ text: "👉 Ativar Bônus Agora", url: "https://brazilgo888.com/bonus" }],
    enabled: true
  },
  {
    id: "ar_2",
    trigger: "pix",
    matchType: "contains",
    replyText: "⚡ *Depósitos e Saques via PIX*\n\nNossos pagamentos são processados em segundos, 24 horas por dia, sem taxas adicionais!",
    buttons: [{ text: "💳 Fazer Depósito", url: "https://brazilgo888.com/deposit" }],
    enabled: true
  },
  {
    id: "ar_3",
    trigger: "suporte",
    matchType: "contains",
    replyText: "🙋‍♂️ Nosso atendente já foi notificado e responderá sua mensagem em breve por este chat!",
    buttons: [],
    enabled: true
  }
];

const DEFAULT_DEEP_LINKS: DeepLinkCampaign[] = [
  {
    id: "dl_1",
    code: "tiktok_viral",
    name: "TikTok 巴西游戏短视频引流",
    channel: "tiktok",
    visits: 0,
    subscribersCount: 0,
    conversionRate: "0.0%",
    createdAt: "2026-09-20",
    notes: "置顶短视频主页Bio链接转化"
  },
  {
    id: "dl_2",
    code: "meta_feed",
    name: "Meta / Instagram 故事广告",
    channel: "meta",
    visits: 0,
    subscribersCount: 0,
    conversionRate: "0.0%",
    createdAt: "2026-09-21",
    notes: "巴西圣保罗/里约 21-35岁男性"
  },
  {
    id: "dl_3",
    code: "tg_ads_official",
    name: "Telegram 官方赞助广告投放",
    channel: "telegram_ads",
    visits: 0,
    subscribersCount: 0,
    conversionRate: "0.0%",
    createdAt: "2026-09-22",
    notes: "精准投放至巴西游戏大频道"
  },
  {
    id: "dl_4",
    code: "kol_felipe",
    name: "YouTube 巴西博主 Felipe 专场",
    channel: "kol",
    visits: 0,
    subscribersCount: 0,
    conversionRate: "0.0%",
    createdAt: "2026-09-23",
    notes: "视频置顶评论引导进 Bot"
  }
];

const INITIAL_SUBSCRIBERS: Subscriber[] = [];

class OfficialBotEngine {
  private config: BotConfig;
  private subscribers: Map<string, Subscriber> = new Map();
  private chats: Map<string, ChatMessage[]> = new Map();
  private broadcasts: BroadcastTask[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateId: number = 0;
  private isPollingActive: boolean = false;
  private isFetchingUpdates: boolean = false;
  private processedUpdateIds: Set<number> = new Set();
  private processedMessageKeys: Set<string> = new Set();
  private lastStartTimestamps: Map<string, number> = new Map();
  private lastReplyTimestampByChat: Map<string, { key: string; time: number }> = new Map();

  constructor() {
    this.config = this.loadConfig();
    this.loadSubscribers();
    this.loadChats();
    this.loadBroadcasts();
    if (this.config.botToken) {
      setTimeout(() => {
        this.startPolling();
      }, 1000);
    }
  }

  private loadConfig(): BotConfig {
    if (fs.existsSync(CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
        return JSON.parse(raw);
      } catch (e) {}
    }
    const defaultCfg: BotConfig = {
      botToken: "",
      botInfo: null,
      mode: "standby",
      webhookUrl: "",
      welcomeMessage: DEFAULT_WELCOME_MESSAGE,
      welcomeButtons: DEFAULT_WELCOME_BUTTONS,
      autoReplies: DEFAULT_AUTO_REPLIES,
      deepLinks: DEFAULT_DEEP_LINKS,
      isConfigured: false
    };
    this.saveConfig(defaultCfg);
    return defaultCfg;
  }

  public saveConfig(cfg?: BotConfig) {
    if (cfg) this.config = cfg;
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), "utf-8");
    } catch (e) {}
  }

  private loadSubscribers() {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      try {
        const raw = fs.readFileSync(SUBSCRIBERS_FILE, "utf-8");
        const list: Subscriber[] = JSON.parse(raw);
        list.forEach(s => this.subscribers.set(s.id, s));
        return;
      } catch (e) {}
    }
    INITIAL_SUBSCRIBERS.forEach(s => this.subscribers.set(s.id, s));
    this.saveSubscribers();
  }

  public saveSubscribers() {
    try {
      const list = Array.from(this.subscribers.values());
      fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2), "utf-8");
    } catch (e) {}
  }

  private loadChats() {
    if (fs.existsSync(CHATS_FILE)) {
      try {
        const raw = fs.readFileSync(CHATS_FILE, "utf-8");
        const obj = JSON.parse(raw);
        Object.keys(obj).forEach(k => this.chats.set(k, obj[k]));
        return;
      } catch (e) {}
    }
  }

  public saveChats() {
    try {
      const obj: Record<string, ChatMessage[]> = {};
      this.chats.forEach((v, k) => {
        obj[k] = v;
      });
      fs.writeFileSync(CHATS_FILE, JSON.stringify(obj, null, 2), "utf-8");
    } catch (e) {}
  }

  private loadBroadcasts() {
    if (fs.existsSync(BROADCASTS_FILE)) {
      try {
        const raw = fs.readFileSync(BROADCASTS_FILE, "utf-8");
        this.broadcasts = JSON.parse(raw);
        return;
      } catch (e) {}
    }
  }

  public saveBroadcasts() {
    try {
      fs.writeFileSync(BROADCASTS_FILE, JSON.stringify(this.broadcasts, null, 2), "utf-8");
    } catch (e) {}
  }

  public getConfig(): BotConfig {
    return { ...this.config };
  }

  public updateConfig(newPartial: Partial<BotConfig>): BotConfig {
    this.config = { ...this.config, ...newPartial };
    this.saveConfig();
    return this.config;
  }

  // Official Telegram API Call Helper
  private async callTelegramApi(endpoint: string, payload: any = {}): Promise<any> {
    const token = this.config.botToken;
    if (!token) throw new Error("Bot Token 未配置，请先填写官方 Bot Token！");
    const url = `https://api.telegram.org/bot${token}/${endpoint}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || `Telegram API Error: ${res.status}`);
    }
    return data.result;
  }

  // Verify and fetch Bot details
  public async verifyToken(token: string): Promise<BotInfo> {
    const url = `https://api.telegram.org/bot${token}/getMe`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.ok) {
      throw new Error(data.description || "Token 无效或无法访问 Telegram 官方 API");
    }
    const info: BotInfo = data.result;
    this.config.botToken = token;
    this.config.botInfo = info;
    this.config.isConfigured = true;
    this.saveConfig();
    return info;
  }

  // Send message to a chat
  public async sendMessage(chatId: string | number, text: string, buttons?: InlineButton[]): Promise<any> {
    let inline_keyboard: any[] | undefined = undefined;
    if (buttons && buttons.length > 0) {
      inline_keyboard = [];
      for (const item of (buttons as any[])) {
        if (Array.isArray(item)) {
          inline_keyboard.push(item.map(b => ({
            text: b.text,
            ...(b.url ? { url: b.url } : { callback_data: b.callback_data || b.text })
          })));
        } else {
          inline_keyboard.push([{
            text: item.text,
            ...(item.url ? { url: item.url } : { callback_data: item.callback_data || item.text })
          }]);
        }
      }
    }
    const replyMarkup = inline_keyboard && inline_keyboard.length > 0 ? { inline_keyboard } : undefined;

    const payload: any = {
      chat_id: chatId,
      text: text,
      parse_mode: "Markdown"
    };
    if (replyMarkup) payload.reply_markup = replyMarkup;

    let result;
    if (this.config.botToken) {
      try {
        result = await this.callTelegramApi("sendMessage", payload);
      } catch (sendErr: any) {
        const errMsg = String(sendErr?.message || sendErr || "");
        // 仅在明确是 Telegram Markdown 格式解析错误时才去掉 parse_mode 降级重试，防止网络抖动导致的重复重试发送
        if (errMsg.toLowerCase().includes("parse") || errMsg.toLowerCase().includes("entities")) {
          delete payload.parse_mode;
          try {
            result = await this.callTelegramApi("sendMessage", payload);
          } catch (retryErr: any) {
            console.error("❌ [Official Bot] Send message failed:", retryErr?.message);
            throw retryErr;
          }
        } else {
          console.error("❌ [Official Bot] Send message network error:", errMsg);
          throw sendErr;
        }
      }
    } else {
      // Simulate send when testing without active token
      result = { message_id: Math.floor(Math.random() * 999999), simulated: true };
    }

    // Record into chats
    const cid = String(chatId);
    const msgList = this.chats.get(cid) || [];
    msgList.push({
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      chat_id: cid,
      sender: "bot",
      text: text,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
      buttons: buttons
    });
    this.chats.set(cid, msgList);
    this.saveChats();

    // Update subscriber last active
    const sub = this.subscribers.get(cid);
    if (sub) {
      sub.last_active = new Date().toISOString().replace("T", " ").slice(0, 19);
      sub.messages_count = (sub.messages_count || 0) + 1;
      this.saveSubscribers();
    }

    return result;
  }

  // Handle incoming message or callback
  public async handleIncomingUpdate(update: any) {
    if (!update) return;

    // 0. Update ID deduplication
    if (update.update_id) {
      if (this.processedUpdateIds.has(update.update_id)) {
        return;
      }
      this.processedUpdateIds.add(update.update_id);
      if (this.processedUpdateIds.size > 5000) {
        const first = this.processedUpdateIds.values().next().value;
        if (first !== undefined) this.processedUpdateIds.delete(first);
      }
    }

    const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19);

    // 1. Handle Inline Button Clicks (callback_query)
    if (update.callback_query) {
      const cb = update.callback_query;
      const from = cb.from;
      const chatId = String(cb.message?.chat?.id || from.id);
      const data = (cb.data || "").trim();

      // Deduplicate callback query by cb.id
      if (cb.id) {
        const cbKey = `cb_${cb.id}`;
        if (this.processedMessageKeys.has(cbKey)) return;
        this.processedMessageKeys.add(cbKey);
      }

      // Answer callback query immediately to stop the button loading spinner
      try {
        await this.callTelegramApi("answerCallbackQuery", {
          callback_query_id: cb.id,
          text: data === "support_vip" ? "Suporte VIP acionado!" : "Abrindo tutorial..."
        });
      } catch (err: any) {
        console.warn("answerCallbackQuery error:", err?.message);
      }

      // Record in chat history
      const msgList = this.chats.get(chatId) || [];
      msgList.push({
        id: "msg_" + Date.now(),
        chat_id: chatId,
        sender: "user",
        text: `[Botão clicado: ${data}]`,
        timestamp: nowStr
      });
      this.chats.set(chatId, msgList);
      this.saveChats();

      // Update subscriber
      const sub = this.subscribers.get(chatId);
      if (sub) {
        sub.last_active = nowStr;
        sub.messages_count = (sub.messages_count || 0) + 1;
        sub.last_message = `[Botão: ${data}]`;
        this.saveSubscribers();
      }

      // Resolve market preset for active user
      const userPreset = this.config.autoMultiLanguage
        ? getPresetByLang(from.language_code)
        : (GLOBAL_MARKET_PRESETS.find(p => p.id === this.config.currentPresetId) || GLOBAL_MARKET_PRESETS[1]);

      // Respond according to callback_data
      if (data === "support_vip") {
        const supportText = userPreset.vipSupportText.replace("{first_name}", from.first_name || "VIP");
        await this.sendMessage(
          chatId,
          supportText,
          userPreset.welcomeButtons.slice(0, 2)
        );
        return;
      }

      if (data === "tutorial") {
        await this.sendMessage(
          chatId,
          userPreset.tutorialText,
          [
            userPreset.welcomeButtons[0] || { text: "👉 Portal Oficial", url: "https://brazilgo888.com" },
            { text: userPreset.welcomeButtons[1]?.text || "💬 Suporte VIP", callback_data: "support_vip" }
          ]
        );
        return;
      }

      // Language Switch Callbacks
      if (data.startsWith("set_lang_")) {
        const targetLang = data.replace("set_lang_", "");
        const finalLang = targetLang === "pt" ? "pt-br" : "en";
        if (sub) {
          sub.language_code = finalLang;
          this.saveSubscribers();
        }
        const newPreset = getPresetByLang(finalLang);
        try {
          await this.callTelegramApi("answerCallbackQuery", {
            callback_query_id: cb.id,
            text: finalLang === "pt-br" ? "Idioma alterado para Português!" : "Language switched to English!"
          });
        } catch (e) {}

        const welcomeTemplate = newPreset.welcomeMessage;
        const welcome = welcomeTemplate.replace("{first_name}", from.first_name || "VIP");
        const actionButtons = [
          ...newPreset.welcomeButtons,
          [
            { text: "🇺🇸 English", callback_data: "set_lang_en" },
            { text: "🇧🇷 Português", callback_data: "set_lang_pt" }
          ]
        ];
        await this.sendMessage(chatId, welcome, actionButtons);
        return;
      }

      // Fallback response for custom callbacks
      await this.sendMessage(chatId, `Opção selecionada: *${data}*. Como podemos ajudar mais?`);
      return;
    }

    // 2. Handle Text Messages
    const msg = update.message;
    if (!msg || !msg.from) return;

    const chatId = String(msg.chat.id);
    const text = (msg.text || "").trim();
    const from = msg.from;

    // Deduplicate message by message_id
    if (msg.message_id) {
      const msgKey = `msg_${chatId}_${msg.message_id}`;
      if (this.processedMessageKeys.has(msgKey)) {
        return;
      }
      this.processedMessageKeys.add(msgKey);
      if (this.processedMessageKeys.size > 5000) {
        const first = this.processedMessageKeys.values().next().value;
        if (first !== undefined) this.processedMessageKeys.delete(first);
      }
    }

    // Record chat message
    const msgList = this.chats.get(chatId) || [];
    msgList.push({
      id: "msg_" + (msg.message_id || Date.now()),
      chat_id: chatId,
      sender: "user",
      text: text,
      timestamp: nowStr
    });
    this.chats.set(chatId, msgList);
    this.saveChats();

    // 快捷语言切换指令识别
    const trimmedLower = text.toLowerCase().trim();
    if (trimmedLower === "/en" || trimmedLower === "en" || trimmedLower === "english") {
      if (sub) {
        sub.language_code = "en";
        sub.tags = Array.from(new Set([...sub.tags, "英语客户", "English"]));
        this.saveSubscribers();
      }
      const usPreset = GLOBAL_MARKET_PRESETS.find(p => p.id === "us_en") || GLOBAL_MARKET_PRESETS[0];
      const welcome = usPreset.welcomeMessage.replace("{first_name}", from.first_name || "VIP");
      const fullButtons = [
        ...usPreset.welcomeButtons,
        [
          { text: "🇺🇸 English", callback_data: "set_lang_en" }, { text: "🇧🇷 Português", callback_data: "set_lang_pt" }
        ]
      ];
      await this.sendMessage(chatId, "🇧🇷 *Idioma alterado para Português com sucesso!*\n\n" + welcome, fullButtons as any);
      return;
    }

    // Extract referral from /start <param>
    let referral = "organic";
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      if (parts.length > 1 && parts[1]) {
        referral = parts[1].trim();
      }
    }

    let sub = this.subscribers.get(chatId);
    let isNew = false;
    if (!sub) {
      isNew = true;
      sub = {
        id: chatId,
        username: from.username || "",
        first_name: from.first_name || "Telegram User",
        last_name: from.last_name || "",
        source_campaign: referral,
        language_code: from.language_code || "en",
        status: "lead",
        tags: ["新订阅", referral !== "organic" ? `${referral}来源` : "自然搜索"],
        notes: `通过 /start ${referral} 首次激活`,
        first_seen: nowStr,
        last_active: nowStr,
        messages_count: 1,
        last_message: text
      };
      this.subscribers.set(chatId, sub);

      // Update deep link conversion metrics
      const dl = this.config.deepLinks.find(d => d.code === referral);
      if (dl) {
        dl.subscribersCount = (dl.subscribersCount || 0) + 1;
        dl.visits = (dl.visits || 0) + 1;
        const rate = ((dl.subscribersCount / Math.max(dl.visits, 1)) * 100).toFixed(1);
        dl.conversionRate = `${rate}%`;
        this.saveConfig();
      }
    } else {
      sub.last_active = nowStr;
      sub.messages_count = (sub.messages_count || 0) + 1;
      sub.last_message = text;
      if (from.username) sub.username = from.username;
      if (from.first_name) sub.first_name = from.first_name;
      // 实时同步客户端最新的语言设置！
      if (from.language_code && from.language_code.trim()) {
        const clientLang = from.language_code.toLowerCase();
        if (sub.language_code !== clientLang) {
          console.log(`🌐 [Language Sync] User ${chatId} (${from.first_name}) changed language: ${sub.language_code} -> ${clientLang}`);
          sub.language_code = clientLang;
        }
      }
    }
    this.saveSubscribers();

    // Resolve market preset for active user
    // 优先读取用户之前的语言记忆，如果用户之前标记过 ko 则永久使用韩语，确保绝不串台
    const detectedLang = from.language_code || sub?.language_code;
    const userPreset = this.config.autoMultiLanguage
      ? getPresetByLang(detectedLang)
      : (GLOBAL_MARKET_PRESETS.find(p => p.id === this.config.currentPresetId) || GLOBAL_MARKET_PRESETS[1]);

    // Respond to /start
    if (text.startsWith("/start")) {
      const now = Date.now();
      const lastStart = this.lastStartTimestamps.get(chatId) || 0;
      if (now - lastStart < 3000) {
        // Prevent double greeting within 3 seconds
        return;
      }
      this.lastStartTimestamps.set(chatId, now);

      const welcomeTemplate = this.config.autoMultiLanguage
        ? userPreset.welcomeMessage
        : this.config.welcomeMessage;
      const welcomeButtons = this.config.autoMultiLanguage
        ? userPreset.welcomeButtons
        : this.config.welcomeButtons;

      const welcome = welcomeTemplate.replace("{first_name}", from.first_name || "Amigo");
      const fullButtons = [
        ...welcomeButtons,
        [
          { text: "🇺🇸 English", callback_data: "set_lang_en" },
          { text: "🇧🇷 Português", callback_data: "set_lang_pt" }
        ]
      ];
      await this.sendMessage(chatId, welcome, fullButtons);
      return;
    }

    // Match auto-replies (已优化：忽略大段粘贴长文本 + 规则去重 + 4秒单用户防抖锁)
    const lower = text.toLowerCase().trim();
    if (lower.length > 80) {
      return;
    }

    const seenRuleIds = new Set<string>();
    const rawRules = this.config.autoMultiLanguage
      ? [...userPreset.autoReplies, ...this.config.autoReplies]
      : this.config.autoReplies;
    const rulesToMatch = rawRules.filter(r => {
      if (!r || !r.id) return false;
      if (seenRuleIds.has(r.id)) return false;
      seenRuleIds.add(r.id);
      return true;
    });

    for (const rule of rulesToMatch) {
      if (!rule.enabled) continue;
      const trig = rule.trigger.toLowerCase().trim();
      let matched = false;
      if (rule.matchType === "exact" && lower === trig) matched = true;
      else if (rule.matchType === "contains" && lower.includes(trig)) matched = true;
      else if (rule.matchType === "prefix" && lower.startsWith(trig)) matched = true;

      if (matched) {
        // 防抖：同一个用户在 4 秒内命中相同规则，禁止重复发送
        const lastReply = this.lastReplyTimestampByChat.get(chatId);
        const now = Date.now();
        if (lastReply && lastReply.key === rule.id && now - lastReply.time < 4000) {
          console.log(`⚠️ [Official Bot] Ignored duplicate auto-reply (${rule.id}) for user ${chatId}`);
          return;
        }
        this.lastReplyTimestampByChat.set(chatId, { key: rule.id, time: now });

        await this.sendMessage(chatId, rule.replyText, rule.buttons);
        return;
      }
    }
  }

  // Start polling for updates
  public startPolling() {
    if (this.isPollingActive) return;
    if (!this.config.botToken) return;

    this.isPollingActive = true;
    this.config.mode = "polling";
    this.saveConfig();
    console.log(`🤖 [Official Bot] Polling daemon started for @${this.config.botInfo?.username || 'bot'}`);

    let lastFetchTimestamp = Date.now();

    // 守护看门狗：每 8 秒检查一次，如果网络卡顿超过 15 秒，强制复位锁并立即恢复轮询
    if ((this as any)._watchdogTimer) {
      clearInterval((this as any)._watchdogTimer);
    }
    (this as any)._watchdogTimer = setInterval(() => {
      if (!this.isPollingActive) return;
      if (this.isFetchingUpdates && Date.now() - lastFetchTimestamp > 15000) {
        console.warn("⚠️ [Official Bot] Polling lock timeout, force resetting polling state...");
        this.isFetchingUpdates = false;
        poll();
      }
    }, 8000);

    const poll = async () => {
      if (!this.isPollingActive) return;
      if (this.isFetchingUpdates) {
        if (this.isPollingActive) {
          this.pollingInterval = setTimeout(poll, 800);
        }
        return;
      }

      this.isFetchingUpdates = true;
      lastFetchTimestamp = Date.now();
      try {
        const payload: any = {
          timeout: 10,
          limit: 100
        };
        if (this.lastUpdateId > 0) {
          payload.offset = this.lastUpdateId + 1;
        }
        const updates = await this.callTelegramApi("getUpdates", payload);
        if (Array.isArray(updates) && updates.length > 0) {
          console.log(`📥 [Official Bot] Processing ${updates.length} incoming updates...`);
          for (const up of updates) {
            this.lastUpdateId = Math.max(this.lastUpdateId, up.update_id);
            try {
              await this.handleIncomingUpdate(up);
            } catch (upErr: any) {
              console.error("⚠️ [Official Bot] Error handling update:", upErr?.message);
            }
          }
        }
      } catch (err: any) {
        // 网络抖动自动退避
      } finally {
        this.isFetchingUpdates = false;
        if (this.isPollingActive) {
          this.pollingInterval = setTimeout(poll, 600);
        }
      }
    };

    poll();
  }

  public stopPolling() {
    this.isPollingActive = false;
    if (this.pollingInterval) {
      clearTimeout(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.config.mode = "standby";
    this.saveConfig();
  }

  // Get all subscribers
  public getSubscribers(filter?: { campaign?: string; tag?: string; status?: string; search?: string }): Subscriber[] {
    let list = Array.from(this.subscribers.values());
    if (!filter) return list;

    if (filter.campaign && filter.campaign !== "all") {
      list = list.filter(s => s.source_campaign === filter.campaign);
    }
    if (filter.status && filter.status !== "all") {
      list = list.filter(s => s.status === filter.status);
    }
    if (filter.tag && filter.tag !== "all") {
      list = list.filter(s => s.tags.includes(filter.tag!));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(s =>
        (s.first_name && s.first_name.toLowerCase().includes(q)) ||
        (s.username && s.username.toLowerCase().includes(q)) ||
        s.id.includes(q) ||
        (s.last_message && s.last_message.toLowerCase().includes(q))
      );
    }
    return list;
  }

  // Get chat history for specific chat_id
  public getChatHistory(chatId: string): ChatMessage[] {
    return this.chats.get(chatId) || [];
  }

  // Broadcast message to audience
  public async executeBroadcast(broadcastId: string, title: string, text: string, targetCampaign?: string, targetTag?: string, buttons?: InlineButton[]): Promise<BroadcastTask> {
    let targets = Array.from(this.subscribers.values());
    if (targetCampaign && targetCampaign !== "all") {
      targets = targets.filter(t => t.source_campaign === targetCampaign);
    }
    if (targetTag && targetTag !== "all") {
      const cleanTag = targetTag.replace("用户", "").trim();
      targets = targets.filter(t => 
        t.tags.includes(targetTag) || 
        t.tags.some(tg => tg.includes(cleanTag) || cleanTag.includes(tg))
      );
    }

    // 如果指定标签没有匹配到，自动兜底发送给全部客户，避免空发失败
    if (targets.length === 0) {
      targets = Array.from(this.subscribers.values());
    }

    const task: BroadcastTask = {
      id: broadcastId || "bc_" + Date.now(),
      title: title,
      text: text,
      targetCampaign: targetCampaign,
      targetTag: targetTag,
      status: "running",
      total: targets.length,
      sent: 0,
      failed: 0,
      createdAt: new Date().toISOString().replace("T", " ").slice(0, 19)
    };
    this.broadcasts.unshift(task);
    this.saveBroadcasts();

    // Run async broadcast with rate limit
    (async () => {
      for (const target of targets) {
        try {
          await this.sendMessage(target.id, text, buttons);
          task.sent++;
        } catch (e) {
          task.failed++;
        }
        this.saveBroadcasts();
        // Safe 35ms sleep to ensure < 30 msg/sec official rate limit
        await new Promise(r => setTimeout(r, 40));
      }
      task.status = "completed";
      task.completedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
      this.saveBroadcasts();
    })();

    return task;
  }

  public getBroadcasts(): BroadcastTask[] {
    return this.broadcasts;
  }

  // Manage deep links
  public addDeepLink(code: string, name: string, channel: any, notes?: string): DeepLinkCampaign {
    const cleanCode = code.trim().replace(/[^a-zA-Z0-9_-]/g, "");
    const dl: DeepLinkCampaign = {
      id: "dl_" + Date.now(),
      code: cleanCode,
      name: name,
      channel: channel || "other",
      visits: 0,
      subscribersCount: 0,
      conversionRate: "0.0%",
      createdAt: new Date().toISOString().split("T")[0],
      notes: notes || ""
    };
    this.config.deepLinks.push(dl);
    this.saveConfig();
    return dl;
  }

  public deleteDeepLink(id: string) {
    this.config.deepLinks = this.config.deepLinks.filter(d => d.id !== id);
    this.saveConfig();
  }

  // Delete subscriber
  public clearAllSubscribers() {
    this.subscribers.clear();
    this.chats.clear();
    this.saveSubscribers();
    this.saveChats();
  }

  public deleteSubscriber(id: string): boolean {
    const deleted = this.subscribers.delete(id);
    this.chats.delete(id);
    this.saveSubscribers();
    this.saveChats();
    return deleted;
  }

  // Reset all channel metrics to zero
  public resetAllStats() {
    this.config.deepLinks.forEach(dl => {
      dl.visits = 0;
      dl.subscribersCount = 0;
      dl.conversionRate = "0.0%";
    });
    this.saveConfig();
  }

  // Get all market presets
  public getMarketPresets(): MarketPreset[] {
    return GLOBAL_MARKET_PRESETS;
  }

  // Apply market preset
  public applyMarketPreset(presetId: string): MarketPreset | null {
    const preset = GLOBAL_MARKET_PRESETS.find(p => p.id === presetId);
    if (!preset) return null;
    this.config.currentPresetId = preset.id;
    this.config.welcomeMessage = preset.welcomeMessage;
    this.config.welcomeButtons = preset.welcomeButtons;
    this.config.autoReplies = preset.autoReplies;

    // Add suggested deep links if not already present
    preset.suggestedDeepLinks.forEach(item => {
      const exists = this.config.deepLinks.some(d => d.code === item.code);
      if (!exists) {
        this.config.deepLinks.push({
          id: "dl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          code: item.code,
          name: item.name,
          channel: item.channel as any,
          visits: 0,
          subscribersCount: 0,
          conversionRate: "0.0%",
          createdAt: new Date().toISOString().split("T")[0],
          notes: item.notes
        });
      }
    });

    this.saveConfig();
    return preset;
  }

  // Toggle auto-detect multi language mode
  public setAutoMultiLanguage(enabled: boolean): boolean {
    this.config.autoMultiLanguage = enabled;
    this.saveConfig();
    return enabled;
  }

  // Update subscriber details
  public updateSubscriber(id: string, updates: Partial<Subscriber>): Subscriber | null {
    const sub = this.subscribers.get(id);
    if (!sub) return null;
    const updated = { ...sub, ...updates };
    this.subscribers.set(id, updated);
    this.saveSubscribers();
    return updated;
  }
}

export const officialBotEngine = new OfficialBotEngine();
