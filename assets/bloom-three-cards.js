/**
 * Bloom Botanical Three-Card Section Component
 * Handles scroll reveal animation, interactive 3D card tilt, and button ripple
 */
class BloomThreeCards extends HTMLElement {
  connectedCallback() {
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.initScrollReveal();
    this.initTiltEffect(signal);
    this.initButtonRipple(signal);
    this.initShopifyEvents();
  }

  disconnectedCallback() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.revealObserver) {
      this.revealObserver.disconnect();
    }
  }

  /**
   * Scroll Reveal using IntersectionObserver
   */
  initScrollReveal() {
    const shouldReveal = this.dataset.reveal === 'true';
    if (!shouldReveal) {
      this.classList.add('is-visible');
      return;
    }

    // Check if motion is reduced
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.classList.add('is-visible');
      return;
    }

    this.revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.classList.add('is-visible');
            this.revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    this.revealObserver.observe(this);
  }

  /**
   * 3D Card Tilt Effect matching Athora Planti (max-tilt: 5deg)
   */
  initTiltEffect(signal) {
    const shouldTilt = this.dataset.tilt === 'true';
    if (!shouldTilt) return;

    // Only apply tilt on fine pointer (desktop mouse)
    const isFinePointer = window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches;
    if (!isFinePointer) return;

    const cards = this.querySelectorAll('[data-tilt-target]');
    const maxTilt = 5; // degrees

    cards.forEach((card) => {
      let rafId = null;
      let targetRotateX = 0;
      let targetRotateY = 0;

      const updateTransform = () => {
        card.style.transform = `perspective(800px) rotateX(${targetRotateX}deg) rotateY(${targetRotateY}deg) scale3d(1.01, 1.01, 1.01)`;
        rafId = null;
      };

      card.addEventListener(
        'pointermove',
        (e) => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const xPercent = x / rect.width;
          const yPercent = y / rect.height;

          targetRotateX = (0.5 - yPercent) * maxTilt * 2;
          targetRotateY = (xPercent - 0.5) * maxTilt * 2;

          if (!rafId) {
            rafId = requestAnimationFrame(updateTransform);
          }
        },
        { signal }
      );

      card.addEventListener(
        'pointerleave',
        () => {
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
          card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        },
        { signal }
      );
    });
  }

  /**
   * Button Magnetic Ripple on mouse move
   */
  initButtonRipple(signal) {
    const buttons = this.querySelectorAll('.bloom-three-cards__btn');

    buttons.forEach((btn) => {
      const circle = btn.querySelector('.bloom-three-cards__circle-bg');
      if (!circle) return;

      btn.addEventListener(
        'mouseenter',
        (e) => {
          const rect = btn.getBoundingClientRect();
          circle.style.left = `${e.clientX - rect.left}px`;
          circle.style.top = `${e.clientY - rect.top}px`;
        },
        { signal }
      );

      btn.addEventListener(
        'mouseleave',
        (e) => {
          const rect = btn.getBoundingClientRect();
          circle.style.left = `${e.clientX - rect.left}px`;
          circle.style.top = `${e.clientY - rect.top}px`;
        },
        { signal }
      );
    });
  }

  /**
   * Shopify Theme Editor dynamic event integration
   */
  initShopifyEvents() {
    if (window.Shopify && window.Shopify.designMode) {
      document.addEventListener('shopify:block:select', (e) => {
        if (this.contains(e.target)) {
          this.classList.add('is-visible');
          const card = e.target.querySelector('[data-tilt-target]');
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    }
  }
}

if (!customElements.get('bloom-three-cards')) {
  customElements.define('bloom-three-cards', BloomThreeCards);
}
