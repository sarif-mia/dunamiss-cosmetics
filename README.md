# Dunamiss Cosmetics Shopify theme

Theme source for [dunamiss.in](https://dunamiss.in), store `dunamiss-web.myshopify.com`.

The source includes the September 2026 performance updates: a single Google-pixel-owned GA4 loader, conditional 360-degree product viewer loading, streamlined GoKwik control synchronization, and a WOFF2 bold font.

## Local development

Use Shopify CLI with an authorized store account:

```sh
npx @shopify/cli@latest theme dev --store dunamiss-web.myshopify.com
```

Validate theme code:

```sh
npx @shopify/cli@latest theme check
```

`config/settings_data.json` is intentionally untracked because it contains store-specific configuration and the theme license. On a new checkout, obtain that file from the appropriate store theme or a trusted local copy before previewing. Shopify CLI state, credentials, generated audit reports, and rollback artifacts are also excluded.

Git pushes save source code to GitHub. This repository does not configure automatic deployment to Shopify.

## Store locator

The legacy hardcoded Mapbox token has been removed. Configure your own domain-restricted public token under **Theme settings → Store locator map** to enable the map. Store details remain available without a token. Use a public `pk.` token, never a secret token. This GitHub preparation change has not been deployed to the live Shopify theme.
