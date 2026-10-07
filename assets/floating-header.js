(() => {
  if (window.dunamissFloatingHeader) {
    window.dunamissFloatingHeader.refresh();
    return;
  }

  let header;
  let announcementBars = [];
  const root = document.documentElement;
  const mobile = matchMedia('(max-width: 1024px)');
  let menuWasOpen = false;
  let menuOpener;
  let searchWasOpen = false;
  let offerWasOpen = false;
  let offerOpener;

  const syncMenu = () => {
    const menu = header?.querySelector('.navigation.mobile');
    const open = mobile.matches && root.classList.contains('nav-open');
    header?.querySelectorAll('.nav-toggle').forEach((toggle) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    if (menu) {
      // Closed drawers otherwise leave their off-screen links in the tab order.
      menu.inert = mobile.matches && !open;
      if (open && !menuWasOpen) {
        menuOpener = document.activeElement;
        menu.querySelector('close-menu')?.focus({ preventScroll: true });
      } else if (!open && menuWasOpen && menuOpener?.isConnected) {
        menuOpener.focus({ preventScroll: true });
      }
    }
    menuWasOpen = open;
    const searchOpen = root.classList.contains('open-search');
    if (!searchOpen && searchWasOpen) {
      header?.querySelector('.top-search-toggle')?.focus({ preventScroll: true });
    }
    searchWasOpen = searchOpen;
    const offer = document.querySelector('before-you-leave');
    const offerOpen = root.classList.contains('open-byl');
    if (offer) {
      offer.inert = !offerOpen;
      offer.setAttribute('role', 'dialog');
      offer.setAttribute('aria-modal', 'true');
      offer.setAttribute('aria-label', 'You may also like');
      if (offerOpen && !offerWasOpen) {
        offerOpener = document.activeElement;
        offer.querySelector('button.close-before')?.focus({ preventScroll: true });
      } else if (!offerOpen && offerWasOpen && offerOpener?.isConnected) {
        offerOpener.focus({ preventScroll: true });
      }
    }
    offerWasOpen = offerOpen;
  };

  const visibleControls = (menu) => [...menu.querySelectorAll(
    'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex="0"]'
  )].filter((item) => {
    const rect = item.getBoundingClientRect();
    return !item.disabled && rect.width > 0 && rect.height > 0 &&
      getComputedStyle(item).visibility !== 'hidden';
  });

  document.addEventListener('keydown', (event) => {
    const offerOpen = root.classList.contains('open-byl');
    if (offerOpen || (root.classList.contains('nav-open') && mobile.matches)) {
      const menu = offerOpen ? document.querySelector('before-you-leave') : header?.querySelector('.navigation.mobile');
      if (event.key === 'Escape') {
        event.preventDefault();
        menu?.querySelector(offerOpen ? 'button.close-before' : 'close-menu')?.click();
      } else if (event.key === 'Tab' && menu) {
        const controls = visibleControls(menu);
        const first = controls[0];
        const last = controls.at(-1);
        if (first && ((!menu.contains(document.activeElement)) ||
          (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last))) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    } else if (event.key === 'Escape' && root.classList.contains('open-search')) {
      event.preventDefault();
      document.querySelector('.btn-search-close')?.click();
    }
  });
  const menuStateObserver = new MutationObserver(syncMenu);
  menuStateObserver.observe(root, { attributes: true, attributeFilter: ['class'] });
  mobile.addEventListener('change', syncMenu);

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
    syncMenu();
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
