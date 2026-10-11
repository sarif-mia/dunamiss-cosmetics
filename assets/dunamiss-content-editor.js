(() => {
  if (window.dunamissContentEditorLoaded) return;
  window.dunamissContentEditorLoaded = true;

  function init(root) {
    root.querySelectorAll('.dunamiss-contact-faq-item').forEach((item, index) => {
      if (item.dataset.dmInitialized) return;
      const question = item.querySelector('.dunamiss-contact-faq-question');
      const answer = item.querySelector('.dunamiss-contact-faq-answer');
      if (!question || !answer) return;
      item.dataset.dmInitialized = 'true';
      const section = item.closest('.shopify-section');
      answer.id = `ContactFaqAnswer-${section?.id || 'page'}-${index}`;
      answer.hidden = true;
      question.type = 'button';
      question.setAttribute('aria-controls', answer.id);
      question.setAttribute('aria-expanded', 'false');
      question.addEventListener('click', () => {
        const wasOpen = !answer.hidden;
        const group = item.closest('.dunamiss-contact-faq') || section || root;
        group.querySelectorAll('.dunamiss-contact-faq-item').forEach((other) => {
          const otherAnswer = other.querySelector('.dunamiss-contact-faq-answer');
          const otherQuestion = other.querySelector('.dunamiss-contact-faq-question');
          if (!otherAnswer || !otherQuestion) return;
          other.classList.remove('active');
          otherAnswer.hidden = true;
          otherAnswer.style.maxHeight = '';
          otherQuestion.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('active');
          answer.hidden = false;
          answer.style.maxHeight = `${answer.scrollHeight}px`;
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });

    root.querySelectorAll('#certificatesGrid, #clinically-tested-certificatesGrid').forEach((grid) => {
      if (grid.dataset.dmInitialized) return;
      const section = grid.closest('.shopify-section') || root;
      const previous = section.querySelector('.prev-btn');
      const next = section.querySelector('.next-btn');
      if (!previous || !next) return;
      grid.dataset.dmInitialized = 'true';
      function scroll(direction) {
        const card = grid.querySelector('.certificate-item, .clinically-tested-certificate-item');
        if (!card) return;
        const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
        grid.scrollTo({ left: grid.scrollLeft + direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
      }
      previous.addEventListener('click', () => scroll(-1));
      next.addEventListener('click', () => scroll(1));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  } else {
    init(document);
  }
  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
