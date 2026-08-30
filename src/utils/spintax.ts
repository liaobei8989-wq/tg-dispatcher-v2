/**
 * Advanced Multi-Tier Recursive Spintax & Anti-Fingerprint Mutation Engine
 * Specially optimized for Telegram Brazil (pt-BR) marketing campaigns.
 */

import { SpintaxTestResult } from '../types';

/**
 * Recursively parse multi-tier nested Spintax:
 * e.g. "{ {Olá|Oi|E aí} {amigo|camarada|parceiro} | Fala mano }, {tudo bem?|como você tá?|tudo em paz?}"
 */
export function parseSpintax(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let current = text;
  const innermostRegex = /\{([^{}]+)\}/;
  let guard = 0;

  // Bottom-up recursive reduction of innermost braces
  while (innermostRegex.test(current) && guard < 100) {
    current = current.replace(innermostRegex, (_, optionsStr) => {
      const options = optionsStr.split('|');
      const randomIndex = Math.floor(Math.random() * options.length);
      return options[randomIndex];
    });
    guard++;
  }

  return current;
}

/**
 * Validate Spintax syntax (checks balanced braces, unescaped characters, empty branches)
 */
export function validateSpintaxSyntax(text: string): { isValid: boolean; errors: string[]; depth: number } {
  const errors: string[] = [];
  let depth = 0;
  let maxDepth = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '{') {
      depth++;
      if (depth > maxDepth) maxDepth = depth;
    } else if (char === '}') {
      depth--;
      if (depth < 0) {
        errors.push(`第 ${i + 1} 个字符处存在多余的闭合括号 '}'`);
        depth = 0;
      }
    }
  }

  if (depth > 0) {
    errors.push(`存在 ${depth} 个未闭合的左括号 '{'，请检查语法结构`);
  }

  // Check for empty pipes e.g. {a||b} or {|a} or {a|}
  const emptyBranchRegex = /\{([^}]*\|\|[^}]*)\}/;
  if (emptyBranchRegex.test(text)) {
    errors.push(`发现连续的竖线 '||' 导致存在空选项分支`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    depth: maxDepth
  };
}

/**
 * Calculate the total number of unique combinations possible in a Spintax string
 */
export function calculateSpintaxCombinations(text: string): number {
  if (!text) return 1;

  // Helper to calculate combinations inside a bracketed block
  function countBlock(block: string): number {
    let parts: string[] = [];
    let cur = '';
    let depth = 0;

    for (let i = 0; i < block.length; i++) {
      const c = block[i];
      if (c === '{') {
        depth++;
        cur += c;
      } else if (c === '}') {
        depth--;
        cur += c;
      } else if (c === '|' && depth === 0) {
        parts.push(cur);
        cur = '';
      } else {
        cur += c;
      }
    }
    parts.push(cur);

    let sum = 0;
    for (const part of parts) {
      sum += countSequences(part);
    }
    return Math.max(1, sum);
  }

  function countSequences(str: string): number {
    let product = 1;
    let i = 0;
    while (i < str.length) {
      if (str[i] === '{') {
        let depth = 1;
        let j = i + 1;
        while (j < str.length && depth > 0) {
          if (str[j] === '{') depth++;
          else if (str[j] === '}') depth--;
          j++;
        }
        const inner = str.slice(i + 1, j - 1);
        product *= countBlock(inner);
        i = j;
      } else {
        i++;
      }
    }
    return product;
  }

  try {
    const total = countSequences(text);
    return total > 0 ? total : 1;
  } catch (e) {
    return 1;
  }
}

/**
 * Complete Spintax analysis with combination count, samples and validation
 */
export function analyzeSpintax(text: string, sampleCount: number = 6): SpintaxTestResult {
  const validation = validateSpintaxSyntax(text);
  const totalCombinations = validation.isValid ? calculateSpintaxCombinations(text) : 0;
  
  const previewSamples: string[] = [];
  if (validation.isValid && text.trim()) {
    const set = new Set<string>();
    let attempts = 0;
    const maxAttempts = sampleCount * 25;
    while (set.size < sampleCount && attempts < maxAttempts) {
      set.add(parseSpintax(text));
      attempts++;
    }
    previewSamples.push(...Array.from(set));
  }

  return {
    totalCombinations,
    previewSamples,
    depthLevel: validation.depth,
    isValid: validation.isValid,
    errors: validation.errors
  };
}

/**
 * Replace placeholders e.g. {NAME}, {BONUS}, {URL}, {CODE}
 */
export function replaceVariables(
  template: string,
  vars: Record<string, string>
): string {
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const reg = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(reg, val);
  }
  return result;
}

export function generateSpintaxVariants(text: string, count: number = 5): string[] {
  const variants = new Set<string>();
  let attempts = 0;
  while (variants.size < count && attempts < count * 15) {
    variants.add(parseSpintax(text));
    attempts++;
  }
  return Array.from(variants);
}

/**
 * Injects invisible zero-width Unicode characters (ZWSP, ZWNJ, ZWJ, BOM) randomly
 * into the text and around punctuation to completely break Telegram message hash matching.
 */
export function injectAntiHashPadding(text: string): string {
  if (!text) return '';
  const zeroWidthChars = ['\u200B', '\u200C', '\u200D', '\uFEFF', '\u2060'];
  
  // 1. Insert 1-3 random zero-width chars at random word boundaries
  const words = text.split(' ');
  const modifiedWords = words.map((w, idx) => {
    if (idx > 0 && Math.random() < 0.4) {
      const zwChar = zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)];
      return zwChar + w;
    }
    return w;
  });

  let result = modifiedWords.join(' ');

  // 2. Append 1-2 zero-width characters at the very end
  const tailCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < tailCount; i++) {
    result += zeroWidthChars[Math.floor(Math.random() * zeroWidthChars.length)];
  }

  return result;
}

/**
 * Formats Brazilian phone numbers into E.164 standard (+55 XX 9XXXX-XXXX)
 */
export function formatBrazilPhone(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  if (!cleaned) return raw;

  if (cleaned.startsWith('55') && (cleaned.length === 12 || cleaned.length === 13)) {
    const ddd = cleaned.substring(2, 4);
    const rest = cleaned.substring(4);
    if (rest.length === 9) {
      return `+55 ${ddd} ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else {
      return `+55 ${ddd} ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  if (cleaned.length === 10 || cleaned.length === 11) {
    const ddd = cleaned.substring(0, 2);
    const rest = cleaned.substring(2);
    if (rest.length === 9) {
      return `+55 ${ddd} ${rest.substring(0, 5)}-${rest.substring(5)}`;
    } else {
      return `+55 ${ddd} ${rest.substring(0, 4)}-${rest.substring(4)}`;
    }
  }

  return `+${cleaned}`;
}

/**
 * Sanitizes and extracts valid phone numbers or Telegram usernames from raw input text/CSV
 */
export function sanitizePhoneList(rawInput: string): string[] {
  if (!rawInput) return [];
  const lines = rawInput.split(/[\r\n,;]+/);
  const result: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Handle Telegram usernames starting with @
    if (trimmed.startsWith('@')) {
      const username = trimmed.toLowerCase();
      if (!seen.has(username)) {
        seen.add(username);
        result.push(username);
      }
      continue;
    }

    // Clean numeric phone numbers
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 8) {
      const formatted = digits.startsWith('55') ? digits : `55${digits}`;
      if (!seen.has(formatted)) {
        seen.add(formatted);
        result.push(formatted);
      }
    }
  }

  return result;
}

/**
 * Utility to export data to a downloadable CSV file.
 * Supports both:
 * 1) exportToCSV(filename, headers, rows)
 * 2) exportToCSV(recordsArray, filename)
 */
export function exportToCSV(
  firstArg: string | Record<string, any>[],
  secondArg?: string[] | string,
  thirdArg?: (string | number)[][]
): void {
  let filename = 'export.csv';
  let csvLines: string[] = [];

  if (typeof firstArg === 'string') {
    // Signature: (filename, headers, rows)
    filename = firstArg.endsWith('.csv') ? firstArg : `${firstArg}.csv`;
    const headers = Array.isArray(secondArg) ? secondArg : [];
    const rows = Array.isArray(thirdArg) ? thirdArg : [];

    if (headers.length > 0) {
      csvLines.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));
    }
    for (const row of rows) {
      csvLines.push(row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','));
    }
  } else if (Array.isArray(firstArg)) {
    // Signature: (recordsArray, filename)
    if (typeof secondArg === 'string') {
      filename = secondArg.endsWith('.csv') ? secondArg : `${secondArg}.csv`;
    }
    if (firstArg.length > 0) {
      const headers = Object.keys(firstArg[0]);
      csvLines.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));
      for (const row of firstArg) {
        const values = headers.map(header => {
          const val = row[header];
          return `"${String(val ?? '').replace(/"/g, '""')}"`;
        });
        csvLines.push(values.join(','));
      }
    }
  }

  if (csvLines.length === 0) return;

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvLines.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * High-Converting Brazilian Portuguese Spintax Snippet Presets
 */
export const BRAZILIAN_SPINTAX_PRESETS = [
  {
    name: "多层复合破冰问候 (Multi-Tier Icebreaker)",
    spintax: "{ {Oi|Olá|E aí} {amigo|camarada|parceiro|meu consagrado} | Fala {mano|jogador|chefe} }, {tudo {bem|joia|certo|em paz}|como você tá|como vão as coisas}? Vi seu perfil {lá no grupo|nos comentários do canal|no chat de apostas} e {resolvi passar pra dar um salve|vim te mandar um oi|achei super legal vir trocar uma ideia}! {😊|👋|🔥|✨}"
  },
  {
    name: "Fortune Tiger 爆分福利 (Tiger Jackpot Promo)",
    spintax: "{🔥 {Alerta de Forra|Bug do Tigre Confirmado|Sinal Quente}!|🐯 {Atenção Jogadores|Nova Rodada VIP}!} {O robô acabou de identificar|Nossa inteligência detectou|Acabou de soltar} {98.7% de assertividade|horários pagantes nas próximas horas} na plataforma {brazilgo888.com|brazilgo888.com/vip}. {Bônus de {100%|200%|R$ 50 grátis} no primeiro depósito via PIX!|Cadastre-se e ganhe rodadas grátis imediatas!} {Bora lucrar?|Vem forrar com a gente!|Aproveita enquanto tá pagando!}"
  },
  {
    name: "PIX 即时提现官方通道 (Instant PIX Channel)",
    spintax: "{💰 {Saques instantâneos via PIX|Pagamento comprovado na conta}!|🚀 {Plataforma 100% regulamentada|Deposite e jogue sem travas}!} {Já conhece o canal oficial?|Acesse agora o link seguro}: {brazilgo888.com|brazilgo888.com/cadastro} {com suporte 24h e bônus exclusivo|onde o PIX cai em menos de 30 segundos}. {Qualquer dúvida estou por aqui!|Bons lucros pra você hoje!}"
  }
];
