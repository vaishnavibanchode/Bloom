/**
 * Bloom Scroll-Driven Hero Stack Banner Sequence
 * Custom Web Component <bloom-scroll-hero-stack>
 * Reproduces the Athora Planti scroll-driven hero sequence
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
          { rootMargin: '200px 0px 200px 0px', threshold: 0 }
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

    update() {
      this.isTicking = false;

      // Check reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !this.enableAnimation) {
        this.resetTransforms();
        return;
      }

      const count = this.slides.length;
      if (count <= 1 || !this.track || !this.slidesRow) return;

      const trackRect = this.track.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const totalScrollable = trackRect.height - viewportH;

      if (totalScrollable <= 0) {
        this.resetTransforms();
        return;
      }

      // Calculate progress strictly from 0 to 1
      const currentScroll = -trackRect.top;
      const progress = Math.min(1, Math.max(0, currentScroll / totalScrollable));

      // 1. Horizontal Group Translation
      const slideWidth = this.slides[0].offsetWidth;
      const computedStyle = window.getComputedStyle(this.slidesRow);
      const gap = parseFloat(computedStyle.columnGap) || 30;
      const totalTranslatePx = (count - 1) * (slideWidth + gap);
      const currentTranslatePx = progress * totalTranslatePx;

      this.slidesRow.style.transform = `translate3d(-${currentTranslatePx.toFixed(2)}px, 0, 0)`;

      // 2. Parallax Depth for Inner Images (if enabled)
      if (this.enableParallax) {
        const step = 1 / (count - 1);
        this.slides.forEach((slide, idx) => {
          const img = slide.querySelector('.bloom-shs__img');
          if (!img) return;

          let start, end, baseTranslate;
          if (idx === 0) {
            start = 0;
            end = step;
            baseTranslate = 10;
          } else {
            start = step * (idx - 1);
            end = idx === count - 1 ? step * idx : step * (idx + 0.5);
            baseTranslate = 18;
          }

          const localProgress = Math.min(1, Math.max(0, (progress - start) / (end - start)));
          const imgTranslateX = (-baseTranslate + baseTranslate * localProgress * 2);
          img.style.transform = `translate3d(${imgTranslateX.toFixed(2)}%, 0, 0)`;
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
      if (count <= 1 || !this.track) return;

      const trackRect = this.track.getBoundingClientRect();
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const sectionTop = window.scrollY + trackRect.top;
      const totalScrollable = trackRect.height - viewportH;

      if (totalScrollable <= 0) return;

      const targetProgress = index / (count - 1);
      const targetScroll = sectionTop + targetProgress * totalScrollable;

      this.isFocusScrolling = true;
      clearTimeout(this.focusScrollTimeout);

      window.scrollTo({
        top: targetScroll,
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
      // Allow natural tab navigation
    }
  }

  customElements.define('bloom-scroll-hero-stack', BloomScrollHeroStack);
}
