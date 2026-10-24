/**
 * ==========================================================================
 * Bloom Theme - Plants for Every Lifestyle Section Component
 * Handles Scroll Reveal, Cursor-Fill Button, and Theme Editor Events
 * ==========================================================================
 */

(function () {
  'use strict';

  class BloomPlantsLifestyle extends HTMLElement {
    constructor() {
      super();
      this.isInitialized = false;
    }

    connectedCallback() {
      if (this.isInitialized) return;
      this.init();
      this.isInitialized = true;
    }

    init() {
      this.initScrollReveal();
      this.initCursorFillBtn();
    }

    initScrollReveal() {
      const isRevealEnabled = this.getAttribute('data-reveal') === 'true';
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!isRevealEnabled || prefersReducedMotion || !('IntersectionObserver' in window)) {
        this.classList.add('is-visible');
        return;
      }

      // Check if already in viewport
      const rect = this.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
        this.classList.add('is-visible');
        return;
      }

      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '0px 0px -40px 0px',
          threshold: 0.12
        }
      );

      observer.observe(this);
    }

    initCursorFillBtn() {
      const btn = this.querySelector('.bloom-lifestyle-btn');
      if (!btn) return;

      let circle = btn.querySelector('.bloom-lifestyle-circle-bg');
      if (!circle) {
        circle = document.createElement('span');
        circle.className = 'bloom-lifestyle-circle-bg';
        circle.setAttribute('aria-hidden', 'true');
        btn.appendChild(circle);
      }

      const updatePos = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
      };

      btn.addEventListener('mouseenter', updatePos);
      btn.addEventListener('mousemove', updatePos);
    }
  }

  // Register custom element
  if (!customElements.get('bloom-plants-lifestyle')) {
    customElements.define('bloom-plants-lifestyle', BloomPlantsLifestyle);
  }

  // Shopify Theme Editor Integration
  document.addEventListener('shopify:section:load', function (e) {
    if (e.target && e.target.querySelector('bloom-plants-lifestyle')) {
      const el = e.target.querySelector('bloom-plants-lifestyle');
      if (el && typeof el.init === 'function') {
        el.init();
      }
    }
  });

  document.addEventListener('shopify:block:select', function (e) {
    const blockEl = e.target;
    if (blockEl && blockEl.closest('bloom-plants-lifestyle')) {
      const section = blockEl.closest('bloom-plants-lifestyle');
      section.classList.add('is-visible');
      // Scroll into view on mobile carousel
      if (section.getAttribute('data-mobile-layout') === 'carousel' && window.innerWidth < 768) {
        blockEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  });
})();
