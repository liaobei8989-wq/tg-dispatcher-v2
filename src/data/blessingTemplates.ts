export interface BlessingTemplate {
  id: string;
  name: string;
  category: 'channel' | 'jackpot' | 'pix' | 'support' | 'short';
  content: string;
  description: string;
}

export const PRESET_BLESSING_TEMPLATES: BlessingTemplate[] = [
  {
    id: 'blessing-channel-vip',
    name: '🎯 祝老板中奖 + VIP 策略频道 (t.me/brazilgo_chat 推荐首选)',
    category: 'channel',
    description: '祝老板爆奖，并引导加入官方“Chat - Dicas e Estratégias”群，即便网址受限客户也能随时在 TG 找到我们',
    content: '{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Bora forrar|🚀 Arrebenta lá|🔥 Muito sucesso} {meu amigo|parceiro|campeão|chefe|jogador}! {Que venha o grande jackpot|Hoje a forra é certa no Tigrinho|Que você dobre sua banca hoje}! 🎰💵 {E entra também no nosso canal VIP de estratégias e dicas diárias|Aproveita e entra no nosso canal oficial de sinais e bônus|Não esquece de entrar no nosso grupo de dicas exclusivas}: {👉 t.me/brazilgo_chat|👉 https://t.me/brazilgo_chat} {pra pegar os horários que tão pagando e não perder nada|com sinais com 98% de assertividade e suporte direto|onde a gente posta as melhores estratégias pra lucrar}! {Tamo junto|Qualquer dúvida estou por aqui}! 🐯✨'
  },
  {
    id: 'blessing-channel-tiger',
    name: '🐯 老虎机爆分出卡 + 进群查放水时间表 (Fortune Tiger)',
    category: 'channel',
    description: '主打 Fortune Tiger 爆分时间表，吸引客户进群蹲守高爆率时段',
    content: '{🐯 Muita sorte nas rodadas|🔥 Sucesso nos giros|🍀 Boa sorte aí} {patrão|chefe|campeão|amigo}! {Que o Tigre solte a carta pra você hoje|Tomara que estoure a banca com lucro alto|Que venha aquele Big Win insano}! 💰🏆 {Liberamos os horários pagantes atualizados lá no nosso canal VIP|A lista dos minutos pagantes de hoje tá fixada no canal}: {👉 t.me/brazilgo_chat|👉 https://t.me/brazilgo_chat} {corre lá pra conferir antes de girar|entra pra pegar a estratégia completa}! 🚀🍀'
  },
  {
    id: 'blessing-channel-backup',
    name: '🛡️ 官方防封备用频道 + 永不失联通道 (Dicas e Estratégias)',
    category: 'channel',
    description: '强调这是官方备用通讯频道，即使平台域名遭遇风控客户也能持续获取最新线路',
    content: '{💎 Boas apostas|🎉 Muito lucro|🚀 Sucesso garantido} {meu parceiro|chefia|amigo}! {Qualquer dúvida estou à disposição|Tamo junto pro que precisar}! 🤝 {Guarda o nosso canal oficial de suporte e atualizações pra você nunca perder os links e bônus|Se o link oscilar, o acesso rápido e promoções ficam sempre atualizados no nosso canal oficial}: {👉 t.me/brazilgo_chat|👉 https://t.me/brazilgo_chat}! 📲💵'
  },
  {
    id: 'blessing-channel-pix',
    name: '💸 祝老板PIX秒到 + 群内看大奖提现图 (Comprovantes PIX)',
    category: 'pix',
    description: '祝愿玩家提现顺利，并引导进群查看真实出款与交流体验',
    content: '{🤑 Que você saque muito no PIX hoje|💸 Tomara que forre pesado|💰 Que venha muito lucro na conta} {parceiro|amigo|patrão}! {Aproveita os giros grátis|Vai com tudo pra cima do Tigrinho}! 🎰 {Confira os comprovantes de saque e estratégias da galera no nosso canal VIP}: {👉 t.me/brazilgo_chat|👉 https://t.me/brazilgo_chat} {Qualquer coisa só me dar um toque por aqui|Tamo junto sempre}! 🙌💵'
  },
  {
    id: 'blessing-channel-short',
    name: '⚡ 极速精炼版 (祝老板中奖 + 频道秒引流)',
    category: 'short',
    description: '超短一句话祝福附带频道，适合快速触达，最自然真实',
    content: '{🍀 Boa sorte aí|🚀 Arrebenta lá|🔥 Sucesso nas apostas} {amigo|patrão|parceiro}! {Bora forrar|Hoje é dia de lucro}! 🎰 {Dicas e sinais VIP aqui|Canal oficial de estratégias}: {t.me/brazilgo_chat|https://t.me/brazilgo_chat} 🐯💰'
  }
];

export const DEFAULT_BLESSING_SPINTAX = '{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Bora forrar|🚀 Arrebenta lá|🔥 Muito sucesso} {meu amigo|parceiro|campeão|chefe|jogador}! {Que venha o grande jackpot|Hoje a forra é certa no Tigrinho|Que você dobre sua banca hoje}! 🎰💵 {E entra também no nosso canal VIP de estratégias e dicas diárias|Aproveita e entra no nosso canal oficial de sinais e bônus|Não esquece de entrar no nosso grupo de dicas exclusivas}: {👉 t.me/brazilgo_chat|👉 https://t.me/brazilgo_chat} {pra pegar os horários que tão pagando e não perder nada|com sinais com 98% de assertividade e suporte direto|onde a gente posta as melhores estratégias pra lucrar}! {Tamo junto|Qualquer dúvida estou por aqui}! 🐯✨';

