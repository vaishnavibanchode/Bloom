/**
 * Bloom Hero Slideshow - Custom Web Component
 * Inspired by Athora Planti preset
 */

if (!customElements.get('bloom-hero')) {
  class BloomHero extends HTMLElement {
    constructor() {
      super();
      this.currentIndex = 0;
      this.timer = null;
      this.progressInterval = null;
      this.isPaused = false;
      this.startTime = 0;
      
      this.onMouseEnter = this.pause.bind(this);
      this.onMouseLeave = this.resume.bind(this);
      this.onFocusIn = this.pause.bind(this);
      this.onFocusOut = this.resume.bind(this);
      this.onKeyDown = this.handleKeyDown.bind(this);
    }

    connectedCallback() {
      this.slides = Array.from(this.querySelectorAll('.bloom-hero__slide'));
      this.dots = Array.from(this.querySelectorAll('.bloom-hero__dot'));
      this.buttons = Array.from(this.querySelectorAll('.bloom-hero__btn'));
      this.prevBtn = this.querySelector('.bloom-hero__arrow--prev');
      this.nextBtn = this.querySelector('.bloom-hero__arrow--next');
      
      if (!this.slides.length) return;

      this.autoplayEnabled = this.dataset.autoplay === 'true';
      this.interval = parseInt(this.dataset.interval, 10) * 1000 || 5000;
      
      // Setup dot click & key events
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

      // Navigation arrow buttons
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

      // Touch swipe gestures for mobile
      this.touchStartX = 0;
      this.touchStartY = 0;
      this.onTouchStart = (e) => {
        if (e.touches && e.touches.length === 1) {
          this.touchStartX = e.touches[0].clientX;
          this.touchStartY = e.touches[0].clientY;
          this.pause();
        }
      };
      this.onTouchEnd = (e) => {
        if (e.changedTouches && e.changedTouches.length === 1) {
          const diffX = e.changedTouches[0].clientX - this.touchStartX;
          const diffY = e.changedTouches[0].clientY - this.touchStartY;
          if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
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
      this.addEventListener('touchstart', this.onTouchStart, { passive: true });
      this.addEventListener('touchend', this.onTouchEnd, { passive: true });

      // Mouse tracking for cursor-fill effect on buttons
      this.buttons.forEach((btn) => {
        const updatePos = (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          btn.style.setProperty('--mouse-x', `${x}px`);
          btn.style.setProperty('--mouse-y', `${y}px`);
        };
        btn.addEventListener('mouseenter', updatePos);
        btn.addEventListener('mousemove', updatePos);
      });

      // Hover / focus pause
      this.addEventListener('mouseenter', this.onMouseEnter);
      this.addEventListener('mouseleave', this.onMouseLeave);
      this.addEventListener('focusin', this.onFocusIn);
      this.addEventListener('focusout', this.onFocusOut);
      this.addEventListener('keydown', this.onKeyDown);

      // IntersectionObserver for performance (pauses autoplay when out of view)
      if ('IntersectionObserver' in window) {
        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.resume();
                this.resetAutoplay();
              } else {
                this.pause();
              }
            });
          },
          { threshold: 0.15 }
        );
        this.observer.observe(this);
      }

      // Start on first slide
      this.goToSlide(0);

      // Start autoplay if enabled and multiple slides exist
      if (this.autoplayEnabled && this.slides.length > 1) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          this.startAutoplay();
        }
      }

      // Shopify Editor Event Listeners
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

    disconnectedCallback() {
      this.stopAutoplay();
      if (this.observer) {
        this.observer.disconnect();
      }
      this.removeEventListener('mouseenter', this.onMouseEnter);
      this.removeEventListener('mouseleave', this.onMouseLeave);
      this.removeEventListener('focusin', this.onFocusIn);
      this.removeEventListener('focusout', this.onFocusOut);
      this.removeEventListener('keydown', this.onKeyDown);
      this.removeEventListener('touchstart', this.onTouchStart);
      this.removeEventListener('touchend', this.onTouchEnd);
    }

    goToSlide(index) {
      if (index < 0) index = this.slides.length - 1;
      if (index >= this.slides.length) index = 0;

      this.currentIndex = index;

      this.slides.forEach((slide, i) => {
        const isActive = i === index;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });

      this.dots.forEach((dot, i) => {
        const isActive = i === index;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      this.resetProgressRing();
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

    startAutoplay() {
      this.stopAutoplay();
      if (!this.autoplayEnabled || this.slides.length <= 1) return;

      this.startTime = Date.now();
      this.runProgressAnimation();

      this.timer = setInterval(() => {
        if (!this.isPaused) {
          this.nextSlide();
          this.startTime = Date.now();
          this.runProgressAnimation();
        }
      }, this.interval);
    }

    stopAutoplay() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
      if (this.progressInterval) {
        cancelAnimationFrame(this.progressInterval);
        this.progressInterval = null;
      }
    }

    pause() {
      this.isPaused = true;
    }

    resume() {
      this.isPaused = false;
      this.startTime = Date.now();
    }

    resetAutoplay() {
      if (this.autoplayEnabled && this.slides.length > 1) {
        this.startAutoplay();
      }
    }

    resetProgressRing() {
      this.dots.forEach((dot) => {
        const fill = dot.querySelector('.bloom-hero__progress-fill');
        if (fill) {
          fill.style.strokeDashoffset = '44';
        }
      });
    }

    runProgressAnimation() {
      if (this.progressInterval) {
        cancelAnimationFrame(this.progressInterval);
      }

      const activeDot = this.dots[this.currentIndex];
      if (!activeDot) return;
      const fill = activeDot.querySelector('.bloom-hero__progress-fill');
      if (!fill) return;

      const animate = () => {
        if (this.isPaused) {
          this.progressInterval = requestAnimationFrame(animate);
          return;
        }

        const elapsed = Date.now() - this.startTime;
        const fraction = Math.min(elapsed / this.interval, 1);
        const offset = 44 - (fraction * 44);
        fill.style.strokeDashoffset = `${offset}`;

        if (fraction < 1) {
          this.progressInterval = requestAnimationFrame(animate);
        }
      };

      this.progressInterval = requestAnimationFrame(animate);
    }
  }

  customElements.define('bloom-hero', BloomHero);
}

// Shopify theme editor reload hook
document.addEventListener('shopify:section:load', (event) => {
  const hero = event.target.querySelector('bloom-hero');
  if (hero && hero.resetAutoplay) {
    hero.resetAutoplay();
  }
});
