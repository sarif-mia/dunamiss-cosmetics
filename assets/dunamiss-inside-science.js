(() => {
  const animate = (root) => {
    const bars = root.querySelectorAll('.dunamiss-inside-science [data-width]');
    if (!bars.length) return;
    const show = (bar) => {
      const width = Math.max(0, Math.min(100, Number(bar.dataset.width) || 0));
      bar.style.setProperty('--bar-width', `${width}%`);
      bar.classList.add('is-visible');
    };
    if (!('IntersectionObserver' in window)) {
      bars.forEach(show);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        show(target);
        observer.unobserve(target);
      });
    }, { threshold: 0.35 });
    bars.forEach((bar) => observer.observe(bar));
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => animate(document), { once: true });
  } else {
    animate(document);
  }
  document.addEventListener('shopify:section:load', (event) => animate(event.target));
})();
