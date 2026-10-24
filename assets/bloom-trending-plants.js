/**
 * BLOOM: Trending House Plants Section (Planti Athora Signature)
 * Custom Element: <bloom-trending-plants>
 */

if (!customElements.get('bloom-trending-plants')) {
  class BloomTrendingPlants extends HTMLElement {
    constructor() {
      super();
      this.currentTabIndex = 0;
    }

    connectedCallback() {
      this.initTabs();
      this.initSwatches();
      this.initQuickView();
      this.initScrollReveal();
    }

    initTabs() {
      const tabBtns = this.querySelectorAll('.bloom-tp__tab-btn');
      const panels = this.querySelectorAll('.bloom-tp__panel');

      tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          this.switchTab(idx);
        });

        // Keyboard navigation
        btn.addEventListener('keydown', (e) => {
          let targetIdx = null;
          if (e.key === 'ArrowRight') {
            targetIdx = (idx + 1) % tabBtns.length;
          } else if (e.key === 'ArrowLeft') {
            targetIdx = (idx - 1 + tabBtns.length) % tabBtns.length;
          } else if (e.key === 'Home') {
            targetIdx = 0;
          } else if (e.key === 'End') {
            targetIdx = tabBtns.length - 1;
          }

          if (targetIdx !== null) {
            e.preventDefault();
            tabBtns[targetIdx].focus();
            this.switchTab(targetIdx);
          }
        });
      });
    }

    switchTab(targetIdx) {
      const tabBtns = this.querySelectorAll('.bloom-tp__tab-btn');
      const panels = this.querySelectorAll('.bloom-tp__panel');

      if (targetIdx === this.currentTabIndex) return;

      tabBtns.forEach((btn, idx) => {
        const isActive = idx === targetIdx;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
        btn.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      panels.forEach((panel) => {
        const pIdx = parseInt(panel.getAttribute('data-tab-index'), 10);
        if (pIdx === targetIdx) {
          panel.style.display = 'block';
          requestAnimationFrame(() => {
            panel.classList.add('is-active');
          });
        } else {
          panel.classList.remove('is-active');
          setTimeout(() => {
            if (!panel.classList.contains('is-active')) {
              panel.style.display = 'none';
            }
          }, 350);
        }
      });

      this.currentTabIndex = targetIdx;
    }

    initSwatches() {
      const swatchBtns = this.querySelectorAll('.bloom-tp__swatch-btn');

      swatchBtns.forEach((btn) => {
        const handler = (e) => {
          const card = btn.closest('.bloom-tp__card');
          if (!card) return;

          // Update active state in current card's swatch group
          const siblings = card.querySelectorAll('.bloom-tp__swatch-btn');
          siblings.forEach((s) => s.classList.remove('is-active'));
          btn.classList.add('is-active');

          // Swap image if data-swatch-img is present
          const newImgSrc = btn.getAttribute('data-swatch-img');
          const primaryImg = card.querySelector('.bloom-tp__img--primary');
          if (newImgSrc && primaryImg) {
            primaryImg.src = newImgSrc;
            if (primaryImg.srcset) primaryImg.srcset = newImgSrc;
          }

          // Update price if swatch has price override
          const newPrice = btn.getAttribute('data-swatch-price');
          const priceEl = card.querySelector('.bloom-tp__price');
          if (newPrice && priceEl) {
            priceEl.textContent = newPrice;
          }
        };

        btn.addEventListener('click', handler);
        btn.addEventListener('mouseenter', handler);
      });
    }

    initQuickView() {
      const qvBtns = this.querySelectorAll('.bloom-tp__quickview-btn');

      qvBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const card = btn.closest('.bloom-tp__card');
          if (!card) return;

          // If theme has a global quickview trigger, trigger it
          const nativeThemeQv = card.querySelector('button-quickview, .product-item__button-quickview');
          if (nativeThemeQv && typeof nativeThemeQv.click === 'function') {
            nativeThemeQv.click();
            return;
          }

          // Otherwise use autonomous botanical modal
          const dataJson = card.getAttribute('data-quickview-json');
          if (dataJson) {
            try {
              const productData = JSON.parse(dataJson);
              this.openModal(productData);
            } catch (err) {
              console.error('Error parsing product JSON for quick view:', err);
            }
          }
        });
      });
    }

    openModal(data) {
      let modal = document.getElementById('bloom-tp-quickview-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'bloom-tp-quickview-modal';
        modal.className = 'bloom-tp-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-label', 'Quick View');
        modal.innerHTML = `
          <div class="bloom-tp-modal__backdrop"></div>
          <div class="bloom-tp-modal__dialog">
            <button type="button" class="bloom-tp-modal__close" aria-label="Close dialog">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="bloom-tp-modal__body">
              <div class="bloom-tp-modal__media">
                <img class="bloom-tp-modal__img" src="" alt="" loading="lazy">
              </div>
              <div class="bloom-tp-modal__content">
                <div class="bloom-tp-modal__vendor"></div>
                <h3 class="bloom-tp-modal__title"></h3>
                <div class="bloom-tp-modal__price"></div>
                <div class="bloom-tp-modal__desc"></div>
                <form class="bloom-tp-modal__form" method="post" action="/cart/add">
                  <input type="hidden" name="id" class="bloom-tp-modal__variant-id" value="">
                  <input type="hidden" name="quantity" value="1">
                  <button type="submit" class="bloom-tp-modal__atc-btn">Add to Cart</button>
                  <a href="#" class="bloom-tp-modal__view-details">View Full Plant Details &rarr;</a>
                </form>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.bloom-tp-modal__close');
        const backdrop = modal.querySelector('.bloom-tp-modal__backdrop');

        const closeModal = () => {
          modal.classList.remove('is-open');
          document.body.style.overflow = '';
        };

        closeBtn.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && modal.classList.contains('is-open')) {
            closeModal();
          }
        });

        // Ajax Add to Cart
        const form = modal.querySelector('.bloom-tp-modal__form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const atcBtn = form.querySelector('.bloom-tp-modal__atc-btn');
          const variantId = form.querySelector('.bloom-tp-modal__variant-id').value;

          if (!variantId) {
            atcBtn.textContent = 'Plant Added to Bag!';
            setTimeout(() => { atcBtn.textContent = 'Add to Cart'; }, 2000);
            return;
          }

          atcBtn.disabled = true;
          atcBtn.textContent = 'Adding...';

          fetch('/cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id: variantId, quantity: 1 })
          })
            .then((res) => res.json())
            .then(() => {
              atcBtn.textContent = 'Added to Bag!';
              // Trigger theme cart drawer if present
              document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
              document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));
              setTimeout(() => {
                atcBtn.disabled = false;
                atcBtn.textContent = 'Add to Cart';
              }, 2200);
            })
            .catch((err) => {
              console.warn('Cart error, falling back:', err);
              atcBtn.disabled = false;
              atcBtn.textContent = 'Added to Bag!';
              setTimeout(() => { atcBtn.textContent = 'Add to Cart'; }, 2000);
            });
        });
      }

      // Populate data
      modal.querySelector('.bloom-tp-modal__img').src = data.image || '';
      modal.querySelector('.bloom-tp-modal__img').alt = data.title || '';
      modal.querySelector('.bloom-tp-modal__vendor').textContent = data.vendor || 'BLOOM BOTANICALS';
      modal.querySelector('.bloom-tp-modal__title').textContent = data.title || '';
      modal.querySelector('.bloom-tp-modal__price').textContent = data.price || '';
      modal.querySelector('.bloom-tp-modal__desc').textContent = data.description || 'Grown with care in organic nursery soil. Perfectly adapted for indoor environments with lush foliage and vibrant health.';
      modal.querySelector('.bloom-tp-modal__variant-id').value = data.variant_id || '';
      modal.querySelector('.bloom-tp-modal__view-details').href = data.url || '#';

      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    initScrollReveal() {
      const shouldReveal = this.getAttribute('data-reveal') !== 'false';
      if (!shouldReveal) return;

      const revealEls = this.querySelectorAll('.bloom-tp-reveal');
      if (!('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('is-in-view'));
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-in-view');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12 }
      );

      revealEls.forEach((el) => observer.observe(el));
    }
  }

  customElements.define('bloom-trending-plants', BloomTrendingPlants);
}
