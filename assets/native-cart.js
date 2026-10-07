/* Extend the theme's existing CartNotification; Shopify remains the cart source of truth. */
(async () => {
  await customElements.whenDefined('cart-notification');
  const cart = document.querySelector('cart-notification.dm-native-cart');
  if (!cart || cart.dataset.nativeInitialized) return;
  cart.dataset.nativeInitialized = 'true';
  const panel = cart.querySelector('.dm-cart-drawer');
  const content = cart.querySelector('#minicart-form');
  const originalOpen = cart.open.bind(cart);
  const originalClose = cart.close.bind(cart);
  let lastRender = 0;
  let state;
  let opener;
  let queue = Promise.resolve();
  let dirty = false;
  let recommendationController;
  const rootURL = window.Shopify?.routes?.root || '/';
  const money = (cents) => window.Shopify?.formatMoney
    ? Shopify.formatMoney(cents, window.cartStrings?.money_format || '₹ {{amount_no_decimals}}')
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: state?.currency || 'INR', maximumFractionDigits: 0 }).format(cents / 100);
  const error = (message) => {
    const node = cart.querySelector('[data-native-cart-error]');
    node.textContent = message || 'Please try again.';
    node.hidden = !message;
  };
  const busy = (value) => {
    panel.setAttribute('aria-busy', String(value));
    panel.querySelectorAll('.quantity__button, input[name="updates[]"], .cart-remove, .dm-cart-clear, .dm-cart-coupon button, .gokwik-checkout button, .dm-cart-checkout, .dm-cart-recommendation button[name="add"]').forEach((node) => { node.disabled = value; });
  };
  const render = (html) => {
    const node = new DOMParser().parseFromString(html, 'text/html').querySelector('#minicart-form');
    if (!node) throw new Error('Unable to refresh your cart. Please try again.');
    content.innerHTML = node.innerHTML;
    cart.cartAction();
    window.BlsLazyloadImg?.init?.();
  };
  const enqueue = (operation) => {
    const result = queue.then(operation);
    queue = result.catch(() => {});
    return result;
  };
  const mutate = (endpoint, body, feedback) => enqueue(async () => {
    error('');
    busy(true);
    const focused = document.activeElement;
    const id = focused?.getAttribute('data-id');
    const name = focused?.getAttribute('name');
    try {
      const response = await fetch(rootURL + endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, sections: ['minicart-form'], sections_url: location.pathname })
      });
      const result = await response.json();
      if (!response.ok || result.errors || result.status >= 400) {
        throw new Error(result.description || (typeof result.errors === 'string' && result.errors) || 'Your cart could not be updated. Please try again.');
      }
      const invalidDiscount = feedback && result.discount_codes?.some((discount) => body.discount.split(',').some((code) => code.toLowerCase() === discount.code.toLowerCase()) && !discount.applicable);
      render(result.sections['minicart-form']);
      dirty = true;
      if (invalidDiscount) throw new Error('This discount code is not available for your cart.');
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: result } }));
      if (feedback) content.querySelector('[data-native-cart-feedback]').textContent = feedback;
      if (id && name && panel.getAttribute('aria-hidden') === 'false') {
        [...panel.querySelectorAll('[data-id]')].find((node) => node.dataset.id === id && node.getAttribute('name') === name)?.focus({ preventScroll: true });
      }
      return result;
    } catch (failure) {
      error(failure.message || 'Please try again.');
      const input = id && [...panel.querySelectorAll('input[name="updates[]"]')].find((node) => node.dataset.id === id);
      if (input) input.value = input.dataset.value;
    } finally {
      busy(false);
    }
  });
  cart.updateQuantity = (id, quantity) => {
    const value = Number(quantity);
    if (!Number.isInteger(value) || value < 0) { error('Enter a valid quantity.'); return; }
    return mutate('cart/change.js', { id, quantity: value });
  };
  cart.refreshNativeCart = () => enqueue(async () => {
    const response = await fetch(rootURL + 'cart?sections=minicart-form', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!response.ok) throw new Error('Unable to refresh your cart.');
    const sections = await response.json();
    render(sections['minicart-form']);
  });
  cart.open = async () => {
    if (panel.getAttribute('aria-hidden') === 'false') return;
    opener = cart.activeElement?.isConnected ? cart.activeElement : document.activeElement;
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('[data-native-cart-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
    await originalOpen();
    panel.querySelector('.close-cart-button').focus({ preventScroll: true });
    if (cart.activeElement?.id === 'cart-icon-bubble' || Date.now() - lastRender > 1500) cart.refreshNativeCart().catch((failure) => error(failure.message));
  };
  cart.close = () => {
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    document.querySelectorAll('[data-native-cart-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    originalClose();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    if (dirty && document.body.classList.contains('template-cart')) {
      dirty = false;
      const section = document.querySelector('#main-cart-items');
      if (section) fetch(rootURL + 'cart?section_id=' + encodeURIComponent(section.dataset.id))
        .then((response) => response.ok ? response.text() : Promise.reject(new Error('Unable to refresh cart page')))
        .then((html) => {
          const updated = new DOMParser().parseFromString(html, 'text/html').querySelector('#main-cart-items');
          if (updated) section.innerHTML = updated.innerHTML;
          window.BlsLazyloadImg?.init?.();
        }).catch((failure) => error(failure.message));
    }
  };
  document.querySelectorAll('.minicart__action').forEach((button) => button.addEventListener('click', () => cart.setActiveElement(button), { capture: true }));
  // Remaining bundle/gift widgets can open the theme drawer through their existing API.
  window.openCrowdBuyCart = async () => {
    try { await cart.refreshNativeCart(); await cart.open(); } catch (failure) { error(failure.message); }
  };
  const rules = () => window.STOREWIDE_RULES || {};
  const updateOffers = () => {
    const config = rules();
    const offers = content.querySelector('[data-native-cart-offers]');
    if (!offers || !state?.count) return;
    const milestones = [];
    const amount = state.subtotal / 100;
    if (config.shipping?.enabled && !config.shipping.freeShippingForAll && config.shipping.freeShippingThreshold > 0) {
      milestones.push({ threshold: Number(config.shipping.freeShippingThreshold), label: 'Free shipping', icon: '🚚', color: '#10b981' });
    }
    for (const gift of config.gifts || []) {
      if (gift.threshold > 0 && (config.giftMeasure || 'value') === 'value') milestones.push({ threshold: Number(gift.threshold), label: 'Free gift', icon: '🎁', color: '#7d098c' });
    }
    for (const discount of config.progressiveDiscounts || []) {
      if (discount.threshold > 0 && (config.progressiveMeasure || 'value') === 'value') milestones.push({ threshold: Number(discount.threshold), label: discount.discountType === 'FIXED_AMOUNT' ? money(discount.discountValue * 100) + ' off' : discount.discountValue + '% off', icon: '✦', color: '#7d098c' });
    }
    milestones.sort((a, b) => a.threshold - b.threshold);
    const track = offers.querySelector('[data-native-cart-milestones]');
    track.replaceChildren();
    const visibleMilestones = milestones.slice(0, 3);
    if (visibleMilestones.length) {
      const progress = document.createElement('div'); progress.className = 'dm-cart-progress';
      const fill = document.createElement('span');
      fill.style.width = `${Math.min(100, amount / visibleMilestones.at(-1).threshold * 100)}%`;
      progress.append(fill); track.append(progress);
      const labels = document.createElement('div'); labels.className = 'dm-cart-thresholds';
      for (const milestone of visibleMilestones) {
        const label = document.createElement('span');
        label.dataset.reached = String(amount >= milestone.threshold);
        label.textContent = `${milestone.label} ${money(milestone.threshold * 100)}`;
        labels.append(label);
      }
      track.append(labels);
    }
    const next = milestones.find((milestone) => amount < milestone.threshold);
    offers.querySelector('[data-native-cart-message]').textContent = next
      ? `Add ${money((next.threshold - amount) * 100)} more to get ${next.label}`
      : 'Your offer milestones are unlocked';
    offers.hidden = milestones.length === 0;
    const giftButton = offers.querySelector('[data-native-cart-gift]');
    giftButton.hidden = !config.gifts?.some((gift) => amount >= gift.threshold && gift.giftOptions?.some((option) => option.variants?.some((variant) => variant.available)));
    const coupons = content.querySelector('[data-native-cart-coupons]');
    if (coupons) {
      const list = coupons.querySelector('[data-native-cart-coupon-list]');
      list.replaceChildren();
      for (const coupon of config.coupons || []) {
        if (!coupon.code) continue;
        const button = document.createElement('button'); button.type = 'button'; button.textContent = coupon.code; button.dataset.nativeCoupon = coupon.code;
        list.append(button);
      }
      coupons.hidden = !list.children.length;
    }
  };
  const updateContent = () => {
    lastRender = Date.now();
    state = JSON.parse(content.querySelector('[data-native-cart-state]')?.textContent || '{}');
    document.querySelectorAll('.cart-count').forEach((node) => { node.textContent = node.classList.contains('cart-count-drawer') ? `(${state.count})` : String(state.count > 100 ? '~' : state.count); });
    updateOffers();
    const recommendation = content.querySelector('[data-native-cart-recommendations]');
    recommendationController?.abort();
    if (recommendation) {
      recommendationController = new AbortController();
      fetch(recommendation.dataset.url, { signal: recommendationController.signal })
        .then((response) => response.ok ? response.text() : '')
        .then((html) => {
          const markup = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-native-cart-recommendation-content]');
          if (recommendation.isConnected && markup?.querySelector('.dm-cart-recommendation')) {
            recommendation.innerHTML = markup.innerHTML; recommendation.hidden = false;
          }
        }).catch((failure) => { if (failure.name !== 'AbortError') console.error('Cart recommendations:', failure.message); });
    }
  };
  new MutationObserver(updateContent).observe(content, { childList: true });
  updateContent();
  window.addEventListener('load', updateOffers, { once: true });
  const openGiftPicker = async () => {
    const tier = rules().gifts?.find((gift) => state.subtotal / 100 >= gift.threshold && gift.giftOptions?.length);
    if (!tier) return;
    if (!window.CrowdBuyGiftPicker) {
      const source = [...document.scripts].find((script) => script.src.includes('/bob-the-bundle-builder-') && script.src.includes('/assets/'));
      if (!source) throw new Error('Please contact us for help choosing your gift.');
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = new URL('gift-picker.min.js', source.src).href;
        script.onload = resolve;
        script.onerror = () => { script.remove(); reject(new Error('Unable to load gift choices. Please try again.')); };
        document.head.append(script);
      });
    }
    let mount = panel.querySelector('.dm-cart-gift-mount');
    if (!mount) { mount = document.createElement('div'); mount.className = 'dm-cart-gift-mount'; panel.append(mount); }
    window.CrowdBuyGiftPicker?.open(tier, { mount, earned: true, source: 'storewide' });
  };
  cart.addEventListener('click', (event) => {
    if (event.target.closest('[data-native-cart-clear]')) content.querySelector('[data-native-cart-confirm]').hidden = false;
    if (event.target.closest('[data-native-cart-cancel]')) content.querySelector('[data-native-cart-confirm]').hidden = true;
    if (event.target.closest('[data-native-cart-clear-confirm]')) mutate('cart/clear.js', {});
    const coupon = event.target.closest('[data-native-coupon]');
    if (coupon) { content.querySelector('[name="discount"]').value = coupon.dataset.nativeCoupon; }
    if (event.target.closest('[data-native-cart-gift]')) openGiftPicker().catch((failure) => error(failure.message));
  });
  cart.addEventListener('click', (event) => {
    const terms = content.querySelector('[data-native-cart-terms]');
    if (event.target.closest('.gokwik-checkout button, .dm-cart-checkout')) { if (terms && !terms.checked) { event.preventDefault(); event.stopImmediatePropagation(); error('Please accept the terms before checkout.'); terms.focus(); } else queueMicrotask(() => cart.close()); }
  }, { capture: true });
  cart.addEventListener('submit', (event) => {
    if (!event.target.matches('[data-native-cart-coupon]')) return;
    event.preventDefault();
    const code = event.target.querySelector('[name="discount"]').value.trim();
    if (!code) { error('Enter a discount code.'); return; }
    mutate('cart/update.js', { discount: [...new Set([...(state.discountCodes || []), code])].join(',') }, 'Discount applied.');
  });
  cart.addEventListener('keydown', (event) => {
    if (panel.getAttribute('aria-hidden') !== 'false') return;
    if (event.key === 'Escape') { event.preventDefault(); const gift = panel.querySelector('.dm-cart-gift-mount'); if (gift?.children.length) { window.CrowdBuyGiftPicker?.close(); event.stopPropagation(); } else cart.close(); }
    if (event.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button, a[href], input, summary, [tabindex="0"]')].filter((node) => !node.disabled && node.getBoundingClientRect().width && !node.closest('[hidden]'));
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  const pendingTrigger = window.dunamissPendingCartTrigger;
  if (pendingTrigger?.isConnected) {
    window.dunamissPendingCartTrigger = null;
    cart.setActiveElement?.(pendingTrigger);
    cart.open();
  }
})();
