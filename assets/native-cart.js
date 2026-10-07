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
  let state;
  let opener;
  let queue = Promise.resolve();
  let recommendationController;
  let errorTimer;
  let giftSyncing = false;
  const rootURL = window.Shopify?.routes?.root || '/';
  const money = (cents) => window.Shopify?.formatMoney
    ? Shopify.formatMoney(cents, window.cartStrings?.money_format || '₹ {{amount_no_decimals}}')
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: state?.currency || 'INR', maximumFractionDigits: 0 }).format(cents / 100);
  const error = (message) => {
    const node = cart.querySelector('[data-native-cart-error]');
    clearTimeout(errorTimer);
    if (!message) {
      node.textContent = '';
      node.hidden = true;
      return;
    }
    node.textContent = message;
    node.hidden = false;
    errorTimer = setTimeout(() => error(''), 6000);
  };
  const busy = (value) => {
    panel.setAttribute('aria-busy', String(value));
    panel.querySelectorAll('.quantity__button, input[name="updates[]"], .cart-remove, .dm-cart-coupon button, .dm-cart-checkout, .dm-cart-recommendation button[name="add"]').forEach((node) => { node.disabled = value; });
  };
  const render = (html) => {
    const node = new DOMParser().parseFromString(html, 'text/html').querySelector('#minicart-form');
    if (!node) throw new Error('Unable to refresh your cart. Please try again.');
    content.innerHTML = node.innerHTML;
    error('');
    cart.cartAction();
    window.BlsLazyloadImg?.init?.();
  };
  const cartPageSection = () => document.querySelector('#main-cart-items')?.dataset.id;
  const renderCartPage = (html) => {
    const current = document.querySelector('#main-cart-items');
    if (!current || !html) return;
    const updated = new DOMParser().parseFromString(html, 'text/html').querySelector('#main-cart-items');
    if (!updated) return;
    current.replaceWith(updated);
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
      const mainSection = cartPageSection();
      const sections = ['minicart-form'];
      if (mainSection) sections.push(mainSection);
      const response = await fetch(rootURL + endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...body, sections, sections_url: location.pathname })
      });
      const result = await response.json();
      if (!response.ok || result.errors || result.status >= 400) {
        throw new Error(result.description || (typeof result.errors === 'string' && result.errors) || 'Your cart could not be updated. Please try again.');
      }
      const invalidDiscount = feedback && result.discount_codes?.some((discount) => body.discount.split(',').some((code) => code.toLowerCase() === discount.code.toLowerCase()) && !discount.applicable);
      render(result.sections['minicart-form']);
      if (mainSection) renderCartPage(result.sections[mainSection]);
      if (invalidDiscount) throw new Error('This discount code is not available for your cart.');
      document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: result, source: 'native-cart' } }));
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
    const response = await fetch(rootURL + 'cart?sections=minicart-form', { cache: 'no-store' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Unable to refresh your cart.');
    const sections = await response.json();
    render(sections['minicart-form']);
  });
  cart.open = async () => {
    if (panel.getAttribute('aria-hidden') === 'false') return;
    error('');
    opener = cart.activeElement?.isConnected ? cart.activeElement : document.activeElement;
    panel.hidden = false;
    panel.inert = false;
    panel.setAttribute('aria-hidden', 'false');
    document.querySelectorAll('[data-native-cart-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'true'));
    await originalOpen();
    panel.querySelector('.close-cart-button').focus({ preventScroll: true });
    cart.refreshNativeCart().catch((failure) => error(failure.message));
  };
  cart.close = () => {
    error('');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    document.querySelectorAll('[data-native-cart-trigger]').forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
    originalClose();
    panel.hidden = true;
    setTimeout(() => {
      if (panel.getAttribute('aria-hidden') !== 'true') return;
      panel.classList.remove('open');
      cart.classList.remove('open');
      document.documentElement.classList.remove('open-minicart', 'open-drawer');
      document.documentElement.style.removeProperty('padding-right');
    }, 160);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  };
  cart.addEventListener('click', (event) => {
    const closeButton = event.target.closest('.dm-cart-close, .close-cart');
    if (!closeButton || !cart.contains(closeButton)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    cart.close();
  }, { capture: true });
  document.querySelectorAll('.minicart__action').forEach((button) => button.addEventListener('click', () => cart.setActiveElement(button), { capture: true }));
  // Remaining bundle widgets can open the theme drawer through their existing API.
  window.openCrowdBuyCart = async () => {
    try { await cart.open(); } catch (failure) { error(failure.message); }
  };
  const drawerConfig = () => JSON.parse(content.querySelector('[data-native-cart-config]')?.textContent || '{}');
  const itemProperty = (item, name) => {
    if (!Array.isArray(item.properties)) return item.properties?.[name];
    const property = item.properties.find((candidate) => Array.isArray(candidate) ? candidate[0] === name : candidate?.name === name);
    return Array.isArray(property) ? property[1] : property?.value;
  };
  const isAutomaticGift = (item) => itemProperty(item, '_dm_auto_gift') === '1'
    || (itemProperty(item, '_gift_pick') === '1' && itemProperty(item, '_gift_tier_id'));
  const qualifyingSubtotal = () => {
    if (!state?.items?.every((item) => Number.isFinite(Number(item.finalLinePrice)))) return Number(state?.subtotal || 0);
    return state.items.reduce((total, item) => isAutomaticGift(item) ? total : total + Number(item.finalLinePrice), 0);
  };
  const updateOffers = () => {
    const config = drawerConfig();
    const offers = content.querySelector('[data-native-cart-offers]');
    if (!offers || !state?.count) return;
    const milestones = [];
    const amount = qualifyingSubtotal() / 100;
    if (config.shipping?.enabled && config.shipping.threshold > 0) {
      milestones.push({ threshold: Number(config.shipping.threshold), label: 'Free shipping' });
    }
    if (config.gift?.enabled && config.gift.available && config.gift.variantId && config.gift.threshold > 0) {
      milestones.push({ threshold: Number(config.gift.threshold), label: 'Free gift' });
    }
    if (config.discount?.enabled && config.discount.threshold > 0) {
      milestones.push({ threshold: Number(config.discount.threshold), label: config.discount.label || 'Discount' });
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
    }
    const next = milestones.find((milestone) => amount < milestone.threshold);
    offers.querySelector('[data-native-cart-message]').textContent = next
      ? `Add ${money((next.threshold - amount) * 100)} more to get ${next.label}`
      : 'Your offer milestones are unlocked';
    offers.hidden = milestones.length === 0;
  };
  const syncAutomaticGifts = () => {
    if (giftSyncing || !state?.items) return;
    const gift = drawerConfig().gift || {};
    const amount = qualifyingSubtotal() / 100;
    const variantId = String(gift.variantId || '');
    const eligible = gift.enabled && gift.available && variantId && Number(gift.threshold) > 0 && Number(gift.threshold) <= amount;
    const updates = {};
    let hasGift = false;
    for (const item of state.items) {
      const ownGift = itemProperty(item, '_dm_auto_gift') === '1';
      const legacyGift = itemProperty(item, '_gift_pick') === '1' && String(item.variantId) === variantId;
      if (!ownGift && !legacyGift) continue;
      if (eligible && !hasGift && String(item.variantId) === variantId && item.quantity === 1) hasGift = true;
      else updates[item.key] = 0;
    }
    const additions = eligible && !hasGift ? [{
      id: Number(variantId),
      quantity: 1,
      properties: {
        _dm_auto_gift: '1',
        _dm_gift_threshold: String(gift.threshold),
        _gift_tier_id: `t${Number(gift.threshold)}`,
        _gift_pick: '1'
      }
    }] : [];
    if (!Object.keys(updates).length && !additions.length) return;
    giftSyncing = true;
    let sequence = Promise.resolve();
    if (Object.keys(updates).length) sequence = sequence.then(() => mutate('cart/update.js', { updates }));
    if (additions.length) sequence = sequence.then(() => mutate('cart/add.js', { items: additions }));
    sequence.finally(() => { giftSyncing = false; });
  };
  const updateContent = () => {
    state = JSON.parse(content.querySelector('[data-native-cart-state]')?.textContent || '{}');
    document.querySelectorAll('.cart-count').forEach((node) => { node.textContent = node.classList.contains('cart-count-drawer') ? `(${state.count})` : String(state.count > 100 ? '~' : state.count); });
    updateOffers();
    syncAutomaticGifts();
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
  window.addEventListener('load', () => { updateOffers(); syncAutomaticGifts(); }, { once: true });
  document.addEventListener('cart:updated', (event) => {
    if (event.detail?.source === 'native-cart') return;
    cart.refreshNativeCart().catch((failure) => error(failure.message));
  });
  cart.addEventListener('click', (event) => {
    const terms = content.querySelector('[data-native-cart-terms]');
    if (event.target.closest('.dm-cart-checkout')) { if (terms && !terms.checked) { event.preventDefault(); event.stopImmediatePropagation(); error('Please accept the terms before checkout.'); terms.focus(); } else queueMicrotask(() => cart.close()); }
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
    if (event.key === 'Escape') { event.preventDefault(); cart.close(); }
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
