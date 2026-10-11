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

Category names and collection-page subtitle defaults are under **Customize → Theme
settings → Dunamiss categories**. Mega-menu item subtitles are edited in one place:
**Header → Custom floating header → Menu subtitle blocks**. Choose the named block,
edit **Subtitle**, and save. The same text appears in Shop and category menus.
Clearing the text or turning off **Show subtitle** hides it. New items can be added
with **Add block → Menu subtitle**, selecting their collection or custom link.
Use one block per destination. Matching uses the destination rather than Navigation
labels, so links can be renamed without losing their subtitles.

The panel introduction lines remain in the floating-header section’s **Shop / Lip
Care / Eye Care / Skin Care menu subheading** settings. Link destinations remain in
Shopify Navigation. Collection product sections can override one collection handle.

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

## Search and AI discovery

`snippets/dunamiss-structured-data.liquid` connects the published store identity,
website, pages and visible breadcrumb trails. Store name, logo and social profiles
come from existing Shopify/theme values. **Theme settings → Dunamiss search
identity** controls the published support email, contact URL override and the list
of utility page handles excluded from search.

Both product layouts use `snippets/dunamiss-product-schema.liquid`. Prices,
currencies, stock, SKUs and validated GTINs come from the actual variants. Reviews
remain controlled by the review app. FAQ sections use
`snippets/dunamiss-faq-schema.liquid`, which serializes only complete visible Q&A
blocks and safely handles quotation marks and rich-text links.

There is no custom robots template: Shopify manages its current crawl policy,
sitemap and agentic-commerce discovery rules. This avoids freezing an older set
of robots rules into the theme. Page/collection/product SEO titles and descriptions
remain editable in Shopify admin. Generic page templates have a primary heading;
existing custom page headings are preserved.

Product consolidation, video-app metadata, Merchant Center feeds and Search Console
or Bing visibility settings are managed in their corresponding admin tools.

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

## Collection banners

Collections with no collection image use nine generated editorial artwork groups,
with 26 collection-specific blocks in the default collection template. Existing
collection images keep their original banner layout. No Shopify collection records
are changed. A later collection image automatically takes precedence over the
built-in fallback.

In **Customize → Collections → Default collection → Collection banner**, choose
the block named for the collection. Edit **Banner heading**, **Banner subtitle**,
**Built-in artwork**, **Custom desktop image**, **Custom mobile image**, or
**Image description**. **Show banner** hides that collection’s banner. Blank
heading uses the collection name or shared Dunamiss category heading. A custom
desktop image explicitly overrides the automatic image choice.

Optimized desktop/mobile WebP files are in `assets/dunamiss-collection-*.webp`.
The built-in image_gen prompt set and file manifest are in
`docs/collection-banner-artwork.json`. New collection blocks can be added through
**Add block → Collection banner**; choose a collection and artwork. Keep one block
per collection. Unconfigured collections without images receive the Beauty artwork
automatically while the section’s fallback-banner option is enabled.
