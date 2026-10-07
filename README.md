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

After editing `assets/brand-system.css`, `assets/add-to-cart-animation.css`, or
`assets/storefront-improvements.css`, `assets/storefront-typography.css`, or
`assets/product-ingredients.css`, run `python3 scripts/build-storefront-css.py`.
The layout loads their generated `assets/storefront-bundle.css` in the same cascade order.

`config/settings_data.json` is intentionally untracked because it contains store-specific configuration and the theme license. On a new checkout, obtain that file from the appropriate store theme or a trusted local copy before previewing. Shopify CLI state, credentials, generated audit reports, and rollback artifacts are also excluded.

Git pushes save source code to GitHub. This repository does not configure automatic deployment to Shopify.

Before editing or deploying, compare local files with the current live theme:

```sh
python3 scripts/check-live-theme.py
```

This downloads the store's currently published theme into an ignored report directory,
compares all seven Shopify theme directories byte for byte, and lists any drift.
It includes the untracked store configuration and never overwrites local work.
For changes, deploy only the reviewed files; after deployment, rerun the comparison.

## Store locator

Configure the map under **Theme settings → Store locator map**. The current public token is stored in the untracked store configuration, rather than runtime JavaScript. Store details remain available without a token. Use a domain-restricted public `pk.` token, never a secret token.

## Collection copy

Manage collection copy in Shopify Admin. The collection title supplies the page H1; **Search engine listing** supplies the search title and meta description. The existing multi-line metafields **Sort Content** (`custom.sort_content`) and **Full Content** (`custom.full_content`) supply the HTML introduction and expandable body.

The theme renders these Admin values directly, with heading normalization, responsive formatting and keyboard-accessible expansion. Empty collections show an availability note. `content/collection-seo.json` is a review snapshot of the October 2026 migration, rather than an override of Admin edits. Theme deployment does not overwrite collection data.

## Product copy

Manage product names, HTML descriptions, search titles and meta descriptions in Shopify Admin. Product subtitles, short descriptions, usage instructions and product details use the existing `custom` metafields. Multiline text metafields contain plain text; only the native product description contains HTML.

`content/product-seo.json` is a review snapshot of the October 2026 published catalogue update. Draft and unlisted review records remain in local audit reports. It does not override subsequent Admin edits. Product templates render native names and descriptions, including the selectable lip oil trio. Product search titles render directly without a second store-name suffix.

The theme preserves product-image alt text and uses the product name when alt text is empty. Product structured data JSON-encodes GTINs, removes a spreadsheet apostrophe prefix, and emits only numeric identifiers with a valid check digit. Barcode values stored in Admin are unchanged.

Assign each variant's image in Shopify Admin. The gallery uses these native associations to show the selected cream or shade and its related images. `content/product-variant-media.json` records the reviewed skincare cream image assignments; it does not override later Admin edits.

Manage key ingredients in the native `custom.product_ingredients` metafield.
Use one ingredient per line; numbered Markdown lists and `May Contain:` groups
are formatted automatically. Put ingredient descriptions on the lines after
the name and separate such groups with a blank line. For sets or creams with different formulas,
start each component with `### Product or shade name` on its own line. The
shared formatter preserves formula names and existing prose in both product
layouts. Empty ingredient data stays hidden. `content/product-ingredients.json`
records source-based ingredient additions and does not override later Admin edits.

Organization structured data links to the published Shopify refund policy using Google's supported `merchantReturnLink` option. Edit the policy in **Settings → Policies**; its URL is read from Shopify. The theme does not infer return fees, delivery windows or credit-note validity from policy prose.

The custom Returns & Exchanges page renders that same native policy and points its canonical URL to the policy page. Its styling and support contacts remain in the theme; its eligibility and timing terms come from Admin.

## Blog copy

Manage articles in **Content → Blog posts**. Native titles, HTML content, excerpts and search-engine fields supply the article pages and cards. Existing URLs, authors, publication dates and visibility are preserved during copy updates. `content/blog-seo.json` is a review snapshot of the published-article revisions and does not override later Admin edits.

The article template renders BlogPosting structured data from native article fields, with the article's canonical URL, publication and modification timestamps, image and author identity. Its title container avoids the generic `page-title` class because the store's custom CSS hides that class. Product references point to current listings; ingredient information is kept separate from unsupported treatment, universal-suitability and firsthand-review claims.
