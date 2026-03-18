# Domaine Studio — Product Card Assessment

A product card component built for the Domaine Studio technical assessment. Built on the Horizon theme using Liquid, vanilla JavaScript, and TailwindCSS.

**Live preview:** https://ben-moore-new-dev.myshopify.com/collections/all

---

## What was built

A fully interactive product card component satisfying all user stories:

- Sale badge and markdown pricing driven by variant-level `compare_at_price`
- Colour variant swatches that swap the primary product image on click
- Secondary on-model image revealed on card hover via opacity transition
- Product title, brand name, and pricing rendered from Shopify product data

---

## File structure

```
snippets/
  product-card.liquid     — Card markup, Liquid logic, Tailwind classes

assets/
  product-card.js         — Web Component handling all interactions

layout/
  theme.liquid            — Tailwind CDN added to <head>
```

The card is a **snippet, not a section** — keeping it decoupled and reusable across collection pages, featured product sections, and any other context that needs to render a product card.

Built on `feat/product-card-v2` branched from `main` (clean Horizon base). Commits are atomic and reflect the build order: infrastructure → markup → interactions → documentation.

---

## Technical decisions

### Vanilla JS Web Component

All interaction logic lives in a single `ProductCard` class registered via `customElements.define('product-card', ProductCard)`.

No framework was used. Three event listeners (swatch click, mouseenter, mouseleave) don't warrant a framework dependency — adding one would introduce build complexity and runtime weight with no meaningful benefit at this scope.

This pattern intentionally mirrors Horizon's own component architecture. Horizon defines `cart-notification`, `localization-form`, and others as Web Components. Matching that pattern keeps the card idiomatic to the theme and immediately familiar to any developer who has worked in Horizon before.

### Replacing vs extending Horizon's ProductCard

Horizon ships its own `ProductCard` Web Component built around the Section Rendering API — on every variant change it fetches updated HTML from Shopify and morphs the DOM. This is powerful for complex products but makes a network request on every interaction.

Our implementation makes zero network requests. All variant data is in the DOM at render time via `data-*` attributes — swatch clicks are instant with no server round trip.

In a production Studio project the right approach would be to extend Horizon's existing `ProductCard` class, overriding `previewImage` for the hover behaviour and building on top of `SwatchesVariantPickerComponent` for swatch colour display. For the assessment, building from scratch demonstrated the capability more clearly than working within the existing architecture.

### Tailwind via Play CDN

Play CDN is the correct choice for this environment. In production delivery this would be replaced with a PostCSS build step to eliminate the runtime overhead of the CDN. The CDN version is not deferred — Tailwind needs to scan the DOM before first render to generate the correct utility classes, so `defer` would cause a flash of unstyled content.

### `aspect-ratio: 4/5` on the image container

The primary (flat) and secondary (on-model) images have different natural proportions — the flat shirts are roughly square, the on-model images are portrait. A `4/5` container with `object-contain` accommodates both without cropping either. `object-position: bottom` on the hover image ensures the shirt rather than the model's head is the focal point.

### Variant-level sale detection

Sale state is checked against `variant.compare_at_price` rather than `product.compare_at_price`. This correctly handles products where only specific variants are on sale — product-level checking would show the badge incorrectly on non-sale variants.

### `variant:selected` CustomEvent

Each swatch click dispatches a `variant:selected` CustomEvent that bubbles up the DOM. This keeps the card compatible with Horizon's ThemeEvents architecture — other sections (a product form, a recently viewed list) can listen for this event without any coupling to the card's internals.

### Image URLs baked into `data-*` attributes at render time

Variant image URLs are written into `data-primary-src` and `data-hover-src` attributes on each swatch button during Liquid render. This means zero API calls on swatch click — the JS reads directly from the DOM. Instant swap, works offline, no loading state needed.

### Hover image preloaded

The secondary image is rendered as a hidden `<img>` tag on page load (`opacity-0`). The browser fetches it immediately so there's no flash or delay on first hover — the opacity transition is instant.

### No hover on touch devices

The hover interaction is intentionally desktop-only. Touch devices have no natural `mouseenter` equivalent — firing on `touchstart` creates a confusing experience where the on-model image flashes before the user navigates to the product page. The card degrades gracefully on mobile: all core functionality works, the hover effect is simply absent. The product page gallery serves the same purpose on mobile.

---

## Shopify setup

**Metafields required on Variants:**

| Name | Namespace & key | Type |
|---|---|---|
| Swatch color | `custom.swatch_color` | Color |
| Hover image | `custom.hover_image` | File |

---

## What I'd add with more time

| Feature | Approach | Estimate |
|---|---|---|
| Quick-add to cart | `product-form-component` + Shopify form + `cart:updated` event | 3–4 hrs |
| Out-of-stock swatch state | `variant.available` check + `disabled` + visual style | 1–2 hrs |
| Low stock badge | `variant.inventory_quantity` conditional in Liquid | 1 hr |
| Merchant config via schema | `section.settings` for badge colour, hover toggle | 2 hrs |
| PostCSS build step | Replace Play CDN for production performance | 1 day |
| Extend Horizon's ProductCard | Override `previewImage` and `SwatchesVariantPickerComponent` | 1–2 days |

---

## Why these choices fit Domaine Studio

Studio's model is fast, repeatable delivery for mid-market brands. Every decision here optimises for that:

- No framework means faster onboarding for new devs and no build pipeline to maintain
- Web Component pattern means the card works anywhere in the theme without modification
- Snippet architecture means it can be dropped into any section with a single `render` tag
- Zero network requests on interaction means instant feedback for the customer
- Metafield-driven configuration means merchants can manage their own data without code changes
