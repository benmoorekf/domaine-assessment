/**
 * Product Card — assets/product-card.js
 * --------------------------------------
 * Handles all interactions for the product-card custom element:
 *   1. Swatch click  → swap primary image + update pricing
 *   2. Card hover    → fade in secondary (hover) image
 *   3. Fires a variant:selected custom event on swatch click,
 *      keeping this component compatible with Horizon's ThemeEvents
 *      architecture so other sections can react if needed.
 *
 * Zero dependencies. No framework. Matches Horizon's own Web Component pattern.
 */

class ProductCard extends HTMLElement {

  connectedCallback() {
    // Cache DOM references once on mount
    this.primaryImage   = this.querySelector('[data-primary-image]');
    this.hoverImage     = this.querySelector('[data-hover-image]');
    this.swatches       = this.querySelectorAll('.swatch');
    this.priceBlock     = this.querySelector('[data-price-block]');

    this._bindSwatches();
    this._bindHover();
  }

  // ─── Swatch interactions ────────────────────────────────────────────────────

  _bindSwatches() {
    this.swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => this._onSwatchClick(e.currentTarget));
    });
  }

  _onSwatchClick(swatch) {
    if (swatch.dataset.available === 'false') return;

    this._swapImages(swatch);
    this._updatePrice(swatch);
    this._setActiveSwatch(swatch);

    // Fire ThemeEvents-compatible event so other Horizon sections
    // (e.g. a product form elsewhere on the page) can react
    this.dispatchEvent(new CustomEvent('variant:selected', {
      bubbles: true,
      detail: {
        variantId:    swatch.dataset.variantId,
        price:        swatch.dataset.price,
        comparePrice: swatch.dataset.comparePrice,
        available:    swatch.dataset.available === 'true',
      }
    }));
  }

  _swapImages(swatch) {
    // Swap primary image src + srcset
    if (this.primaryImage && swatch.dataset.primarySrc) {
      this.primaryImage.src     = swatch.dataset.primarySrc;
      this.primaryImage.srcset  = swatch.dataset.primarySrcset || '';
    }

    // Update hover image src + srcset so hover always matches selected colour
    if (this.hoverImage && swatch.dataset.hoverSrc) {
      this.hoverImage.src    = swatch.dataset.hoverSrc;
      this.hoverImage.srcset = swatch.dataset.hoverSrcset || '';
    }
  }

  _setActiveSwatch(activeSwatch) {
    this.swatches.forEach(swatch => {
      const isActive = swatch === activeSwatch;
      swatch.setAttribute('aria-pressed', String(isActive));

      // Active state: ring-2 ring-offset-2 using the swatch's own colour
      if (isActive) {
        const color = swatch.style.backgroundColor;
        swatch.style.boxShadow = `0 0 0 2px white, 0 0 0 4px ${color}`;
      } else {
        swatch.style.boxShadow = '';
      }
    });
  }

  // ─── Hover interactions ─────────────────────────────────────────────────────

  _bindHover() {
    if (!this.hoverImage) return;

    this.addEventListener('mouseenter', () => this._showHoverImage());
    this.addEventListener('mouseleave', () => this._hideHoverImage());

    // Touch devices: tap once to hover, tap again to follow link
    this.addEventListener('touchstart', () => this._showHoverImage(), { passive: true });
  }

  _showHoverImage() {
    if (!this.hoverImage) return;
    this.hoverImage.classList.remove('opacity-0');
    if (this.primaryImage) this.primaryImage.classList.add('opacity-0');
  }

  _hideHoverImage() {
    if (!this.hoverImage) return;
    this.hoverImage.classList.add('opacity-0');
    if (this.primaryImage) this.primaryImage.classList.remove('opacity-0');
  }

  // ─── Pricing update ─────────────────────────────────────────────────────────

  _updatePrice(swatch) {
    if (!this.priceBlock) return;

    const price        = parseInt(swatch.dataset.price, 10);
    const comparePrice = parseInt(swatch.dataset.comparePrice, 10);
    const onSale       = comparePrice > price;

    // Format as currency — Shopify prices are in cents
    const format = (cents) => {
      return '$' + (cents / 100).toFixed(2);
    };

    if (onSale) {
      this.priceBlock.innerHTML = `
        <span class="text-base text-gray-400 line-through" aria-label="Original price">
          ${format(comparePrice)}
        </span>
        <span class="text-base font-medium text-red-500" aria-label="Sale price">
          ${format(price)}
        </span>
      `;
    } else {
      this.priceBlock.innerHTML = `
        <span class="text-base font-medium text-gray-900" aria-label="Price">
          ${format(price)}
        </span>
      `;
    }
  }

}

// Register the custom element — matches Horizon's own component registration pattern
if (!customElements.get('product-card')) {
  customElements.define('product-card', ProductCard);
}
