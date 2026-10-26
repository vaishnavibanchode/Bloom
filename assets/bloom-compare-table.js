/**
 * Bloom "Compare the Best to the Rest" Comparison Table Component
 */

class BloomCompareTable extends HTMLElement {
  constructor() {
    super();
    this.observer = null;
    this.scrollViewport = null;
    this.card = null;
    this.onScrollHandler = null;
  }

  get revealEnabled() {
    return this.dataset.reveal !== 'false';
  }

  connectedCallback() {
    this.scrollViewport = this.querySelector('.bloom-compare__scroll-viewport');
    this.card = this.querySelector('.bloom-compare__table-card');

    if (this.revealEnabled) {
      this.initReveal();
    } else {
      this.classList.add('is-visible');
    }

    if (this.scrollViewport && this.card) {
      this.initScrollCue();
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.scrollViewport && this.onScrollHandler) {
      this.scrollViewport.removeEventListener('scroll', this.onScrollHandler);
    }
  }

  initReveal() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.classList.add('is-visible');
      return;
    }

    if (!('IntersectionObserver' in window)) {
      this.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('is-visible');
            this.observer.unobserve(this);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    this.observer.observe(this);
  }

  initScrollCue() {
    const updateScrollCue = () => {
      const maxScroll = this.scrollViewport.scrollWidth - this.scrollViewport.clientWidth;
      if (maxScroll > 10) {
        const remaining = maxScroll - this.scrollViewport.scrollLeft;
        const opacity = Math.min(1, Math.max(0, remaining / 30));
        this.card.style.setProperty('--bct-scroll-cue-opacity', opacity.toFixed(2));
      } else {
        this.card.style.setProperty('--bct-scroll-cue-opacity', '0');
      }
    };

    this.onScrollHandler = updateScrollCue;
    this.scrollViewport.addEventListener('scroll', this.onScrollHandler, { passive: true });
    window.addEventListener('resize', updateScrollCue, { passive: true });
    
    // Initial calculation after render
    requestAnimationFrame(updateScrollCue);
  }
}

if (!customElements.get('bloom-compare-table')) {
  customElements.define('bloom-compare-table', BloomCompareTable);
}

// Shopify Theme Editor Integration
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (e) => {
    const el = e.target.querySelector('bloom-compare-table');
    if (el) {
      el.classList.add('is-visible');
    }
  });

  document.addEventListener('shopify:block:select', (e) => {
    const row = e.target.closest('.bloom-comp__row--body');
    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}
