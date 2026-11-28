import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://vaelspire.dev',
  integrations: [
    starlight({
      title: 'Vaelspire',
      description:
        'Ultra-lightweight Rust open-core identity and authentication platform by Neotales — embeddable crates, single-binary OIDC 1.0 IdP & /forward-auth server, Passkeys, per-app RBAC, Cloudflare D1/Containers, Kubernetes, and Enterprise WORM compliance.',
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
            { label: 'Operator CLI Reference', slug: 'guides/cli-reference' },
            { label: 'Deployment & Reverse Proxies', slug: 'getting-started/deployment' },
            { label: 'Cloudflare (D1/Containers) & K8s', slug: 'guides/cloudflare-and-k8s' },
            { label: 'How Vaelspire Compares', slug: 'guides/comparisons' },
          ],
        },
        {
          label: 'Core Platform Guides',
          items: [
            { label: 'OIDC 1.0 IdP & SSO', slug: 'guides/oidc-idp' },
            { label: 'Per-App RBAC & Org SSO', slug: 'guides/rbac-and-organizations' },
            { label: 'SCIM 2.0, SAML & AI Agents', slug: 'guides/scim-and-nhi' },
            { label: 'GDPR, Redaction & Anomaly Detection', slug: 'guides/gdpr-and-auditing' },
            { label: 'Multi-Sink Security Alerting', slug: 'guides/alerts' },
            { label: 'Forward-Auth Integration', slug: 'guides/forward-auth' },
            { label: 'Embedded Web UI & Desktop', slug: 'guides/web-ui' },
            { label: 'Embeddable Rust Crates', slug: 'guides/embedded-crates' },
            { label: 'Security Architecture', slug: 'guides/security-architecture' },
          ],
        },
        {
          label: 'Reference & Operations',
          items: [
            { label: 'Rust Crate Reference', slug: 'reference/crates' },
            { label: 'Release & Docs Policy', slug: 'guides/releasing' },
            { label: 'Public Roadmap', slug: 'roadmap' },
          ],
        },
        {
          label: 'Vaelspire Enterprise',
          items: [
            { label: 'Enterprise Overview', slug: 'enterprise/overview' },
            { label: 'WORM, Geo-Rep & Offline Licensing', slug: 'enterprise/licensing-and-worm' },
          ],
        },
        {
          label: 'AI Agent Reference',
          badge: { text: 'Dense', variant: 'note' },
          items: [
            { label: 'Agent Orientation & Invariants', slug: 'agents' },
            { label: 'HTTP & CLI Contract', slug: 'agents/api-reference' },
            { label: 'OIDC, SCIM & Enterprise Contract', slug: 'agents/oidc-and-scim' },
            { label: 'Rust Crate Recipes', slug: 'agents/crate-recipes' },
          ],
        },
      ],
    }),
  ],
});
