(() => {
  const normalize = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\bdimond\b/g, 'diamond');
  const maps = new WeakMap();
  const shadeName = value => /^(lilina|linina)$/i.test(value || '') ? 'Liliana' : value;
  function createMap(data) {
    const bundleOptions = data.options.map((name, index) => /^(?:choose an option\s*-?\s*\d+|(?:colou?r|shade|lip oil|lipstick|item)\s*-?\s*\d+(?:\s*[-—:]\s*(?:choose\s+)?shade)?)$/i.test(name.trim()) ? index : -1).filter(index => index >= 0);
    const option = bundleOptions.length > 1 ? bundleOptions[0] : data.options.findIndex(name => /^(colou?r|shade)s?$/i.test(name.trim()));
    const selectedOptions = bundleOptions.length > 1 ? bundleOptions : [option];
    if (option < 0) return null;
    const shades = [...new Set(data.variants.flatMap(variant => selectedOptions.map(index => shadeName(variant.options[index]))))];
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
      const id = String(variant.media), shade = shadeName(variant.options[option]);
      // A shared featured image cannot identify a single shade.
      const linked = data.variants.filter(item => item.media === variant.media);
      if (linked.every(item => shadeName(item.options[option]) === shade)) owners.set(id, shade);
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
    return { option, selectedOptions, owners, variants: data.variants, handle: data.handle, itemName: /lip oils?/.test(normalize(`${data.title} ${data.handle}`)) ? 'Lip Oil' : /lipsticks?/.test(normalize(`${data.title} ${data.handle}`)) ? 'Lipstick' : 'Item' };
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
      const selected = data.selectedOptions.map(index => shadeName(variant.options[index]));
      const identifiable = selected.every(shade => [...data.owners.values()].includes(shade));
      if (data.selectedOptions.length > 1) {
        product.querySelectorAll('variant-radios-detail fieldset').forEach((fieldset, index) => {
          if (!data.selectedOptions.includes(index)) return;
          const label = fieldset.querySelector('.form__label');
          if (label) {
            const value = document.createElement('span');
            value.className = 'option_value heading-style capitalize';
            value.textContent = shadeName(variant.options[index]);
            label.replaceChildren(`${data.itemName} ${data.selectedOptions.indexOf(index) + 1} — Choose shade: `, value);
          }
          fieldset.querySelectorAll('label').forEach(label => {
            for (const node of label.childNodes) {
              if (node.nodeType === Node.TEXT_NODE && /^(lilina|linina)$/i.test(node.textContent.trim())) node.textContent = 'Liliana';
            }
          });
        });
      }
      gallery.querySelectorAll('[data-media-id]').forEach(media => {
        const owner = data.owners.get(media.dataset.mediaId.split('-').pop());
        media.toggleAttribute('data-shade-hidden', Boolean(identifiable && owner && !selected.includes(owner)));
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
