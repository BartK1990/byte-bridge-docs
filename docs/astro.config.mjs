// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The docs are served under the website: https://bartk1990.github.io/protocol-bridge-docs/docs/.
// The Pages workflow passes the site's base path (it changes with a custom domain).
const site = process.env.SITE_URL || 'https://bartk1990.github.io';
const siteBase = (process.env.SITE_BASE ?? '/protocol-bridge-docs').replace(/\/$/, '');

export default defineConfig({
    site,
    base: `${siteBase}/docs`,
    trailingSlash: 'always',
    integrations: [
        starlight({
            title: 'Protocol Bridge Docs',
            description: 'How to use the Protocol Bridge tester and configure a Protocol Bridge gateway.',
            logo: { light: './src/assets/logo-light.gif', dark: './src/assets/logo-dark.gif', alt: 'Protocol Bridge' },
            favicon: '/favicon.svg',
            customCss: ['./src/styles/brand.css'],
            social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/BartK1990/protocol-bridge-docs' }],
            sidebar: [
                { label: '← Protocol Bridge website', link: `${site}${siteBase}/`, attrs: { target: '_self' } },
                {
                    label: 'Start here',
                    items: [
                        { label: 'Introduction', link: '/' },
                        { slug: 'concepts' },
                    ],
                },
                { label: 'Tester', items: [{ autogenerate: { directory: 'tester' } }] },
                { label: 'Gateway', items: [{ autogenerate: { directory: 'gateway' } }] },
            ],
        }),
    ],
});
