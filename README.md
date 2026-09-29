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

`config/settings_data.json` is intentionally untracked because it contains store-specific configuration. On a new checkout, obtain that file from the appropriate store theme or a trusted local copy before previewing. Shopify CLI state, credentials, generated audit reports, and rollback artifacts are also excluded.

Git pushes save source code to GitHub. This repository does not configure automatic deployment to Shopify.

## Store locator

The legacy hardcoded Mapbox token has been removed. Configure your own domain-restricted public token under **Theme settings → Store locator map** to enable the map. Store details remain available without a token. Use a public `pk.` token, never a secret token. This GitHub preparation change has not been deployed to the live Shopify theme.

## Activation-code changes

This branch removes the vendor activation UI, purchase-code settings, license-check network calls, and associated cookie handling. Original theme-author metadata and third-party license notices are retained. These code changes do not grant additional rights to use or distribute the original theme.

## Package for another store

Run `python3 scripts/package-theme.py` to create `dist/dunamiss-reusable-theme.zip` with native Shopify checkout defaults, blank merchant/analytics IDs, and source-store app blocks removed. See [store setup instructions](docs/STORE-SETUP.md). A theme ZIP does not migrate catalog data, store uploads, app subscriptions, or theme usage rights.
