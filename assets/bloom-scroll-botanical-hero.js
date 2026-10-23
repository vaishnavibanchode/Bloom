/**
 * Bloom Scroll-Animated Botanical Hero
 * Recreates the Planti theme scroll-driven botanical hero animation.
 * Scoped, performant, bidirectional scrub with requestAnimationFrame.
 */

if (!customElements.get('bloom-scroll-hero')) {
  class BloomScrollHero extends HTMLElement {
    constructor() {
      super();
      this.track = null;
      this.viewport = null;
      this.phaseOne = null;
      this.springContent = null;
      this.phaseTwo = null;
      this.panoramicImg = null;
      this.cardContent = null;
      this.items = {};

      this.ticking = false;
      this.rafId = null;
      this.onScroll = this.onScroll.bind(this);
      this.onResize = this.onResize.bind(this);
    }

    connectedCallback() {
      this.track = this.querySelector('.bloom-scroll-hero__track');
      this.viewport = this.querySelector('.bloom-scroll-hero__viewport');
      this.phaseOne = this.querySelector('.bloom-scroll-hero__phase-one');
      this.springContent = this.querySelector('.bloom-scroll-hero__spring-content');
      this.phaseTwo = this.querySelector('.bloom-scroll-hero__phase-two');
      this.panoramicImg = this.querySelector('.bloom-scroll-hero__panoramic-img');
      this.cardContent = this.querySelector('.bloom-scroll-hero__card-content');

      // Floating items
      const itemElements = this.querySelectorAll('.bloom-scroll-hero__item');
      itemElements.forEach((el) => {
        const key = el.dataset.item;
        if (key) this.items[key] = el;
      });

      // Check reduced motion preference or disabled animation
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const animationEnabled = this.dataset.animation !== 'false';

      if (prefersReducedMotion || !animationEnabled) {
        this.applyStaticFallback();
        return;
      }

      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('resize', this.onResize, { passive: true });

      // Initial frame render
      this.render();

      // Shopify Theme Editor lifecycle
      if (window.Shopify && Shopify.designMode) {
        document.addEventListener('shopify:section:load', (e) => {
          if (e.target.contains(this)) {
            this.render();
          }
        });
      }
    }

    disconnectedCallback() {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('resize', this.onResize);
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
      }
    }

    applyStaticFallback() {
      if (this.phaseTwo) {
        this.phaseTwo.style.clipPath = 'none';
        this.phaseTwo.style.opacity = '1';
        this.phaseTwo.style.transform = 'none';
      }
      if (this.cardContent) {
        this.cardContent.style.opacity = '1';
        this.cardContent.style.transform = 'none';
      }
      if (this.panoramicImg) {
        this.panoramicImg.style.transform = 'none';
      }
      if (this.phaseOne) {
        this.phaseOne.style.display = 'none';
      }
    }

    onScroll() {
      if (!this.ticking) {
        this.rafId = requestAnimationFrame(() => {
          this.render();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }

    onResize() {
      this.onScroll();
    }

    render() {
      if (!this.track || !this.viewport) return;

      const rect = this.track.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const scrollDistance = this.track.offsetHeight - viewportH;

      if (scrollDistance <= 0) return;

      // Calculate progress strictly from 0.0 to 1.0 through the pinned track
      let progress = 0;
      if (rect.top <= 0) {
        progress = Math.min(1, Math.max(0, -rect.top / scrollDistance));
      }

      this.updateAnimations(progress);
    }

    updateAnimations(progress) {
      // Helpers
      const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
      const mapRange = (val, inMin, inMax, outMin, outMax) => {
        const t = clamp((val - inMin) / (inMax - inMin), 0, 1);
        return outMin + t * (outMax - outMin);
      };

      // ----------------------------------------------------------------------
      // 1. Phase 1: Spring Savings Content (fade out between 0.12 and 0.32)
      // ----------------------------------------------------------------------
      if (this.springContent) {
        if (progress <= 0.12) {
          this.springContent.style.opacity = '1';
          this.springContent.style.transform = 'translateY(0) scale(1)';
        } else if (progress <= 0.32) {
          const t = (progress - 0.12) / (0.32 - 0.12);
          const opacity = 1 - t;
          const y = -35 * t;
          const scale = 1 - 0.05 * t;
          this.springContent.style.opacity = opacity.toFixed(3);
          this.springContent.style.transform = `translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        } else {
          this.springContent.style.opacity = '0';
          this.springContent.style.transform = 'translateY(-35px) scale(0.95)';
        }
      }

      // ----------------------------------------------------------------------
      // 2. Floating Botanical Items: Burst outwards, drift with parallax, fade
      // ----------------------------------------------------------------------
      // Flower (Center -> Top)
      if (this.items.flower) {
        if (progress <= 0.16) {
          // Centered, slight drift upwards
          const t = progress / 0.16;
          const y = -60 * t;
          const scale = 1 + 0.05 * t;
          this.items.flower.style.opacity = '1';
          this.items.flower.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.34) {
          const t = (progress - 0.16) / (0.34 - 0.16);
          const y = -60 - 80 * t;
          const opacity = 1 - t;
          this.items.flower.style.opacity = opacity.toFixed(3);
          this.items.flower.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(1.05)`;
        } else {
          this.items.flower.style.opacity = '0';
        }
      }

      // Monstera (Center -> Bottom)
      if (this.items.monstera) {
        if (progress <= 0.18) {
          const t = progress / 0.18;
          const y = 80 * t;
          const scale = mapRange(progress, 0, 0.18, 0.6, 1.0);
          const opacity = mapRange(progress, 0, 0.08, 0, 1);
          this.items.monstera.style.opacity = opacity.toFixed(3);
          this.items.monstera.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.35) {
          const t = (progress - 0.18) / (0.35 - 0.18);
          const y = 80 + 70 * t;
          const opacity = 1 - t;
          this.items.monstera.style.opacity = opacity.toFixed(3);
          this.items.monstera.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(1)`;
        } else {
          this.items.monstera.style.opacity = '0';
        }
      }

      // Person Holding Plant (Center -> Bottom-Left)
      if (this.items.person) {
        if (progress <= 0.18) {
          const t = progress / 0.18;
          const x = -18 * t; // vw
          const y = 14 * t;  // vh
          const scale = mapRange(progress, 0, 0.18, 0.6, 1.0);
          const opacity = mapRange(progress, 0, 0.08, 0, 1);
          this.items.person.style.opacity = opacity.toFixed(3);
          this.items.person.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.35) {
          const t = (progress - 0.18) / (0.35 - 0.18);
          const x = -18 - 8 * t;
          const y = 14 + 8 * t;
          const opacity = 1 - t;
          this.items.person.style.opacity = opacity.toFixed(3);
          this.items.person.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) scale(1)`;
        } else {
          this.items.person.style.opacity = '0';
        }
      }

      // Garden Trowel (Center -> Bottom-Right)
      if (this.items.trowel) {
        if (progress <= 0.20) {
          const t = progress / 0.20;
          const x = 20 * t;  // vw
          const y = 16 * t;  // vh
          const rot = 15 + 20 * t;
          const scale = mapRange(progress, 0, 0.20, 0.6, 1.0);
          const opacity = mapRange(progress, 0, 0.10, 0, 1);
          this.items.trowel.style.opacity = opacity.toFixed(3);
          this.items.trowel.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.36) {
          const t = (progress - 0.20) / (0.36 - 0.20);
          const x = 20 + 8 * t;
          const y = 16 + 8 * t;
          const rot = 35 + 5 * t;
          const opacity = 1 - t;
          this.items.trowel.style.opacity = opacity.toFixed(3);
          this.items.trowel.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(1)`;
        } else {
          this.items.trowel.style.opacity = '0';
        }
      }

      // Watering Can (Center -> Top-Right)
      if (this.items.can) {
        if (progress <= 0.20) {
          const t = progress / 0.20;
          const x = 20 * t;   // vw
          const y = -14 * t;  // vh
          const rot = -4 - 12 * t;
          const scale = mapRange(progress, 0, 0.20, 0.6, 1.0);
          const opacity = mapRange(progress, 0.02, 0.12, 0, 1);
          this.items.can.style.opacity = opacity.toFixed(3);
          this.items.can.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.36) {
          const t = (progress - 0.20) / (0.36 - 0.20);
          const x = 20 + 8 * t;
          const y = -14 - 8 * t;
          const rot = -16 - 4 * t;
          const opacity = 1 - t;
          this.items.can.style.opacity = opacity.toFixed(3);
          this.items.can.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(1)`;
        } else {
          this.items.can.style.opacity = '0';
        }
      }

      // Potted Snake Plant (Center -> Top-Left)
      if (this.items.pot) {
        if (progress <= 0.20) {
          const t = progress / 0.20;
          const x = -18 * t;  // vw
          const y = -14 * t;  // vh
          const rot = 5 - 10 * t;
          const scale = mapRange(progress, 0, 0.20, 0.6, 1.0);
          const opacity = mapRange(progress, 0.02, 0.12, 0, 1);
          this.items.pot.style.opacity = opacity.toFixed(3);
          this.items.pot.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
        } else if (progress <= 0.36) {
          const t = (progress - 0.20) / (0.36 - 0.20);
          const x = -18 - 8 * t;
          const y = -14 - 8 * t;
          const rot = -5 - 3 * t;
          const opacity = 1 - t;
          this.items.pot.style.opacity = opacity.toFixed(3);
          this.items.pot.style.transform = `translate3d(${x.toFixed(1)}vw, ${y.toFixed(1)}vh, 0) rotate(${rot.toFixed(1)}deg) scale(1)`;
        } else {
          this.items.pot.style.opacity = '0';
        }
      }

      // ----------------------------------------------------------------------
      // 3. Phase 2 Card: Clip-Path Expansion from Center Card to Full Bleed
      // ----------------------------------------------------------------------
      if (this.phaseTwo) {
        if (progress < 0.24) {
          // Hidden
          this.phaseTwo.style.clipPath = 'inset(50% 50% round 36px)';
          this.phaseTwo.style.opacity = '0';
          this.phaseTwo.style.pointerEvents = 'none';
        } else if (progress <= 0.60) {
          // Emerges from center as rounded card (Screenshot 4)
          const t = (progress - 0.24) / (0.60 - 0.24);
          // Inset Y: 50% -> 9%
          // Inset X: 50% -> 7%
          const insetY = 50 - 41 * t;
          const insetX = 50 - 43 * t;
          const radius = 32;
          const opacity = mapRange(t, 0, 0.3, 0, 1);
          this.phaseTwo.style.clipPath = `inset(${insetY.toFixed(2)}% ${insetX.toFixed(2)}% round ${radius}px)`;
          this.phaseTwo.style.opacity = opacity.toFixed(3);
          this.phaseTwo.style.pointerEvents = 'auto';
        } else if (progress <= 0.95) {
          // Expands from rounded card (9% Y, 7% X) to full bleed (0% Y, 0% X) (Screenshot 5)
          const t = (progress - 0.60) / (0.95 - 0.60);
          const insetY = 9 - 9 * t;
          const insetX = 7 - 7 * t;
          const radius = Math.max(0, 32 * (1 - t));
          this.phaseTwo.style.clipPath = `inset(${insetY.toFixed(2)}% ${insetX.toFixed(2)}% round ${radius.toFixed(1)}px)`;
          this.phaseTwo.style.opacity = '1';
          this.phaseTwo.style.pointerEvents = 'auto';
        } else {
          // Completely unclipped full bleed
          this.phaseTwo.style.clipPath = 'inset(0% 0% round 0px)';
          this.phaseTwo.style.opacity = '1';
          this.phaseTwo.style.pointerEvents = 'auto';
        }
      }

      // ----------------------------------------------------------------------
      // 4. Panoramic 5-People Image Slide (Parallax reveal from bottom)
      // ----------------------------------------------------------------------
      if (this.panoramicImg) {
        // Slides smoothly upwards into place
        const t = clamp((progress - 0.30) / 0.60, 0, 1);
        const yOffset = (1 - t) * 14; // %
        this.panoramicImg.style.transform = `translate3d(0, ${yOffset.toFixed(2)}%, 0)`;
      }

      // ----------------------------------------------------------------------
      // 5. Phase 2 Editorial Typography & Pill Button Fade-in
      // ----------------------------------------------------------------------
      if (this.cardContent) {
        if (progress < 0.35) {
          this.cardContent.style.opacity = '0';
          this.cardContent.style.transform = 'translate3d(0, 40px, 0)';
        } else if (progress <= 0.65) {
          const t = (progress - 0.35) / (0.65 - 0.35);
          const y = 40 * (1 - t);
          this.cardContent.style.opacity = t.toFixed(3);
          this.cardContent.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        } else {
          this.cardContent.style.opacity = '1';
          this.cardContent.style.transform = 'translate3d(0, 0, 0)';
        }
      }
    }
  }

  customElements.define('bloom-scroll-hero', BloomScrollHero);
}
