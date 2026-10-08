# Theme architecture

This repository keeps Shopify's required runtime folders flat. Shopify does not support
arbitrary subfolders inside these directories, so file names and ownership boundaries
provide the organization.

## Runtime folders

- `assets/` contains files Shopify serves in the storefront. Original vendor files keep
  their existing names. Dunamiss-owned runtime CSS and JavaScript use the `dunamiss-`
  prefix.
- `blocks/` contains Shopify theme blocks.
- `config/` contains settings definitions. `settings_data.json` is store-specific and is
  intentionally untracked.
- `layout/` contains the storefront and password layouts.
- `locales/` contains storefront and Theme Editor translations.
- `sections/` contains configurable Shopify sections. A section owns its schema and
  loads any feature-specific asset it needs.
- `snippets/` contains reusable Liquid presentation. Shared behavior belongs here rather
  than in copied category-specific files.
- `templates/` contains Shopify JSON and Liquid templates.

## Repository-only folders

- `styles/` contains the editable modules that generate the shared custom CSS.
- `scripts/` contains deterministic build, audit, and live-parity tools.
- `content/` contains reviewed migration snapshots; it does not override Shopify Admin.
- `docs/` contains maintenance documentation.
- `reports/` contains ignored audit and rollback artifacts.
- `dist/` contains ignored, locally generated theme packages.

## Custom storefront ownership

The active floating header is rendered by `sections/dunamiss-floating-header.liquid`.
Its responsive shell and icon layout live in `assets/dunamiss-floating-header.css`.
Desktop mega-menu layout lives in `assets/dunamiss-desktop-navigation.css`, and mobile
navigation layout lives in `assets/dunamiss-mobile-navigation.css`. Header measurement
and mega-menu interaction live in the matching `dunamiss-floating-header.js` and
`dunamiss-mega-menu.js` assets.

`snippets/horizontal-menu.liquid` routes the Shop menu to
`snippets/dunamiss-shop-mega-menu.liquid`. It routes Lip Care, Eye Care, and Skin Care to
the shared `snippets/dunamiss-category-mega-menu.liquid`, passing a category type. Category text,
promo images, and item subtitles remain editable in the floating-header section settings.

The small inline measurement script in the floating-header section runs before deferred
header JavaScript so fixed-header spacing is correct on first paint. Keep it inline unless
the loading order is replaced with an equivalent early measurement.

## CSS workflow

Edit the CSS files directly in `styles/` for shared tokens, typography, and components,
then run:

```sh
python3 scripts/build-storefront-css.py
```

This produces `assets/dunamiss-global.css` and `assets/dunamiss-foundations.css`. Do not
edit either generated file directly. Feature CSS stays in a descriptively named
`assets/dunamiss-*.css` file and is loaded only by its owner.

## Validation and deployment

Run these checks before every deployment:

```sh
python3 scripts/audit-theme.py
npx --yes @shopify/cli@latest theme check
python3 scripts/check-live-theme.py
```

Review live drift before pushing. Deploy to the development theme first, test the affected
desktop and mobile interactions, then push the reviewed files to the live theme. Run the
live-parity check again after deployment and commit the same source to Git.
