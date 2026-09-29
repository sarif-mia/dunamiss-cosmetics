// js animation

const SCROLL_ANIMATION_TRIGGER_CLASSNAME = '.scroll-trigger:not(.slide_in)';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';
function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = new Date().getTime();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    return fn(...args);
  };
}
var BlsAnimations = (function () {
  return {
    innit: function () {
      this.animates();
    },
    animates: function () {
      var animates = document.querySelectorAll(
        '.scroll-trigger:not(.slide_in)'
      );
      if (animates.length > 0) {
        animates.forEach((i) => {
          i.addEventListener('animationend', (e) => {
            setTimeout(() => {
              e.target.setAttribute('animation-end', '');
            }, 1000);
          });
        });
      }
    },
  };
})();

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (
        elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)
      ) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute('data-cascade'))
          elementTarget.setAttribute('style', `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(
  rootEl = document,
  isDesignModeEvent = false
) {
  const animationTriggerElements = Array.from(
    rootEl.querySelectorAll(SCROLL_ANIMATION_TRIGGER_CLASSNAME)
  );
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animationTriggerElements = Array.from(
    document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME)
  );

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;
  let rafId = null;

  const updateZoomAnimations = () => {
    const viewportHeight = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;

    animationTriggerElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const elementPositionY = rect.top + scrollY;
      const elementHeight = element.offsetHeight || rect.height || 1;

      if (rect.bottom < 0 || rect.top > viewportHeight) {
        return;
      }

      if (elementPositionY > scrollY + viewportHeight) {
        element.style.setProperty('--zoom-in-ratio', 1);
        return;
      }

      if (elementPositionY + elementHeight < scrollY) {
        element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * 100);
        return;
      }

      const distance = scrollY + viewportHeight - elementPositionY;
      const percentage = Math.min(
        100,
        Math.max(0, distance / ((viewportHeight + elementHeight) / 100))
      );

      element.style.setProperty(
        '--zoom-in-ratio',
        1 + scaleAmount * Math.round(percentage)
      );
    });
  };

  const scheduleZoomAnimations = () => {
    if (rafId) return;

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateZoomAnimations();
    });
  };

  updateZoomAnimations();
  window.addEventListener('scroll', scheduleZoomAnimations, { passive: true });
  window.addEventListener('resize', scheduleZoomAnimations);
  window.addEventListener('load', scheduleZoomAnimations);
}

window.addEventListener('DOMContentLoaded', () => {
  var elemts = document.querySelectorAll('.swiper-slide.opacity-0');
  elemts.forEach((el) => {
    el.classList.remove('opacity-0');
  });
  initializeScrollAnimationTrigger();
  BlsAnimations.innit();
  initializeScrollZoomAnimationTrigger();
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    initializeScrollAnimationTrigger(event.target, true);
  });
  document.addEventListener('shopify:section:reorder', () => {
    initializeScrollAnimationTrigger(document, true);
  });
}