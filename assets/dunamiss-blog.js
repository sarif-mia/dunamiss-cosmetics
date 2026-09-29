(() => {
  function init(root = document) {
    root.querySelectorAll('.sec__article').forEach(article => {
      const toc = article.querySelector('.dm-article-toc');
      const headings = [...article.querySelectorAll('.article-template__content h2')].filter(h => h.textContent.trim());
      if (toc && headings.length >= 3 && !toc.dataset.ready) {
        const list = toc.querySelector('ol');
        headings.forEach((heading, index) => {
          if (!heading.id) {
            let id = `article-section-${index + 1}`;
            while (document.getElementById(id)) id += '-section';
            heading.id = id;
          }
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${encodeURIComponent(heading.id)}`;
          link.textContent = heading.textContent.trim();
          item.append(link);
          list.append(item);
        });
        toc.hidden = false;
        toc.dataset.ready = 'true';
      }
      const button = article.querySelector('[data-copy-article]');
      if (button && navigator.clipboard && !button.dataset.ready) {
        button.hidden = false;
        button.dataset.ready = 'true';
        button.addEventListener('click', async () => {
          const status = article.querySelector('.dm-copy-status');
          try {
            await navigator.clipboard.writeText(button.dataset.copyArticle);
            status.textContent = 'Link copied';
          } catch {
            status.textContent = 'Could not copy. Please copy the address from your browser.';
          }
        });
      }
    });
  }
  init();
  document.addEventListener('shopify:section:load', event => init(event.target));
})();
