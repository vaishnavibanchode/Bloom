/**
 * Bloom "Room Inspiration" Section
 * Recreating Athora Planti's Sticky Vertical-to-Horizontal Card Scroll
 */

class BloomRoomInspiration extends HTMLElement {
  constructor() {
    super();
    this.track = null;
    this.trackViewport = null;
    this.headerWrap = null;
    this.outerContainer = null;
    this.cards = [];
    this.isTicking = false;
    this.resizeObserver = null;
    this.maxTravelX = 0;
    this.scrollDuration = 0;
    this.abortController = null;
  }

  get isDesktop() {
    return window.innerWidth >= 1024;
  }

  get stickyEnabled() {
    return this.dataset.sticky !== 'false';
  }

  get tiltEnabled() {
    return this.dataset.tilt !== 'false';
  }

  connectedCallback() {
    this.track = this.querySelector('.bloom-ri-track');
    this.trackViewport = this.querySelector('.bloom-ri-track-viewport');
    this.headerWrap = this.querySelector('.bloom-ri-header-wrap');
    this.outerContainer = this.querySelector('.bloom-ri-outer-container');
    this.cards = Array.from(this.querySelectorAll('.bloom-ri-card-item'));

    if (!this.track || !this.trackViewport) return;

    this.abortController = new AbortController();
    const { signal } = this.abortController;

    this.init();
    this.initButtonRipple(signal);

    // Listeners
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true, signal });
    window.addEventListener('resize', this.onResize.bind(this), { passive: true, signal });

    // Focus handling for accessibility
    this.addEventListener('focusin', this.onFocusIn.bind(this), { capture: true, signal });

    // ResizeObserver on track for accurate measurement
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.updateMeasurements();
      });
      this.resizeObserver.observe(this.track);
      if (this.outerContainer) {
        this.resizeObserver.observe(this.outerContainer);
      }
    }
  }

  disconnectedCallback() {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.resetStyles();
  }

  init() {
    if (this.isDesktop && this.stickyEnabled) {
      this.classList.add('is-sticky-enabled');
      this.updateMeasurements();
      this.render();
    } else {
      this.classList.remove('is-sticky-enabled');
      this.resetStyles();
    }
  }

  onResize() {
    if (this.isDesktop && this.stickyEnabled) {
      if (!this.classList.contains('is-sticky-enabled')) {
        this.classList.add('is-sticky-enabled');
      }
      this.updateMeasurements();
      this.render();
    } else {
      if (this.classList.contains('is-sticky-enabled')) {
        this.classList.remove('is-sticky-enabled');
        this.resetStyles();
      }
    }
  }

  updateMeasurements() {
    if (!this.isDesktop || !this.track || !this.outerContainer) return;

    const containerWidth = this.outerContainer.clientWidth;
    const headerWidth = this.headerWrap ? this.headerWrap.offsetWidth : 340;
    const headerLeft = this.headerWrap ? this.headerWrap.offsetLeft : 48;

    // Card 1 starts just after the stationary header
    const initialOffsetLeft = Math.round(headerLeft + headerWidth + 36);
    this.track.style.setProperty('--bri-track-offset-left', `${initialOffsetLeft}px`);

    // Total width occupied by the cards (sum of widths and gaps)
    let totalCardsWidth = 0;
    this.cards.forEach((card, index) => {
      totalCardsWidth += card.offsetWidth;
      if (index < this.cards.length - 1) {
        totalCardsWidth += 28; // gap
      }
    });

    // Total distance track must travel leftwards so Card 4 finishes comfortably aligned on the right
    const targetEndPosition = containerWidth - 48; // 48px padding from right border
    const naturalCardEnd = initialOffsetLeft + totalCardsWidth;
    this.maxTravelX = Math.max(0, naturalCardEnd - targetEndPosition);

    // Vertical scroll duration (matches Planti's 230vh - 250vh pacing)
    this.scrollDuration = Math.round(this.maxTravelX * 1.25);
    this.style.setProperty('--bri-scroll-distance', `${this.scrollDuration}px`);
  }

  onScroll() {
    if (!this.isDesktop || !this.stickyEnabled) return;
    if (!this.isTicking) {
      requestAnimationFrame(() => {
        this.render();
        this.isTicking = false;
      });
      this.isTicking = true;
    }
  }

  getScrollProgress() {
    const rect = this.getBoundingClientRect();
    const windowH = window.innerHeight;
    const startY = window.scrollY + rect.top;
    const endY = startY + rect.height - windowH;

    const totalScroll = endY - startY;
    if (totalScroll <= 0) return 0;

    const progress = (window.scrollY - startY) / totalScroll;
    return Math.max(0, Math.min(1, progress));
  }

  render() {
    if (!this.isDesktop || !this.stickyEnabled || !this.track) return;

    const progress = this.getScrollProgress();
    const currentTranslateX = progress * this.maxTravelX;

    // Apply horizontal translation
    this.track.style.setProperty('--bri-x', currentTranslateX.toFixed(2));

    // Smooth header fade as first card glides over it
    if (this.headerWrap) {
      const fadeProgress = Math.min(1, Math.max(0, (progress - 0.04) / 0.28));
      this.headerWrap.style.setProperty('--bri-header-fade', (fadeProgress * 0.75).toFixed(2));
    }

    // Optional 3D card tilt effect (matching Athora Planti's subtle perspective)
    if (this.tiltEnabled && this.cards.length > 0) {
      const n = this.cards.length;
      this.cards.forEach((card, i) => {
        const cardInner = card.querySelector('.bloom-ri-card-inner');
        if (!cardInner) return;

        const cardStart = i / n;
        const cardEnd = (i + 1) / n;
        
        let anglePercent = 0;
        if (progress < cardStart) {
          anglePercent = 1;
        } else if (progress > cardEnd) {
          anglePercent = -0.4;
        } else {
          const localP = (progress - cardStart) / (cardEnd - cardStart);
          anglePercent = 1 - localP * 1.4;
        }

        const tiltDeg = (anglePercent * 3.5).toFixed(2);
        cardInner.style.setProperty('--bri-tilt', `${tiltDeg}deg`);
      });
    }
  }

  onFocusIn(e) {
    if (!this.isDesktop || !this.stickyEnabled) return;
    const card = e.target.closest('.bloom-ri-card-item');
    if (!card || !this.contains(card)) return;

    const cardIndex = parseInt(card.dataset.index, 10) - 1;
    if (isNaN(cardIndex) || this.cards.length === 0) return;

    const targetProgress = Math.max(0, Math.min(1, cardIndex / (this.cards.length - 1)));
    const rect = this.getBoundingClientRect();
    const startY = window.scrollY + rect.top;
    const targetScrollY = startY + targetProgress * this.scrollDuration;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth'
    });
  }

  resetStyles() {
    this.style.removeProperty('--bri-scroll-distance');
    if (this.track) {
      this.track.style.removeProperty('--bri-x');
      this.track.style.removeProperty('--bri-track-offset-left');
    }
    if (this.headerWrap) {
      this.headerWrap.style.removeProperty('--bri-header-fade');
    }
    this.cards.forEach(card => {
      const cardInner = card.querySelector('.bloom-ri-card-inner');
      if (cardInner) {
        cardInner.style.removeProperty('--bri-tilt');
      }
    });
  }

  initButtonRipple(signal) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interactiveButtons = [
      ...Array.from(this.querySelectorAll('.bloom-ri-btn')),
      ...Array.from(this.querySelectorAll('.bloom-ri-card-label'))
    ];

    interactiveButtons.forEach((btn) => {
      const circle = btn.querySelector('.bloom-ri-circle-bg, .bloom-ri-card-circle-bg');
      if (!circle) return;

      const updatePos = (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        circle.style.left = `${x}px`;
        circle.style.top = `${y}px`;
      };

      btn.addEventListener('mouseenter', updatePos, { signal, passive: true });
      btn.addEventListener('mousemove', updatePos, { signal, passive: true });
      btn.addEventListener(
        'mouseleave',
        () => {
          circle.style.opacity = '0';
          circle.style.transform = 'translate(-50%, -50%) scale(0)';
        },
        { signal, passive: true }
      );
    });
  }
}

if (!customElements.get('bloom-room-inspiration')) {
  customElements.define('bloom-room-inspiration', BloomRoomInspiration);
}
