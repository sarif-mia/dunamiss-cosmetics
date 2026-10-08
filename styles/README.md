# Stylesheet organization

Shopify serves runtime theme assets from the flat `assets` directory. To keep the code
easy to navigate, this repository separates original theme CSS from Dunamiss CSS by name:

- `assets/*.s.min.css` — optimized original theme styles loaded at runtime.
- `assets/dunamiss-*.css` — Dunamiss runtime styles. These names describe the page or
  component they own.
- `styles/*.css` — editable source modules used to generate shared global CSS.

## Shared Dunamiss styles

The global source modules load in this order:

1. `foundations.css` — brand tokens and shared base rules.
2. `add-to-cart.css` — product-card and product-form add-to-cart states.
3. `components.css` — shared storefront components and cross-page fixes.
4. `typography.css` — responsive type scale and readable content sizing.
5. `product-ingredients.css` — ingredient-list and ingredient-card presentation.

Run `python3 scripts/build-storefront-css.py` after changing any source module. It creates:

- `assets/dunamiss-global.css` for the main storefront layout.
- `assets/dunamiss-foundations.css` for the lightweight password layout.

Generated files include a header explaining where to edit. Never make a direct change to
them because the next build replaces it.

## Feature styles

Feature styles remain in `assets` because Shopify loads them directly:

- `dunamiss-cart-drawer.css` — native cart drawer.
- `dunamiss-cart-page.css` — full cart page.
- `dunamiss-collection-content.css` — collection introduction and SEO content.
- `dunamiss-desktop-navigation.css` — desktop Shop navigation.
- `dunamiss-floating-header.css` — floating header structure and responsive layout.
- `dunamiss-mobile-navigation.css` — mobile navigation drawer.
- `dunamiss-footer.css` — storefront footer.
- `dunamiss-home.css` — homepage-only spacing.
- `dunamiss-about.css`, `dunamiss-blog.css`, and `dunamiss-review-carousel.css` — named page features.

Keep selectors scoped to their owning page or component. Add a new feature file only when
the rules have a clear owner and should not be part of the shared global bundle.
