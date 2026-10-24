/**
 * Bloom Theme - Perfectly Paired Plant Sets Interactive Section
 * Athora Planti Signature Lookbook Component
 */

(function () {
  'use strict';

  class BloomPairedPlantSets extends HTMLElement {
    constructor() {
      super();
      this.activeLookIndex = 0;
      this.activeProductIndices = {}; // map of lookIndex -> productIndex
    }

    connectedCallback() {
      this.initElements();
      this.bindEvents();
      this.initScrollReveal();
      this.initShopifyEditor();
    }

    initElements() {
      this.thumbBtns = this.querySelectorAll('.bloom-pps__thumb-btn');
      this.lookViews = this.querySelectorAll('.bloom-pps__look-view');
      this.lookProducts = this.querySelectorAll('.bloom-pps__look-products');

      // Initialize active product index for each look
      this.lookProducts.forEach((lp, idx) => {
        this.activeProductIndices[idx] = 0;
        this.updateProductDisplay(idx, 0);
      });
    }

    bindEvents() {
      // 1. Thumbnail Rail Clicks
      this.thumbBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const targetIndex = parseInt(btn.dataset.lookIndex, 10);
          if (!isNaN(targetIndex)) {
            this.switchLook(targetIndex);
          }
        });
      });

      // 2. Hotspots interactions
      const hotspots = this.querySelectorAll('.bloom-pps__hotspot-btn');
      hotspots.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const prodIndex = parseInt(btn.dataset.productIndex, 10);
          const lookIndex = parseInt(btn.closest('.bloom-pps__look-view')?.dataset.lookIndex, 10);

          if (!isNaN(prodIndex) && !isNaN(lookIndex)) {
            this.switchProduct(lookIndex, prodIndex);
            this.highlightHotspot(lookIndex, prodIndex);
          }
        });

        // Toggle popover on mobile tap
        btn.addEventListener('touchend', (e) => {
          const hotspotWrapper = btn.closest('.bloom-pps__hotspot');
          if (hotspotWrapper) {
            const wasOpen = hotspotWrapper.classList.contains('has-popover-open');
            this.querySelectorAll('.bloom-pps__hotspot').forEach(h => h.classList.remove('has-popover-open'));
            if (!wasOpen) {
              hotspotWrapper.classList.add('has-popover-open');
            }
          }
        });
      });

      // Close popovers on click outside
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.bloom-pps__hotspot')) {
          this.querySelectorAll('.bloom-pps__hotspot').forEach(h => h.classList.remove('has-popover-open'));
        }
      });

      // 3. Vertical Navigation Arrows (Up / Down)
      this.querySelectorAll('.bloom-pps__nav-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const lookIndex = parseInt(btn.closest('.bloom-pps__look-products')?.dataset.lookIndex, 10);
          const dir = btn.dataset.direction; // 'prev' or 'next'
          if (!isNaN(lookIndex)) {
            this.navigateProduct(lookIndex, dir);
          }
        });
      });

      // 4. Variant Swatches Clicks
      this.querySelectorAll('.bloom-pps__swatch-btn').forEach((swatch) => {
        swatch.addEventListener('click', (e) => {
          e.preventDefault();
          const card = swatch.closest('.bloom-pps__meta-wrap');
          const lookProduct = swatch.closest('.bloom-pps__look-products');
          if (!card || !lookProduct) return;

          // Update active swatch
          card.querySelectorAll('.bloom-pps__swatch-btn').forEach(s => s.classList.remove('is-active'));
          swatch.classList.add('is-active');

          // Update price if swatch has price data
          const newPrice = swatch.dataset.variantPrice;
          const priceEl = card.querySelector('.bloom-pps__price');
          if (newPrice && priceEl) {
            priceEl.textContent = newPrice;
          }

          // Update product image if swatch has image data
          const newImg = swatch.dataset.variantImg;
          const activeSlide = lookProduct.querySelector('.bloom-pps__prod-slide.is-active img');
          if (newImg && activeSlide) {
            activeSlide.src = newImg;
          }
        });
      });
    }

    switchLook(targetIndex) {
      if (targetIndex === this.activeLookIndex) return;

      // Update thumbnails
      this.thumbBtns.forEach((btn, idx) => {
        btn.setAttribute('aria-selected', idx === targetIndex ? 'true' : 'false');
      });

      // Update stage lifestyle views
      this.lookViews.forEach((view, idx) => {
        view.classList.toggle('is-active', idx === targetIndex);
      });

      // Update product panels
      this.lookProducts.forEach((lp, idx) => {
        lp.classList.toggle('is-active', idx === targetIndex);
      });

      this.activeLookIndex = targetIndex;

      // Sync active hotspot for this look
      const currentProdIdx = this.activeProductIndices[targetIndex] || 0;
      this.highlightHotspot(targetIndex, currentProdIdx);
    }

    navigateProduct(lookIndex, direction) {
      const lookContainer = this.querySelector(`.bloom-pps__look-products[data-look-index="${lookIndex}"]`);
      if (!lookContainer) return;

      const slides = lookContainer.querySelectorAll('.bloom-pps__prod-slide');
      const total = slides.length;
      if (total <= 1) return;

      let current = this.activeProductIndices[lookIndex] || 0;
      if (direction === 'next') {
        current = (current + 1) % total;
      } else {
        current = (current - 1 + total) % total;
      }

      this.switchProduct(lookIndex, current);
      this.highlightHotspot(lookIndex, current);
    }

    switchProduct(lookIndex, prodIndex) {
      const lookContainer = this.querySelector(`.bloom-pps__look-products[data-look-index="${lookIndex}"]`);
      if (!lookContainer) return;

      const slides = lookContainer.querySelectorAll('.bloom-pps__prod-slide');
      const metas = lookContainer.querySelectorAll('.bloom-pps__meta-wrap');
      const total = slides.length;

      slides.forEach((slide, idx) => {
        slide.classList.toggle('is-active', idx === prodIndex);
      });

      metas.forEach((meta, idx) => {
        meta.style.display = idx === prodIndex ? 'block' : 'none';
      });

      // Update vertical navigation indicator
      const indicator = lookContainer.querySelector('.bloom-pps__nav-indicator');
      if (indicator && total > 0) {
        const hPct = 100 / total;
        const topPct = prodIndex * hPct;
        indicator.style.height = `${hPct}%`;
        indicator.style.top = `${topPct}%`;
      }

      this.activeProductIndices[lookIndex] = prodIndex;
    }

    updateProductDisplay(lookIndex, prodIndex) {
      this.switchProduct(lookIndex, prodIndex);
    }

    highlightHotspot(lookIndex, prodIndex) {
      const activeStage = this.querySelector(`.bloom-pps__look-view[data-look-index="${lookIndex}"]`);
      if (!activeStage) return;

      activeStage.querySelectorAll('.bloom-pps__hotspot-btn').forEach((btn) => {
        const pIdx = parseInt(btn.dataset.productIndex, 10);
        btn.classList.toggle('is-active', pIdx === prodIndex);
      });
    }

    initScrollReveal() {
      if (this.dataset.reveal !== 'true') return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.querySelectorAll('.bloom-pps-reveal').forEach((el, idx) => {
                setTimeout(() => {
                  el.classList.add('is-revealed');
                }, idx * 100);
              });
              observer.unobserve(this);
            }
          });
        },
        { threshold: 0.15 }
      );

      observer.observe(this);
    }

    initShopifyEditor() {
      // Shopify Theme Editor support
      document.addEventListener('shopify:block:select', (event) => {
        if (!this.contains(event.target)) return;
        const lookIdx = parseInt(event.target.dataset.lookIndex, 10);
        if (!isNaN(lookIdx)) {
          this.switchLook(lookIdx);
        }
      });
    }
  }

  if (!customElements.get('bloom-paired-plant-sets')) {
    customElements.define('bloom-paired-plant-sets', BloomPairedPlantSets);
  }
})();
