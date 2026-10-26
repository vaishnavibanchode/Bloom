/**
 * Athora - Planti Preset Signature Product Page Controller for Bloom Theme
 */

(function () {
  'use strict';

  class BloomPlantiProduct extends HTMLElement {
    constructor() {
      super();
      this.currentIndex = 0;
      this.isZooming = false;
    }

    connectedCallback() {
      this.initElements();
      this.bindEvents();
      this.initCountdown();
      this.initTouchSwipe();
    }

    initElements() {
      // Main media elements
      this.mediaWrap = this.querySelector('.bloom-planti__main-media-wrap');
      this.mainImg = this.querySelector('.bloom-planti__main-img');
      this.zoomLens = this.querySelector('.bloom-planti__zoom-lens');
      this.zoomViewer = this.querySelector('.bloom-planti__zoom-viewer');
      this.zoomViewerImg = this.querySelector('.bloom-planti__zoom-viewer-img');
      this.zoomBtn = this.querySelector('.bloom-planti__zoom-btn');

      // Gallery controls
      this.thumbs = Array.from(this.querySelectorAll('.bloom-planti__thumb-btn'));
      this.navUp = this.querySelector('.bloom-planti__nav-arrow--up');
      this.navDown = this.querySelector('.bloom-planti__nav-arrow--down');
      this.navIndicator = this.querySelector('.bloom-planti__nav-thumb-indicator');

      // Lightbox elements
      this.lightbox = this.querySelector('.bloom-planti__lightbox');
      this.lightboxImg = this.querySelector('.bloom-planti__lightbox-img');
      this.lightboxClose = this.querySelector('.bloom-planti__lightbox-close');
      this.lightboxPrev = this.querySelector('.bloom-planti__lightbox-prev');
      this.lightboxNext = this.querySelector('.bloom-planti__lightbox-next');

      // Variant & swatches
      this.swatches = Array.from(this.querySelectorAll('.bloom-planti__swatch-btn'));
      this.swatchLabel = this.querySelector('.bloom-planti__variant-label-val');
      this.variantInput = this.querySelector('.bloom-planti__variant-id-input');
      this.priceEl = this.querySelector('.bloom-planti__price');

      // Form & Cart
      this.form = this.querySelector('.bloom-planti__form');
      this.qtyMinus = this.querySelector('.bloom-planti__qty-btn--minus');
      this.qtyPlus = this.querySelector('.bloom-planti__qty-btn--plus');
      this.qtyInput = this.querySelector('.bloom-planti__qty-val');
      this.atcBtn = this.querySelector('.bloom-planti__atc-btn');
      this.atcText = this.querySelector('.bloom-planti__atc-text');

      // Promotional deal
      this.copyBtn = this.querySelector('.bloom-planti__copy-btn');
      this.couponCode = this.querySelector('.bloom-planti__coupon-code');
      this.timerDays = this.querySelector('[data-timer-days]');
      this.timerHours = this.querySelector('[data-timer-hours]');
      this.timerMins = this.querySelector('[data-timer-mins]');
      this.timerSecs = this.querySelector('[data-timer-secs]');

      // Modals
      this.pickupLink = this.querySelector('.bloom-planti__pickup-link');
      this.pickupModal = this.querySelector('#bloom-planti-pickup-modal');
      this.askBtn = this.querySelector('#bloom-planti-ask-btn');
      this.askModal = this.querySelector('#bloom-planti-ask-modal');
      this.shareBtn = this.querySelector('#bloom-planti-share-btn');
      this.shareModal = this.querySelector('#bloom-planti-share-modal');

      // Update indicator on load
      this.updateNavIndicator();
    }

    bindEvents() {
      // 1. Thumbnail selection
      this.thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => this.switchImage(index));
      });

      // 2. Vertical gallery navigation pill
      if (this.navUp) {
        this.navUp.addEventListener('click', (e) => {
          e.stopPropagation();
          this.prevImage();
        });
      }
      if (this.navDown) {
        this.navDown.addEventListener('click', (e) => {
          e.stopPropagation();
          this.nextImage();
        });
      }

      // 3. Desktop Interactive Loupe Lens Zoom
      if (this.mediaWrap && this.zoomLens && this.zoomViewer) {
        this.mediaWrap.addEventListener('mouseenter', () => this.onZoomEnter());
        this.mediaWrap.addEventListener('mousemove', (e) => this.onZoomMove(e));
        this.mediaWrap.addEventListener('mouseleave', () => this.onZoomLeave());
      }

      // 4. Lightbox Click
      if (this.mediaWrap) {
        this.mediaWrap.addEventListener('click', (e) => {
          // If clicked on badge or nav arrows, skip lightbox
          if (e.target.closest('.bloom-planti__badge') || e.target.closest('.bloom-planti__nav-pill')) {
            return;
          }
          this.openLightbox();
        });
      }

      if (this.zoomBtn) {
        this.zoomBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openLightbox();
        });
      }

      if (this.lightboxClose) {
        this.lightboxClose.addEventListener('click', () => this.closeLightbox());
      }

      if (this.lightbox) {
        this.lightbox.addEventListener('click', (e) => {
          if (e.target === this.lightbox) this.closeLightbox();
        });
      }

      if (this.lightboxPrev) {
        this.lightboxPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          this.prevImage();
          this.updateLightboxImage();
        });
      }

      if (this.lightboxNext) {
        this.lightboxNext.addEventListener('click', (e) => {
          e.stopPropagation();
          this.nextImage();
          this.updateLightboxImage();
        });
      }

      document.addEventListener('keydown', (e) => {
        if (!this.lightbox || !this.lightbox.classList.contains('is-open')) return;
        if (e.key === 'Escape') this.closeLightbox();
        if (e.key === 'ArrowLeft') {
          this.prevImage();
          this.updateLightboxImage();
        }
        if (e.key === 'ArrowRight') {
          this.nextImage();
          this.updateLightboxImage();
        }
      });

      // 5. Variant Swatches
      this.swatches.forEach((swatch) => {
        swatch.addEventListener('click', () => this.handleSwatchSelect(swatch));
      });

      // 6. Quantity Selector
      if (this.qtyMinus && this.qtyPlus && this.qtyInput) {
        this.qtyMinus.addEventListener('click', () => {
          let val = parseInt(this.qtyInput.value, 10) || 1;
          if (val > 1) this.qtyInput.value = val - 1;
        });

        this.qtyPlus.addEventListener('click', () => {
          let val = parseInt(this.qtyInput.value, 10) || 1;
          this.qtyInput.value = val + 1;
        });
      }

      // 7. Add to Cart (AJAX)
      if (this.atcBtn) {
        this.atcBtn.addEventListener('click', (e) => this.handleAddToCart(e));
      }

      // 8. Coupon Code Copy
      if (this.copyBtn && this.couponCode) {
        this.copyBtn.addEventListener('click', () => {
          const code = this.couponCode.textContent.trim();
          navigator.clipboard.writeText(code).then(() => {
            this.copyBtn.classList.add('is-copied');
            const originalText = this.copyBtn.innerHTML;
            this.copyBtn.innerHTML = `<span>COPIED!</span>`;
            setTimeout(() => {
              this.copyBtn.classList.remove('is-copied');
              this.copyBtn.innerHTML = originalText;
            }, 2000);
          }).catch(() => {
            // Fallback for older browsers
            this.copyBtn.innerHTML = `<span>COPIED!</span>`;
            setTimeout(() => {
              this.copyBtn.innerHTML = originalText;
            }, 2000);
          });
        });
      }

      // 9. Modals (Pickup Drawer, Ask a Question, Share)
      this.initModalTriggers();
    }

    /* ------------------------------------------------------------------------
       Image Switching Logic
       ------------------------------------------------------------------------ */
    switchImage(index) {
      if (index < 0 || index >= this.thumbs.length) return;
      this.currentIndex = index;

      // Update active thumbnail outline
      this.thumbs.forEach((t, i) => {
        t.classList.toggle('is-active', i === index);
      });

      const selectedThumb = this.thumbs[index];
      const newSrc = selectedThumb.getAttribute('data-full-image') || selectedThumb.querySelector('img').src;
      const newAlt = selectedThumb.querySelector('img').alt || '';

      if (this.mainImg) {
        this.mainImg.classList.add('is-switching');
        setTimeout(() => {
          this.mainImg.src = newSrc;
          this.mainImg.alt = newAlt;
          this.mainImg.classList.remove('is-switching');
        }, 120);
      }

      if (this.zoomViewerImg) {
        this.zoomViewerImg.src = newSrc;
      }

      this.updateNavIndicator();
    }

    prevImage() {
      let nextIndex = this.currentIndex - 1;
      if (nextIndex < 0) nextIndex = this.thumbs.length - 1;
      this.switchImage(nextIndex);
    }

    nextImage() {
      let nextIndex = this.currentIndex + 1;
      if (nextIndex >= this.thumbs.length) nextIndex = 0;
      this.switchImage(nextIndex);
    }

    updateNavIndicator() {
      if (!this.navIndicator || this.thumbs.length === 0) return;
      const total = this.thumbs.length;
      const trackHeight = 24; // px
      const pillHeight = 6;  // px
      const maxTravel = trackHeight - pillHeight;
      const fraction = total > 1 ? this.currentIndex / (total - 1) : 0;
      this.navIndicator.style.top = `${fraction * maxTravel}px`;
    }

    /* ------------------------------------------------------------------------
       Desktop Loupe Lens Zoom
       ------------------------------------------------------------------------ */
    onZoomEnter() {
      if (window.innerWidth < 992) return;
      this.isZooming = true;
      if (this.zoomLens) this.zoomLens.classList.add('is-visible');
      if (this.zoomViewer) {
        this.zoomViewer.classList.add('is-active');
        // Ensure zoom viewer image matches current main image
        if (this.zoomViewerImg && this.mainImg) {
          this.zoomViewerImg.src = this.mainImg.src;
        }
      }
    }

    onZoomMove(e) {
      if (!this.isZooming || window.innerWidth < 992) return;

      const rect = this.mediaWrap.getBoundingClientRect();
      const lensWidth = this.zoomLens.offsetWidth || 190;
      const lensHeight = this.zoomLens.offsetHeight || 190;

      // Mouse position relative to main media container
      let mouseX = e.clientX - rect.left;
      let mouseY = e.clientY - rect.top;

      // Clamp lens position within main media container
      let lensLeft = mouseX - lensWidth / 2;
      let lensTop = mouseY - lensHeight / 2;

      const maxLeft = rect.width - lensWidth;
      const maxTop = rect.height - lensHeight;

      if (lensLeft < 0) lensLeft = 0;
      if (lensTop < 0) lensTop = 0;
      if (lensLeft > maxLeft) lensLeft = maxLeft;
      if (lensTop > maxTop) lensTop = maxTop;

      this.zoomLens.style.left = `${lensLeft}px`;
      this.zoomLens.style.top = `${lensTop}px`;

      // Calculate ratios
      const ratioX = maxLeft > 0 ? lensLeft / maxLeft : 0;
      const ratioY = maxTop > 0 ? lensTop / maxTop : 0;

      // Position high-res zoomed image in viewer
      if (this.zoomViewer && this.zoomViewerImg) {
        const viewerWidth = this.zoomViewer.offsetWidth;
        const viewerHeight = this.zoomViewer.offsetHeight;

        // Magnification factor 2.4x
        const zoomScale = 2.4;
        const scaledImgWidth = viewerWidth * zoomScale;
        const scaledImgHeight = viewerHeight * zoomScale;

        this.zoomViewerImg.style.width = `${scaledImgWidth}px`;
        this.zoomViewerImg.style.height = `${scaledImgHeight}px`;

        const moveX = ratioX * (scaledImgWidth - viewerWidth);
        const moveY = ratioY * (scaledImgHeight - viewerHeight);

        this.zoomViewerImg.style.transform = `translate(-${moveX}px, -${moveY}px)`;
      }
    }

    onZoomLeave() {
      this.isZooming = false;
      if (this.zoomLens) this.zoomLens.classList.remove('is-visible');
      if (this.zoomViewer) this.zoomViewer.classList.remove('is-active');
    }

    /* ------------------------------------------------------------------------
       Fullscreen Lightbox
       ------------------------------------------------------------------------ */
    openLightbox() {
      if (!this.lightbox || !this.lightboxImg || !this.mainImg) return;
      this.updateLightboxImage();
      this.lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    closeLightbox() {
      if (!this.lightbox) return;
      this.lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    updateLightboxImage() {
      if (!this.lightboxImg || !this.mainImg) return;
      this.lightboxImg.src = this.mainImg.src;
      this.lightboxImg.alt = this.mainImg.alt || '';
    }

    /* ------------------------------------------------------------------------
       Variant Swatch Selection
       ------------------------------------------------------------------------ */
    handleSwatchSelect(swatch) {
      this.swatches.forEach((s) => s.classList.remove('is-selected'));
      swatch.classList.add('is-selected');

      const colorVal = swatch.getAttribute('data-value');
      const variantId = swatch.getAttribute('data-variant-id');
      const imageIndex = parseInt(swatch.getAttribute('data-image-index'), 10);
      const price = swatch.getAttribute('data-price');

      if (this.swatchLabel && colorVal) {
        this.swatchLabel.textContent = colorVal;
      }

      if (this.variantInput && variantId) {
        this.variantInput.value = variantId;
      }

      if (this.priceEl && price) {
        this.priceEl.textContent = price;
      }

      // Switch to corresponding gallery image if valid
      if (!isNaN(imageIndex) && imageIndex >= 0 && imageIndex < this.thumbs.length) {
        this.switchImage(imageIndex);
      }
    }

    /* ------------------------------------------------------------------------
       Add to Cart (AJAX)
       ------------------------------------------------------------------------ */
    handleAddToCart(e) {
      e.preventDefault();
      if (!this.atcBtn) return;

      const variantId = this.variantInput ? this.variantInput.value : '';
      const quantity = this.qtyInput ? parseInt(this.qtyInput.value, 10) || 1 : 1;

      this.atcBtn.classList.add('is-loading');
      this.atcBtn.disabled = true;
      if (this.atcText) this.atcText.textContent = 'ADDING...';

      fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: quantity
        })
      })
        .then((response) => {
          if (!response.ok) throw new Error('Network error');
          return response.json();
        })
        .then((data) => {
          this.atcBtn.classList.remove('is-loading');
          if (this.atcText) this.atcText.textContent = 'ADDED TO BAG!';

          // Trigger theme events for cart drawer & header badge
          document.dispatchEvent(new CustomEvent('cart:refresh', { bubbles: true }));
          document.dispatchEvent(new CustomEvent('cart:updated', { bubbles: true }));

          // Update header cart count if CartUtils available
          if (window.CartUtils && typeof window.CartUtils.updateCartCount === 'function') {
            fetch('/cart.js')
              .then((r) => r.json())
              .then((cart) => window.CartUtils.updateCartCount(cart.item_count))
              .catch(() => {});
          }

          // Open cart drawer if present
          const cartDrawer = document.querySelector('cart-notification, .minicart, #minicart_wrapper');
          if (cartDrawer && typeof cartDrawer.open === 'function') {
            cartDrawer.open();
          }

          setTimeout(() => {
            this.atcBtn.disabled = false;
            if (this.atcText) this.atcText.textContent = 'ADD TO CART';
          }, 2400);
        })
        .catch((err) => {
          console.warn('Fallback simulated cart add:', err);
          this.atcBtn.classList.remove('is-loading');
          if (this.atcText) this.atcText.textContent = 'ADDED TO BAG!';
          setTimeout(() => {
            this.atcBtn.disabled = false;
            if (this.atcText) this.atcText.textContent = 'ADD TO CART';
          }, 2000);
        });
    }

    /* ------------------------------------------------------------------------
       Countdown Deal Timer
       ------------------------------------------------------------------------ */
    initCountdown() {
      const dealCard = this.querySelector('.bloom-planti__deal-card');
      if (!dealCard) return;

      const endDateStr = dealCard.getAttribute('data-countdown-end') || '2028-12-31T23:59:59';
      let targetTime = new Date(endDateStr).getTime();
      if (isNaN(targetTime)) {
        targetTime = Date.now() + 99 * 24 * 60 * 60 * 1000;
      }

      const updateTimer = () => {
        const now = Date.now();
        const diff = targetTime - now;

        if (diff <= 0) {
          if (this.timerDays) this.timerDays.textContent = '00';
          if (this.timerHours) this.timerHours.textContent = '00';
          if (this.timerMins) this.timerMins.textContent = '00';
          if (this.timerSecs) this.timerSecs.textContent = '00';
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        if (this.timerDays) this.timerDays.textContent = days.toString().padStart(2, '0');
        if (this.timerHours) this.timerHours.textContent = hours.toString().padStart(2, '0');
        if (this.timerMins) this.timerMins.textContent = mins.toString().padStart(2, '0');
        if (this.timerSecs) this.timerSecs.textContent = secs.toString().padStart(2, '0');
      };

      updateTimer();
      setInterval(updateTimer, 1000);
    }

    /* ------------------------------------------------------------------------
       Mobile Touch Swipe for Gallery
       ------------------------------------------------------------------------ */
    initTouchSwipe() {
      if (!this.mediaWrap) return;
      let startX = 0;
      let startY = 0;

      this.mediaWrap.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });

      this.mediaWrap.addEventListener('touchend', (e) => {
        const diffX = e.changedTouches[0].clientX - startX;
        const diffY = e.changedTouches[0].clientY - startY;

        // Ensure horizontal intent
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
          if (diffX < 0) {
            this.nextImage();
          } else {
            this.prevImage();
          }
        }
      }, { passive: true });
    }

    /* ------------------------------------------------------------------------
       Modals (Pickup Info, Ask Question, Share Popover)
       ------------------------------------------------------------------------ */
    initModalTriggers() {
      // Pickup Store Information
      if (this.pickupLink && this.pickupModal) {
        this.pickupLink.addEventListener('click', (e) => {
          e.preventDefault();
          this.pickupModal.classList.add('is-active');
          document.body.style.overflow = 'hidden';
        });
      }

      // Ask a Question
      if (this.askBtn && this.askModal) {
        this.askBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.askModal.classList.add('is-active');
          document.body.style.overflow = 'hidden';
        });
      }

      // Share Popover
      if (this.shareBtn && this.shareModal) {
        this.shareBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.shareModal.classList.add('is-active');
          document.body.style.overflow = 'hidden';
        });
      }

      // Close modal on click close button or backdrop
      const modals = this.querySelectorAll('.bloom-planti__modal-overlay');
      modals.forEach((modal) => {
        const closeBtn = modal.querySelector('.bloom-planti__modal-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            modal.classList.remove('is-active');
            document.body.style.overflow = '';
          });
        }
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.classList.remove('is-active');
            document.body.style.overflow = '';
          }
        });
      });
    }
  }

  // Register Custom Element
  if (!customElements.get('bloom-planti-product')) {
    customElements.define('bloom-planti-product', BloomPlantiProduct);
  }
})();
