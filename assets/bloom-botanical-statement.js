/**
 * Bloom Botanical Statement - Custom Web Component
 * Matches Athora Planti scroll reveal and interactive button micro-interactions
 */

if (!customElements.get('bloom-statement')) {
  class BloomBotanicalStatement extends HTMLElement {
    constructor() {
      super();
      this.observer = null;
    }

    connectedCallback() {
      const revealEnabled = this.dataset.reveal === 'true';
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Scroll-triggered entrance reveal
      if (revealEnabled && !prefersReducedMotion) {
        if ('IntersectionObserver' in window) {
          this.observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  this.classList.add('is-visible');
                  this.observer.unobserve(this);
                }
              });
            },
            { threshold: 0.15 }
          );
          this.observer.observe(this);
        } else {
          this.classList.add('is-visible');
        }
      } else {
        this.classList.add('is-visible');
      }

      // 2. Planti Button Ripple & Subtle Magnetic Interaction
      this.setupButtonRipple();
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    setupButtonRipple() {
      const btn = this.querySelector('.bloom-statement__btn');
      if (!btn) return;
      const circle = btn.querySelector('.bloom-statement__circle-bg');
      if (!circle) return;

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      btn.addEventListener('mouseenter', (e) => {
        if (prefersReducedMotion) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;

        // Radial distance calculation matching Planti Math.hypot formula
        const d1 = Math.hypot(x, y);
        const d2 = Math.hypot(rect.width - x, y);
        const d3 = Math.hypot(x, rect.height - y);
        const d4 = Math.hypot(rect.width - x, rect.height - y);
        const maxDist = Math.max(d1, d2, d3, d4);

        const scaleTo = (maxDist * 2.2) / 16;
        circle.style.transform = `translate(-50%, -50%) scale(${scaleTo.toFixed(2)})`;
        circle.style.opacity = '1';
      });

      btn.addEventListener('mousemove', (e) => {
        if (prefersReducedMotion || window.innerWidth < 1025) return;

        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        const moveX = (x / (rect.width / 2)) * 3;
        const moveY = (y / (rect.height / 2)) * 3;

        btn.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
      });

      btn.addEventListener('mouseleave', () => {
        circle.style.transform = 'translate(-50%, -50%) scale(0)';
        circle.style.opacity = '0';
        btn.style.transform = 'translate3d(0, 0, 0)';
      });
    }
  }

  customElements.define('bloom-statement', BloomBotanicalStatement);
}

// Shopify Theme Editor section reload handler
document.addEventListener('shopify:section:load', (event) => {
  const statement = event.target.querySelector('bloom-statement');
  if (statement) {
    statement.classList.add('is-visible');
  }
});
