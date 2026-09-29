/* Read Judge.me's server-rendered metafield; never fetch private API credentials. */
if (!customElements.get('dunamiss-review-carousel')) {
  customElements.define('dunamiss-review-carousel', class extends HTMLElement {
    connectedCallback() {
      if (this.controller) return;
      this.controller = new AbortController();
      const { signal } = this.controller;
      this.track = this.querySelector('.dm-reviews__track');
      const source = this.querySelector('[data-review-source]');
      if (!this.track || !source) return;
      this.track.replaceChildren();
      const seen = new Set();
      source.content.querySelectorAll('.jdgm-carousel-item').forEach((item) => {
        const read = (name) => item.querySelector(`.jdgm-carousel-item__${name}`)?.textContent.trim() || '';
        const body = read('review-body');
        const title = read('review-title');
        const author = read('reviewer-name');
        const id = item.dataset.reviewId || JSON.stringify([body, title, author]);
        if ((!body && !title) || seen.has(id)) return;
        seen.add(id);
        const card = document.createElement('article');
        card.className = 'dm-review';
        const append = (tag, className, text) => {
          const el = document.createElement(tag);
          el.className = className;
          el.textContent = text;
          card.append(el);
          return el;
        };
        const rating = item.querySelector('.jdgm-carousel-item__review-rating');
        const score = rating?.querySelectorAll('.jdgm--on').length || 0;
        if (score > 0 && score <= 5) {
          const stars = append('div', 'dm-review__stars', '★'.repeat(score) + '☆'.repeat(5 - score));
          stars.setAttribute('role', 'img');
          stars.setAttribute('aria-label', `${score} out of 5 stars`);
        }
        if (title) append('h3', 'dm-review__title', title);
        if (body) append('p', 'dm-review__body', body);
        if (author) append('p', 'dm-review__author', author);
        const product = item.querySelector('.jdgm-carousel-item__product-title');
        const sourceImage = item.querySelector('.jdgm-carousel-item__product-image');
        const link = product?.closest('a') || product?.querySelector('a') || sourceImage?.closest('a') ||
          item.querySelector('.jdgm-carousel-item__product-wrapper a[href]');
        const safeURL = (value) => {
          if (!value) return null;
          try {
            const url = new URL(value, location.origin);
            return ['https:', 'http:'].includes(url.protocol) ? url : null;
          } catch (_) { return null; }
        };
        const productURL = safeURL(link?.getAttribute('href'));
        const rawName = product?.textContent.trim() || sourceImage?.getAttribute('alt')?.trim() || '';
        // Keep the destination intact; show a readable name instead of a raw URL.
        const productName = /^(https?:|\/\/|\/products\/)/i.test(rawName) ? 'View product' : rawName;
        if (productName || productURL) {
          const row = append(productURL ? 'a' : 'div', 'dm-review__product', '');
          if (productURL) row.href = productURL.href;
          const name = productName || 'View product';
          row.title = name;
          const imageURL = safeURL(sourceImage?.getAttribute('data-src')) ||
            safeURL(sourceImage?.getAttribute('src'));
          if (imageURL) {
            const imageFrame = document.createElement('span');
            imageFrame.className = 'dm-review__product-thumbnail';
            const thumbnail = document.createElement('img');
            thumbnail.className = 'dm-review__product-image';
            thumbnail.width = 48;
            thumbnail.height = 48;
            thumbnail.alt = '';
            thumbnail.loading = 'lazy';
            thumbnail.decoding = 'async';
            thumbnail.addEventListener('error', () => imageFrame.remove(), { once: true, signal });
            thumbnail.src = imageURL.href;
            imageFrame.append(thumbnail);
            row.append(imageFrame);
          }
          const label = document.createElement('span');
          label.className = 'dm-review__product-name';
          label.textContent = name;
          row.append(label);
        }
        this.track.append(card);
      });
      this.cards = [...this.track.children];
      if (!this.cards.length) {
        if (this.dataset.designMode === 'true') {
          this.hidden = false;
          this.querySelector('[data-review-empty]').hidden = false;
        }
        return;
      }
      this.hidden = false;
      this.previous = this.querySelector('[data-previous]');
      this.next = this.querySelector('[data-next]');
      this.previous.addEventListener('click', () => { this.move(-1); this.syncAutoplay(); }, { signal });
      this.next.addEventListener('click', () => { this.move(1); this.syncAutoplay(); }, { signal });
      this.track.addEventListener('scroll', () => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.update());
      }, { passive: true, signal });
      this.track.addEventListener('keydown', (event) => {
        if (event.target !== this.track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const rtl = getComputedStyle(this.track).direction === 'rtl';
        this.move((event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1));
      }, { signal });
      this.resizeObserver = new ResizeObserver(() => this.update());
      this.resizeObserver.observe(this.track);
      this.update();
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.paused = this.motion.matches;
      this.keyboardFocus = false;
      this.touching = false;
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Tab') { this.keyboardFocus = true; this.syncAutoplay(); }
      }, { signal });
      this.addEventListener('focusin', () => this.syncAutoplay(), { signal });
      this.addEventListener('focusout', () => {
        queueMicrotask(() => { if (this.isConnected) this.syncAutoplay(); });
      }, { signal });
      this.addEventListener('pointerdown', () => { this.keyboardFocus = false; this.touching = true; this.stopAnimation(); this.syncAutoplay(); }, { signal });
      this.track.addEventListener('wheel', () => this.stopAnimation(), { passive: true, signal });
      const release = () => { this.touching = false; this.syncAutoplay(); };
      document.addEventListener('pointerup', release, { signal });
      document.addEventListener('pointercancel', release, { signal });
      document.addEventListener('visibilitychange', () => this.syncAutoplay(), { signal });
      this.motion.addEventListener('change', () => {
        this.paused = this.motion.matches;
        this.stopAnimation();
        this.syncAutoplay();
      }, { signal });
      // Off-screen autoplay otherwise forces layout and paint every three seconds.
      this.inViewport = !('IntersectionObserver' in window);
      if ('IntersectionObserver' in window) {
        this.visibilityObserver = new IntersectionObserver(([entry]) => {
          this.inViewport = entry.isIntersecting;
          if (!this.inViewport) this.stopAnimation();
          this.syncAutoplay();
        });
        this.visibilityObserver.observe(this);
      }
      this.syncAutoplay();
    }
    syncAutoplay() {
      clearTimeout(this.autoplayTimer);
      const stopped = !this.inViewport || this.paused || this.touching || document.hidden || (this.keyboardFocus && this.contains(document.activeElement));
      this.querySelector('[data-review-status]').setAttribute('aria-live', stopped ? 'polite' : 'off');
      if (stopped) return;
      this.autoplayTimer = setTimeout(() => {
        if (this.pageStarts.length > 1) this.goToPage((this.activePage + 1) % this.pageStarts.length);
        this.syncAutoplay();
      }, 3000);
    }
    update() {
      const step = this.cards[0].getBoundingClientRect().width + 20;
      this.pageSize = Math.max(1, Math.round((this.track.clientWidth + 20) / step));
      const pageCount = Math.max(1, this.cards.length - this.pageSize + 1);
      this.pageStarts = Array.from({ length: pageCount }, (_, page) => page);
      const position = Math.abs(this.track.scrollLeft) / step;
      this.activePage = this.pageStarts.reduce((best, start, page) =>
        Math.abs(start - position) < Math.abs(this.pageStarts[best] - position) ? page : best, 0);
      this.previous.hidden = pageCount <= 1;
      this.next.hidden = pageCount <= 1;
      this.previous.disabled = this.activePage === 0;
      this.next.disabled = this.activePage === pageCount - 1;
      const status = this.querySelector('[data-review-status]');
      const message = `Review page ${this.activePage + 1} of ${pageCount}`;
      if (status.textContent !== message) status.textContent = message;
    }
    move(direction) {
      this.goToPage(this.activePage + direction);
    }
    goToPage(page) {
      const index = this.pageStarts[Math.max(0, Math.min(this.pageStarts.length - 1, page))];
      const rtl = getComputedStyle(this.track).direction === 'rtl';
      const step = this.cards[0].getBoundingClientRect().width + 20;
      this.stopAnimation();
      const target = index * step * (rtl ? -1 : 1);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.track.scrollTo({ left: target, behavior: 'instant' });
        return;
      }
      const start = this.track.scrollLeft;
      const began = performance.now();
      // Suspend snapping during easing so the browser does not fight each frame.
      this.track.style.scrollSnapType = 'none';
      const animate = (now) => {
        const progress = Math.min(1, (now - began) / 700);
        const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
        this.track.scrollTo({ left: start + (target - start) * eased, behavior: 'instant' });
        if (progress < 1) this.animationFrame = requestAnimationFrame(animate);
        else {
          this.track.style.removeProperty('scroll-snap-type');
          this.animationFrame = null;
          this.update();
        }
      };
      this.animationFrame = requestAnimationFrame(animate);
    }
    stopAnimation() {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
      this.track?.style.removeProperty('scroll-snap-type');
    }
    disconnectedCallback() {
      this.stopAnimation();
      clearTimeout(this.autoplayTimer);
      this.controller?.abort();
      this.controller = null;
      this.resizeObserver?.disconnect();
      this.visibilityObserver?.disconnect();
      cancelAnimationFrame(this.frame);
    }
  });
}
