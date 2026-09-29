(() => {
  if (window.dunamissFloatingHeader) {
    window.dunamissFloatingHeader.refresh();
    return;
  }

  let header;
  let announcementBars = [];
  const root = document.documentElement;

  const measure = () => {
    if (!header?.isConnected) return;
    const announcementHeight = announcementBars.reduce((height, bar) => {
      return height + (bar.isConnected ? bar.getBoundingClientRect().height : 0);
    }, 0);
    root.style.setProperty('--announcement-bar-height', `${announcementHeight}px`);
    root.style.setProperty('--floating-header-height', `${header.getBoundingClientRect().height}px`);
  };

  const observer = window.ResizeObserver ? new ResizeObserver(measure) : null;
  const refresh = () => {
    observer?.disconnect();
    header = document.querySelector('.section-header-custom-floating');
    announcementBars = [...document.querySelectorAll('.section-announcement-bar')];
    if (!header) {
      root.style.removeProperty('--announcement-bar-height');
      root.style.removeProperty('--floating-header-height');
      return;
    }
    // This section manages its own fixed positioning, independent of theme sticky classes.
    header.classList.remove('shopify-section-header-sticky', 'shopify-section-header-hidden', 'animate');
    observer?.observe(header);
    announcementBars.forEach(bar => observer?.observe(bar));
    measure();
  };

  window.dunamissFloatingHeader = { refresh };
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('pageshow', refresh);
  document.addEventListener('shopify:section:load', refresh);
  document.addEventListener('shopify:section:reorder', refresh);
  document.addEventListener('shopify:section:unload', () => requestAnimationFrame(refresh));
  document.fonts?.ready.then(measure);
  refresh();
})();
