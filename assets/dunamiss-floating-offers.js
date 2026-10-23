(() => {
  const trigger = document.querySelector('[data-dm-offers-open]');
  const dialog = document.getElementById('DmFloatingOffers');
  if (!trigger || !dialog || typeof dialog.showModal !== 'function') return;
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    if (!dialog.open) dialog.showModal();
  });
  dialog.querySelector('[data-dm-offers-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => trigger.focus({ preventScroll: true }));
})();
