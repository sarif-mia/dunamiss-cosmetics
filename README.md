# Dunamiss Cosmetics Shopify theme

Theme source for [dunamiss.in](https://dunamiss.in), store `dunamiss-web.myshopify.com`.
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
npx --yes @shopify/cli@latest theme dev --store dunamiss-web.myshopify.com
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

Category names and subtitles have one shared source under **Customize → Theme
settings → Dunamiss categories**. These settings apply to desktop/mobile navigation,
the Shop menu and collection headings. Link destinations remain in Shopify Navigation.
The collection product section can optionally override a single collection handle.

## Editing custom content in Shopify

All page templates use JSON sections. About Us, Contact, Offers, Certifications,
Privacy, Returns, Shipping and Terms expose their existing copy, images and links
through native content groups. These groups edit positions in the existing layout;
additional sections can be added and moved in Customize. Choose the page template
from the editor’s page selector. Standard page body content and app page content
remain editable in **Online Store → Pages**.

The product template uses native **Dunamiss benefits**, **Dunamiss offers** and
**Dunamiss trust badges** blocks, plus **Dunamiss certificates**, **Dunamiss
community** and **Dunamiss Inside Science** sections. Text and image controls no
longer require editing a render call. Benefit fields fall back to the product’s
existing custom benefit metafields; dynamic sources can supply per-product content.
Inside Science preserves the existing product content until a rich-text or image
override is entered. Its overrides can also connect to product metafields.

Shared cart labels are under **Theme settings → Dunamiss cart text**. Product names,
descriptions and collections remain controlled by the corresponding Shopify admin
records. Generic interface translations use **Edit default theme content**.

Validate editor schema and template connections after changing controls:

```sh
python3 scripts/validate-customize.py
```

## Cart

The storefront uses the theme-owned drawer in `snippets/minicart.liquid`. Keep
**Theme settings → Cart → Action after adding to cart** set to **Open drawer** and keep
app-provided cart drawers disabled. Cart drawer behavior lives in
`assets/dunamiss-cart-drawer.js`; cart presentation lives in the matching Dunamiss CSS.
GoKwik checkout remains controlled by the existing Theme settings integration.

## Inside Science

The product template renders Inside Science from its Custom Liquid section:

```liquid
{% render 'dunamiss-inside-science', product: product %}
```

Use this same render in Theme Editor instead of the retired category snippets.
Keep one Inside Science section per product template to avoid duplicates.
The component uses three snippets: `dunamiss-inside-science` for explicit product
routing, `dunamiss-inside-science-data` for category and product content, and
`dunamiss-inside-science-layout` for shared markup. Its shared CSS and progress
animation live in `assets/dunamiss-inside-science.css` and
`assets/dunamiss-inside-science.js`.

Existing category content is preserved in the data snippet. Add new product details
there using an explicit handle match and verified brand information, with source URLs.
Reuse the shared layout rather than creating a snippet per product. Shopify runtime
directories must remain flat; do not move these files into subfolders.

## Deployment

Push to the development theme first:

```sh
npx --yes @shopify/cli@latest theme push \
  --store dunamiss-web.myshopify.com \
  --theme 167706820843
```

After reviewing desktop and mobile behavior, push to the live theme:

```sh
npx --yes @shopify/cli@latest theme push \
  --store dunamiss-web.myshopify.com \
  --theme 167129776363 \
  --allow-live
```

Commit and push the same reviewed source to GitHub so local, live and Git remain aligned.
