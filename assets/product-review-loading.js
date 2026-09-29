(() => {
  const root = document.documentElement;
  const pendingClass = 'product-reviews-pending';
  root.classList.add(pendingClass);
  let observer;
  let poll;
  let stableSince = 0;
  let lastHeight = 0;
  let notice;

  const reveal = () => {
    root.classList.remove(pendingClass);
    observer?.disconnect();
    clearInterval(poll);
    clearTimeout(fallback);
    notice?.remove();
  };
  // Offer access to the server-rendered fallback without revealing half-built UI.
  const fallback = setTimeout(() => {
    const widget = document.getElementById('judgeme_product_reviews');
    if (!widget) return reveal();
    notice = document.createElement('div');
    notice.className = 'product-reviews-loading-notice';
    notice.setAttribute('role', 'status');
    notice.append('Reviews are taking longer to load. ');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Show available reviews';
    button.addEventListener('click', reveal, { once: true });
    notice.append(button);
    widget.before(notice);
  }, 20000);

  const check = () => {
    const widget = document.getElementById('judgeme_product_reviews');
    if (!widget) return;
    const modern = widget.querySelector('.jm-review-widget');
    const legacy = widget.querySelector('.jdgm-rev-widg');
    const content = modern || legacy;
    const hasReviews = widget.querySelector('.jdgm-review-card, .jdgm-rev-widg .jdgm-rev');
    const reviewData = window.jdgm?.data?.reviewWidget?.[widget.dataset.productId];
    const empty = Number(reviewData?.number_of_reviews) === 0 ||
      widget.querySelector('.jdgm-rev-widg[data-number-of-reviews="0"]');
    const stylesPending = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .some(link => /judgeme|judge\.me/.test(link.href) && (!link.sheet || link.media === 'nope!'));
    if (!content || (!hasReviews && !empty) || stylesPending) {
      stableSince = 0;
      return;
    }
    const height = content.getBoundingClientRect().height;
    if (!height || height !== lastHeight) {
      lastHeight = height;
      stableSince = performance.now();
      return;
    }
    if (!stableSince) stableSince = performance.now();
    if (performance.now() - stableSince > 500) reveal();
  };
  const start = () => {
    if (!root.classList.contains(pendingClass)) return;
    observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });
    poll = setInterval(check, 100);
    check();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
