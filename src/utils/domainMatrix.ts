/**
 * 🇧🇷 100 Anti-Ban Dynamic Subdomains Generator derived from 5 Auxiliary Domains
 * Base Domains in Cloudflare:
 * 1. promobr1.xyz (20 Subdomains: vip01 ~ vip20)
 * 2. promobr2.xyz (20 Subdomains: vip01 ~ vip20)
 * 3. promobr3.xyz (20 Subdomains: vip01 ~ vip20)
 * 4. promobr4.xyz (20 Subdomains: vip01 ~ vip20)
 * 5. promobr5.xyz (20 Subdomains: vip01 ~ vip20)
 * Total = 100 Dynamic Anti-Ban Subdomains!
 */

export const BASE_5_DOMAINS = [
  'promobr1.xyz',
  'promobr2.xyz',
  'promobr3.xyz',
  'promobr4.xyz',
  'promobr5.xyz'
];

export const SUBDOMAIN_PREFIXES = [
  'vip', 'br', 'pix', 'spin', 'bet',
  'slot', 'lucky', 'win', 'top', 'go',
  'play', 'forra', 'mega', 'sorte', 'ouro',
  'clube', 'brasil', 'premio', 'bonus', 'turbo'
];

/**
 * Generates the full list of 100 dynamic subdomains
 */
export function generate100AntiBanSubdomains(): string[] {
  const subdomains: string[] = [];
  BASE_5_DOMAINS.forEach((domain) => {
    SUBDOMAIN_PREFIXES.forEach((prefix, idx) => {
      const numStr = (idx + 1).toString().padStart(2, '0');
      subdomains.push(`https://${prefix}${numStr}.${domain}`);
    });
  });
  return subdomains;
}

/**
 * Returns a Spintax string of all 100 dynamic subdomains
 * Example: {https://vip01.promobr1.xyz|https://br02.promobr1.xyz|...}
 */
export function get100SubdomainsSpintax(): string {
  const list = generate100AntiBanSubdomains();
  return `{${list.join('|')}}`;
}

/**
 * Returns a random subdomain from the 100 subdomains pool
 */
export function getRandomAntiBanSubdomain(): string {
  const list = generate100AntiBanSubdomains();
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

/**
 * Replaces generic URLs or variables with a randomly rotated dynamic subdomain from the 100 pool
 */
export function injectAntiBanDomain(text: string): string {
  if (!text) return text;
  return text.replace(/\{URL\}|https:\/\/mostbet\.com\/pt|https:\/\/mostbet\.com/g, () => getRandomAntiBanSubdomain());
}
