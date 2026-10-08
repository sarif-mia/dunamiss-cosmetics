(() => {
  if (window.dunamissShopMenuInstalled) return;
  window.dunamissShopMenuInstalled = true;
  const desktop = matchMedia('(min-width: 1025px)');
  const init = (root) => root.querySelectorAll('.dm-shop-menu').forEach((menu) => {
    if (menu.dataset.initialized) return;
    menu.dataset.initialized = 'true';
    let hoverOpened = false;
    let closeTimer;
    const closeCategoryMenus = () => menu.closest('.header__menu')?.querySelectorAll('.dm-category-mega.open, .dm-category-mega.visible').forEach((item) => {
      item.classList.remove('open', 'visible');
    });
    menu.addEventListener('pointerenter', (event) => {
      clearTimeout(closeTimer);
      closeCategoryMenus();
      if (!desktop.matches || event.pointerType !== 'mouse' || menu.open) return;
      menu.open = true;
      hoverOpened = true;
    });
    menu.addEventListener('focusin', closeCategoryMenus);
    menu.querySelector('summary').addEventListener('click', (event) => {
      if (hoverOpened) { event.preventDefault(); menu.open = true; hoverOpened = false; }
    });
    menu.addEventListener('pointerleave', () => {
      closeTimer = setTimeout(() => {
        if (!menu.contains(document.activeElement)) { menu.open = false; hoverOpened = false; }
      }, 180);
    });
    menu.addEventListener('focusout', () => {
      queueMicrotask(() => { if (!menu.contains(document.activeElement)) menu.open = false; });
    });
  });
  init(document);
  document.addEventListener('shopify:section:load', (event) => init(event.target));
  // Keep the Shop panel from covering the original category dropdowns.
  const closeForCategory = (event) => {
    const category = event.target.closest('.section-header-custom-floating nav.navigation');
    if (!category || !desktop.matches) return;
    category.closest('.header__menu')?.querySelectorAll('.dm-shop-menu[open]').forEach((menu) => {
      menu.open = false;
    });
  };
  document.addEventListener('pointerover', closeForCategory);
  document.addEventListener('focusin', closeForCategory);
  document.addEventListener('click', (event) => {
    document.querySelectorAll('.dm-shop-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target)) menu.open = false;
    });
  });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.dm-shop-menu[open]').forEach((menu) => {
      menu.open = false;
      menu.querySelector('summary').focus();
    });
  });
  desktop.addEventListener('change', () => {
    if (!desktop.matches) document.querySelectorAll('.dm-shop-menu[open]').forEach((menu) => { menu.open = false; });
  });
})();
