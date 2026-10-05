(() => {
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const maps = new WeakMap();
  function createMap(data) {
    const option = data.options.findIndex(name => /^(colou?r|shade)s?$/i.test(name.trim()));
    if (option < 0) return null;
    const shades = [...new Set(data.variants.map(variant => variant.options[option]))];
    if (shades.length < 2) return null;
    const owners = new Map();
    const anchors = new Map();
    for (const media of data.media) {
      const alt = ` ${normalize(media.alt)} `;
      const filename = normalize((media.src || '').split('/').pop().split('?')[0]);
      const matches = shades.filter(shade => {
        const name = normalize(shade);
        return name && (alt.includes(` ${name} `) || ` ${filename} `.includes(` ${name} `) ||
          (name.length >= 3 && filename.replace(/ /g, '').startsWith(name.replace(/ /g, ''))));
      });
      if (matches.length === 1) owners.set(String(media.id), matches[0]);
    }
    for (const variant of data.variants) {
      if (!variant.media) continue;
      const id = String(variant.media), shade = variant.options[option];
      // A shared featured image cannot identify a single shade.
      const linked = data.variants.filter(item => item.media === variant.media);
      if (linked.every(item => item.options[option] === shade)) owners.set(id, shade);
    }
    for (const media of data.media) {
      const shade = owners.get(String(media.id));
      if (shade && !anchors.has(shade)) anchors.set(shade, String(media.id));
    }
    // Infer ordered image groups only when every shade has an identifiable start.
    const grouped = anchors.size === shades.length && owners.has(String(data.media[0]?.id));
    let owner;
    for (const media of data.media) {
      const id = String(media.id), explicit = owners.get(id);
      if (explicit) owner = explicit;
      else if (grouped && media.type === 'image') owners.set(id, owner);
    }
    return { option, owners, variants: data.variants };
  }
  function update() {
    document.querySelectorAll('media-gallery').forEach(gallery => {
      const script = gallery.querySelector('[data-shade-media-map]');
      if (!script) return;
      if (!maps.has(script)) maps.set(script, createMap(JSON.parse(script.textContent)));
      const data = maps.get(script);
      if (!data) return;
      const product = gallery.closest('.product__item-js');
      const id = product?.querySelector('product-form input[name="id"]')?.value;
      const variant = data.variants.find(item => String(item.id) === id);
      if (!variant) return;
      const shade = variant.options[data.option];
      const identifiable = [...data.owners.values()].includes(shade);
      gallery.querySelectorAll('[data-media-id]').forEach(media => {
        const owner = data.owners.get(media.dataset.mediaId.split('-').pop());
        media.toggleAttribute('data-shade-hidden', Boolean(identifiable && owner && owner !== shade));
      });
      const viewer = gallery.querySelector('[id^="GalleryViewer"]');
      if (viewer) viewer.scrollLeft = 0;
      gallery.querySelectorAll('.swiper').forEach(element => element.swiper?.update());
    });
  }
  document.addEventListener('change', event => {
    if (event.target instanceof Element && event.target.matches('input[name="id"], variant-radios-detail input, sticky-add-cart select')) update();
  });
  document.addEventListener('shopify:section:load', update);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update, { once: true });
  else update();
})();
