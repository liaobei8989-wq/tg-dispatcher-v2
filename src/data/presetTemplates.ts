import { PromotionalTemplate } from '../types';

export const PRESET_TEMPLATES: PromotionalTemplate[] = [
  // ================= Mostbet 盘口专属文案 (1 ~ 3) =================
  {
    id: 'mostbet-1-lpl-500bonus',
    name: '🔴 [Mostbet 盘口 1] LPL 2026 体育/500%首充+150Spins (PROMO CODE)',
    category: 'sports_vip',
    platformTarget: 'telegram',
    isDefault: true,
    content: `{🏆 MOSTBET LPL 2026 — A NOVA ERA DE RECOMPENSAS!|🔥 O MAIOR BÔNUS DO BRASIL NA MOSTBET!}\n💰 BÔNUS DE DEPÓSITO DE 500% + 150 RODADAS GRÁTIS (FREE SPINS)!\n🎁 Use o código promocional exclusivo e ative agora!\n🔥 Aposte mais, ganhe muito mais no melhor site do Brasil!\n⚡ Saque via PIX instantâneo — sem taxas e sem burocracia!\n👇 Clique no link oficial e resgate seu bônus de 500%:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: 'mostbet-2-winning-awaiting',
    name: '🔴 [Mostbet 盘口 2] Your Winning Is Awaiting! 500%+150 Free Spins',
    category: 'welcome_bonus',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🎰 YOUR WINNING IS AWAITING NA MOSTBET!|👑 SUA VITÓRIA TE ESPERA NA MOSTBET!}\n💥 CLAIM 500% DE BÔNUS DE DEPÓSITO + 150 FREE SPINS!\n🏆 A melhor oportunidade para multiplicar seu banca hoje mesmo!\n✓ Depósito rápido e seguro\n✓ Jogos com maior taxa de pagamento (RTP 98%+)\n✓ Saque ilimitado via PIX\n👉 Registre-se agora e ative o bônus exclusivo:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: 'mostbet-3-pix-instant-spins',
    name: '🔴 [Mostbet 盘口 3] PIX 秒到账 + 150 Spins 免费轮盘爆彩',
    category: 'pix_payout',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🔥 SAQUE RÁPIDO E GARANTIDO VIA PIX NA MOSTBET!|💰 BÔNUS VIP MOSTBET ATIVADO!}\n🎰 Receba 500% no seu primeiro depósito + 150 Rodadas Grátis!\n⚡ Pague R$10 e receba bônus instantâneo para jogar Fortune Tiger, Aviator e Roleta!\n💰 Prêmios liberados a cada segundo!\n👉 Acesse o link oficial Mostbet agora:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },

  // ================= 933 盘口专属炒群与追发文案 (1 ~ 10) =================
  {
    id: '933-1-plano-milionario',
    name: '💎 [933 盘口 1] 代理招募 - Plano Anual Milionário (拉人R$60/月入百万)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🔥 Convide amigos para o grupo 668xt e ganhe até R$ 1 milhão por ano! 💰🔥|📢 RECRUTAMENTO DE AGENTES SENIORES 933/668XT!}\n📢 Estamos recrutando agentes seniores para o "Plano Anual Milionário" do Grupo!\n✅ Se você tem influência no Instagram, YouTube, Facebook, Telegram...\n✅ Se você puder divulgar o Grupo para o seu público...\n✅ Entre em contato com nosso atendimento ao cliente agora mesmo!\n💰 Oferecemos bônus generosos (Convide 1 pessoa e ganhe R$60) e salário fixo!\n🤑 Salário alto + bônus generosos estão esperando por você!\n🚀 Junte-se a nós e transforme sua influência em uma renda de milhões!\n👉 Link de registro exclusivo oficial do 668xt:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-2-chave-de-dinheiro',
    name: '💎 [933 盘口 2] Chave de Dinheiro 财运金钥匙 (88轮爆奖+PIX秒提)',
    category: 'pix_payout',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🔑 CHAVE DE DINHEIRO LIBERADA! RESGATE SEUS BÔNUS GRÁTIS!|🎉 AVISO URGENTE: CANAL DE BÔNUS 933/KK76JÁ ABERTO!}\nVer esta mensagem já é uma oportunidade.\n🎉 Deposite agora e receba bônus instantâneos 💰\n✓ Segurança dos fundos garantida\n✓ Saques ilimitados via PIX\n👉 Inscrição exclusiva oficial:\n{URL}\n\n🐯🔥 O popular jogo brasileiro "Tigre da Fortuna" está com uma distribuição incrível de prêmios!\n🎆 88 rodadas de oportunidades de recompensa disponíveis hoje!\n⚠️ Lembrete Importante: Quem participar agora já está lucrando!\n🔥 Participe agora, o próximo sortudo pode ser você!`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-3-roleta-premiada',
    name: '💎 [933 盘口 3] 幸运转盘 Roleta da Sorte (R$60 ~ R$1000 随机拿)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🎡 ROLETA DA SORTE & CHUVA DE DINHEIRO 933!|💸 GIRE E GANHE DE R$60 A R$1.000 NO PIX!}\n🌟 A nova plataforma do Grupo kk76já / 668xt está no ar!\n🎯 Gire a roleta premiada e ganhe bônus em dinheiro de R$60 até R$1.000 direto no seu PIX!\n✓ Depósitos mínimos de R$10\n✓ Saque ilimitado sem taxa\n👇 Clique no link e resgate sua rodada grátis na roleta:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-4-fortune-tiger-3x3',
    name: '💎 [933 盘口 4] Fortune Tiger 96.81% RTP (经典3x3爆倍数)',
    category: 'fortune_tiger',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🔥 A nova plataforma do Grupo kk76já já está disponível!|🐯 NOVO BUG DO FORTUNE TIGER 668XT CONFIRMADO!}\nLink oficial: 🔗\n{URL}\n\n🐯 O jogo de maior sucesso do Brasil – Fortune Tiger – chegou!\nO Fortune Tiger utiliza um layout clássico de 3x3, com RTP de até 96,81%. Fácil de aprender com multiplicadores altos!\n💥 Símbolos Wild ativam rodadas extras!\n💥 "Modo Fortune Tiger" acionado aleatoriamente!\n💰 Alguém já ganhou um prêmio! O próximo sortudo pode ser você!`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-5-explosao-insana-1999',
    name: '💎 [933 盘口 5] Touro+Dragão+Coelho (首充10送1999/PIX秒到)',
    category: 'fortune_tiger',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🚀 EXPLOSÃO INSANA! Touro + Dragão + Coelho ativados!|💥 BÔNUS BOMBÁSTICO LIBERADO NO 933!}\n💥 Recompensas altas sendo liberadas sem parar!\n💰 Com apenas R$10, você pode chegar a R$1.999!\n🏆 Entre agora! A oportunidade é por tempo limitado!\n🔥 Chance de vitória acima de 98%+\n💰 Saque rápido via PIX — sem espera\n🤑 Cashback diário de até 100%\n✅ Cadastre-se agora e ative bônus de até R$1.999!\n{URL}\n👉 Clique no link acima e registre-se agora!`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-6-beneficios-pg-10real',
    name: '💎 [933 盘口 6] PG 官方福利 R$10 (门槛10/瓜分5555万)',
    category: 'pix_payout',
    platformTarget: 'telegram',
    isDefault: false,
    content: `{🔥 Benefícios oficiais da PG chegaram!|🎁 PROMOÇÃO OFICIAL PG SOFT NO 933!}\n💰 Com apenas R$10 você já pode participar\n⚡ Depósito mínimo R$10, saque mínimo R$10, sem taxas e saque rápido\n🎁 Divida um prêmio total de 55,55 milhões de reais\n🤑 Ganhe até R$300 mil por pessoa\n💸 Bônus diários + cashback em dinheiro sendo liberados sem parar!\n👇 Cadastre-se agora e receba suas recompensas:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-7-codigo-resgate-pdmbm',
    name: '💎 [933 盘口 7] 每日限时兑换码 (pdMbM 免费领红利)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `😁🐺🤍🤍🤍🤍🤍🐺😆\n♦️ Recompensas diárias para os jogadores! ♦️\n🔥 O código de resgate de hoje é 🔥\n🌟 pdMbM 🌟\nComo participar: 💥\n1️⃣ Obtenha o código de resgate agora\n2️⃣ Faça login na sua conta\n3️⃣ Acesse para resgatar a recompensa\n⏰ Horário de resgate (GMT-3)\n🎁 Validade do resgate: 1 dia\n😆 Lembre-se ou salve o site oficial permanente:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-8-lucky-dragon-9674',
    name: '💎 [933 盘口 8] Lucky Dragon 爆大奖喜报 (96.74% RTP)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `🥰 Notícia de última hora! Um jogador brasileiro acaba de ganhar um grande prêmio no Lucky Dragon! Os ganhos chegaram! Parabéns ao sortudo vencedor! 💖\n🐍 Jogo imperdível e com alto retorno já disponível!\n⭐ Taxa de retorno de 96,74%\n💎 Prêmio principal de 10x, bônus surpresa extras de 2x/3x oferecidos continuamente!\n👉 Link oficial de cadastro:\n{URL}\n🔥 Vagas limitadas, participe agora!`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-9-agente-comissao-5521',
    name: '💎 [933 盘口 9] 裂变返佣 5% (专属代码 5521 领日彩)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `🎆 Atividade de Agente Oficial – conexões viram renda real! 📢 Indique amigos e ganhe até 5% bônus diário nas apostas deles!\n💕 Renda mensal até R$ milhões – bilionário possível!\nCódigo de hoje: 💕 5521 💕\n😁 Grana grátis na mão! Vem reivindicar...\n👉 Link oficial:\n{URL}`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  },
  {
    id: '933-10-cash-mania-carnaval',
    name: '💎 [933 盘口 10] Cash Mania 巴西狂欢礼包 (24h客服/矿山)',
    category: 'custom',
    platformTarget: 'telegram',
    isDefault: false,
    content: `👇 🌟 O Carnaval Brasileiro nunca acaba! Cash Mania não é apenas um jogo, é a sua mina de ouro exclusiva! ⛏️ 💎\nOferecemos suporte online 24 horas por dia, 7 dias por semana, com uma equipe brasileira pronta para te atender.\n⚡ Saques rápidos! Outros jogadores já receberam seus ganhos!\n👇 O link já está pronto para você, clique e comece sua jornada rumo aos lucros:\n{URL}\n🌿 Entre agora e receba um kit exclusivo brasileiro 🍀`,
    mediaType: 'none',
    mediaUrl: '',
    variables: ['URL']
  }
];
