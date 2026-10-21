/**
 * Athora - Planti Preset Interactive Animations & Controllers for Bloom Theme
 */

(function () {
  'use strict';

  function initAthoraPlantiSections(container) {
    const root = container || document;

    // --------------------------------------------------------------------------
    // 1. Athora Cursor-Fill Fluid Button Effect
    // --------------------------------------------------------------------------
    const cursorButtons = root.querySelectorAll('[data-cursor-fill]');
    cursorButtons.forEach((btn) => {
      let circle = btn.querySelector('.planti-circle-bg');
      if (!circle) {
        circle = document.createElement('span');
        circle.className = 'planti-circle-bg';
        circle.setAttribute('aria-hidden', 'true');
        btn.appendChild(circle);
      }

      function updateCirclePosition(e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        circle.style.left = x + 'px';
        circle.style.top = y + 'px';
      }

      btn.addEventListener('mouseenter', updateCirclePosition);
      btn.addEventListener('mousemove', updateCirclePosition);
    });

    // --------------------------------------------------------------------------
    // 2. Interactive Hotspot Pins & Adaptive Cards
    // --------------------------------------------------------------------------
    const hotspotContainers = root.querySelectorAll('[data-planti-hotspots]');
    hotspotContainers.forEach((containerEl) => {
      const items = containerEl.querySelectorAll('[data-hotspot-item]');

      items.forEach((item) => {
        const trigger = item.querySelector('[data-hotspot-trigger]');
        const card = item.querySelector('[data-hotspot-card]');

        function adjustCardPosition() {
          if (!card) return;
          const containerRect = containerEl.getBoundingClientRect();
          const cardRect = card.getBoundingClientRect();

          // Reposition if overflows left or right
          if (cardRect.left < containerRect.left + 10) {
            const shift = containerRect.left + 10 - cardRect.left;
            card.style.transform = `translateX(calc(-50% + ${shift}px)) translateY(0) scale(1)`;
          } else if (cardRect.right > containerRect.right - 10) {
            const shift = cardRect.right - (containerRect.right - 10);
            card.style.transform = `translateX(calc(-50% - ${shift}px)) translateY(0) scale(1)`;
          }
        }

        if (trigger) {
          trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            const isActive = item.classList.contains('is-active');

            // Close other hotspots in container
            items.forEach((other) => {
              if (other !== item) {
                other.classList.remove('is-active');
                const t = other.querySelector('[data-hotspot-trigger]');
                if (t) t.setAttribute('aria-expanded', 'false');
              }
            });

            if (!isActive) {
              item.classList.add('is-active');
              trigger.setAttribute('aria-expanded', 'true');
              adjustCardPosition();
            } else {
              item.classList.remove('is-active');
              trigger.setAttribute('aria-expanded', 'false');
            }
          });
        }
      });

      // Close hotspots when clicking outside
      document.addEventListener('click', function (e) {
        if (!containerEl.contains(e.target)) {
          items.forEach((item) => {
            item.classList.remove('is-active');
            const t = item.querySelector('[data-hotspot-trigger]');
            if (t) t.setAttribute('aria-expanded', 'false');
          });
        }
      });
    });

    // --------------------------------------------------------------------------
    // 3. Before & After Drag Comparison Slider
    // --------------------------------------------------------------------------
    const baContainers = root.querySelectorAll('[data-planti-ba-slider]');
    baContainers.forEach((containerEl) => {
      const beforeLayer = containerEl.querySelector('[data-planti-ba-before]');
      const handle = containerEl.querySelector('[data-planti-ba-handle]');
      if (!beforeLayer || !handle) return;

      let isDragging = false;

      function updatePosition(clientX) {
        const rect = containerEl.getBoundingClientRect();
        let offsetX = clientX - rect.left;
        if (offsetX < 0) offsetX = 0;
        if (offsetX > rect.width) offsetX = rect.width;

        const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
        beforeLayer.style.width = percentage + '%';
        handle.style.left = percentage + '%';
        handle.setAttribute('aria-valuenow', Math.round(percentage));
      }

      function onPointerDown(e) {
        isDragging = true;
        updatePosition(e.clientX);
        e.preventDefault();
      }

      function onPointerMove(e) {
        if (!isDragging) return;
        updatePosition(e.clientX);
      }

      function onPointerUp() {
        isDragging = false;
      }

      handle.addEventListener('pointerdown', onPointerDown);
      containerEl.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);

      // Keyboard accessibility
      handle.addEventListener('keydown', function (e) {
        const current = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
        let step = 0;
        if (e.key === 'ArrowLeft') step = -5;
        if (e.key === 'ArrowRight') step = 5;

        if (step !== 0) {
          e.preventDefault();
          const target = Math.max(0, Math.min(100, current + step));
          beforeLayer.style.width = target + '%';
          handle.style.left = target + '%';
          handle.setAttribute('aria-valuenow', target);
        }
      });
    });

    // --------------------------------------------------------------------------
    // 4. Animated Milestone Stat Counter
    // --------------------------------------------------------------------------
    const statGrids = root.querySelectorAll('[data-planti-stat-grid]');
    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const counterNumbers = entry.target.querySelectorAll('[data-counter-target]');
              counterNumbers.forEach((el) => {
                const targetStr = el.getAttribute('data-counter-target');
                const targetNum = parseFloat(targetStr);
                const valSpan = el.querySelector('.planti-stat-val');
                if (isNaN(targetNum) || !valSpan) return;

                const isDecimal = targetStr.includes('.');
                const decimals = isDecimal ? targetStr.split('.')[1].length : 0;
                const duration = 1800; // ms
                const startTime = performance.now();

                function step(currentTime) {
                  const elapsed = currentTime - startTime;
                  const progress = Math.min(elapsed / duration, 1);
                  // Ease-out expo
                  const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                  const currentVal = (targetNum * easeOut).toFixed(decimals);
                  valSpan.textContent = currentVal;

                  if (progress < 1) {
                    requestAnimationFrame(step);
                  } else {
                    valSpan.textContent = targetStr;
                  }
                }

                requestAnimationFrame(step);
              });

              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );

      statGrids.forEach((grid) => counterObserver.observe(grid));
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initAthoraPlantiSections());
  } else {
    initAthoraPlantiSections();
  }

  // Shopify theme editor support
  document.addEventListener('shopify:section:load', function (e) {
    initAthoraPlantiSections(e.target);
  });
})();
