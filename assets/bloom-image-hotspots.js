/**
 * Bloom Image Hotspots Section Component
 * Handles interactive hotspot popups, auto-edge clamping, and optional subtle parallax
 */

if (!customElements.get('bloom-image-hotspots')) {
  class BloomImageHotspots extends HTMLElement {
    constructor() {
      super();
      this.activeItem = null;
      this.isTicking = false;
      this.onScroll = this.onScroll.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onDocumentClick = this.onDocumentClick.bind(this);
    }

    connectedCallback() {
      this.viewport = this.querySelector('.bih-viewport');
      this.img = this.querySelector('.bih-img');
      this.hotspotItems = Array.from(this.querySelectorAll('.bih-hotspot-item'));
      this.enableParallax = this.dataset.parallax === 'true';

      this.initHotspots();
      this.initParallax();

      document.addEventListener('click', this.onDocumentClick);
      document.addEventListener('keydown', this.onKeyDown);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this.onDocumentClick);
      document.removeEventListener('keydown', this.onKeyDown);
      window.removeEventListener('scroll', this.onScroll);
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    initHotspots() {
      this.hotspotItems.forEach((item) => {
        const pin = item.querySelector('.bih-hotspot-pin');
        const card = item.querySelector('.bih-hotspot-card');
        const closeBtn = item.querySelector('.bih-card-close');

        if (pin) {
          pin.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleHotspot(item);
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeHotspot(item);
          });
        }

        if (card) {
          card.addEventListener('click', (e) => {
            e.stopPropagation();
          });
        }
      });
    }

    toggleHotspot(item) {
      if (this.activeItem === item) {
        this.closeHotspot(item);
      } else {
        if (this.activeItem) {
          this.closeHotspot(this.activeItem);
        }
        this.openHotspot(item);
      }
    }

    openHotspot(item) {
      this.activeItem = item;
      item.classList.add('is-active');
      const pin = item.querySelector('.bih-hotspot-pin');
      if (pin) pin.setAttribute('aria-expanded', 'true');

      this.adjustCardPlacement(item);
    }

    closeHotspot(item) {
      item.classList.remove('is-active');
      const pin = item.querySelector('.bih-hotspot-pin');
      if (pin) pin.setAttribute('aria-expanded', 'false');
      if (this.activeItem === item) {
        this.activeItem = null;
      }
    }

    adjustCardPlacement(item) {
      const card = item.querySelector('.bih-hotspot-card');
      if (!card || !this.viewport) return;

      // Remove existing placement classes
      card.classList.remove(
        'bih-hotspot-card--left',
        'bih-hotspot-card--right',
        'bih-hotspot-card--top',
        'bih-hotspot-card--bottom'
      );

      const itemRect = item.getBoundingClientRect();
      const viewportRect = this.viewport.getBoundingClientRect();

      const posXPercent = ((itemRect.left - viewportRect.left) / viewportRect.width) * 100;
      const posYPercent = ((itemRect.top - viewportRect.top) / viewportRect.height) * 100;

      // Decide best placement based on percentage coordinate
      if (posXPercent > 65) {
        card.classList.add('bih-hotspot-card--left');
      } else if (posXPercent < 35) {
        card.classList.add('bih-hotspot-card--right');
      } else if (posYPercent > 60) {
        card.classList.add('bih-hotspot-card--top');
      } else {
        card.classList.add('bih-hotspot-card--bottom');
      }
    }

    onDocumentClick(e) {
      if (this.activeItem && !this.activeItem.contains(e.target)) {
        this.closeHotspot(this.activeItem);
      }
    }

    onKeyDown(e) {
      if (e.key === 'Escape' && this.activeItem) {
        this.closeHotspot(this.activeItem);
      }
    }

    /* ------------------------------------------------------------------------
       Optional Subtle Parallax
       ------------------------------------------------------------------------ */
    initParallax() {
      if (!this.enableParallax || !this.img) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                window.addEventListener('scroll', this.onScroll, { passive: true });
                this.updateParallax();
              } else {
                window.removeEventListener('scroll', this.onScroll);
              }
            });
          },
          { rootMargin: '100px 0px 100px 0px', threshold: 0 }
        );
        this.observer.observe(this);
      } else {
        window.addEventListener('scroll', this.onScroll, { passive: true });
      }
    }

    onScroll() {
      if (!this.isTicking) {
        window.requestAnimationFrame(() => {
          this.updateParallax();
          this.isTicking = false;
        });
        this.isTicking = true;
      }
    }

    updateParallax() {
      if (!this.img || !this.viewport) return;
      const rect = this.viewport.getBoundingClientRect();
      const windowH = window.innerHeight || document.documentElement.clientHeight;

      // Calculate progress from 0 (entering bottom) to 1 (leaving top)
      const progress = (windowH - rect.top) / (windowH + rect.height);
      const clamped = Math.min(1, Math.max(0, progress));

      // Translate subtle offset [-3.5%, +3.5%]
      const offset = (clamped - 0.5) * 7;
      this.img.style.transform = `translate3d(0, ${offset.toFixed(2)}%, 0)`;
    }
  }

  customElements.define('bloom-image-hotspots', BloomImageHotspots);
}
