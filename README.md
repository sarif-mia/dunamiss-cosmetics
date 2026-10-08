# Dunamiss Cosmetics Shopify theme

Theme source for [dunamiss.in](https://dunamiss.in), store `cfe991.myshopify.com`.
The repository follows Shopify's standard flat theme structure so the source can be
used directly with Shopify CLI.

## Theme structure

Shopify runtime code lives in these folders:

- `assets/` — CSS, JavaScript, fonts and images.
- `blocks/` — theme blocks.
- `config/` — theme settings definitions.
- `layout/` — storefront and password layouts.
- `locales/` — storefront and Theme Editor translations.
- `sections/` — configurable Shopify sections.
- `snippets/` — reusable Liquid components.
- `templates/` — Shopify JSON and Liquid templates.

Dunamiss-owned runtime assets use the `dunamiss-` prefix. Shopify requires these
runtime folders to remain flat, so do not add nested folders inside them.

`config/settings_data.json` contains store-specific configuration and the theme license.
It is intentionally excluded from Git, but must remain available locally when previewing
or deploying this store.

## Local development

Start a Shopify preview:

```sh
npx --yes @shopify/cli@latest theme dev --store cfe991.myshopify.com
```

Validate the theme before deployment:

```sh
npx --yes @shopify/cli@latest theme check
```

Theme Check can report warnings for original Glozin sections, app integrations and
snippets rendered from JSON `custom_liquid` settings. Treat errors as blocking. Check
JSON template references before deleting a snippet reported as orphaned.

## CSS editing

Edit runtime CSS directly in `assets/`:

- `dunamiss-global.css` — shared brand tokens, components, typography and product styles.
- `dunamiss-foundations.css` — lightweight brand foundations used by the password layout.
- `dunamiss-cart-drawer.css` and `dunamiss-cart-page.css` — cart interfaces.
- `dunamiss-floating-header.css`, `dunamiss-desktop-navigation.css` and
  `dunamiss-mobile-navigation.css` — header and navigation.
- Other `dunamiss-*.css` files own the page or feature named in the filename.

Keep selectors scoped to their component. When changing shared brand tokens, update the
matching tokens in `dunamiss-foundations.css` if the password page should use the change.

## Header and navigation

The active header is `sections/dunamiss-floating-header.liquid`. Shop navigation uses
`snippets/dunamiss-shop-mega-menu.liquid`; Lip Care, Eye Care and Skin Care share
`snippets/dunamiss-category-mega-menu.liquid`. Menu headings, subtitles and promo images
remain editable in the floating-header section settings.

## Cart

The storefront uses the theme-owned drawer in `snippets/minicart.liquid`. Keep
**Theme settings → Cart → Action after adding to cart** set to **Open drawer** and keep
app-provided cart drawers disabled. Cart drawer behavior lives in
`assets/dunamiss-cart-drawer.js`; cart presentation lives in the matching Dunamiss CSS.
GoKwik checkout remains controlled by the existing Theme settings integration.

## Inside Science

`sections/dunamiss-inside-science.liquid` is the product page section.
`snippets/dunamiss-inside-science.liquid` routes existing category layouts by explicit
product handle. New product content lives in `snippets/dunamiss-inside-science-data.liquid`,
with source URLs beside each entry. Its shared markup lives in
`snippets/dunamiss-inside-science-layout.liquid` and its styles in
`assets/dunamiss-inside-science.css`.

Add new product details to the data snippet using an explicit handle match and verified
brand information. Reuse the shared layout rather than creating a snippet per product.
Shopify runtime directories must remain flat; do not move these files into subfolders.

## Deployment

Push to the development theme first:

```sh
npx --yes @shopify/cli@latest theme push \
  --store cfe991.myshopify.com \
  --theme 167045759211
```

After reviewing desktop and mobile behavior, push to the live theme:

```sh
npx --yes @shopify/cli@latest theme push \
  --store cfe991.myshopify.com \
  --theme 167129776363 \
  --allow-live
```

Commit and push the same reviewed source to GitHub so local, live and Git remain aligned.
