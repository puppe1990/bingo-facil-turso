import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router';
import appCss from '../index.css?url';
import { getOgImageUrl, getSiteUrl, siteConfig } from '../lib/site';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

export const Route = createRootRoute({
  head: () => {
    const siteUrl = getSiteUrl();
    const ogImageUrl = getOgImageUrl();

    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
        { title: siteConfig.title },
        { name: 'description', content: siteConfig.description },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteConfig.name },
        { property: 'og:locale', content: siteConfig.locale },
        { property: 'og:url', content: siteUrl },
        { property: 'og:title', content: siteConfig.title },
        { property: 'og:description', content: siteConfig.description },
        { property: 'og:image', content: ogImageUrl },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: `${siteConfig.name} — ${siteConfig.description}` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: siteConfig.title },
        { name: 'twitter:description', content: siteConfig.description },
        { name: 'twitter:image', content: ogImageUrl },
        { name: 'twitter:image:alt', content: `${siteConfig.name} — ${siteConfig.description}` },
      ],
      links: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicon.png' },
        { rel: 'canonical', href: siteUrl },
        { rel: 'stylesheet', href: appCss },
      ],
    };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
        <HeadContent />
      </head>
      <body className="bg-yellow-50 text-indigo-900 antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}
