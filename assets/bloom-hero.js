/**
 * Bloom Hero Slideshow - Custom Web Component
 * Faithfully matches Athora Planti preset animations, shrink-on-scroll,
 * can-reveal staggered text transitions, and interactive ripple buttons.
 *
 * Source reference: Athora Planti Theme (https://themes.shopify.com/themes/athora/presets/planti)
 */

if (!customElements.get('bloom-hero')) {
  class BloomHero extends HTMLElement {
    constructor() {
      super();
      this.currentIndex = 0;
      this.timer = null;
      this.animFrame = null;
      this.isPaused = false;
      this.startTime = 0;
      this.pausedTime = 0;
      this.totalPausedDuration = 0;

      // Bound handlers for cleanup
      this.onMouseEnter = this.pause.bind(this);
      this.onMouseLeave = this.resume.bind(this);
      this.onFocusIn = this.pause.bind(this);
      this.onFocusOut = this.resume.bind(this);
      this.onKeyDown = this.handleKeyDown.bind(this);
      this.onVisibilityChange = this.handleVisibilityChange.bind(this);
      this.onScroll = this.handleScroll.bind(this);
      this.onResize = this.handleResize.bind(this);

      // Scroll RAF throttling
      this.ticking = false;
    }

    connectedCallback() {
      this.track = this.querySelector('.bloom-hero__track');
      this.shrinkWrap = this.querySelector('.bloom-hero__shrink-wrap');
      this.shrinkInner = this.querySelector('.bloom-hero__shrink-inner');
      this.slides = Array.from(this.querySelectorAll('.bloom-hero__slide'));
      this.dots = Array.from(this.querySelectorAll('.bloom-hero__dot'));
      this.buttons = Array.from(this.querySelectorAll('.bloom-hero__btn'));
      this.prevBtn = this.querySelector('.bloom-hero__arrow--prev');
      this.nextBtn = this.querySelector('.bloom-hero__arrow--next');

      if (!this.slides.length) return;

      this.autoplayEnabled = this.dataset.autoplay === 'true';
      this.interval = parseInt(this.dataset.interval, 10) * 1000 || 5000;
      this.animationType = this.dataset.animation || 'slide';
      this.shrinkEnabled = this.dataset.shrink === 'true';
      this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // 1. Setup Dot Controls
      this.dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
          this.goToSlide(index);
          this.resetAutoplay();
        });
        dot.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.goToSlide(index);
            this.resetAutoplay();
          }
        });
      });

      // 2. Navigation Chevrons
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => {
          this.prevSlide();
          this.resetAutoplay();
        });
      }
      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => {
          this.nextSlide();
          this.resetAutoplay();
        });
      }

      // 3. Touch Gestures (Mobile Swiping)
      this.setupTouchGestures();

      // 4. Planti Magnetic Ripple Button Interactions
      this.setupButtonRipple();

      // 5. Athora Planti Signature Shrink-on-Scroll Effect
      if (this.shrinkEnabled && !this.prefersReducedMotion) {
        this.setupShrinkOnScroll();
      }

      // 6. Pause / Resume on Hover and Keyboard Focus
      this.addEventListener('mouseenter', this.onMouseEnter);
      this.addEventListener('mouseleave', this.onMouseLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);
      this.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('visibilitychange', this.onVisibilityChange);

      // 7. Intersection Observer for Performance (Pauses offscreen)
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.resume();
                if (this.autoplayEnabled && this.slides.length > 1) {
                  this.resetAutoplay();
                }
              } else {
                this.pause();
              }
            });
          },
          { threshold: 0.1 }
        );
        this.observer.observe(this);
      }

      // 8. Initialize First Slide & Autoplay with Entrance Animation
      this.classList.remove('is-ready');
      this.goToSlide(0, true);

      // Trigger Planti entrance animation on next frame after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.classList.add('is-ready');
        });
      });

      if (this.autoplayEnabled && this.slides.length > 1 && !this.prefersReducedMotion) {
        this.startAutoplay();
      }

      // 9. Shopify Theme Editor Support
      this.setupShopifyEditorListeners();
    }

    disconnectedCallback() {
      this.stopAutoplay();
      if (this.observer) this.observer.disconnect();

      this.removeEventListener('mouseenter', this.onMouseEnter);
      this.removeEventListener('mouseleave', this.onMouseLeave);
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('focusout', this.onFocusOut);
      this.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('visibilitychange', this.onVisibilityChange);

      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);

      if (this.touchStartHandler) {
        this.removeEventListener('touchstart', this.touchStartHandler);
        this.removeEventListener('touchend', this.touchEndHandler);
      }
    }

    /* ========================================================================
       Slide Navigation & Planti Reveal Text Entrance
       ======================================================================== */
    goToSlide(index, isInitial = false) {
      if (index < 0) index = this.slides.length - 1;
      if (index >= this.slides.length) index = 0;

      const previousIndex = this.currentIndex;
      this.currentIndex = index;

      // Update Track Translation in slide mode
      if (this.animationType === 'slide' && this.track) {
        this.track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
      }

      // Update Slides State & ARIA
      this.slides.forEach((slide, i) => {
        const isActive = i === index;
        if (isActive) {
          slide.classList.add('is-active');
          slide.setAttribute('aria-hidden', 'false');

          // If switching slides (not initial setup), re-arm staggered can-reveal animation
          if (!isInitial && i !== previousIndex) {
            const reveals = slide.querySelectorAll('[can-reveal]');
            reveals.forEach((el) => {
              el.style.transition = 'none';
              el.style.opacity = '0.001';
              el.style.transform = 'translate3d(0, 42px, 0)';
            });

            const img = slide.querySelector('.bloom-hero__image, .bloom-hero__picture img, .bloom-hero__video');
            if (img) {
              img.style.transition = 'none';
              img.style.transform = 'scale(1.10)';
            }

            // Force reflow
            void slide.offsetHeight;

            reveals.forEach((el) => {
              el.style.transition = '';
              el.style.opacity = '';
              el.style.transform = '';
            });

            if (img) {
              img.style.transition = '';
              img.style.transform = '';
            }
          }
        } else {
          slide.classList.remove('is-active');
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      // Update Dot Indicators & Accessibility
      this.dots.forEach((dot, i) => {
        const isActive = i === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      // Reset and trigger SVG circular progress path
      this.resetProgressRing();
      if (this.autoplayEnabled && !this.isPaused && this.slides.length > 1) {
        this.startTime = Date.now();
        this.totalPausedDuration = 0;
        this.runProgressAnimation();
      }
    }

    nextSlide() {
      this.goToSlide(this.currentIndex + 1);
    }

    prevSlide() {
      this.goToSlide(this.currentIndex - 1);
    }

    handleKeyDown(e) {
      if (e.key === 'ArrowRight') {
        this.nextSlide();
        this.resetAutoplay();
      } else if (e.key === 'ArrowLeft') {
        this.prevSlide();
        this.resetAutoplay();
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    }

    /* ========================================================================
       Athora Planti Signature Shrink-on-Scroll
       ======================================================================== */
    setupShrinkOnScroll() {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });
      this.updateShrinkProgress();
    }

    handleScroll() {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.updateShrinkProgress();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }

    handleResize() {
      this.updateShrinkProgress();
    }

    updateShrinkProgress() {
      if (!this.shrinkInner) return;

      // Planti disables shrink on mobile (< 768px) to eliminate touch scroll jitter
      if (window.innerWidth < 768) {
        this.shrinkInner.style.clipPath = '';
        return;
      }

      const rect = this.getBoundingClientRect();
      const vh = window.innerHeight;
      const bottom = rect.bottom;

      // Athora Planti exact offset logic: ["1 0.82", "1 0.12"]
      // Top of page: bottom >= 0.85 * vh -> progress = 0 (hero is full width edge to edge)
      // Scrolled down towards next section: bottom crosses below 0.85 * vh -> contracts smoothly
      const startGap = vh * 0.85;
      const endGap = vh * 0.15;

      let progress = 0;
      if (bottom >= startGap) {
        progress = 0;
      } else if (bottom <= endGap) {
        progress = 1;
      } else {
        progress = (startGap - bottom) / (startGap - endGap);
      }

      const p = Math.min(Math.max(progress, 0), 1);

      if (p <= 0.001) {
        this.shrinkInner.style.clipPath = 'inset(0 round 0)';
      } else if (p >= 0.999) {
        this.shrinkInner.style.clipPath = 'inset(0 var(--clip-x) 0 var(--clip-x) round var(--rounded-lg))';
      } else {
        this.shrinkInner.style.clipPath = `inset(0 calc(var(--clip-x) * ${p.toFixed(4)}) 0 calc(var(--clip-x) * ${p.toFixed(4)}) round calc(var(--rounded-lg) * ${p.toFixed(4)}))`;
      }

      // Planti translate effect for data-shrink-translate
      const translates = this.querySelectorAll('[data-shrink-translate="start"]');
      translates.forEach((el) => {
        el.style.transform = `translateX(calc(var(--clip-x) * ${(1 - p).toFixed(4)} * 0.35))`;
      });
    }

    /* ========================================================================
       Athora Planti Button Ripple Physics & Magnetic Micro-Interactions
       ======================================================================== */
    setupButtonRipple() {
      this.buttons.forEach((btn) => {
        const circle = btn.querySelector('.bloom-hero__circle-bg');
        if (!circle) return;

        btn.addEventListener('mouseenter', (e) => {
          if (this.prefersReducedMotion) return;

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
          const maxDistance = Math.max(d1, d2, d3, d4);

          // Base diameter in CSS is 18px -> radius is 9px
          const scaleTo = (maxDistance * 2.1) / 18;
          circle.style.transform = `translate(-50%, -50%) scale(${scaleTo.toFixed(2)})`;
          circle.style.opacity = '1';
        });

        btn.addEventListener('mousemove', (e) => {
          if (this.prefersReducedMotion || window.innerWidth < 1025) return;

          // Subtle magnetic shift pull
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          const moveX = (x / (rect.width / 2)) * 4.5;
          const moveY = (y / (rect.height / 2)) * 4.5;

          btn.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
        });

        btn.addEventListener('mouseleave', () => {
          circle.style.transform = 'translate(-50%, -50%) scale(0)';
          circle.style.opacity = '0';
          btn.style.transform = 'translate3d(0, 0, 0)';
        });
      });
    }

    /* ========================================================================
       Touch Gestures (Mobile Swiping)
       ======================================================================== */
    setupTouchGestures() {
      let touchStartX = 0;
      let touchStartY = 0;

      this.touchStartHandler = (e) => {
        if (e.touches && e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          this.pause();
        }
      };

      this.touchEndHandler = (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
          const diffX = e.changedTouches[0].clientX - touchStartX;
          const diffY = e.changedTouches[0].clientY - touchStartY;

          // Horizontal swipe threshold
          if (Math.abs(diffX) > 42 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
              this.nextSlide();
            } else {
              this.prevSlide();
            }
          }
          this.resume();
          this.resetAutoplay();
        }
      };

      this.addEventListener('touchstart', this.touchStartHandler, { passive: true });
      this.addEventListener('touchend', this.touchEndHandler, { passive: true });
    }

    /* ========================================================================
       Autoplay & Planti SVG Progress Ring Countdown
       ======================================================================== */
    startAutoplay() {
      this.stopAutoplay();
      if (!this.autoplayEnabled || this.slides.length <= 1) return;

      this.startTime = Date.now();
      this.totalPausedDuration = 0;
      this.runProgressAnimation();

      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.nextSlide();
        }
      }, this.interval);
    }

    stopAutoplay() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
        this.animFrame = null;
      }
    }

    pause() {
      if (this.isPaused) return;
      this.isPaused = true;
      this.pausedTime = Date.now();
    }

    resume() {
      if (!this.isPaused) return;
      this.isPaused = false;
      if (this.pausedTime > 0) {
        this.totalPausedDuration += Date.now() - this.pausedTime;
        this.pausedTime = 0;
      }
    }

    resetAutoplay() {
      if (this.autoplayEnabled && this.slides.length > 1 && !this.prefersReducedMotion) {
        this.startAutoplay();
      }
    }

    resetProgressRing() {
      this.dots.forEach((dot) => {
        const path = dot.querySelector('.bloom-hero__progress-path');
        if (path) {
          path.style.strokeDashoffset = '1';
        }
      });
    }

    runProgressAnimation() {
      if (this.animFrame) {
        cancelAnimationFrame(this.animFrame);
      }

      const activeDot = this.dots[this.currentIndex];
      if (!activeDot) return;
      const path = activeDot.querySelector('.bloom-hero__progress-path');
      if (!path) return;

      const animate = () => {
        if (!this.autoplayEnabled || this.slides.length <= 1) return;

        if (this.isPaused) {
          this.animFrame = requestAnimationFrame(animate);
          return;
        }

        const now = Date.now();
        const elapsed = now - this.startTime - this.totalPausedDuration;
        const progress = Math.min(Math.max(elapsed / this.interval, 0), 1);

        // PathLength is 1 in SVG markup, offset animates smoothly from 1 to 0
        const offset = 1 - progress;
        path.style.strokeDashoffset = offset.toFixed(4);

        if (progress < 1) {
          this.animFrame = requestAnimationFrame(animate);
        }
      };

      this.animFrame = requestAnimationFrame(animate);
    }

    /* ========================================================================
       Shopify Theme Editor Events
       ======================================================================== */
    setupShopifyEditorListeners() {
      if (window.Shopify && Shopify.designMode) {
        document.addEventListener('shopify:block:select', (event) => {
          if (event.target && this.contains(event.target)) {
            const blockId = event.detail.blockId;
            const targetIndex = this.slides.findIndex((s) => s.dataset.blockId === blockId);
            if (targetIndex !== -1) {
              this.pause();
              this.goToSlide(targetIndex);
            }
          }
        });

        document.addEventListener('shopify:block:deselect', (event) => {
          if (event.target && this.contains(event.target)) {
            this.resume();
          }
        });
      }
    }
  }

  customElements.define('bloom-hero', BloomHero);
}

// Shopify Theme Editor section reload handler
document.addEventListener('shopify:section:load', (event) => {
  const hero = event.target.querySelector('bloom-hero');
  if (hero && hero.resetAutoplay) {
    hero.resetAutoplay();
  }
});
