// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// The docs are served under the website: https://bartk1990.github.io/byte-bridge-docs/docs/.
// The Pages workflow passes the site's base path (it changes with a custom domain).
const site = process.env.SITE_URL || 'https://bartk1990.github.io';
const siteBase = (process.env.SITE_BASE ?? '/byte-bridge-docs').replace(/\/$/, '');

export default defineConfig({
    site,
    base: `${siteBase}/docs`,
    trailingSlash: 'always',
    integrations: [
        starlight({
            title: 'ByteBridge Docs',
            description: 'How to use the ByteBridge tester and configure a ByteBridge gateway.',
            logo: { light: './src/assets/logo-light.webp', dark: './src/assets/logo-dark.webp', alt: 'ByteBridge' },
            favicon: '/favicon.svg',
            customCss: ['./src/styles/brand.css'],
            social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/BartK1990/byte-bridge-docs' }],
            sidebar: [
                { label: '← ByteBridge website', link: `${site}${siteBase}/`, attrs: { target: '_self' } },
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
