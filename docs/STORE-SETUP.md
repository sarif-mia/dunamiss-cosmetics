# Installing the reusable Dunamiss theme

This package is a technical starting point for another Shopify store. It is not an unlimited-store license. NextSky states that each store needs its own theme license: https://support.nextsky.co/. Confirm the rights applicable to your purchase before publishing on another store. Original theme-author metadata remains intact.

1. In the target store, open Online Store → Themes → Add theme → Upload zip file, and select `dunamiss-reusable-theme.zip`.
2. Keep the imported theme unpublished while configuring it. Set the new store's logo, images, navigation, collections, products, pages, contact information, policies, currency, shipping, and payments. Shopify resource references and store-hosted uploads do not migrate with a theme ZIP. Existing Dunamiss branding, external images and content should be reviewed for the target store.
3. Native Shopify cart checkout and dynamic Buy Now are the defaults in this package. No GoKwik merchant ID or GA/Meta ID from the original store is included in settings. If the target store uses GoKwik, configure its own merchant ID and environment, then enable the integration in theme settings. KwikPass uses those same store-specific settings.
4. Install and configure any required apps on the target store. Source-store app blocks/embeds are removed from this ZIP. Re-add review, video, rewards, forms, bundle and other app blocks as appropriate. Configure analytics using the target store's connected pixel/app.
5. Configure your own public Mapbox token only if you use the store-locator map.
6. Check mobile/desktop menus, product selection, prices, inventory, cart quantity, shipping and payment methods. Place an authorized test order before publishing. Neither app data nor orders/products migrate with this ZIP.

## Package behavior

- Theme layout/style settings are retained where possible.
- GoKwik and its Buy Now button start disabled, and merchant/analytics/map settings are blank.
- Store-specific app blocks and old settings presets are removed from the package.
- Vendor activation logic was removed in the preceding local changes. This does not change the vendor's license terms or guarantee that future vendor updates preserve customizations.
- Shopify account/subscription requirements and third-party app subscriptions remain separate.

Build again with `python3 scripts/package-theme.py`. The source checkout needs a local `config/settings_data.json`; it is intentionally excluded from Git. This package has passed static/theme checks and checkout-rendering fixture tests, but has not been installed or tested on a second store. These changes are maintained on the separate `feature/reusable-theme` branch. They have not been deployed to the live Shopify theme; `main` retains the previous source.
