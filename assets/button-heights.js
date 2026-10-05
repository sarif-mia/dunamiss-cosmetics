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
          height: 35px !important;
          min-height: 35px !important;
          max-height: 35px !important;
          padding-block: 0 !important;
        }
        .cart-close { width: 35px !important; }
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
