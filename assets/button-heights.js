// The cart app renders its buttons in an open shadow root, outside theme CSS.
(() => {
  let observer;
  let retryTimer;
  let attempts = 0;
  let scheduled = false;
  const applyHeight = () => {
    scheduled = false;
    const host = document.querySelector('[data-app="crowd-buy-cart-drawer"]');
    const root = host?.shadowRoot;
    if (!root) {
      if (host && attempts++ < 20 && !retryTimer) {
        retryTimer = setTimeout(() => { retryTimer = null; applyHeight(); }, 250);
      }
      return;
    }
    if (!root.querySelector('[data-theme-button-height]')) {
      const style = document.createElement('style');
      style.setAttribute('data-theme-button-height', '');
      style.textContent = `
        button {
          box-sizing: border-box;
          height: auto !important;
          min-height: 35px !important;
          max-height: none !important;
          padding-block: 6px !important;
          font-family: var(--body-font, "Instrument Sans", Arial, sans-serif);
          font-size: 13px;
          line-height: 1.3;
        }
        .cart-close { width: 35px !important; }
        .checkout-label { font-size: 13px !important; line-height: 1.4; }
        .payment-badge-text, .discount-hint-left {
          font-size: 12px !important;
          line-height: 1.5;
        }
      `;
      root.appendChild(style);
      // Keep the override when the app remounts its drawer contents.
      const shadowObserver = new MutationObserver(() => {
        if (!style.isConnected) root.appendChild(style);
      });
      shadowObserver.observe(root, { childList: true });
    }
    observer?.disconnect();
    clearTimeout(retryTimer);
  };
  const initialize = () => {
    observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(applyHeight);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    applyHeight();
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
