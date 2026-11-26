import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://vaelspire.dev',
  integrations: [
    starlight({
      title: 'Vaelspire',
      description:
        'Ultra-lightweight Rust open-core identity and authentication platform by Neotales — embeddable crates, single-binary /forward-auth server, and Enterprise geo-replication & WORM compliance.',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/vaelspire.css'],
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/neotales/vaelspire',
        },
      ],
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: '60-Second Quickstart', slug: 'getting-started/quickstart' },
            { label: 'Configuration & CLI', slug: 'getting-started/configuration' },
            { label: 'Deployment & Reverse Proxies', slug: 'getting-started/deployment' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Embeddable Rust Crates', slug: 'guides/embedded-crates' },
            { label: 'Forward-Auth Integration', slug: 'guides/forward-auth' },
            { label: 'Security Architecture', slug: 'guides/security-architecture' },
          ],
        },
        {
          label: 'Product & Enterprise',
          items: [
            { label: 'Vaelspire Enterprise', slug: 'enterprise/overview' },
            { label: 'Public Roadmap', slug: 'roadmap' },
          ],
        },
        {
          label: 'AI Agent Reference',
          badge: { text: 'Dense', variant: 'note' },
          items: [
            { label: 'Agent Orientation & Invariants', slug: 'agents' },
            { label: 'HTTP & CLI Contract', slug: 'agents/api-reference' },
            { label: 'Rust Crate Recipes', slug: 'agents/crate-recipes' },
          ],
        },
      ],
    }),
  ],
});
