(() => {
  function update() {
    document.querySelectorAll('media-gallery').forEach(gallery => {
      const script = gallery.querySelector('[data-shade-media-map]');
      if (!script) return;
      const data = JSON.parse(script.textContent);
      const product = gallery.closest('.product__item-js');
      const variant = product?.querySelector('product-form input[name="id"]')?.value;
      const owner = data.variants[variant];
      if (!owner) return;
      gallery.querySelectorAll('[data-media-id]').forEach(media => {
        const id = media.dataset.mediaId.split('-').pop();
        media.toggleAttribute('data-shade-hidden', Boolean(data.media[id] && data.media[id] !== owner));
      });
    });
  }
  document.addEventListener('change', event => {
    if (event.target instanceof Element && event.target.matches('input[name="id"], variant-radios-detail input, sticky-add-cart select')) update();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update, { once: true });
  else update();
})();
