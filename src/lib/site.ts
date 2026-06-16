const DEFAULT_SITE_URL = 'http://localhost:3001';

export const siteConfig = {
  name: 'Bingo Fácil',
  shortName: 'Bingo Fácil',
  description:
    'Crie, gerencie e realize sorteios profissionais com conferência automática de cartelas.',
  locale: 'pt_BR',
  ogImagePath: '/og.png',
} as const;

export function getSiteUrl() {
  const url = process.env.BETTER_AUTH_URL?.replace(/\/$/, '');
  return url || DEFAULT_SITE_URL;
}

export function getOgImageUrl() {
  return `${getSiteUrl()}${siteConfig.ogImagePath}`;
}
