// Desktop product page: the information column holds in place while the shopper scrolls
// through the image gallery, and only then scrolls on to its remaining content.
//
// Both columns are position: sticky (theme classes). This script sets their `top`
// values, and when both are taller than the screen it gives the row extra height so the
// scroll happens in two phases:
//   1. info holds below the header (title, price, add to cart in view) while the
//      gallery scrolls to its last image;
//   2. the gallery holds on its last image while the rest of the info scrolls up.
// When only one column is taller than the screen, the shorter one simply holds below
// the header while the taller one scrolls.
(() => {
  const desktop = matchMedia('(min-width: 768px)');
  const GAP = 20;
  const root = document.documentElement;
  const heights = new Map();
  let rows = [];

  const headerOffset = () =>
    (parseFloat(root.style.getPropertyValue('--announcement-bar-height')) || 0) +
    (parseFloat(root.style.getPropertyValue('--floating-header-height')) || 0) + GAP;

  const setStyle = (element, property, value) => {
    if (!element) return;
    if (value === '') {
      if (element.style.getPropertyValue(property)) element.style.removeProperty(property);
    } else if (element.style.getPropertyValue(property) !== value) {
      element.style.setProperty(property, value);
    }
  };

  const apply = () => {
    const offset = headerOffset();
    const visible = window.innerHeight - offset - GAP;
    rows.forEach(({ row, info, gallery }) => {
      if (!desktop.matches || !gallery) {
        setStyle(info, 'top', '');
        setStyle(gallery, 'top', '');
        setStyle(row, 'min-height', '');
        return;
      }
      const infoHeight = heights.get(info) ?? info.offsetHeight;
      const galleryHeight = heights.get(gallery) ?? gallery.offsetHeight;
      let infoTop = offset;
      let galleryTop = offset;
      let rowHeight = '';
      if (infoHeight > visible && galleryHeight > visible) {
        galleryTop = offset + visible - galleryHeight;
        rowHeight = `${Math.ceil(galleryHeight + infoHeight - visible)}px`;
      } else if (infoHeight > visible) {
        infoTop = offset + visible - infoHeight;
      } else if (galleryHeight > visible) {
        galleryTop = offset + visible - galleryHeight;
      }
      setStyle(info, 'top', `${Math.round(infoTop)}px`);
      setStyle(gallery, 'top', `${Math.round(galleryTop)}px`);
      setStyle(row, 'min-height', rowHeight);
    });
  };

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      heights.set(entry.target, entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight);
    });
    apply();
  });

  const init = () => {
    observer.disconnect();
    heights.clear();
    rows = [...document.querySelectorAll('.product-detail__information > .sticky')].map((info) => {
      const row = info.parentElement.parentElement;
      const gallery = row.querySelector(':scope > .product-detail__media > media-gallery.sticky');
      [info, gallery].forEach((column) => column && observer.observe(column));
      return { row, info, gallery };
    });
  };

  // The header script writes its height variables on <html> when the header or the
  // announcement bar changes size, so re-anchor the columns whenever that happens.
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ['style'] });
  window.addEventListener('resize', apply, { passive: true });
  desktop.addEventListener('change', apply);
  document.addEventListener('shopify:section:load', init);
  init();
})();
