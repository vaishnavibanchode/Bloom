/**
 * Bloom Scroll-Driven Hero Stack Banner Sequence
 * Custom Web Component <bloom-scroll-hero-stack>
 * Fixed & Optimized Implementation
 */

if (!customElements.get('bloom-scroll-hero-stack')) {
  class BloomScrollHeroStack extends HTMLElement {
    constructor() {
      super();
      this.isTicking = false;
      this.isIntersecting = false;
      this.isFocusScrolling = false;
      this.focusScrollTimeout = null;

      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
      this.update = this.update.bind(this);
      this.onFocusIn = this.onFocusIn.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
    }

    connectedCallback() {
      this.initElements();
      if (!this.track || !this.slidesRow || this.slides.length <= 1) {
        return;
      }

      this.setupObserver();
      this.bindEvents();
      this.update();
    }

    disconnectedCallback() {
      this.unbindEvents();
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    initElements() {
      this.track = this.querySelector('.bloom-shs__track');
      this.stickyViewport = this.querySelector('.bloom-shs__sticky-viewport');
      this.slidesRow = this.querySelector('.bloom-shs__slides-row');
      this.slides = Array.from(this.querySelectorAll('.bloom-shs__slide'));
      this.images = Array.from(this.querySelectorAll('.bloom-shs__img'));
      this.enableAnimation = this.dataset.animation !== 'false';
      this.enableParallax = this.dataset.parallax !== 'false';
    }

    setupObserver() {
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              this.isIntersecting = entry.isIntersecting;
              if (this.isIntersecting) {
                this.requestTick();
              }
            });
          },
          { rootMargin: '300px 0px 300px 0px', threshold: 0 }
        );
        this.observer.observe(this);
      } else {
        this.isIntersecting = true;
      }
    }

    bindEvents() {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('keydown', this.onKeyDown);

      // Shopify Theme Editor lifecycle
      if (window.Shopify && Shopify.designMode) {
        document.addEventListener('shopify:section:load', (e) => {
          if (e.target.contains(this)) {
            this.initElements();
            this.update();
          }
        });
        document.addEventListener('shopify:block:select', (e) => {
          if (this.contains(e.target)) {
            const blockId = e.detail.blockId;
            const slide = this.querySelector(`[data-block-id="${blockId}"]`);
            if (slide) {
              const idx = this.slides.indexOf(slide);
              if (idx !== -1) {
                this.scrollToIndex(idx);
              }
            }
          }
        });
      }
    }

    unbindEvents() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('keydown', this.onKeyDown);
    }

    onScroll() {
      if (this.isIntersecting && !this.isFocusScrolling) {
        this.requestTick();
      }
    }

    onResize() {
      this.requestTick();
    }

    requestTick() {
      if (!this.isTicking) {
        this.isTicking = true;
        window.requestAnimationFrame(this.update);
      }
    }

    /**
     * Map linear scroll progress (0..1) to smooth slide position (0..count-1)
     * Includes intentional resting/dwell periods for each slide so they sit 100% aligned
     * without unwanted edges peeking or premature transitions.
     */
    calculateSlidePosition(progress, count) {
      if (count <= 1) return 0;
      if (progress <= 0) return 0;
      if (progress >= 1) return count - 1;

      const numTransitions = count - 1;
      const dwellRatio = 0.10;
      const totalDwell = count * dwellRatio;
      const transitionWindow = (1.0 - totalDwell) / numTransitions;

      for (let i = 0; i < numTransitions; i++) {
        const dwellStart = i * (dwellRatio + transitionWindow);
        const dwellEnd = dwellStart + dwellRatio;
        const transEnd = dwellEnd + transitionWindow;

        if (progress <= dwellEnd) {
          return i; // Stationary at slide i
        }
        if (progress < transEnd) {
          // Smooth transition from slide i to slide i+1
          const t = (progress - dwellEnd) / transitionWindow;
          // Smooth cubic ease-in-out curve
          const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          return i + ease;
        }
      }

      return count - 1; // Stationary at final slide
    }

    update() {
      this.isTicking = false;

      // Handle reduced motion preference or disabled scroll animation
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !this.enableAnimation) {
        this.resetTransforms();
        return;
      }

      const count = this.slides.length;
      if (count <= 1 || !this.track || !this.slidesRow || !this.stickyViewport) return;

      const trackRect = this.track.getBoundingClientRect();
      const stickyStyle = window.getComputedStyle(this.stickyViewport);
      const computedStickyTop = parseFloat(stickyStyle.top) || 50;

      // Distance during which the viewport is pinned inside the track
      const totalScrollable = this.track.offsetHeight - this.stickyViewport.offsetHeight;
      if (totalScrollable <= 0) {
        this.resetTransforms();
        return;
      }

      // Progress is 0.0 exactly when sticky viewport touches its sticky top,
      // and reaches 1.0 when sticky viewport reaches the bottom of the track.
      const currentScroll = computedStickyTop - trackRect.top;
      const rawProgress = Math.min(1, Math.max(0, currentScroll / totalScrollable));

      // Calculate the active slide position with dwell periods
      const slidePosition = this.calculateSlidePosition(rawProgress, count);

      // Slide width & gap calculations based on the actual sticky viewport dimensions
      const slideWidth = this.stickyViewport.clientWidth;
      const rowStyle = window.getComputedStyle(this.slidesRow);
      const gap = parseFloat(rowStyle.columnGap) || 30;
      const stepDistance = slideWidth + gap;

      // 1. Horizontal Group Translation (translate by exact step distance)
      const currentTranslatePx = slidePosition * stepDistance;
      this.slidesRow.style.transform = `translate3d(-${currentTranslatePx.toFixed(2)}px, 0, 0)`;

      // 2. Subtle, strictly bounded parallax for inner images (if enabled)
      if (this.enableParallax) {
        this.slides.forEach((slide, idx) => {
          const img = slide.querySelector('.bloom-shs__img');
          if (!img) return;

          // Difference between current slide position and this slide index
          const offset = slidePosition - idx;
          // Subtly pan image within [-3%, +3%] range, strictly staying inside the slide boundary
          const parallaxPercent = Math.min(3.5, Math.max(-3.5, -offset * 3.5));
          img.style.transform = `translate3d(${parallaxPercent.toFixed(2)}%, 0, 0)`;
        });
      }
    }

    resetTransforms() {
      if (this.slidesRow) {
        this.slidesRow.style.transform = '';
      }
      this.images.forEach((img) => {
        img.style.transform = '';
      });
    }

    scrollToIndex(index) {
      const count = this.slides.length;
      if (count <= 1 || !this.track || !this.stickyViewport) return;

      const trackRect = this.track.getBoundingClientRect();
      const stickyStyle = window.getComputedStyle(this.stickyViewport);
      const computedStickyTop = parseFloat(stickyStyle.top) || 50;
      const totalScrollable = this.track.offsetHeight - this.stickyViewport.offsetHeight;
      if (totalScrollable <= 0) return;

      const sectionAbsTop = window.scrollY + trackRect.top;
      // Center of dwell window for index:
      const numTransitions = count - 1;
      const dwellRatio = 0.10;
      const transitionWindow = (1.0 - count * dwellRatio) / numTransitions;
      const targetProgress = index * (dwellRatio + transitionWindow) + (dwellRatio / 2);

      const targetScroll = (sectionAbsTop - computedStickyTop) + (targetProgress * totalScrollable);

      this.isFocusScrolling = true;
      clearTimeout(this.focusScrollTimeout);

      window.scrollTo({
        top: Math.max(0, targetScroll),
        behavior: 'smooth'
      });

      this.focusScrollTimeout = setTimeout(() => {
        this.isFocusScrolling = false;
        this.update();
      }, 700);
    }

    onFocusIn(event) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const slide = target.closest('.bloom-shs__slide');
      if (!slide || !this.contains(slide)) return;

      const index = this.slides.indexOf(slide);
      if (index >= 0) {
        this.scrollToIndex(index);
      }
    }

    onKeyDown(event) {
      if (event.key !== 'Tab') return;
      // Allow standard tab navigation
    }
  }

  customElements.define('bloom-scroll-hero-stack', BloomScrollHeroStack);
}
