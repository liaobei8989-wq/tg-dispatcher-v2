export interface BlessingTemplate {
  id: string;
  name: string;
  category: 'jackpot' | 'pix' | 'support' | 'short';
  content: string;
  description: string;
}

export const PRESET_BLESSING_TEMPLATES: BlessingTemplate[] = [
  {
    id: 'blessing-jackpot-1',
    name: '🎰 祝老板爆大奖 / 老虎机PG爆分 (Jackpot & Forra)',
    category: 'jackpot',
    description: '祝老板爆出超级大奖、老虎机出分，巴西玩家最喜爱的地道黑话',
    content: '{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Boa sorte|🚀 Arrebenta lá|🔥 Sucesso} {patrão|chefe|meu amigo|campeão|amigo}! {Que venha o grande jackpot|Hoje a forra é certa|Bora lucrar pesado nos giros|Que venha muitos ganhos hoje}! 🎰💵 {Qualquer dúvida estou por aqui|Se precisar de ajuda só chamar|Tamo junto}! 😉'
  },
  {
    id: 'blessing-tiger-2',
    name: '🐯 祝老板老虎机放水出卡 (Fortune Tiger Soltar Carta)',
    category: 'jackpot',
    description: '针对 Fortune Tiger 等热门老虎机游戏，祝老板遇上大暴击',
    content: '{🐯 Boa sorte aí|🎰 Muita sorte nas rodadas|🔥 Sucesso} {patrão|chefe|campeão}! {Que o Tigre solte a carta pra você hoje|Tomara que estoure a banca com lucro alto|Que venha aquele Big Win insano}! 💰🏆 {Bom jogo e boas apostas|Qualquer coisa me avisa aqui}! 🍀'
  },
  {
    id: 'blessing-pix-3',
    name: '💸 祝老板PIX提款秒到 / 天天提现 (Saques no PIX)',
    category: 'pix',
    description: '祝老板今天提款顺利、狂提 PIX 现金',
    content: '{💎 Muito sucesso|🎉 Boas apostas|🤑 Lucro garantido} {chefia|patrão|meu parceiro}! {Que você saque muito no PIX hoje|Tomara que multiplique sua banca com segurança|Que hoje seja seu dia de forrar}! 🚀💵 {Tamo junto sempre|Qualquer dúvida só mandar mensagem}! 🙌'
  },
  {
    id: 'blessing-support-4',
    name: '🤝 贴心客服陪伴 / 有疑问随时找我 (Suporte VIP)',
    category: 'support',
    description: '拉近与客户的距离，树立真实可信的 1 对 1 专属客服形象，降低被举报率',
    content: '{✨ Boa sorte nos jogos|🍀 Ótimas apostas|🎲 Bom jogo} {meu amigo|meu querido|parceiro}! {Aproveita o bônus e arrebenta lá|Vai dar bom demais hoje|Bora lucrar}! 🤑 {Se tiver qualquer dúvida sobre cadastro, depósito ou bônus, só me chamar aqui no chat|Qualquer coisa me chama que te ajudo|Estou à disposição}! 💬❤️'
  },
  {
    id: 'blessing-short-5',
    name: '⚡ 极速精炼版 (Curto & Rápido)',
    category: 'short',
    description: '超短一句话祝福，适合极速追发，最自然真实',
    content: '{Boa sorte aí|Muito boa sorte|Sucesso nas apostas} {patrão|chefe|amigo}! 🍀 {Que venha o forro|Bora faturar} hoje! 🎰'
  }
];

export const DEFAULT_BLESSING_SPINTAX = '{🍀 Boa sorte|💰 Desejo muita sorte|🤑 Boa sorte|🚀 Arrebenta lá|🔥 Sucesso} {patrão|chefe|meu amigo|campeão|amigo}! {Que venha o grande jackpot|Hoje a forra é certa|Bora lucrar pesado nos giros|Que venha muitos ganhos hoje}! 🎰💵 {Qualquer dúvida estou por aqui|Se precisar de ajuda só chamar|Tamo junto}! 😉';
