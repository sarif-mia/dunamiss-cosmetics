"use strict";
(() => {
  // extensions/theme-extension-instagram-feed/assets/analytics-tracker.js
  var TRACK_APP_URL = "https://apps5.omegatheme.com/instagram-tiktok-feed";
  var IMPRESSION_BATCH = [];
  var CLICK_BATCH = [];
  var ADD_TO_CART_BATCH = [];
  var ANALYTICS = { IMPRESSION: "impression", CLICK: "click", ADD_TO_CART: "add_to_cart", PURCHASE: "purchase" };
  var BATCHES = { [ANALYTICS.IMPRESSION]: IMPRESSION_BATCH, [ANALYTICS.CLICK]: CLICK_BATCH, [ANALYTICS.ADD_TO_CART]: ADD_TO_CART_BATCH };
  function encodeToBase64(e) {
    const t = new TextEncoder(), r = JSON.stringify(e), n = t.encode(r);
    return btoa(String.fromCharCode(...n));
  }
  var analyticsTracker = (() => {
    const e = `${TRACK_APP_URL}/api/track-event`, t = ["shop_url", "type", "widget_id"], r = { [ANALYTICS.IMPRESSION]: null, [ANALYTICS.CLICK]: null, [ANALYTICS.ADD_TO_CART]: null }, n = (e2) => ({ created_at: (/* @__PURE__ */ new Date()).toISOString(), event_type: e2, meta: { device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop" } });
    function i(t2) {
      const r2 = BATCHES[t2];
      if (r2 && r2.length > 0) {
        (async (t3, r3) => {
          try {
            const i2 = t3.map((e2) => ({ ...n(r3), widget_id: e2.widget_id, id: Number(e2.id), ...e2 })), o = await fetch(e, { method: "POST", headers: {}, body: JSON.stringify({ batch: encodeToBase64(i2) }) });
            o.ok || console.error("Failed to send batch:", o.statusText);
          } catch (e2) {
            console.error("Error sending batch:", e2);
          }
        })(r2.splice(0, r2.length), t2);
      }
    }
    return { queueEvent: function(e2, n2) {
      if (!((e3) => {
        for (const r2 of t) if (!e3[r2]) return console.error(`Missing required field: ${r2}`), false;
        return true;
      })(n2)) return;
      const o = BATCHES[e2];
      if (o) {
        if (o.push(n2), o.length >= 10) return i(e2), clearTimeout(r[e2]), void (r[e2] = null);
        r[e2] || (r[e2] = setTimeout(() => {
          i(e2), r[e2] = null;
        }, 3e3));
      }
    }, BATCHES };
  })();
  var eventBuilders = { media: (e) => ({ id: e?.media_id || "", title: e?.media?.title || e?.title || "", url: e?.media?.media_url || e?.media_url || "", widget_id: e?.widget_id || e?.widget_id || "", type: "media", product_ids: e?.product_ids || [], shop_url: e?.media?.shop || e?.shop_url || "" }), product: (e) => ({ id: e?.id || "", title: e?.title || "", url: e?.image?.src || "", media_id: e?.media_id || "", widget_id: e?.widget_id || "", type: "product", category_ids: e?.category_ids || [], shop_url: e?.media?.shop || e?.shop_url || "" }) };
  function trackEvent({ eventType: e, objectType: t }, r) {
    const n = eventBuilders[t];
    if (!n) return void console.warn(`No tracking builder found for type: ${t}`);
    const i = n(r);
    analyticsTracker.queueEvent(ANALYTICS[e.toUpperCase()], i);
  }
  window.analyticsTracker = analyticsTracker, window.addEventListener("beforeunload", () => {
    Object.keys(BATCHES).forEach((e) => {
      BATCHES[e].length > 0 && navigator.sendBeacon?.(`${TRACK_APP_URL}/api/track-event`, JSON.stringify({ batch: encodeToBase64(BATCHES[e]) }));
    });
  }), window.trackEvent = trackEvent;

  // extensions/theme-extension-instagram-feed/assets/carousel-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaCarouselAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: o } = t2;
      if (!e || !i || !o) return void console.warn("Missing required config for impression tracking");
      const r = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, c = await o(t4);
          c && this.trackEvent({ eventType: "impression", objectType: i }, c), r.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        r.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const o = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, o);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-carousel .omega-mcpl-item", "#omega-modal-carousel .omega-mcp-detail"].forEach((o) => {
          this.setupImpressionTracking({ selector: o, objectType: "product", getData: function(o2) {
            const r = o2.getAttribute("data-product-id"), c = r?.split("/").pop(), n = t2?.find((t3) => t3?.id === Number(c)), a = e?.find((t3) => t3?.product_id?.split("/").pop() === r);
            return { id: Number(c) || 0, title: a?.title || n?.title || "Unnamed product", media_id: a?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-carousel-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let o = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: o };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/carousel-modal.js
  !(function() {
    let e = [], n = {}, o = null, a = null, t = null, i = window.omegaCarouselShowBrandmark, s = [], d = 0;
    function l(t2, i2, s2 = null) {
      const d2 = document.querySelector(".omega-mc-info");
      if (d2) {
        if (n = {}, o = i2, "list_product" === t2) d2.innerHTML = `
      ${i2?.length > 0 ? `
        <div>
          <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
          </div>
          <div class="omega-mcp-list-title" >Featured products</div>
            <div class="omega-mcp-list">
            ${i2.map((e2) => `
              <div class="omega-mcpl-item"
              data-product-id='${e2?.id}'
              data-item="${window.omegaUtils.encodeToBase64(s2)}"
              onclick="window.OmegaCarouselModal.handleShowProductCarousel(${e2?.id}, event)"
              >
                <div class="omega-mcpl-item-info">
                <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
                </div>
                <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
                </div>
                    <div class="omega-mcpl-item-price">
                      ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                          ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                        </span>` : ""}
                      <span class="omega-mcpl-item-price-current list-product">
                        ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                      </span>
                      </div>
                </div>
                <div
                class="omega-mcpl-item-actions"
                >
                Add to cart
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === t2) {
          let o2 = null;
          i2?.variants?.[0] && (o2 = i2.variants[0], i2.options.forEach((e2, a2) => {
            n[e2.name] = o2[`option${a2 + 1}`];
          }), a = o2), d2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${i2?.id}" data-item="${window.omegaUtils.encodeToBase64(s2)}">
        <div class="omega-mcpd-back">
         ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaCarouselModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
        </div>
          <div class="omega-mcpd-main">
          <div class="omega-mcpdm-list-image">
            ${i2?.images?.length > 0 ? i2?.images?.map((e2, n2) => `
            <img
              src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
              style="${n2 === i2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
            />
            `).join("") : `
            <img
              src="${window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
            />`}
          </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${i2?.title}
              </div>
              <div class="omega-mcpl-item-price">
                ${o2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(o2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(o2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(o2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(o2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${i2?.options?.length > 0 && i2?.options?.filter((e2) => "Title" !== e2?.name).map((e2, o3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((o4) => `
                    <div
                      class="omega-mcpdm-option-value ${n[e2.name] === o4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${o4}"
                    >
                      ${o4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...s2 })}"
              onclick="window.OmegaCarouselModal.handleBuyItNowCarousel(${i2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...s2 })}"
              onclick="window.OmegaCarouselModal.handleAddToCartCarousel(${i2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaCarouselModal.handleOpenProductCarousel('${i2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaCarouselModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${i2?.body_html ? i2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(i2?.images)), e2.addEventListener("click", window.OmegaCarouselModal.handleOptionChangeCarousel);
          }), d2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function c(e2, n2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const o2 = e2.querySelector("video");
        o2 && (o2.pause(), o2.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
      }), e2.addEventListener("click", (o2) => {
        if (o2.target === e2) {
          const o3 = e2.querySelector("video");
          o3 && (o3.pause(), o3.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
        }
      });
    }
    function m(n2, o2, a2, m2) {
      window;
      let r = [];
      r = (o2 ?? []).filter((e2) => e2?.media_id === n2?.media_id), window.omegaUtils.throttleTrack(`click-media-${n2?.media_id}`, () => {
        window.OmegaCarouselAnalytics.trackMediaClick(n2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", w = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', v = false;
      g && (v = false === p || !n2?.socialAccount?.username || !n2?.media?.caption || "INSTAGRAM" !== n2?.media?.source, v && (u = "aspect-ratio: 9 / 16;", w = ""));
      const h = d > 0, C = d < s.length - 1;
      a2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${h ? '\n        <button class="omega-carousel-prev omega-mc-nav-btn-prev" onclick="window.OmegaCarouselModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${C ? '\n        <button class="omega-carousel-next omega-mc-nav-btn-next" onclick="window.OmegaCarouselModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${v ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === n2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${n2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${n2.media?.media_url}">`}
            ${n2?.media?.permalink ? `
            <button
             style="${"VIDEO" !== n2?.media?.type ? "bottom: 20px;" : ""}"
             class="omega-mc-instagram omega-tooltip
              ${"VIDEO" === n2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
              ${g ? "omega-mc-empty-product" : ""}"
             aria-label="Toggle sound"
             onclick="window.omegaUtils.openPermalink('${n2?.media?.permalink || ""}')"
             >
              <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
              </svg>
            </button>
            ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n               >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${w}
      </div>
    </div>
  `, document.body.appendChild(a2), a2.style.display = "flex", document.body.classList.add(m2), i && window.omegaUtils.waitForElement("#omega-modal-carousel").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-carousel", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), c(a2, m2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((o3) => {
        e = o3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], n2) : l("list_product", e, n2);
      }) : window.omegaModal.generateModalInfoCaption(n2), t = n2, window.omegaUtils.setupModalSoundToggle();
    }
    window.OmegaCarouselModal = { openModalCarousel: function(n2) {
      if (!n2) return;
      if (n2.classList && (n2.classList.contains("quickview") || n2.classList.contains("product__add-cart") || n2.classList.contains("product-item__select-options") || "SELECT-OPTION" === n2.tagName)) return;
      if (!(n2.closest ? n2.closest(".omega-carousel-container") : null)) return;
      if (!n2.classList || !n2.classList.contains("omega-carousel-item")) {
        const e2 = n2.closest ? n2.closest(".omega-carousel-item") : null;
        if (!e2) return;
        n2 = e2;
      }
      const o2 = n2.getAttribute("data-item");
      if (!o2 || "" === o2.trim()) return;
      const a2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!a2.test(o2)) return;
      const r = n2.getAttribute("data-media-products");
      if (r && "" !== r.trim() && !a2.test(r)) return;
      const g = window.omegaUtils.decodeBase64(o2), p = r ? window.omegaUtils.decodeBase64(r) : null;
      if (!g || !g.media_id) return;
      const u = document.querySelectorAll(".omega-carousel-item[data-item]");
      s = Array.from(u).map((e2) => {
        const n3 = e2.getAttribute("data-item");
        if (!n3) return null;
        const o3 = window.omegaUtils.decodeBase64(n3);
        return o3 && o3.media_id ? o3 : null;
      }).filter(Boolean), d = s.findIndex((e2) => e2 && e2.media_id === g.media_id);
      const w = document.getElementById("omega-modal-carousel"), v = "omega-mc-open";
      window;
      let h = [];
      h = (p ?? []).filter((e2) => e2?.media_id === g?.media_id), window.omegaUtils.throttleTrack(`click-media-${g?.media_id}`, () => {
        window.OmegaCarouselAnalytics.trackMediaClick(g, h);
      }), e = [];
      const C = Array.isArray(h) && 0 === h.length, { showPostCaption: f } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", $ = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', b = false;
      C && (b = false === f || !g?.socialAccount?.username || !g?.media?.caption || "INSTAGRAM" !== g?.media?.source, b && (y = "aspect-ratio: 9 / 16;", $ = "")), w.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
        <div class="${b ? "omega-mc-main-no-product" : "omega-mc-main"}">
            <div class="omega-mc-media-container">
              ${"VIDEO" === g?.media?.type ? `
                      <video
                        class="omega-mc-media-video"
                        src="${g.media?.media_url}"
                        autoplay
                        loop
                        ${window.omegaUtils.isAndroid() ? "muted" : ""}
                        playsinline
                      ></video>
                      <button
                        class="omega-mc-sound-toggle ${C ? "omega-mc-sound-toggle-empty-product" : ""}"
                        aria-label="Toggle sound"
                      >
                        <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                          <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                          <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                        </svg>
                      </button>
                    ` : `<img class="omega-mc-media-image" src="${g.media?.media_url}">`}
              ${g?.media?.permalink ? `
              <button
               style="${"VIDEO" !== g?.media?.type ? "bottom: 20px;" : ""}"
               class="omega-mc-instagram omega-tooltip
                ${"VIDEO" === g?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                ${C ? "omega-mc-empty-product" : ""}"
               aria-label="Toggle sound"
               onclick="window.omegaUtils.openPermalink('${g?.media?.permalink || ""}')"
               >
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
              ${!C && '<button class="omega-mc-btn-collapse-sheet"\n                onclick="window.omegaUtils.expandProductSheet()"\n                >\n                  <img\n                    src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                    alt="btn-cart"\n                    width="20px"\n                    height="100%"\n                  />\n                  View featured products\n                </button>'}
            </div>
          ${$}
        </div>
      </div>
    `, document.body.appendChild(w), w.style.display = "flex", document.body.classList.add(v), i && window.omegaUtils.waitForElement("#omega-modal-carousel").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-carousel", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), c(w, v), h?.length > 0 ? Promise.all(h?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], g) : l("list_product", e, g), h?.length && window.OmegaCarouselAnalytics.trackProductImpression(e, h, g);
      }) : (window.omegaModal.generateModalInfoCaption(g), h?.length && window.OmegaCarouselAnalytics.trackProductImpression(e, h, g)), t = g, window.omegaUtils.setupModalSoundToggle(), m(g, p, w, v);
    }, generateModalInfoHTMLCarousel: l, handleOptionChangeCarousel: function(e2) {
      if (!o) return;
      const t2 = e2.target, i2 = t2.dataset.optionName, s2 = t2.dataset.value;
      n[i2] = s2, a = o?.variants?.find((e3) => Object.entries(n).every(([n2, a2]) => {
        const t3 = o.options.findIndex((e4) => e4.name === n2);
        if (-1 === t3) return false;
        return e3[`option${t3 + 1}`] === a2;
      }));
      const d2 = t2.closest(".omega-mcpdm-option-group");
      if (d2) {
        d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === t2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (a) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const n2 = `
          ${a.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(a.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(a.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(a.price)} ${window.omegaUtils.getCurrencySymbol(a.price_currency)}
          </span>
        `;
          e3.innerHTML = n2;
        }
      }
      if (a && o?.images) {
        const n2 = o.images.find((e3) => e3?.id === a?.image_id), t3 = document.querySelector(".omega-mcpdm-list-image");
        if (t3) {
          const o2 = JSON.parse(e2.target.dataset.images || "[]");
          t3.innerHTML = n2?.src ? `
          <img
            src="${n2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : o2?.length > 0 ? o2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartCarousel: function(n2, o2) {
      const t2 = window.omegaUtils.decodeBase64(o2.target.dataset.item), i2 = (window, e.find((e2) => e2?.id === n2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(a?.id, 1) && window.OmegaCarouselAnalytics.trackAddToCart(i2, t2);
      }
    }, handleBuyItNowCarousel: function(n2, o2) {
      if (window.omegaUtils.decodeBase64(o2.target.dataset.item), window, e.find((e2) => e2?.id === n2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(a?.id, 1);
      }
    }, handleShowProductCarousel: function(n2, o2) {
      const a2 = o2.currentTarget, i2 = window.omegaUtils.decodeBase64(a2?.dataset?.item);
      window, t = i2;
      let s2 = e.find((e2) => e2?.id === n2);
      if (!s2) throw new Error(`Product with ID ${n2} not found in listDetailProductsCarousel`);
      window.omegaUtils.throttleTrack(`product-click-${s2?.id}`, () => {
        window.OmegaCarouselAnalytics.trackProductClick(s2, i2);
      }), l("detail_product", s2, i2);
    }, handleOpenProductCarousel: function(e2, n2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      l("list_product", e, t), o = null, n = null, a = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), n2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", n2.textContent = "\u2212") : (e2.style.display = "none", n2.textContent = "+");
    }, goToPrevious: function() {
      if (d > 0) {
        d--;
        const e2 = s[d], n2 = document.getElementById("omega-modal-carousel"), o2 = "omega-mc-open", a2 = document.querySelectorAll("[data-item]"), t2 = Array.from(a2).find((n3) => {
          const o3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return o3 && o3.media_id === e2.media_id;
        }), i2 = t2 ? window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products")) : null;
        m(e2, i2, n2, o2);
      }
    }, goToNext: function() {
      if (d < s.length - 1) {
        d++;
        const e2 = s[d], n2 = document.getElementById("omega-modal-carousel"), o2 = "omega-mc-open", a2 = document.querySelectorAll("[data-item]"), t2 = Array.from(a2).find((n3) => {
          const o3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return o3 && o3.media_id === e2.media_id;
        }), i2 = t2 ? window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products")) : null;
        m(e2, i2, n2, o2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/carousel-utils.js
  window.OmegaCarouselUtils = { getDataMedia: function(e) {
    let o = [];
    return window?.[`omega_keys_array_carousel_${e}`]?.forEach((e2) => {
      const t = e2.toString(), l = window[`omega_medias_carousel_${t}`];
      o.push(l);
    }), o;
  }, getVisibleItemsCount: function() {
    const e = window.innerWidth;
    return e <= 768 ? 2 : e <= 1024 ? 3 : 4;
  }, renderCustomListCarousel: function() {
    let e = window.customizeSettingInstagramFeedOmega?.customizeCarousel;
    const o = window.innerWidth <= 768, t = document.querySelectorAll(".omega-carousel-title"), l = document.querySelectorAll(".omega-carousel-subtitle"), a = document.querySelectorAll(".omega-carousel-list"), m = document.querySelectorAll(".omega-carousel"), i = document.querySelectorAll(".omega-carousel-item"), u = document.querySelectorAll(".omega-carousel-btn-follow-us-top"), n = document.querySelectorAll(".omega-carousel-btn-follow-us-bottom");
    t.forEach((o2, t2) => {
      const a2 = l[t2];
      o2 && a2 && window.OmegaCustomizeTemplate.applyHeaderVisibility(o2, a2, e);
    }), u.forEach((o2, t2) => {
      const l2 = n[t2];
      o2 && l2 && window.OmegaCustomizeTemplate.applyButtonFollowUs(o2, l2, e);
    }), e?.columnNumberDesktop && !o && a.forEach((o2) => {
      window.OmegaCustomizeTemplate.applyContainerWidth(o2, e.columnNumberDesktop, e.columnSpacing);
    }), i.forEach((t2, l2) => {
      e?.template && window.OmegaCustomizeTemplate.applyTemplate(t2, e.template), null != e?.borderRadius && window.OmegaCustomizeTemplate.applyBorderRadius(t2, e.borderRadius), e?.mediaRatio && window.OmegaCustomizeTemplate.applyMediaRatio(t2, e.mediaRatio);
      const a2 = e?.videoPlay;
      a2 ? window.OmegaCustomizeTemplate.setupVideoPlayBehavior(t2, a2) : window.OmegaCustomizeTemplate.setupVideoPlayBehavior(t2, "play-on-hover");
      const m2 = t2.style.getPropertyValue("--columns"), i2 = o ? e?.columnNumberMobile : e?.columnNumberDesktop;
      m2 !== i2?.toString() && (e?.columnNumberDesktop && !o && window.OmegaCustomizeTemplate.applyColumnSettings(t2, e.columnNumberDesktop, false), e?.columnNumberMobile && o && (window.OmegaCustomizeTemplate.applyColumnSettings(t2, e.columnNumberMobile, true), 2 === e.columnNumberMobile ? t2.classList.add("mobile-2-columns") : t2.classList.remove("mobile-2-columns")));
    }), e?.columnSpacing && m.forEach((o2) => {
      window.OmegaCustomizeTemplate.applySpacing(o2, e.columnSpacing);
    }), e?.carouselMotion && window.OmegaCustomizeTemplate.applyCarouselMotion(e.carouselMotion), e?.themeColors && document.querySelectorAll(".omega-carousel-container").forEach((o2, a2) => {
      const m2 = t[a2], i2 = l[a2], r = u[a2], s = n[a2];
      window.OmegaCustomizeTemplate.applyThemeColors(o2, m2, i2, r, s, e.themeColors);
    });
  }, getUrlSocialAccount: function(e, o) {
    return e && o && "instagram" === o.toLowerCase() ? `https://www.instagram.com/${e}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/grid-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaGridAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: o } = t2;
      if (!e || !i || !o) return void console.warn("Missing required config for impression tracking");
      const r = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, c = await o(t4);
          c && this.trackEvent({ eventType: "impression", objectType: i }, c), r.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        r.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const o = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, o);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-grid .omega-mcpl-item", "#omega-modal-grid .omega-mcp-detail"].forEach((o) => {
          this.setupImpressionTracking({ selector: o, objectType: "product", getData: function(o2) {
            const r = o2.getAttribute("data-product-id"), c = r?.split("/").pop(), n = t2?.find((t3) => t3?.id === Number(c)), a = e?.find((t3) => t3?.product_id?.split("/").pop() === r);
            return { id: Number(c) || 0, title: a?.title || n?.title || "Unnamed product", media_id: a?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-grid-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let o = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: o };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/grid-modal.js
  !(function() {
    let e = [], n = {}, o = null, a = null, t = null, i = window.omegaGridShowBrandmark, d = [], m = 0;
    function l(t2, i2, d2 = null) {
      const m2 = document.querySelector(".omega-mc-info");
      if (m2) {
        if (n = {}, o = i2, "list_product" === t2) m2.innerHTML = `
      ${i2?.length > 0 ? `
      <div>
        <div class="omega-drag-indicator-wrapper">
          <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-list-title" >Featured products</div>
          <div class="omega-mcp-list">
          ${i2.map((e2) => `
            <div
            class="omega-mcpl-item"
            data-product-id='${e2?.id}'
            data-item="${window.omegaUtils.encodeToBase64(d2)}"
            onclick="window.OmegaGridModal.handleShowProductGrid(${e2?.id}, event)"
            >
            <div class="omega-mcpl-item-info">
              <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
              </div>
              <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
              </div>
              <div class="omega-mcpl-item-price">
                ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                    ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current list-product">
                  ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                </span>
              </div>
              </div>
              <div
                class="omega-mcpl-item-actions"

              >
                Add to cart
              </div>
            </div>
          `).join("")}
        </div>
        </div>` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === t2) {
          let o2 = null;
          i2?.variants?.[0] && (o2 = i2.variants[0], i2.options.forEach((e2, a2) => {
            n[e2.name] = o2[`option${a2 + 1}`];
          }), a = o2), m2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${i2?.id}" data-item="${window.omegaUtils.encodeToBase64(d2)}">
        <div class="omega-mcpd-back">
        ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaGridModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
          </div>
          <div class="omega-mcpd-main">
            <div class="omega-mcpdm-list-image">
              ${i2?.images?.length > 0 ? i2?.images?.map((e2, n2) => `
              <img
                src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
                alt="No image"
                class="omega-mcpdm-image"
                style="${n2 === i2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
              />
              `).join("") : `
              <img
                src="${window.omegaUtils.defaultImageUrl}"
                alt="No image"
                class="omega-mcpdm-image"
              />`}
            </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${i2?.title}
              </div>
               <div class="omega-mcpl-item-price">
                ${o2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(o2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(o2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(o2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(o2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${i2?.options?.length > 0 && i2?.options?.filter((e2) => "Title" !== e2?.name)?.map((e2, o3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((o4) => `
                    <div
                      class="omega-mcpdm-option-value ${n[e2.name] === o4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${o4}"
                    >
                      ${o4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaGridModal.handleBuyItNowGrid(${i2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaGridModal.handleAddToCartGrid(${i2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaGridModal.handleOpenProductGrid('${i2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaGridModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${i2?.body_html ? i2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          m2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(i2?.images)), e2.addEventListener("click", window.OmegaGridModal.handleOptionChangeGrid);
          }), m2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function s(e2, n2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const o2 = e2.querySelector("video");
        o2 && (o2.pause(), o2.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
      }), e2.addEventListener("click", (o2) => {
        if (o2.target === e2) {
          const o3 = e2.querySelector("video");
          o3 && (o3.pause(), o3.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
        }
      });
    }
    function c(n2, o2, a2, c2) {
      window;
      let r = [];
      r = (o2 ?? []).filter((e2) => e2?.media_id === n2?.media_id), window.omegaUtils.throttleTrack(`click-media-${n2?.media_id}`, () => {
        window.OmegaGridAnalytics.trackMediaClick(n2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", w = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', v = false;
      g && (v = false === p || !n2?.socialAccount?.username || !n2?.media?.caption || "INSTAGRAM" !== n2?.media?.source, v && (u = "aspect-ratio: 9 / 16;", w = ""));
      const h = m > 0, f = m < d.length - 1;
      a2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${h ? '\n        <button class="omega-grid-prev omega-mc-nav-btn-prev" onclick="window.OmegaGridModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${f ? '\n        <button class="omega-grid-next omega-mc-nav-btn-next" onclick="window.OmegaGridModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${v ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === n2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${n2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${n2.media?.media_url}" alt="${n2.title}">`}
            ${n2?.media?.permalink ? `
                <button
                style="${"VIDEO" !== n2?.media?.type ? "bottom: 20px;" : ""}"
                class="omega-mc-instagram omega-tooltip
                  ${"VIDEO" === n2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                  ${g ? "omega-mc-empty-product" : ""}"
                aria-label="Toggle sound"
                onclick="window.omegaUtils.openPermalink('${n2?.media?.permalink || ""}')"
                >
                  <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                    <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                  </svg>
                </button>
                ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n              >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${w}
      </div>
    </div>
  `, document.body.appendChild(a2), a2.style.display = "flex", document.body.classList.add(c2), i && window.omegaUtils.waitForElement("#omega-modal-grid").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-grid", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), s(a2, c2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((o3) => {
        e = o3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], n2) : l("list_product", e, n2);
      }) : window.omegaModal.generateModalInfoCaption(n2), t = n2, window.omegaUtils.setupModalSoundToggle(), window.omegaUtils.renderCustomizeProductPopupDetail();
    }
    window.OmegaGridModal = { openModalGrid: function(n2) {
      if (!n2) return;
      if (n2.classList && (n2.classList.contains("quickview") || n2.classList.contains("product__add-cart") || "SELECT-OPTION" === n2.tagName)) return;
      const o2 = n2.getAttribute("data-item");
      if (!o2 || "" === o2.trim()) return;
      const a2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!a2.test(o2)) return;
      const r = n2.getAttribute("data-media-products");
      if (r && "" !== r.trim() && !a2.test(r)) return;
      const g = window.omegaUtils.decodeBase64(o2), p = r ? window.omegaUtils.decodeBase64(r) : null;
      if (!g || !g.media_id) return;
      const u = document.querySelectorAll("[data-item]");
      d = Array.from(u).map((e2) => {
        const n3 = e2.getAttribute("data-item");
        if (!n3) return null;
        const o3 = window.omegaUtils.decodeBase64(n3);
        return o3 && o3.media_id ? o3 : null;
      }).filter(Boolean), m = d.findIndex((e2) => e2 && e2.media_id === g.media_id);
      const w = document.getElementById("omega-modal-grid"), v = "omega-mc-open";
      window;
      let h = [];
      h = (p ?? []).filter((e2) => e2?.media_id === g?.media_id), window.omegaUtils.throttleTrack(`click-media-${g?.media_id}`, () => {
        window.OmegaGridAnalytics.trackMediaClick(g, h);
      }), e = [];
      const f = Array.isArray(h) && 0 === h.length, { showPostCaption: C } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", $ = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', b = false;
      f && (b = false === C || !g?.socialAccount?.username || !g?.media?.caption || "INSTAGRAM" !== g?.media?.source, b && (y = "aspect-ratio: 9 / 16;", $ = "")), w.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
       <div class="${b ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === g?.media?.type ? `
                <video
                  class="omega-mc-media-video"
                  src="${g.media?.media_url}"
                  autoplay
                  loop
                  ${window.omegaUtils.isAndroid() ? "muted" : ""}
                  playsinline
                ></video>
                <button
                  class="omega-mc-sound-toggle ${f ? "omega-mc-sound-toggle-empty-product" : ""}"
                  aria-label="Toggle sound"
                >
                  <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                    <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                    <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                  </svg>
                </button>
                ` : `<img class="omega-mc-media-image" src="${g.media?.media_url}" alt="${g.title}">`}
            ${g?.media?.permalink ? `
              <button
                style="${"VIDEO" !== g?.media?.type ? "bottom: 20px;" : ""}"
                class="omega-mc-instagram omega-tooltip
                  ${"VIDEO" === g?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                  ${f ? "omega-mc-empty-product" : ""}"
                aria-label="Toggle sound"
                onclick="window.omegaUtils.openPermalink('${g?.media?.permalink || ""}')">
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
            ${!f && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n              >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
          ${$}
        </div>
      </div>
    `, document.body.appendChild(w), w.style.display = "flex", document.body.classList.add(v), i && window.omegaUtils.waitForElement("#omega-modal-grid").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-grid", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), s(w, v), h?.length > 0 ? Promise.all(h?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], g) : l("list_product", e, g), h?.length && window.OmegaGridAnalytics.trackProductImpression(e, h, g);
      }) : window.omegaModal.generateModalInfoCaption(g), t = g, window.omegaUtils.setupModalSoundToggle(), window.omegaUtils.renderCustomizeProductPopupDetail(), c(g, p, w, v);
    }, generateModalInfoHTMLGrid: l, handleOptionChangeGrid: function(e2) {
      if (!o) return;
      const t2 = e2.target, i2 = t2.dataset.optionName, d2 = t2.dataset.value;
      n[i2] = d2, a = o?.variants?.find((e3) => Object.entries(n).every(([n2, a2]) => {
        const t3 = o.options.findIndex((e4) => e4.name === n2);
        if (-1 === t3) return false;
        return e3[`option${t3 + 1}`] === a2;
      }));
      const m2 = t2.closest(".omega-mcpdm-option-group");
      if (m2) {
        m2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === t2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (a) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const n2 = `
          ${a.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(a.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(a.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(a.price)} ${window.omegaUtils.getCurrencySymbol(a.price_currency)}
          </span>
        `;
          e3.innerHTML = n2;
        }
      }
      if (a && o?.images) {
        const n2 = o.images.find((e3) => e3?.id === a?.image_id), t3 = document.querySelector(".omega-mcpdm-list-image");
        if (t3) {
          const o2 = JSON.parse(e2.target.dataset.images || "[]");
          t3.innerHTML = n2?.src ? `
          <img
            src="${n2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : o2?.length > 0 ? o2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartGrid: function(n2, o2) {
      const t2 = window.omegaUtils.decodeBase64(o2.target.dataset.item), i2 = (window, e.find((e2) => e2?.id === n2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(a?.id, 1) && window.OmegaGridAnalytics.trackAddToCart(i2, t2);
      }
    }, handleBuyItNowGrid: function(n2, o2) {
      if (window.omegaUtils.decodeBase64(o2.target.dataset.item), window, e.find((e2) => e2?.id === n2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(a?.id, 1);
      }
    }, handleShowProductGrid: function(n2, o2) {
      const a2 = o2.currentTarget, i2 = window.omegaUtils.decodeBase64(a2?.dataset?.item);
      window, t = i2;
      let d2 = e.find((e2) => e2?.id === n2);
      if (!d2) throw new Error(`Product with ID ${n2} not found in listDetailProductsGrid`);
      window.omegaUtils.throttleTrack(`product-click-${d2?.id}`, () => {
        window.OmegaGridAnalytics.trackProductClick(d2, i2);
      }), l("detail_product", d2, i2);
    }, handleOpenProductGrid: function(e2, n2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      l("list_product", e, t), o = null, n = null, a = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), n2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", n2.textContent = "\u2212") : (e2.style.display = "none", n2.textContent = "+");
    }, goToPrevious: function() {
      if (m > 0) {
        m--;
        const e2 = d[m], n2 = document.getElementById("omega-modal-grid"), o2 = "omega-mc-open", a2 = document.querySelectorAll("[data-item]"), t2 = Array.from(a2).find((n3) => {
          const o3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return o3 && o3.media_id === e2.media_id;
        }), i2 = window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products"));
        c(e2, i2, n2, o2);
      }
    }, goToNext: function() {
      if (m < d.length - 1) {
        m++;
        const e2 = d[m], n2 = document.getElementById("omega-modal-grid"), o2 = "omega-mc-open", a2 = document.querySelectorAll("[data-item]"), t2 = Array.from(a2).find((n3) => {
          const o3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return o3 && o3.media_id === e2.media_id;
        }), i2 = t2 ? window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products")) : null;
        c(e2, i2, n2, o2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/grid-utils.js
  window.OmegaGridUtils = { getDataMediaGrid: function(e) {
    let o = [];
    return window?.[`omega_keys_array_grid_${e}`]?.forEach((e2) => {
      const t = e2.toString(), m = window[`omega_medias_grid_${t}`];
      o.push(m);
    }), o;
  }, getVisibleItemsCount: function() {
    const e = window.innerWidth;
    return e <= 768 ? 2 : e <= 1024 ? 3 : 4;
  }, renderCustomListGrid: function() {
    let e = window.customizeSettingInstagramFeedOmega?.customizeGrid;
    const o = window.innerWidth <= 768, t = document.querySelectorAll(".omega-grid-title"), m = document.querySelectorAll(".omega-grid-subtitle"), i = document.querySelectorAll(".omega-grid-list"), l = document.querySelectorAll(".omega-grid-item"), a = document.querySelectorAll(".omega-grid-btn-follow-us-top"), n = document.querySelectorAll(".omega-grid-btn-follow-us-bottom");
    t.forEach((o2, t2) => {
      const i2 = m[t2];
      o2 && i2 && window.OmegaCustomizeTemplate.applyHeaderVisibility(o2, i2, e);
    }), a.forEach((o2, t2) => {
      const m2 = n[t2];
      o2 && m2 && window.OmegaCustomizeTemplate.applyButtonFollowUs(o2, m2, e);
    }), e?.columnNumberDesktop && !o && i.forEach((o2) => {
      window.OmegaCustomizeTemplate.applyContainerWidth(o2, e.columnNumberDesktop, e.columnSpacing);
    }), l.forEach((t2) => {
      e?.template && window.OmegaCustomizeTemplate.applyTemplate(t2, e.template), null != e?.borderRadius && window.OmegaCustomizeTemplate.applyBorderRadius(t2, e.borderRadius), e?.mediaRatio && window.OmegaCustomizeTemplate.applyMediaRatio(t2, e.mediaRatio);
      const m2 = e?.videoPlay;
      m2 ? window.OmegaCustomizeTemplate.setupVideoPlayBehavior(t2, m2) : window.OmegaCustomizeTemplate.setupVideoPlayBehavior(t2, "play-on-hover"), e?.columnNumberDesktop && !o && window.OmegaCustomizeTemplate.applyColumnSettings(t2, e.columnNumberDesktop, false), e?.columnNumberMobile && o && (window.OmegaCustomizeTemplate.applyColumnSettings(t2, e.columnNumberMobile, true), 2 === e.columnNumberMobile ? t2.classList.add("mobile-2-columns") : t2.classList.remove("mobile-2-columns"));
    }), i.forEach((t2) => {
      !o && e?.columnNumberDesktop && window.OmegaCustomizeTemplate.applyGridColumns(t2, e.columnNumberDesktop), o && e?.columnNumberMobile && window.OmegaCustomizeTemplate.applyGridColumns(t2, e.columnNumberMobile ?? 2), e?.columnSpacing && window.OmegaCustomizeTemplate.applySpacing(t2, e.columnSpacing);
    }), e?.themeColors && document.querySelectorAll(".omega-grid-container").forEach((o2, i2) => {
      const l2 = t[i2], u = m[i2], r = a[i2], s = n[i2];
      window.OmegaCustomizeTemplate.applyThemeColors(o2, l2, u, r, s, e.themeColors);
    });
  }, getUrlSocialAccount: function(e, o) {
    return e && o && "instagram" === o.toLowerCase() ? `https://www.instagram.com/${e}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/omega.carousel.core.js
  !(function() {
    function e() {
      if (window.__omegaCarouselState.isProcessing) return;
      window.__omegaCarouselState.isProcessing = true;
      const e2 = document.querySelectorAll(".omega-carousel-container");
      0 !== e2.length ? (e2.forEach((e3) => {
        const a = e3.dataset.blockId || e3.getAttribute("data-block-id");
        if (!a) return;
        if (window.__omegaCarouselState.renderedContainers.has(a)) return;
        const i = window.OmegaCarouselUtils.getDataMedia(a);
        let t = "";
        0 !== i?.length && i?.[0] || !window?.Shopify?.designMode ? i?.forEach((e4, o2) => {
          let a2 = e4?.medias ?? [];
          const i2 = window.OmegaCarouselUtils.getUrlSocialAccount(e4?.socialAccount?.username, e4?.socialAccount?.platform), n = window.OmegaCarouselUtils.getVisibleItemsCount();
          let l = `
          <div class="omega-carousel-title">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(e4) : e4?.title || ""}
          </div>
          <div class="omega-carousel-subtitle">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(e4) : e4?.subtitle || ""}
          </div>
          ${i2 ? `<button onclick="window.open('${i2}', '_blank')" class="omega-carousel-btn-follow-us-top">FOLLOW US</button>` : ""}
          <div class="omega-carousel-list carousel-${o2}">
            ${a2.length > n ? '<button class="omega-carousel-prev"></button>' : ""}
            <div class="omega-carousel">
              ${a2?.sort((e5, o3) => e5.position - o3.position)?.map((o3, a3) => {
            let t2 = e4?.mediaProducts?.filter((e5) => e5?.media_id === o3?.media_id);
            return `<div
                    class="omega-carousel-item"
                    onclick="window.OmegaCarouselModal.openModalCarousel(this)"
                    data-item="${window.omegaUtils.encodeToBase64({ ...o3, listProduct: t2, socialAccount: e4?.socialAccount || "", urlSocialAccount: i2 })}"
                    data-media-products="${window.omegaUtils.encodeToBase64(e4?.mediaProducts)}"
                >
                  <div class="omega-carousel-wrapper">
                    ${"VIDEO" === o3.media.type ? `
                      <img
                        src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.thumbnail_url, "video") : o3.media.thumbnail_url}"
                        alt="Media error or was deleted"
                        class="omega-carousel-img omega-carousel-thumbnail"
                        crossorigin="anonymous"
                        loading="${a3 < 3 ? "eager" : "lazy"}"
                      />
                      <video
                        class="omega-carousel-video"
                        src="${o3.media.media_url}"
                        muted
                        loop
                        preload="${a3 < 3 ? "auto" : "metadata"}"
                        crossorigin="anonymous"
                        poster="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.thumbnail_url, "video") : o3.media.thumbnail_url}"
                        playsinline
                      ></video>
                      <div class="omega-carousel-play-button"></div>
                    ` : `
                      <img
                        src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.media_url, "image") : o3.media.media_url}"
                        alt="Media error or was deleted"
                        class="omega-carousel-img"
                        crossorigin="anonymous"
                        loading="${a3 < 3 ? "eager" : "lazy"}"
                      />
                    `}
                  </div>
                </div>
              `;
          }).join("")}
            </div>
            ${a2.length > n ? '<button class="omega-carousel-next"></button>' : ""}
          </div>
          ${i2 ? `<button onclick="window.open('${i2}', '_blank')" class="omega-carousel-btn-follow-us-bottom">FOLLOW US</button>` : ""}
        `;
          a2?.length > 0 && (t += l);
        }) : t = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', t && (e3.innerHTML = t, setTimeout(() => {
          window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeContainerMedia && (window.omegaMediaOptimizer.optimizeContainerMedia(e3), "function" == typeof window.omegaMediaOptimizer.setupEnhancedLazyLoading && window.omegaMediaOptimizer.setupEnhancedLazyLoading(e3)), document.querySelectorAll(".omega-carousel-item").forEach((e4, o2) => {
            const a2 = e4.querySelector(".omega-carousel-video"), i2 = e4.querySelector(".omega-carousel-thumbnail"), t2 = e4.querySelector(".omega-carousel-play-button");
            if (a2 && i2 && t2) {
              if (o2 < 3 && (a2.preload = "auto", a2.src)) {
                const e5 = document.createElement("link");
                e5.rel = "preload", e5.as = "video", e5.href = a2.src, e5.crossOrigin = "anonymous", document.head.appendChild(e5);
              }
              let n;
              e4.addEventListener("mouseenter", () => {
                n && clearTimeout(n), n = setTimeout(() => {
                  a2.readyState >= 2 && (a2.play().catch((e5) => {
                  }), t2 && (t2.style.display = "none"), i2 && (i2.style.opacity = "0.3"));
                }, 50);
              }), e4.addEventListener("mouseleave", () => {
                n && clearTimeout(n), a2.pause(), a2.currentTime = 0, t2 && (t2.style.display = "flex"), i2 && (i2.style.opacity = "1");
              });
            }
          }), window.OmegaCarouselUtils && window.OmegaCarouselUtils.renderCustomListCarousel ? (window.OmegaCarouselUtils.renderCustomListCarousel(), window.__omegaCarouselState.renderedContainers.add(a)) : window.__omegaCarouselState.renderedContainers.add(a), o();
        }, 100)), window.__omegaCarouselState.isProcessing = false, i.forEach((o2, a2) => {
          let i2 = o2?.medias ?? [];
          const t2 = window.OmegaCarouselUtils.getVisibleItemsCount();
          if (i2.length > t2) {
            const o3 = e3.querySelector(`.carousel-${a2}`), i3 = o3.querySelector(".omega-carousel"), t3 = o3.querySelector(".omega-carousel-prev"), n = o3.querySelector(".omega-carousel-next");
            setTimeout(() => {
              const e4 = () => {
                const e5 = window?.customizeSettingInstagramFeedOmega?.customizeCarousel, o5 = Number(e5?.columnSpacing || 12);
                return i3.querySelector(".omega-carousel-item").offsetWidth + o5;
              }, o4 = () => {
                const e5 = i3.scrollLeft, o5 = i3.scrollWidth - i3.clientWidth;
                t3.classList.toggle("omega-carousel-hidden", e5 <= 0), n.classList.toggle("omega-carousel-hidden", e5 >= o5 - 1);
              };
              o4(), t3.addEventListener("click", () => {
                const a3 = e4();
                i3.scrollLeft -= a3, setTimeout(o4, 100);
              }), n.addEventListener("click", () => {
                const a3 = e4();
                i3.scrollLeft += a3, setTimeout(o4, 100);
              }), i3.addEventListener("scroll", o4), i3.updateNavigation = () => {
                o4();
              };
            }, 100);
          }
        });
      }), (function() {
        const e3 = window.customizeSettingInstagramFeedOmega?.customizeCarousel, o2 = Array.isArray(e3?.videoPlay) ? e3?.videoPlay?.[0] : e3?.videoPlay;
        if (o2 && "play-on-hover" !== o2) return;
        document.querySelectorAll(".omega-carousel-item").forEach((e4) => {
          const o3 = e4.querySelector(".omega-carousel-video"), a = (e4.querySelector(".omega-carousel-thumbnail"), e4.querySelector(".omega-carousel-play-button"));
          o3 && (a && (a.style.display = "flex"), e4.addEventListener("mouseenter", function() {
            o3.play().catch((e5) => {
            }), a && (a.style.display = "none");
          }), e4.addEventListener("mouseleave", function() {
            o3.pause(), o3.currentTime = 0, a && (a.style.display = "flex");
          }));
        });
      })(), o()) : window.__omegaCarouselState.isProcessing = false;
    }
    function o() {
      document.querySelectorAll(".omega-carousel").forEach((e2) => {
        1 === e2.querySelectorAll(".omega-carousel-item").length ? e2.classList.add("single-item") : e2.classList.remove("single-item");
      });
    }
    window.__omegaCarouselState = window.__omegaCarouselState || { renderedContainers: /* @__PURE__ */ new Set(), lastMobileState: void 0, isProcessing: false }, document.addEventListener("DOMContentLoaded", function() {
      if (window.__omegaCarouselInitialized) return;
      window.__omegaCarouselInitialized = true, e(), setTimeout(() => {
        window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeAllPageMedia && window.omegaMediaOptimizer.optimizeAllPageMedia();
      }, 1e3), window.__omegaCarouselResizeHandlerBound || (window.__omegaCarouselResizeHandlerBound = true, window.addEventListener("resize", /* @__PURE__ */ (function(e2, o2) {
        let a;
        return function() {
          const i = this, t = arguments;
          clearTimeout(a), a = setTimeout(() => e2.apply(i, t), o2);
        };
      })(() => {
        const o2 = window.innerWidth <= 768, a = window.__omegaCarouselState.lastMobileState;
        if (void 0 === a || a !== o2) window.__omegaCarouselState.lastMobileState = o2, window.__omegaCarouselState.renderedContainers.clear(), e();
        else {
          document.querySelectorAll(".omega-carousel").forEach((e2) => {
            e2.updateNavigation && e2.updateNavigation();
          });
        }
      }, 150)));
      document.querySelectorAll(".omega-widget-empty").forEach((e2, o2) => {
        e2.style.display = 0 === o2 ? "block" : "none";
      });
      window;
      window.OmegaCarouselAnalytics?.trackMediaImpression && window.OmegaCarouselAnalytics.trackMediaImpression();
    }), window.OmegaCarouselCore = { handleRenderCarousel: e };
  })();

  // extensions/theme-extension-instagram-feed/assets/omega.grid.core.js
  !(function() {
    function i() {
      document.querySelectorAll(".omega-grid-container").forEach((i2) => {
        const e = i2.dataset.blockId, n = window.OmegaGridUtils.getDataMediaGrid(e);
        let o = "";
        0 !== n?.length && n?.[0] || !window?.Shopify?.designMode ? n.forEach((i3, e2) => {
          let n2 = i3?.medias ?? [];
          const a = window.OmegaGridUtils.getUrlSocialAccount(i3?.socialAccount?.username, i3?.socialAccount?.platform);
          let t = `
            <div class="omega-grid-title">
              ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(i3) : i3?.title || ""}
            </div>
            <div class="omega-grid-subtitle">
              ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(i3) : i3?.subtitle || ""}
            </div>
            ${a ? `<button onclick="window.open('${a}', '_blank')" class="omega-grid-btn-follow-us-top">FOLLOW US</button>` : ""}
            <div class="omega-grid-list grid-${e2}">
                ${n2?.sort((i4, e3) => i4.position - e3.position)?.map((e3, n3) => {
            let o2 = i3?.mediaProducts?.filter((i4) => i4?.media_id === e3?.media_id);
            return `<div class="omega-grid-item"
                      onclick="window.OmegaGridModal.openModalGrid(this)"
                      data-item="${window.omegaUtils.encodeToBase64({ ...e3, listProduct: o2, socialAccount: i3?.socialAccount || "", urlSocialAccount: a })}"
                      data-media-products="${window.omegaUtils.encodeToBase64(i3?.mediaProducts)}"
                    >
                      <div class="omega-grid-wrapper">
                        ${"VIDEO" === e3?.media?.type ? `
                          <img
                            src="${e3?.media?.thumbnail_url || ""}"
                            alt="Media error or was deleted"
                            class="omega-grid-img omega-grid-thumbnail"
                            crossorigin="anonymous"
                          />
                          <video
                            class="omega-grid-video"
                            src="${e3?.media?.media_url || ""}"
                            muted
                            loop
                            preload="metadata"
                            crossorigin="anonymous"
                          ></video>
                          <div class="omega-grid-play-button"></div>
                        ` : `
                          <img
                            src="${e3?.media?.media_url || ""}"
                            alt="Media error or was deleted"
                            class="omega-grid-img"
                            crossorigin="anonymous"
                          />
                        `}
                      </div>
                    </div>
                  `;
          }).join("")}
            </div>
            ${a ? `<button onclick="window.open('${a}', '_blank')" class="omega-grid-btn-follow-us-bottom">FOLLOW US</button>` : ""}
          `;
          n2?.length > 0 && (o += t);
        }) : o = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', o && (i2.innerHTML = o, setTimeout(() => {
          window.OmegaGridUtils && window.OmegaGridUtils.renderCustomListGrid && window.OmegaGridUtils.renderCustomListGrid();
        }, 100));
      });
    }
    document.addEventListener("DOMContentLoaded", function() {
      i();
      document.querySelectorAll(".omega-widget-empty").forEach((i2, e) => {
        i2.style.display = 0 === e ? "block" : "none";
      });
      window;
      window.OmegaGridAnalytics.trackMediaImpression && window.OmegaGridAnalytics.trackMediaImpression();
    }), window.OmegaGridCore = { handleRenderGrid: i };
  })();

  // extensions/theme-extension-instagram-feed/assets/omega.utils.js
  if (!window.omegaUtils) {
    let encodeToBase642 = function(e2) {
      const t2 = new TextEncoder(), o2 = JSON.stringify(e2), n2 = t2.encode(o2);
      return btoa(String.fromCharCode(...n2));
    }, decodeBase64 = function(e2) {
      const t2 = (e3) => {
        if (!e3 || "string" != typeof e3) return null;
        if (!/^[A-Za-z0-9+/]*={0,2}$/.test(e3)) return null;
        try {
          const t3 = atob(e3).split("").map((e4) => "%" + e4.charCodeAt(0).toString(16).padStart(2, "0")).join(""), o2 = decodeURIComponent(t3);
          return JSON.parse(o2);
        } catch (e4) {
          return null;
        }
      };
      return Array.isArray(e2) ? e2.map(t2) : t2(e2);
    }, setupModalSoundToggle = function() {
      document.removeEventListener("click", handleModalSoundToggle), document.addEventListener("click", handleModalSoundToggle);
    }, handleModalSoundToggle = function(e2) {
      if (e2.target.closest(".omega-mc-sound-toggle")) {
        const t2 = e2.target.closest(".omega-mc-media-container").querySelector(".omega-mc-media-video"), o2 = e2.target.closest(".omega-mc-sound-toggle").querySelector(".omega-mc-sound-icon"), n2 = o2.querySelector(".omega-mc-sound-on"), r2 = o2.querySelector(".omega-mc-sound-off");
        t2 && n2 && r2 && (t2.muted ? (t2.muted = false, n2.style.display = "block", r2.style.display = "none") : (t2.muted = true, n2.style.display = "none", r2.style.display = "block"));
      }
    }, openPermalink = function(e2) {
      e2 && "null" !== e2 && "undefined" !== e2 && window.open(e2, "_blank");
    }, waitForElement = function(e2, t2 = 5e3) {
      return new Promise((o2, n2) => {
        const r2 = document.querySelector(e2);
        if (r2) return o2(r2);
        const s2 = new MutationObserver(() => {
          const t3 = document.querySelector(e2);
          t3 && (s2.disconnect(), o2(t3));
        });
        s2.observe(document.body, { childList: true, subtree: true }), setTimeout(() => {
          s2.disconnect(), n2(new Error(`Timeout: Element ${e2} not found`));
        }, t2);
      });
    };
    encodeToBase643 = encodeToBase642, decodeBase642 = decodeBase64, setupModalSoundToggle2 = setupModalSoundToggle, handleModalSoundToggle2 = handleModalSoundToggle, openPermalink2 = openPermalink, waitForElement2 = waitForElement;
    const e = (e2, t2) => {
      const o2 = document.querySelector(".omega-toast");
      o2 && o2.remove();
      const n2 = document.createElement("div");
      n2.className = `omega-toast ${t2}`, n2.innerHTML = `
    <div class="omega-toast-content">
      <span class="omega-toast-icon">
        ${"success" === t2 ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'}
      </span>
      <span class="omega-toast-message">${e2}</span>
    </div>
  `;
      const r2 = document.createElement("style");
      r2.textContent = "\n    .omega-toast {\n      position: fixed;\n      top: 20px;\n      right: 20px;\n      z-index: 9999999999999;\n      padding: 12px 20px;\n      border-radius: 8px;\n      background: white;\n      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n      display: flex;\n      align-items: center;\n      animation: slideIn 0.3s ease-out;\n    }\n    .omega-toast.success {\n      border-left: 4px solid #000;\n      background: #000;\n      color: white;\n    }\n    .omega-toast.error {\n      border-left: 4px solid #f44336;\n    }\n    .omega-toast-content {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n    }\n    .omega-toast-icon {\n      display: flex;\n      align-items: center;\n    }\n    .omega-toast.success .omega-toast-icon {\n      color: white;\n    }\n    .omega-toast.error .omega-toast-icon {\n      color: #f44336;\n    }\n    .omega-toast-message {\n      font-size: 14px;\n    }\n    .omega-toast.success .omega-toast-message {\n      color: white;\n    }\n    .omega-toast.error .omega-toast-message {\n      color: #333;\n    }\n    @keyframes slideIn {\n      from {\n        transform: translateX(100%);\n        opacity: 0;\n      }\n      to {\n        transform: translateX(0);\n        opacity: 1;\n      }\n    }\n    @keyframes slideOut {\n      from {\n        transform: translateX(0);\n        opacity: 1;\n      }\n      to {\n        transform: translateX(100%);\n        opacity: 0;\n      }\n    }\n  ", document.head.appendChild(r2), document.body.appendChild(n2), setTimeout(() => {
        n2.style.animation = "slideOut 0.3s ease-out forwards", setTimeout(() => {
          n2.remove(), r2.remove();
        }, 300);
      }, 3e3);
    }, t = async (t2, o2 = 1) => {
      let n2 = { items: [{ id: t2, quantity: o2 }] };
      try {
        const t3 = await fetch("/cart/add.js", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n2) }), o3 = await t3.json();
        return 422 === o3.status ? (e(o3.message || "Failed to add to cart.", "error"), false) : (e("Successfully added to cart!", "success"), true);
      } catch (t3) {
        return console.error("Error:", t3), e("Failed to add to cart. Please try again.", "error"), false;
      }
    }, o = async (t2, o2 = 1) => {
      let n2 = { items: [{ id: t2, quantity: o2 }] };
      try {
        const t3 = await fetch("/cart/add.js", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n2) }), o3 = await t3.json();
        return 422 === o3.status ? (e(o3.message || "Failed to add to cart.", "error"), false) : (window.location.href = "/checkout", true);
      } catch (t3) {
        return console.error("Error:", t3), e("Failed to add to cart. Please try again.", "error"), false;
      }
    }, n = (e2) => isNaN(e2) ? "Invalid Number" : e2.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), r = { ALL: "Lek", ARS: "$", AUD: "A$", AZN: "\u20BC", BYR: "p.", BOB: "$b", BAM: "KM", BWP: "P", BGN: "\u043B\u0432", BRL: "R$", KHR: "\u17DB", CAD: "$", CLP: "$", CNY: "\xA5", COP: "$", CRC: "\u20A1", HRK: "kn", CUP: "\u20B1", CZK: "K\u010D", DKK: "kr", DOP: "RD$", EGP: "\xA3", EEK: "kr", EUR: "\u20AC", FKP: "\xA3", GEL: "\u20BE", GHC: "\xA2", GIP: "\xA3", GTQ: "Q", GGP: "\xA3", HNL: "L", HUF: "Ft", ISK: "kr", INR: "\u20B9", IDR: "Rp", IRR: "\uFDFC", ILS: "\u20AA", JMD: "J$", JPY: "\xA5", KZT: "\u043B\u0432", KPW: "\u20A9", KRW: "\u20A9", LAK: "\u20AD", LVL: "Ls", LTL: "Lt", MKD: "\u0434\u0435\u043D", MYR: "RM", MUR: "\u20A8", MXN: "$", MNT: "\u20AE", NPR: "\u20A8", ANG: "\u0192", NIO: "C$", NGN: "\u20A6", NOK: "kr", OMR: "\uFDFC", PKR: "\u20A8", PAB: "B/.", PYG: "Gs", PEN: "S/.", PHP: "\u20B1", PLN: "z\u0142", QAR: "\uFDFC", RON: "lei", RUB: "\u20BD", SAR: "\uFDFC", RSD: "\u0414\u0438\u043D.", SGD: "S$", ZAR: "R", SEK: "kr", CHF: "CHF", TWD: "NT$", THB: "\u0E3F", TTD: "TT$", TRY: "\u20BA", UAH: "\u20B4", GBP: "\xA3", USD: "$", UYU: "$U", VEF: "Bs", VND: "\u20AB", YER: "\uFDFC", NULL: "" }, s = (e2) => ` ${r?.[e2 ?? "NULL"]}` || "";
    const a = "https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_no_image_product.webp?v=1750923790";
    const l = /* @__PURE__ */ ((e2 = 1e3) => {
      const t2 = /* @__PURE__ */ new Map();
      return (o2, n2, ...r2) => {
        const s2 = Date.now();
        s2 - (t2.get(o2) || 0) >= e2 && (t2.set(o2, s2), n2(...r2));
      };
    })(1e3), c = () => {
      document.querySelectorAll(".omega-mcpdm-list-image").forEach(function(e2) {
        let t2 = false, o2 = 0, n2 = 0;
        e2.style.cursor = "grab", e2.style.userSelect = "none", e2.style.webkitUserSelect = "none", e2.style.mozUserSelect = "none", e2.style.msUserSelect = "none", e2.addEventListener("mousedown", function(r2) {
          r2.preventDefault(), t2 = true, e2.style.cursor = "grabbing", o2 = r2.pageX - e2.offsetLeft, n2 = e2.scrollLeft;
        }), e2.addEventListener("mouseup", function() {
          t2 = false, e2.style.cursor = "grab";
        }), e2.addEventListener("mouseleave", function() {
          t2 = false, e2.style.cursor = "grab";
        }), e2.addEventListener("mousemove", function(r2) {
          if (!t2) return;
          r2.preventDefault(), r2.stopPropagation();
          const s2 = r2.pageX - e2.offsetLeft - o2;
          e2.scrollLeft = n2 - s2;
        }), e2.addEventListener("contextmenu", function(e3) {
          e3.preventDefault();
        }), e2.addEventListener("wheel", function(t3) {
          0 !== t3.deltaY && (t3.preventDefault(), e2.scrollBy({ left: t3.deltaY, behavior: "smooth" }));
        });
      });
    }, i = () => {
      let e2 = document.querySelector(".omega-mcpl-item")?.clientWidth;
      document.querySelectorAll(".omega-mcpl-item-price")?.forEach((t2) => {
        t2?.classList?.remove("force-column"), t2?.scrollWidth > e2 && t2?.classList?.add("force-column");
      });
    }, d = () => {
      let e2 = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail;
      window.innerWidth;
      const t2 = document.querySelectorAll(".omega-mcpl-item-image"), o2 = document.querySelectorAll(".omega-mcpl-item-title"), n2 = document.querySelectorAll(".omega-mcpl-item-price-compare.list-product"), r2 = document.querySelectorAll(".omega-mcpl-item-price-current.list-product"), s2 = document.querySelectorAll(".omega-mcpl-item-actions"), a2 = document.querySelector(".omega-mcpd-bin"), l2 = document.querySelector(".omega-mcpd-atc"), c2 = document.querySelector(".omega-mcpd-info"), i2 = document.querySelector(".omega-mcpd-divider"), d2 = document.querySelector(".omega-mcpd-description-collapse"), m2 = document.querySelector(".omega-tooltip-text-75"), { productImageRatio: u2, priceColor: g2, salePriceColor: p2, titleSize: y2, titleWeight: h, titleColor: f, buttonTitleSize: w, buttonTitleWeight: S, buttonTitleColor: v, buttonBackgroundColor: L, showAddToCartButton: E, showBuyNowButton: b, showDescription: T, showProductInfoButton: C } = e2 || {};
      u2 && t2?.length > 0 && t2.forEach((e3) => {
        e3.style.aspectRatio = u2;
      }), g2 && n2?.length > 0 && n2.forEach((e3) => {
        e3.style.color = g2;
      }), p2 && r2?.length > 0 && r2.forEach((e3) => {
        e3.style.color = p2;
      }), y2 && o2?.length > 0 && o2.forEach((e3) => {
        e3.style.fontSize = `${y2}px`;
      }), h && o2?.length > 0 && o2.forEach((e3) => {
        e3.style.fontWeight = h;
      }), f && o2?.length > 0 && o2.forEach((e3) => {
        e3.style.color = f;
      }), w && s2?.length > 0 && s2.forEach((e3) => {
        e3.style.fontSize = `${w}px`;
      }), S && s2?.length > 0 && s2.forEach((e3) => {
        e3.style.fontWeight = S;
      }), v && s2?.length > 0 && s2.forEach((e3) => {
        e3.style.color = v;
      }), L && s2?.length > 0 && s2.forEach((e3) => {
        e3.style.backgroundColor = L;
      }), !E && l2 && (l2.style.display = "none"), !b && a2 && (a2.style.display = "none"), !T && d2 && i2 && (i2.style.display = "none", d2.style.display = "none"), !C && c2 && (c2.style.display = "none"), C && c2 && m2 && !E && !b && (c2.style.width = "100%", m2.style.left = "41%", m2.style.transform = "translateX(-51%)");
    }, m = () => {
      if (window.innerWidth > 650) return;
      const e2 = document.querySelector(".omega-mc-info"), t2 = document.querySelector(".omega-drag-indicator-wrapper"), o2 = document.querySelector(".omega-mc-media-image"), n2 = document.querySelector(".omega-mc-media-video");
      if (!e2 || !t2) return;
      let r2 = false, s2 = 0, a2 = parseInt(e2.style.top) || 150, l2 = null;
      const c2 = window.innerHeight - 100, i2 = () => {
        l2 && (cancelAnimationFrame(l2), l2 = null);
      }, d2 = (t3) => {
        t3.target.closest(".omega-drag-indicator-wrapper") && (r2 = true, i2(), s2 = t3.touches ? t3.touches[0].clientY : t3.clientY, a2 = parseInt(e2.style.top) || 150, e2.style.transition = "none", document.body.style.userSelect = "none");
      }, m2 = (t3) => {
        if (!r2) return;
        const o3 = t3.touches ? t3.touches[0].clientY : t3.clientY;
        let n3 = a2 + (o3 - s2);
        n3 = Math.min(Math.max(n3, 45), c2), i2(), l2 = requestAnimationFrame(() => {
          e2.style.top = `${n3}px`;
        }), t3.preventDefault();
      }, u2 = () => {
        if (!r2) return;
        r2 = false, i2(), document.body.style.userSelect = "";
        const t3 = e2.getBoundingClientRect(), o3 = t3.height, n3 = t3.top / o3, s3 = document.querySelector(".omega-mc-btn-collapse-sheet");
        n3 > 0.5 ? g2() : (e2.style.transition = "top 0.2s ease", e2.style.top = "0px", s3 && (s3.style.display = "none"), setTimeout(() => {
          e2.style.transition = "none";
        }, 300));
      }, g2 = () => {
        e2.style.transition = "top 0.2s ease", e2.style.top = window.innerHeight - 100 + "px";
        const t3 = document.querySelector(".omega-mc-btn-collapse-sheet");
        t3 && (t3.style.display = "flex"), setTimeout(() => {
          e2.style.transition = "none";
        }, 300);
      };
      o2 && o2.addEventListener("click", g2), n2 && n2.addEventListener("click", g2), t2.addEventListener("mousedown", d2), t2.addEventListener("touchstart", d2, { passive: false }), window.addEventListener("mousemove", m2), window.addEventListener("touchmove", m2, { passive: false }), window.addEventListener("mouseup", u2), window.addEventListener("touchend", u2);
    }, u = () => {
      const e2 = document.querySelector(".omega-mc-info"), t2 = document.querySelector(".omega-mc-btn-collapse-sheet");
      e2 && t2 && (e2.style.transition = "top 0.3s ease", e2.style.top = "270px", t2.style.display = "none");
    };
    const g = (e2) => {
      if (!e2) return "";
      const t2 = new Date(e2);
      return isNaN(t2.getTime()) ? "" : t2.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    }, p = () => window.innerWidth <= 768, y = () => /android/i.test(navigator.userAgent);
    window.omegaUtils = { showToast: e, handleAddToCart: t, handleBuyItNow: o, formatNumberWithCommas: n, getCurrencySymbol: s, defaultImageUrl: a, encodeToBase64: encodeToBase642, decodeBase64, setupModalSoundToggle, handleModalSoundToggle, throttleTrack: l, openPermalink, handleAddScrollImagesDetailProduct: c, handleCheckOverflowWidthPricing: i, renderCustomizeProductPopupDetail: d, setupDragForModalInfo: m, expandProductSheet: u, waitForElement, formatDate: g, checkIsMobile: p, isAndroid: y };
  }
  var encodeToBase643;
  var decodeBase642;
  var setupModalSoundToggle2;
  var handleModalSoundToggle2;
  var openPermalink2;
  var waitForElement2;

  // extensions/theme-extension-instagram-feed/assets/omega.brandmark.js
  !(function() {
    "use strict";
    const n = () => `
      <style>
        .brandmark-container {
          font-family: "Inter", sans-serif;
          margin-top: 12px;
          font-weight: bold;
          text-align: center;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: 100% !important;
          height: auto !important;
          line-height: 1.2;
          cursor: pointer !important;
          transition: opacity 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .brandmark-container:hover {
          opacity: 0.8 !important;
        }
        .brandmark-powered-by {
          font-weight: bold;
          font-size: 14px;
          color: #E3E3E3;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
          margin-right: 3px;
        }
        .brandmark-logo-gradient {
          font-size: 16px;
          font-family: "Inter", sans-serif;
          font-weight: bold;
          background: linear-gradient(290.74deg, #7537FA -47.77%, #A033FF -22.88%, #FF5280 34.75%, #FF684A 59.74%, #FEB100 82.6%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
        }
      </style>
      <div class='brandmark-container'>
        <span class='brandmark-powered-by'>
          Powered by
        </span>
        <span class='brandmark-logo-gradient'>Omega</span>
      </div>`, t = (n2) => {
      const t2 = n2.querySelector(".brandmark-container");
      t2 && (t2.style.cursor = "pointer", t2.addEventListener("click", (n3) => {
        n3.preventDefault(), n3.stopPropagation(), window.open("https://apps.shopify.com/instafeed-instagram-feed-1", "_blank");
      }));
    }, e = (n2) => {
      n2.style.setProperty("display", "block", "important"), n2.style.setProperty("visibility", "visible", "important"), n2.style.setProperty("opacity", "1", "important"), n2.style.setProperty("pointer-events", "auto", "important"), n2.style.setProperty("position", "absolute", "important"), n2.style.setProperty("z-index", "9999", "important");
    }, r = (n2, e2) => {
      n2.innerHTML = e2, t(n2);
    }, i = (n2) => {
      e(n2);
      ["display", "visibility", "opacity", "pointerEvents"].forEach((t3) => {
        const e2 = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, t3);
        e2?.set && Object.defineProperty(n2.style, t3, { get: e2.get, set: function(n3) {
          if (!/* @__PURE__ */ ((n4, t4) => "display" === n4 && "none" === t4 || "visibility" === n4 && "hidden" === t4 || "opacity" === n4 && ("0" === t4 || 0 === t4))(t3, n3)) return e2.set.call(this, n3);
        } });
      });
      const t2 = n2.setAttribute;
      n2.setAttribute = function(n3, e2) {
        if ("style" !== n3 || !((n4) => n4.includes("display:none") || n4.includes("display: none") || n4.includes("visibility:hidden") || n4.includes("visibility: hidden") || n4.includes("opacity:0") || n4.includes("opacity: 0"))(e2)) return t2.call(this, n3, e2);
      };
    }, a = ({ brandmarkContainer: n2, shadow: t2, brandmarkHTML: e2, containerSelector: r2, afterElementSelector: i2, contentElement: a2 }) => {
      if (n2.remove = function() {
        setTimeout(() => {
          document.querySelector("#omega-protected-brandmark") || c(r2, i2);
        }, 0);
      }, a2.removeChild) {
        const n3 = a2.removeChild;
        a2.removeChild = function(t3) {
          return "omega-protected-brandmark" === t3?.id ? (setTimeout(() => {
            c(r2, i2);
          }, 0), t3) : n3.call(this, t3);
        };
      }
      o(t2, e2), s(a2, t2, e2, r2, i2);
    }, o = (n2, t2) => {
      Object.defineProperty(n2, "innerHTML", { get: function() {
        return this._innerHTML || t2;
      }, set: function(e3) {
        e3?.includes("brandmark-container") || e3?.includes("Powered by") ? this._innerHTML = e3 : setTimeout(() => r(n2, t2), 0);
      } });
      const e2 = n2.removeChild;
      e2 && (n2.removeChild = function(i2) {
        return i2?.classList?.contains("brandmark-container") || i2?.textContent?.includes("Powered by") ? (setTimeout(() => r(n2, t2), 0), i2) : e2.call(this, i2);
      });
    }, s = (n2, t2, e2, r2, i2) => {
      const a2 = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
      a2 && Object.defineProperty(n2, "innerHTML", { get: a2.get, set: function(n3) {
        const t3 = a2.set.call(this, n3);
        return setTimeout(() => {
          this.querySelector("#omega-protected-brandmark") || c(r2, i2);
        }, 0), t3;
      } });
    }, l = (n2) => {
      (({ shadow: n3, brandmarkHTML: t2, containerSelector: i2, afterElementSelector: a2 }) => {
        const o2 = setInterval(() => {
          const s2 = document.querySelector("#omega-protected-brandmark"), l2 = n3.querySelector(".brandmark-container");
          if (!s2) return clearInterval(o2), void c(i2, a2);
          e(s2), l2 || r(n3, t2);
        }, 500);
      })(n2), (({ brandmarkContainer: n3, shadow: t2, brandmarkHTML: i2, containerSelector: a2, afterElementSelector: o2, contentElement: s2 }) => {
        new MutationObserver(() => {
          document.querySelector("#omega-protected-brandmark") || c(a2, o2);
        }).observe(s2, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "class", "id"] }), new MutationObserver(() => {
          t2.querySelector(".brandmark-container") || r(t2, i2);
        }).observe(t2, { childList: true, subtree: true, attributes: true }), new MutationObserver((n4) => {
          n4.forEach((n5) => {
            if ("attributes" === n5.type && "style" === n5.attributeName) {
              const t3 = n5.target;
              "omega-protected-brandmark" === t3.id && e(t3);
            }
          });
        }).observe(n3, { attributes: true, attributeFilter: ["style", "class"] });
      })(n2), i(n2.brandmarkContainer), a(n2);
    }, c = (n2, e2) => {
      const r2 = document.querySelector(n2), i2 = document.querySelector(e2);
      if (!r2 || !i2) return;
      if (document.querySelector("#omega-protected-brandmark")) return;
      const a2 = (() => {
        const n3 = document.createElement("div");
        return n3.setAttribute("id", "omega-protected-brandmark"), n3.style.cssText = "\n      position: absolute !important;\n      bottom: -30px !important;\n      left: 50% !important;\n      transform: translateX(-50%) !important;\n      display: block !important;\n      visibility: visible !important;\n      opacity: 1 !important;\n      width: auto !important;\n      height: auto !important;\n      z-index: 9999 !important;\n      pointer-events: auto !important;\n      cursor: pointer !important;\n    ", n3;
      })(), o2 = a2.attachShadow({ mode: "closed" }), s2 = `
      <style>
        .brandmark-container {
          font-family: "Inter", sans-serif;
          margin-top: 12px;
          font-weight: bold;
          text-align: center;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: 100% !important;
          height: auto !important;
          line-height: 1.2;
          cursor: pointer !important;
          transition: opacity 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .brandmark-container:hover {
          opacity: 0.8 !important;
        }
        .brandmark-powered-by {
          font-weight: bold;
          font-size: 14px;
          color: #E3E3E3;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
          margin-right: 3px;
        }
        .brandmark-logo-gradient {
          font-size: 16px;
          font-family: "Inter", sans-serif;
          font-weight: bold;
          background: linear-gradient(290.74deg, #7537FA -47.77%, #A033FF -22.88%, #FF5280 34.75%, #FF684A 59.74%, #FEB100 82.6%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
        }
      </style>
      <div class='brandmark-container'>
        <span class='brandmark-powered-by'>
          Powered by
        </span>
        <span class='brandmark-logo-gradient'>Omega</span>
      </div>`;
      o2.innerHTML = s2, t(o2), i2.style.position = "relative", i2.appendChild(a2), l({ brandmarkContainer: a2, shadow: o2, brandmarkHTML: s2, containerSelector: n2, afterElementSelector: e2, contentElement: i2 });
    }, p = (n2) => {
      const e2 = document.querySelector(n2);
      if (!e2) return;
      if (document.getElementById("omega-brandmark-container")) return;
      const r2 = document.createElement("div");
      r2.setAttribute("id", "omega-brandmark-container"), r2.style.pointerEvents = "auto", r2.style.cursor = "pointer";
      const i2 = r2.attachShadow({ mode: "closed" });
      i2.innerHTML = `
      <style>
        .brandmark-container {
          font-family: "Inter", sans-serif;
          margin-top: 12px;
          font-weight: bold;
          text-align: center;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: 100% !important;
          height: auto !important;
          line-height: 1.2;
          cursor: pointer !important;
          transition: opacity 0.2s ease;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .brandmark-container:hover {
          opacity: 0.8 !important;
        }
        .brandmark-powered-by {
          font-weight: bold;
          font-size: 14px;
          color: #E3E3E3;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
          margin-right: 3px;
        }
        .brandmark-logo-gradient {
          font-size: 16px;
          font-family: "Inter", sans-serif;
          font-weight: bold;
          background: linear-gradient(290.74deg, #7537FA -47.77%, #A033FF -22.88%, #FF5280 34.75%, #FF684A 59.74%, #FEB100 82.6%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: inline !important;
          text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
          line-height: 1.2 !important;
        }
      </style>
      <div class='brandmark-container'>
        <span class='brandmark-powered-by'>
          Powered by
        </span>
        <span class='brandmark-logo-gradient'>Omega</span>
      </div>`, t(i2), e2.appendChild(r2);
      new MutationObserver(() => {
        document.getElementById("omega-brandmark-container") || p(n2);
      }).observe(e2, { childList: true, subtree: true });
    };
    window.omegaBrandmark = { renderOmegaBrandmark: n, insertProtectedBrandmarkAfter: c, insertOmegaBrandmarkShadow: p };
  })();

  // extensions/theme-extension-instagram-feed/assets/omega.customize-template.js
  !(function() {
    "use strict";
    window.OmegaCustomizeTemplate = { log: function(e, t = null) {
    }, applySimpleTemplate: function(e) {
      this.removeAllTemplateClasses(e), e.classList.add("template-simple");
    }, applyOverlayTemplate: function(e) {
      const t = e.querySelector(".omega-carousel-wrapper") || e.querySelector(".omega-grid-wrapper");
      if (!t) return;
      this.removeAllTemplateClasses(e);
      const o = this.getFirstProductFromItem(e);
      Promise.resolve(o).then((o2) => {
        if (o2) e.classList.add("template-overlay"), e.querySelector(".overlay-content") ? this.updateExistingOverlay(e, o2) : this.createOverlayContent(e, t, o2);
        else {
          const t2 = e.querySelector(".overlay-content");
          t2 && t2.remove(), e.classList.remove("template-overlay"), this.applySimpleTemplate(e);
        }
      }).catch((t2) => {
        const o2 = e.querySelector(".overlay-content");
        o2 && o2.remove(), e.classList.remove("template-overlay"), this.applySimpleTemplate(e);
      });
    }, createOverlayContent: function(e, t, o) {
      const r = document.createElement("div");
      r.className = "overlay-content";
      const l = o?.title || "Product title", a = o?.url || "#", n = o?.image || "https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516";
      r.innerHTML = `
        <div class="overlay-text">
          <div class="overlay-product-info" onclick="window.open('${a}', '_blank')" style="cursor: pointer;">
            <img
              src="${n}"
              alt="Product"
              class="overlay-product-img"
              onerror="this.src='https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516'"
            />
            <div class="overlay-product-text">
              <span class="overlay-title">${l}</span>
              <span class="overlay-subtitle">Shop now</span>
            </div>
          </div>
        </div>
      `, t.appendChild(r);
    }, getFirstProductFromItem: async function(e) {
      try {
        const t = e.getAttribute("data-item");
        if (!t) return null;
        let o;
        try {
          o = window.omegaUtils && window.omegaUtils.decodeBase64 ? window.omegaUtils.decodeBase64(t) : JSON.parse(atob(t));
        } catch (e2) {
          o = JSON.parse(atob(t));
        }
        const r = o?.listProduct || [];
        for (const e2 of r) {
          if (e2.product_title || e2.title) return { id: e2.product_id, title: e2.product_title || e2.title, url: e2.product_url || e2.url || "#", handle: e2.product_handle || e2.handle, image: e2.product_image || e2.image, price: e2.product_price || e2.price };
          const t2 = await this.fetchProductDetails(e2);
          if (t2) return t2;
        }
        return null;
      } catch (e2) {
        return null;
      }
    }, fetchProductDetails: async function(e) {
      if (!e.handle) return { id: e.product_id, title: "Product", url: "#", handle: e.handle, image: null, price: null, variants: [] };
      try {
        const t = await fetch(`/products/${e.handle}.json`);
        if (t.ok && 200 === t.status) {
          const o = await t.json(), r = o?.product;
          return { id: r?.id || e.product_id, title: r?.title || "Product", url: `/products/${e.handle}`, handle: e.handle, image: r?.images?.[0]?.src || r?.featured_image, price: r?.variants?.[0]?.price, comparePrice: r?.variants?.[0]?.compare_at_price, variants: r?.variants || [] };
        }
        return null;
      } catch (e2) {
        return this.log(`Error fetching product details: ${e2.message}`), null;
      }
    }, updateExistingOverlay: function(e, t) {
      const o = e.querySelector(".overlay-title"), r = e.querySelector(".overlay-subtitle"), l = e.querySelector(".overlay-product-img"), a = e.querySelector(".overlay-product-info");
      if (t) o && (o.textContent = t.title), r && (r.textContent = "Shop now"), l && t.image && (l.src = t.image, l.onerror = () => {
        l.src = "https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516";
      }), a && (a.onclick = () => window.open(t.url, "_blank"));
      else {
        const t2 = e.querySelector(".overlay-content");
        t2 && t2.remove(), e.classList.remove("template-overlay"), this.applySimpleTemplate(e);
      }
    }, applyReelTitleOnlyTemplate: function(e) {
      const t = e.querySelector(".omega-carousel-wrapper") || e.querySelector(".omega-grid-wrapper");
      if (!t) return;
      this.removeAllTemplateClasses(e), e.classList.add("template-reel-title-only");
      const o = this.getMediaCaptionFromItem(e);
      e.querySelector(".reel-title") ? this.updateExistingReelTitle(e, o) : this.createReelTitle(e, t, o);
    }, getMediaCaptionFromItem: function(e) {
      try {
        const t = e.getAttribute("data-item");
        if (!t) return "";
        let o;
        try {
          o = window.omegaUtils && window.omegaUtils.decodeBase64 ? window.omegaUtils.decodeBase64(t) : JSON.parse(atob(t));
        } catch (e2) {
          o = JSON.parse(atob(t));
        }
        return o?.media?.caption || o?.caption || "";
      } catch (e2) {
        return "";
      }
    }, createReelTitle: function(e, t, o) {
      const r = document.createElement("div");
      r.className = "reel-title", r.innerHTML = `<span>${o}</span>`, t.appendChild(r);
    }, updateExistingReelTitle: function(e, t) {
      const o = e.querySelector(".reel-title span");
      o && (o.textContent = t);
    }, applyProductTemplate: function(e) {
      const t = e.querySelector(".omega-carousel-wrapper") || e.querySelector(".omega-grid-wrapper");
      if (!t) return;
      this.removeAllTemplateClasses(e);
      const o = this.getFirstProductFromItem(e);
      Promise.resolve(o).then((o2) => {
        if (o2) e.classList.add("template-product"), e.querySelector(".product-info") ? this.updateExistingProductInfo(e, o2) : this.createProductInfo(e, t, o2);
        else {
          const t2 = e.querySelector(".product-info");
          t2 && t2.remove(), e.classList.remove("template-product"), this.applySimpleTemplate(e);
        }
      }).catch((t2) => {
        const o2 = e.querySelector(".product-info");
        o2 && o2.remove(), e.classList.remove("template-product"), this.applySimpleTemplate(e);
      });
    }, createProductInfo: function(e, t, o) {
      const r = o?.title || "Product title", l = o?.image || "https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516", a = o?.url || "#";
      let n = "";
      if (o && o.variants && o.variants.length > 0) {
        const e2 = o.variants[0];
        n = `
          ${e2?.compare_at_price ? `<span class="text-sale-price">
                ${window.omegaUtils?.formatNumberWithCommas?.(e2.compare_at_price) || e2.compare_at_price} ${window.omegaUtils?.getCurrencySymbol?.(e2.price_currency) || ""}
               </span>` : ""}
          <span class="text-black-price">
            ${window.omegaUtils?.formatNumberWithCommas?.(e2?.price || 0) || e2?.price || 0} ${window.omegaUtils?.getCurrencySymbol?.(e2?.price_currency || "") || ""}
          </span>
        `;
      } else {
        const e2 = o?.comparePrice, t2 = o?.price;
        n = e2 && t2 ? `
            <span class="text-sale-price">${e2}</span>
            <span class="text-black-price">${t2}</span>
          ` : t2 ? `
            <span class="text-black-price">${t2}</span>
          ` : '\n            <span class="text-black-price">$XX.XX</span>\n          ';
      }
      const s = document.createElement("div");
      s.className = "product-info", s.innerHTML = `
        <div class="custom-template-product-media-wrapper" onclick="window.open('${a}', '_blank')" style="cursor: pointer;">
          <div class="product-image-block">
            <img src="${l}"
                 alt="Product"
                 class="product-img"
                 onerror="this.src='https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516'">
          </div>
          <div class="custom-template-title-wrapper">
            <div class="product-title-box">
              <span class="text-black product-title-text">${r}</span>
              <div class="line-custom-template-media-wrapper"></div>
            </div>
            <div class="product-price-inline">
              ${n}
            </div>
          </div>
        </div>
      `, t.appendChild(s);
    }, updateExistingProductInfo: function(e, t) {
      const o = e.querySelector(".text-black.product-title-text"), r = e.querySelector(".product-img"), l = e.querySelector(".product-price-inline"), a = e.querySelector(".custom-template-product-media-wrapper");
      if (t) {
        if (o && (o.textContent = t.title), r && t.image && (r.src = t.image, r.onerror = () => {
          r.src = "https://cdn.shopify.com/s/files/1/0742/5553/2320/files/instagram-feed-preview-img.jpg?v=1747712516";
        }), l) {
          let e2 = "";
          if (t.variants && t.variants.length > 0) {
            const o2 = t.variants[0];
            e2 = `
              ${o2?.compare_at_price ? `<span class="text-sale-price">
                    ${window.omegaUtils?.formatNumberWithCommas?.(o2.compare_at_price) || o2.compare_at_price} ${window.omegaUtils?.getCurrencySymbol?.(o2.price_currency) || ""}
                   </span>` : ""}
              <span class="text-black-price">
                ${window.omegaUtils?.formatNumberWithCommas?.(o2?.price || 0) || o2?.price || 0} ${window.omegaUtils?.getCurrencySymbol?.(o2?.price_currency || "") || ""}
              </span>
            `;
          } else {
            const o2 = t?.comparePrice, r2 = t?.price;
            e2 = o2 && r2 ? `
                <span class="text-sale-price">${o2}</span>
                <span class="text-black-price">${r2}</span>
              ` : r2 ? `
                <span class="text-black-price">${r2}</span>
              ` : '\n                <span class="text-black-price">$XX.XX</span>\n              ';
          }
          l.innerHTML = e2;
        }
        a && (a.onclick = () => window.open(t.url, "_blank"));
      } else {
        const t2 = e.querySelector(".product-info");
        t2 && t2.remove(), e.classList.remove("template-product"), this.applySimpleTemplate(e);
      }
    }, removeAllTemplateClasses: function(e) {
      ["template-simple", "template-overlay", "template-reel-title-only", "template-product"].forEach((t) => {
        e.classList.remove(t);
      });
    }, applyTemplate: function(e, t) {
      switch (t) {
        case "simple":
        default:
          this.applySimpleTemplate(e);
          break;
        case "overlay":
          this.applyOverlayTemplate(e);
          break;
        case "reel_title_only":
          this.applyReelTitleOnlyTemplate(e);
          break;
        case "product":
          this.applyProductTemplate(e);
      }
    }, applyBorderRadius: function(e, t) {
      const o = e.querySelector(".omega-carousel-wrapper") || e.querySelector(".omega-grid-wrapper"), r = e.querySelector(".omega-carousel-img") || e.querySelector(".omega-grid-img"), l = e.querySelector(".omega-carousel-video") || e.querySelector(".omega-grid-video");
      if (null != t) {
        const a = `${t}px`;
        e.style.setProperty("border-radius", a, "important"), o && o.style.setProperty("border-radius", a, "important"), r && r.style.setProperty("border-radius", a, "important"), l && l.style.setProperty("border-radius", a, "important");
      } else e.style.removeProperty("border-radius"), o && o.style.removeProperty("border-radius"), r && r.style.removeProperty("border-radius"), l && l.style.removeProperty("border-radius");
    }, applyMediaRatio: function(e, t) {
      const o = e.querySelector(".omega-carousel-img") || e.querySelector(".omega-grid-img"), r = e.querySelector(".omega-carousel-video") || e.querySelector(".omega-grid-video");
      o && (o.style.aspectRatio = t), r && (r.style.aspectRatio = t);
    }, setupVideoPlayBehavior: function(e, t) {
      let o;
      o = Array.isArray(t) ? t[0] : t;
      const r = e.querySelector(".omega-carousel-video") || e.querySelector(".omega-grid-video");
      if (!r) return;
      const l = e.querySelector(".omega-carousel-thumbnail") || e.querySelector(".omega-grid-thumbnail"), a = e.querySelector(".omega-carousel-play-button") || e.querySelector(".omega-grid-play-button");
      if (o) switch (o) {
        case "play-on-hover":
        default:
          this.setupPlayOnHover(e, r, a);
          break;
        case "none":
          this.setupVideoHidden(r, l, a);
          break;
        case "autoplay":
          e.removeEventListener("mouseenter", e._hoverPlayHandler), e.removeEventListener("mouseleave", e._hoverPauseHandler), this.setupAutoplay(r, l, a);
      }
      else this.setupPlayOnHover(e, r, a);
    }, setupPlayOnHover: function(e, t, o) {
      const r = e.querySelector(".omega-carousel-thumbnail") || e.querySelector(".omega-grid-thumbnail");
      r && (r.style.display = "block", r.style.opacity = "1"), o && (o.style.display = "flex"), t.style.display = "block", t.pause(), t.currentTime = 0, e.removeEventListener("mouseenter", e._hoverPlayHandler), e.removeEventListener("mouseleave", e._hoverPauseHandler), e._hoverPlayHandler = () => {
        r && (r.style.opacity = "0"), o && (o.style.display = "none"), t.play().catch((e2) => this.log(`Video play failed: ${e2.message}`));
      }, e._hoverPauseHandler = () => {
        t.pause(), t.currentTime = 0, r && (r.style.opacity = "1"), o && (o.style.display = "flex");
      }, e.addEventListener("mouseenter", e._hoverPlayHandler), e.addEventListener("mouseleave", e._hoverPauseHandler);
    }, setupAutoplay: function(e, t, o) {
      e.play().catch((e2) => this.log(`Video autoplay failed: ${e2.message}`)), t && (t.style.opacity = "0"), o && (o.style.display = "none");
      const r = e.closest(".omega-carousel-item") || e.closest(".omega-grid-item");
      r && (r.removeEventListener("mouseenter", r._autoplayHoverHandler), r.removeEventListener("mouseleave", r._autoplayLeaveHandler), r._autoplayHoverHandler = () => {
        e.pause(), o && (o.style.display = "flex"), t && (t.style.opacity = "1");
      }, r._autoplayLeaveHandler = () => {
        e.play().catch((e2) => this.log(`Video autoplay resume failed: ${e2.message}`)), o && (o.style.display = "none"), t && (t.style.opacity = "0");
      }, r.addEventListener("mouseenter", r._autoplayHoverHandler), r.addEventListener("mouseleave", r._autoplayLeaveHandler));
    }, setupVideoHidden: function(e, t, o) {
      e.style.display = "none", e.pause(), e.currentTime = 0, t && (t.style.display = "block", t.style.opacity = "1"), o && (o.style.display = "flex");
      const r = e.closest(".omega-carousel-item") || e.closest(".omega-grid-item");
      r && (r.removeEventListener("mouseenter", r._hoverPlayHandler), r.removeEventListener("mouseleave", r._hoverPauseHandler), r.removeEventListener("mouseenter", r._autoplayHoverHandler), r.removeEventListener("mouseleave", r._autoplayLeaveHandler));
    }, applyColumnSettings: function(e, t, o) {
      e.style.setProperty("--columns", t.toString());
    }, applySpacing: function(e, t) {
      e && e.style.setProperty("--gap", `${t}px`);
    }, applyGridColumns: function(e, t) {
      e && e.style.setProperty("--columns", t.toString());
    }, applyThemeColors: function(e, t, o, r, l, a) {
      if (!a) return;
      if (e && a.backgroundColor) {
        e.style.setProperty("background-color", a.backgroundColor, "important");
        const t2 = e.closest(".shopify-section");
        t2 && t2.style.setProperty("background-color", a.backgroundColor, "important");
      }
      t && a.titleColor && t.style.setProperty("color", a.titleColor, "important"), o && a.subtitleColor && o.style.setProperty("color", a.subtitleColor, "important");
      const n = a.buttonColor;
      if (n) {
        const e2 = (e3) => {
          e3 && "none" !== e3.style.display && (e3.style.setProperty("background-color", n, "important"), e3.style.setProperty("border-color", n, "important"), e3.style.setProperty("color", "#ffffff"), e3.addEventListener("mouseenter", () => {
            e3.style.setProperty("box-shadow", `0 0 0 1px ${n}`, "important");
          }), e3.addEventListener("mouseleave", () => {
            e3.style.removeProperty("box-shadow");
          }));
        };
        e2(r), e2(l);
      }
    }, applyHeaderVisibility: function(e, t, o) {
      if (!e || !t) return;
      const r = !!o?.showHeader, l = !!o?.showSubtitle;
      e.style.display = r ? "flex" : "none", e.style.paddingBottom = l ? "0px" : "";
    }, applyButtonFollowUs: function(e, t, o) {
      e && (e.style.display = o?.showBtnFollowUs && "top" === o?.positionBtnFollowUs ? "block" : "none"), t && (t.style.display = o?.showBtnFollowUs && "bottom" === o?.positionBtnFollowUs ? "block" : "none");
    }, applyContainerWidth: function(e, t, o) {
      if (!e) return;
      const r = e.parentElement?.offsetWidth || window.innerWidth, l = Number(o || 12);
      if (t < 4) {
        const o2 = (r - 3 * l) / 4 * t + (t - 1) * l;
        setTimeout(() => {
          e.style.setProperty("width", `${o2}px`, "important"), e.style.setProperty("max-width", `${o2}px`, "important"), e.style.setProperty("min-width", `${o2}px`, "important"), e.style.margin = "0 auto";
        }, 0);
      }
    }, applyCarouselMotion: function(e) {
      if ("auto-scroll" === e) {
        const e2 = document.querySelectorAll(".omega-carousel-prev"), t = document.querySelectorAll(".omega-carousel-next"), o = document.querySelectorAll(".omega-carousel");
        if (e2.forEach((e3) => {
          e3 && (e3.style.display = "none");
        }), t.forEach((e3) => {
          e3 && (e3.style.display = "none");
        }), !o || 0 === o.length) return;
        this.setupAutoScrollForCarousels(o);
      }
    }, setupAutoScrollForCarousels: function(e) {
      this.cleanupAllAutoScroll(), e && 0 !== e.length && e.forEach((e2, t) => {
        if (!e2) return;
        if ("true" === e2.dataset.autoScrollInitialized) return;
        const o = () => {
          const t2 = window?.customizeSettingInstagramFeedOmega?.customizeCarousel?.columnSpacing || 12, o2 = e2.querySelector(".omega-carousel-item")?.offsetWidth + Number(t2);
          if (!o2) return;
          const r2 = e2.scrollLeft;
          if (r2 >= e2.scrollWidth - e2.clientWidth - 1) this.smoothScrollTo(e2, 0);
          else {
            const t3 = r2 + o2;
            this.smoothScrollTo(e2, t3);
          }
        };
        e2.autoScrollAnimationId && (cancelAnimationFrame(e2.autoScrollAnimationId), e2.autoScrollAnimationId = null);
        let r = null, l = 0;
        let a = false;
        const n = () => {
          if (a) return;
          const t2 = (n2) => {
            n2 - l >= 2e3 && (o(), l = n2), a || (r = requestAnimationFrame(t2), e2.autoScrollAnimationId = r);
          };
          r = requestAnimationFrame(t2), e2.autoScrollAnimationId = r;
        }, s = () => {
          a = true, r && (cancelAnimationFrame(r), r = null, e2.autoScrollAnimationId = null);
        }, i = () => {
          setTimeout(() => {
            a = false, n();
          }, 150);
        }, c = () => {
          a = true, m = true, r && (cancelAnimationFrame(r), r = null, e2.autoScrollAnimationId = null);
        }, p = () => {
          setTimeout(() => {
            a = false, n();
          }, 500);
        };
        let u, m = false;
        const d = () => {
          m || (m = true, a = true, r && (cancelAnimationFrame(r), r = null, e2.autoScrollAnimationId = null)), u && clearTimeout(u), u = setTimeout(() => {
            m = false, a = false, n();
          }, 1e3);
        }, y = () => {
          document.hidden ? (a = true, r && (cancelAnimationFrame(r), r = null, e2.autoScrollAnimationId = null)) : a && setTimeout(() => {
            a = false, n();
          }, 200);
        };
        e2.addEventListener("mouseenter", s), e2.addEventListener("mouseleave", i), e2.addEventListener("touchstart", c, { passive: true }), e2.addEventListener("touchmove", c, { passive: true }), e2.addEventListener("touchend", p, { passive: true }), e2.addEventListener("scroll", d, { passive: true }), document.addEventListener("visibilitychange", y), e2.cleanupAutoScroll = () => {
          a = true, r && (cancelAnimationFrame(r), r = null), e2.autoScrollAnimationId && (cancelAnimationFrame(e2.autoScrollAnimationId), e2.autoScrollAnimationId = null), document.removeEventListener("visibilitychange", y), e2.removeEventListener("mouseenter", s), e2.removeEventListener("mouseleave", i), e2.removeEventListener("touchstart", c), e2.removeEventListener("touchmove", c), e2.removeEventListener("touchend", p), e2.removeEventListener("scroll", d), u && clearTimeout(u);
        }, e2.dataset.autoScrollInitialized = "true", setTimeout(() => {
          n();
        }, 1e3);
      });
    }, cleanupAllAutoScroll: function() {
      document.querySelectorAll(".omega-carousel").forEach((e) => {
        e.cleanupAutoScroll && e.cleanupAutoScroll(), delete e.dataset.autoScrollInitialized;
      });
    }, smoothScrollTo: function(e, t, o = 800) {
      "scrollBehavior" in document.documentElement.style ? e.scrollTo({ left: t, behavior: "smooth" }) : this.customSmoothScroll(e, t, o);
    }, customSmoothScroll: function(e, t, o) {
      const r = e.scrollLeft, l = t - r, a = performance.now(), n = (t2) => {
        const s = t2 - a, i = Math.min(s / o, 1), c = ((e2) => e2 < 0.5 ? 4 * e2 * e2 * e2 : 1 - Math.pow(-2 * e2 + 2, 3) / 2)(i), p = r + l * c;
        e.scrollLeft = p, i < 1 && requestAnimationFrame(n);
      };
      requestAnimationFrame(n);
    } };
  })(), window.addEventListener("beforeunload", () => {
    window.OmegaCarouselUtils && window.OmegaCarouselUtils.cleanupAllAutoScroll && window.OmegaCarouselUtils.cleanupAllAutoScroll();
  });

  // extensions/theme-extension-instagram-feed/assets/omega.media-optimizer.js
  !(function() {
    "use strict";
    let e;
    window.omegaMediaOptimizer = { _urlCache: /* @__PURE__ */ new Map(), optimizeMediaUrl: function(e2, t = "image", a = null) {
      if (!e2) return e2;
      const r = `${e2}_${t}_${a || "auto"}`;
      if (this._urlCache.has(r)) return this._urlCache.get(r);
      a || (a = this.getDeviceType());
      let i = e2;
      return e2.includes("cdn.shopify.com") ? i = this.optimizeShopifyUrl(e2, t, a) : this.isExternalUrl(e2) && (i = this.optimizeExternalUrl(e2, a)), this._urlCache.set(r, i), i;
    }, getDeviceType: function() {
      const e2 = window.innerWidth;
      return e2 <= 480 ? "mobile-small" : e2 <= 768 ? "mobile" : e2 <= 1024 ? "tablet" : e2 <= 1440 ? "desktop" : "desktop-large";
    }, isExternalUrl: function(e2) {
      return e2.includes("instagram.com") || e2.includes("facebook.com") || e2.includes("fbcdn.net") || e2.includes("cdninstagram.com");
    }, optimizeShopifyUrl: function(e2, t, a) {
      try {
        const t2 = new URL(e2);
        return t2.searchParams.delete("width"), t2.searchParams.delete("height"), t2.searchParams.delete("crop"), t2.toString();
      } catch (t2) {
        return console.warn("Failed to optimize Shopify URL:", t2), e2;
      }
    }, addVideoOptimization: function(e2, t) {
      switch (t) {
        case "mobile-small":
          e2.searchParams.set("width", "350"), e2.searchParams.set("height", "450");
          break;
        case "mobile":
          e2.searchParams.set("width", "450"), e2.searchParams.set("height", "600");
          break;
        case "tablet":
        case "desktop-large":
          e2.searchParams.set("width", "600"), e2.searchParams.set("height", "800");
          break;
        case "desktop":
          e2.searchParams.set("width", "500"), e2.searchParams.set("height", "650");
          break;
        default:
          e2.searchParams.set("width", "400"), e2.searchParams.set("height", "550");
      }
      e2.searchParams.set("quality", "90");
    }, addImageOptimization: function(e2, t) {
      switch (t) {
        case "mobile-small":
          e2.searchParams.set("width", "300"), e2.searchParams.set("height", "400"), e2.searchParams.set("format", "webp"), e2.searchParams.set("quality", "85");
          break;
        case "mobile":
          e2.searchParams.set("width", "450"), e2.searchParams.set("height", "600"), e2.searchParams.set("format", "webp"), e2.searchParams.set("quality", "88");
          break;
        case "tablet":
          e2.searchParams.set("width", "650"), e2.searchParams.set("height", "850"), e2.searchParams.set("format", "webp"), e2.searchParams.set("quality", "88");
          break;
        case "desktop":
          e2.searchParams.set("width", "550"), e2.searchParams.set("height", "700"), e2.searchParams.set("quality", "92");
          break;
        case "desktop-large":
          e2.searchParams.set("width", "750"), e2.searchParams.set("height", "1000"), e2.searchParams.set("quality", "92");
          break;
        default:
          e2.searchParams.set("width", "500"), e2.searchParams.set("height", "650"), e2.searchParams.set("quality", "88");
      }
    }, optimizeExternalUrl: function(e2, t) {
      if (t.includes("mobile")) {
        const t2 = ["_n", "_z", "_q"];
        for (const a of t2) {
          const t3 = e2.replace(/\.(jpg|jpeg|png|webp)/, `${a}.$1`);
          if (t3 !== e2) return t3;
        }
      }
      return e2;
    }, optimizeContainerMedia: function(e2) {
      if (!e2) return;
      const t = e2.querySelectorAll("img"), a = e2.querySelectorAll("video");
      let r = 0;
      return t.forEach((e3) => {
        if (!e3.dataset.optimized) {
          const t2 = e3.src, a2 = this.optimizeMediaUrl(t2, "image");
          a2 !== t2 && (e3.src = a2, e3.dataset.optimized = "true", r++);
        }
      }), a.forEach((e3) => {
        if (e3.poster && !e3.dataset.posterOptimized) {
          const t2 = e3.poster, a2 = this.optimizeMediaUrl(t2, "video");
          a2 !== t2 && (e3.poster = a2, e3.dataset.posterOptimized = "true", r++);
        }
      }), r;
    }, setupEnhancedLazyLoading: function(e2) {
      if (!e2) return;
      const t = e2.querySelectorAll('img[loading="lazy"]'), a = e2.querySelectorAll('video[preload="metadata"]'), r = new IntersectionObserver((e3) => {
        e3.forEach((e4) => {
          if (e4.isIntersecting) {
            const t2 = e4.target;
            if (t2.dataset.src && !t2.dataset.preloaded) {
              const e5 = document.createElement("link");
              e5.rel = "preload", e5.as = "image", e5.href = t2.dataset.src, e5.crossOrigin = "anonymous", document.head.appendChild(e5), t2.dataset.preloaded = "true";
            }
            e4.intersectionRatio > 0.1 && this.preloadImage(t2);
          }
        });
      }, { rootMargin: "200px 0px", threshold: [0, 0.1, 0.5, 1] });
      t.forEach((e3) => {
        e3.dataset.observed || (r.observe(e3), e3.dataset.observed = "true");
      });
      const i = new IntersectionObserver((e3) => {
        e3.forEach((e4) => {
          if (e4.isIntersecting && e4.intersectionRatio > 0.3) {
            const t2 = e4.target;
            t2.dataset.preloaded || (this.preloadVideo(t2), t2.dataset.preloaded = "true");
          }
        });
      }, { rootMargin: "300px 0px", threshold: [0, 0.3, 0.7, 1] });
      return a.forEach((e3) => {
        e3.dataset.observed || (i.observe(e3), e3.dataset.observed = "true");
      }), { imageObserver: r, videoObserver: i };
    }, preloadImage: function(e2) {
      if (e2.dataset.preloaded) return;
      const t = e2.src, a = this.optimizeMediaUrl(t, "image");
      if (a !== t) {
        const t2 = document.createElement("link");
        t2.rel = "preload", t2.as = "image", t2.href = a, t2.crossOrigin = "anonymous", document.head.appendChild(t2), e2.src = a, e2.dataset.optimized = "true", e2.dataset.preloaded = "true", e2.onload = () => {
          t2.parentNode && t2.parentNode.removeChild(t2);
        };
      }
    }, preloadVideo: function(e2) {
      if (!e2.dataset.preloaded) {
        if (e2.src) {
          const t = document.createElement("link");
          t.rel = "preload", t.as = "video", t.href = e2.src, t.crossOrigin = "anonymous", document.head.appendChild(t), e2.addEventListener("loadedmetadata", () => {
            t.parentNode && t.parentNode.removeChild(t);
          }, { once: true });
        }
        if (e2.poster && !e2.dataset.posterOptimized) {
          const t = e2.poster, a = this.optimizeMediaUrl(t, "video");
          a !== t && (e2.poster = a, e2.dataset.posterOptimized = "true");
        }
      }
    }, getStats: function() {
      return { cacheSize: this._urlCache.size, deviceType: this.getDeviceType(), screenWidth: window.innerWidth };
    }, clearCache: function() {
      this._urlCache.clear();
    }, resetOptimizationFlags: function(e2) {
      if (!e2) return;
      const t = e2.querySelectorAll("img[data-optimized]"), a = e2.querySelectorAll("video[data-poster-optimized]");
      t.forEach((e3) => delete e3.dataset.optimized), a.forEach((e3) => delete e3.dataset.posterOptimized);
    } }, "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        window.omegaMediaOptimizer.optimizeAllPageMedia();
      }, 1e3);
    }) : setTimeout(() => {
      window.omegaMediaOptimizer.optimizeAllPageMedia();
    }, 1e3), window.addEventListener("resize", () => {
      clearTimeout(e), e = setTimeout(() => {
        document.querySelectorAll(".omega-carousel-container, .omega-grid-container").forEach((e2) => {
          window.omegaMediaOptimizer.resetOptimizationFlags(e2), window.omegaMediaOptimizer.optimizeContainerMedia(e2);
        });
      }, 300);
    }), window.omegaMediaOptimizer.optimizeAllPageMedia = function() {
      const e2 = document.querySelectorAll(".omega-carousel-container, .omega-grid-container");
      let t = 0;
      return e2.forEach((e3) => {
        t += this.optimizeContainerMedia(e3), this.setupEnhancedLazyLoading(e3);
      }), t;
    };
  })();

  // extensions/theme-extension-instagram-feed/assets/omega.modal.js
  function generateModalInfoCaption(a) {
    const n = document.querySelector(".omega-mc-info");
    if (!n) return;
    if (!a?.socialAccount?.username || !a?.media?.caption) return;
    const o = `
        <div class="omega-modal-wrapper-info-caption">
            <div class="omega-modal-info-header">
                <span class="omega-modal-info-avatar">
                    <img 
                        src="${a?.socialAccount?.avatar_url || "https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-avt.jpg?v=1757581931"}" 
                        alt="${a?.socialAccount?.username || ""}" 
                    />
                </span>
                <span class="omega-modal-info-caption-username">${a?.socialAccount?.username || ""}</span>
                <span class="omega-modal-info-caption-dot">\u2022</span>
                <span class="omega-modal-btn-follow-social" onclick="window.open('${a?.urlSocialAccount || ""}', '_blank')">Follow</span>
            </div>

            <p class="omega-modal-info-caption-text">${a?.media?.caption || ""}</p>
           
            <span class="omega-modal-info-caption-timestamp">
                ${window.omegaUtils.formatDate(a?.media?.timestamp)}
            </span>
        </div>`;
    n.innerHTML = "INSTAGRAM" === a?.socialAccount?.platform ? o : "";
  }
  window.omegaModal = { generateModalInfoCaption };

  // extensions/theme-extension-instagram-feed/assets/collage-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaCollageAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: o } = t2;
      if (!e || !i || !o) return void console.warn("Missing required config for impression tracking");
      const c = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, r = await o(t4);
          r && this.trackEvent({ eventType: "impression", objectType: i }, r), c.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        c.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const o = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, o);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-collage .omega-mcpl-item", "#omega-modal-collage .omega-mcp-detail"].forEach((o) => {
          this.setupImpressionTracking({ selector: o, objectType: "product", getData: function(o2) {
            const c = o2.getAttribute("data-product-id"), r = c?.split("/").pop(), n = t2?.find((t3) => t3?.id === Number(r)), a = e?.find((t3) => t3?.product_id?.split("/").pop() === c);
            return { id: Number(r) || 0, title: a?.title || n?.title || "Unnamed product", media_id: a?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-collage-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let o = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: o };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/collage-modal.js
  !(function() {
    let e = [], n = {}, a = null, o = null, t = null, i = window.omegaCollageShowBrandmark, l = [], d = 0;
    function m(t2, i2, l2 = null) {
      const d2 = document.querySelector(".omega-mc-info");
      if (d2) {
        if (n = {}, a = i2, "list_product" === t2) d2.innerHTML = `
      ${i2?.length > 0 ? `
        <div>
          <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
          </div>
          <div class="omega-mcp-list-title" >Featured products</div>
            <div class="omega-mcp-list">
            ${i2.map((e2) => `
              <div class="omega-mcpl-item"
              data-product-id='${e2?.id}'
              data-item="${window.omegaUtils.encodeToBase64(l2)}"
              onclick="window.OmegaCollageModal.handleShowProductCollage(${e2?.id}, event)"
              >
                <div class="omega-mcpl-item-info">
                <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
                </div>
                <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
                </div>
                    <div class="omega-mcpl-item-price">
                      ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                          ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                        </span>` : ""}
                      <span class="omega-mcpl-item-price-current list-product">
                        ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                      </span>
                      </div>
                </div>
                <div
                class="omega-mcpl-item-actions"
                >
                Add to cart
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === t2) {
          let a2 = null;
          i2?.variants?.[0] && (a2 = i2.variants[0], i2.options.forEach((e2, o2) => {
            n[e2.name] = a2[`option${o2 + 1}`];
          }), o = a2), d2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${i2?.id}" data-item="${window.omegaUtils.encodeToBase64(l2)}">
        <div class="omega-mcpd-back">
         ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaCollageModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
        </div>
          <div class="omega-mcpd-main">
          <div class="omega-mcpdm-list-image">
            ${i2?.images?.length > 0 ? i2?.images?.map((e2, n2) => `
            <img
              src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
              style="${n2 === i2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
            />
            `).join("") : `
            <img
              src="${window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
            />`}
          </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${i2?.title}
              </div>
              <div class="omega-mcpl-item-price">
                ${a2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(a2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(a2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(a2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(a2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${i2?.options?.length > 0 && i2?.options?.filter((e2) => "Title" !== e2?.name).map((e2, a3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((a4) => `
                    <div
                      class="omega-mcpdm-option-value ${n[e2.name] === a4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${a4}"
                    >
                      ${a4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...l2 })}"
              onclick="window.OmegaCollageModal.handleBuyItNowCollage(${i2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...l2 })}"
              onclick="window.OmegaCollageModal.handleAddToCartCollage(${i2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaCollageModal.handleOpenProductCollage('${i2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaCollageModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${i2?.body_html ? i2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(i2?.images)), e2.addEventListener("click", window.OmegaCollageModal.handleOptionChangeCollage);
          }), d2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function c(e2, n2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const a2 = e2.querySelector("video");
        a2 && (a2.pause(), a2.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
      }), e2.addEventListener("click", (a2) => {
        if (a2.target === e2) {
          const a3 = e2.querySelector("video");
          a3 && (a3.pause(), a3.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
        }
      });
    }
    function s(n2, a2, o2, s2) {
      window;
      let r = [];
      r = (a2 ?? []).filter((e2) => e2?.media_id === n2?.media_id), window.omegaUtils.throttleTrack(`click-media-${n2?.media_id}`, () => {
        window.OmegaCollageAnalytics.trackMediaClick(n2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", w = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', v = false;
      g && (v = false === p || !n2?.socialAccount?.username || !n2?.media?.caption || "INSTAGRAM" !== n2?.media?.source, v && (u = "aspect-ratio: 9 / 16;", w = ""));
      const h = d > 0, C = d < l.length - 1;
      o2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${h ? '\n        <button class="omega-collage-prev omega-mc-nav-btn-prev" onclick="window.OmegaCollageModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${C ? '\n        <button class="omega-collage-next omega-mc-nav-btn-next" onclick="window.OmegaCollageModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${v ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === n2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${n2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${n2.media?.media_url}">`}
            ${n2?.media?.permalink ? `
            <button
             style="${"VIDEO" !== n2?.media?.type ? "bottom: 20px;" : ""}"
             class="omega-mc-instagram omega-tooltip
              ${"VIDEO" === n2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
              ${g ? "omega-mc-empty-product" : ""}"
             aria-label="Toggle sound"
             onclick="window.omegaUtils.openPermalink('${n2?.media?.permalink || ""}')"
             >
              <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
              </svg>
            </button>
            ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n               >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${w}
      </div>
    </div>
  `, document.body.appendChild(o2), o2.style.display = "flex", document.body.classList.add(s2), i && window.omegaUtils.waitForElement("#omega-modal-collage").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-collage", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), c(o2, s2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((a3) => {
        e = a3.filter(Boolean), 1 === e?.length ? m("detail_product", e?.[0], n2) : m("list_product", e, n2);
      }) : window.omegaModal.generateModalInfoCaption(n2), t = n2, window.omegaUtils.setupModalSoundToggle();
    }
    window.OmegaCollageModal = { openModalCollage: function(n2) {
      if (!n2) return;
      if (n2.classList && (n2.classList.contains("quickview") || n2.classList.contains("product__add-cart") || "SELECT-OPTION" === n2.tagName)) return;
      if (!(n2.closest ? n2.closest(".omega-collage-container") : null)) return;
      const a2 = n2.getAttribute("data-item");
      if (!a2 || "" === a2.trim()) return;
      const o2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!o2.test(a2)) return;
      const r = n2.getAttribute("data-media-products");
      if (r && "" !== r.trim() && !o2.test(r)) return;
      const g = window.omegaUtils.decodeBase64(a2), p = r ? window.omegaUtils.decodeBase64(r) : null;
      if (!g || !g.media_id) return;
      const u = n2.closest(".omega-collage-container").querySelectorAll("[data-item]");
      l = Array.from(u).map((e2) => window.omegaUtils.decodeBase64(e2.getAttribute("data-item"))), d = l.findIndex((e2) => e2.media_id === g.media_id);
      const w = document.getElementById("omega-modal-collage"), v = "omega-mc-open";
      window;
      let h = [];
      h = (p ?? []).filter((e2) => e2?.media_id === g?.media_id), window.omegaUtils.throttleTrack(`click-media-${g?.media_id}`, () => {
        window.OmegaCollageAnalytics.trackMediaClick(g, h);
      }), e = [];
      const C = Array.isArray(h) && 0 === h.length, { showPostCaption: f } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", $ = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', b = false;
      C && (b = false === f || !g?.socialAccount?.username || !g?.media?.caption || "INSTAGRAM" !== g?.media?.source, b && (y = "aspect-ratio: 9 / 16;", $ = "")), w.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
        <div class="${b ? "omega-mc-main-no-product" : "omega-mc-main"}">
            <div class="omega-mc-media-container">
              ${"VIDEO" === g?.media?.type ? `
                      <video
                        class="omega-mc-media-video"
                        src="${g.media?.media_url}"
                        autoplay
                        loop
                        ${window.omegaUtils.isAndroid() ? "muted" : ""}
                        playsinline
                      ></video>
                      <button
                        class="omega-mc-sound-toggle ${C ? "omega-mc-sound-toggle-empty-product" : ""}"
                        aria-label="Toggle sound"
                      >
                        <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                          <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                          <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                        </svg>
                      </button>
                    ` : `<img class="omega-mc-media-image" src="${g.media?.media_url}">`}
              ${g?.media?.permalink ? `
              <button
               style="${"VIDEO" !== g?.media?.type ? "bottom: 20px;" : ""}"
               class="omega-mc-instagram omega-tooltip
                ${"VIDEO" === g?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                ${C ? "omega-mc-empty-product" : ""}"
               aria-label="Toggle sound"
               onclick="window.omegaUtils.openPermalink('${g?.media?.permalink || ""}')"
               >
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
              ${!C && '<button class="omega-mc-btn-collapse-sheet"\n                onclick="window.omegaUtils.expandProductSheet()"\n                >\n                  <img\n                    src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                    alt="btn-cart"\n                    width="20px"\n                    height="100%"\n                  />\n                  View featured products\n                </button>'}
            </div>
          ${$}
        </div>
      </div>
    `, document.body.appendChild(w), w.style.display = "flex", document.body.classList.add(v), i && window.omegaUtils.waitForElement("#omega-modal-collage").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-collage", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), c(w, v), h?.length > 0 ? Promise.all(h?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? m("detail_product", e?.[0], g) : m("list_product", e, g), h?.length && window.OmegaCollageAnalytics.trackProductImpression(e, h, g);
      }) : (window.omegaModal.generateModalInfoCaption(g), h?.length && window.OmegaCollageAnalytics.trackProductImpression(e, h, g)), t = g, window.omegaUtils.setupModalSoundToggle(), s(g, p, w, v);
    }, generateModalInfoHTMLCollage: m, handleOptionChangeCollage: function(e2) {
      if (!a) return;
      const t2 = e2.target, i2 = t2.dataset.optionName, l2 = t2.dataset.value;
      n[i2] = l2, o = a?.variants?.find((e3) => Object.entries(n).every(([n2, o2]) => {
        const t3 = a.options.findIndex((e4) => e4.name === n2);
        if (-1 === t3) return false;
        return e3[`option${t3 + 1}`] === o2;
      }));
      const d2 = t2.closest(".omega-mcpdm-option-group");
      if (d2) {
        d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === t2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (o) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const n2 = `
          ${o.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(o.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(o.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(o.price)} ${window.omegaUtils.getCurrencySymbol(o.price_currency)}
          </span>
        `;
          e3.innerHTML = n2;
        }
      }
      if (o && a?.images) {
        const n2 = a.images.find((e3) => e3?.id === o?.image_id), t3 = document.querySelector(".omega-mcpdm-list-image");
        if (t3) {
          const a2 = JSON.parse(e2.target.dataset.images || "[]");
          t3.innerHTML = n2?.src ? `
          <img
            src="${n2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : a2?.length > 0 ? a2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartCollage: function(n2, a2) {
      const t2 = window.omegaUtils.decodeBase64(a2.target.dataset.item), i2 = (window, e.find((e2) => e2?.id === n2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(o?.id, 1) && window.OmegaCollageAnalytics.trackAddToCart(i2, t2);
      }
    }, handleBuyItNowCollage: function(n2, a2) {
      if (window.omegaUtils.decodeBase64(a2.target.dataset.item), window, e.find((e2) => e2?.id === n2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(o?.id, 1);
      }
    }, handleShowProductCollage: function(n2, a2) {
      const o2 = a2.currentTarget, i2 = window.omegaUtils.decodeBase64(o2?.dataset?.item);
      window, t = i2;
      let l2 = e.find((e2) => e2?.id === n2);
      if (!l2) throw new Error(`Product with ID ${n2} not found in listDetailProductsCollage`);
      window.omegaUtils.throttleTrack(`product-click-${l2?.id}`, () => {
        window.OmegaCollageAnalytics.trackProductClick(l2, i2);
      }), m("detail_product", l2, i2);
    }, handleOpenProductCollage: function(e2, n2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      m("list_product", e, t), a = null, n = null, o = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), n2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", n2.textContent = "\u2212") : (e2.style.display = "none", n2.textContent = "+");
    }, goToPrevious: function() {
      if (d > 0) {
        d--;
        const e2 = l[d], n2 = document.getElementById("omega-modal-collage"), a2 = "omega-mc-open", o2 = document.querySelectorAll("[data-item]"), t2 = Array.from(o2).find((n3) => window.omegaUtils.decodeBase64(n3.getAttribute("data-item")).media_id === e2.media_id), i2 = window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products"));
        s(e2, i2, n2, a2);
      }
    }, goToNext: function() {
      if (d < l.length - 1) {
        d++;
        const e2 = l[d], n2 = document.getElementById("omega-modal-collage"), a2 = "omega-mc-open", o2 = document.querySelectorAll("[data-item]"), t2 = Array.from(o2).find((n3) => {
          const a3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return a3 && a3.media_id === e2.media_id;
        }), i2 = t2 ? window.omegaUtils.decodeBase64(t2.getAttribute("data-media-products")) : null;
        s(e2, i2, n2, a2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/collage-utils.js
  window.OmegaCollageUtils = { getDataMedia: function(t) {
    let n = [];
    return window?.[`omega_keys_array_collage_${t}`]?.forEach((t2) => {
      const o = t2.toString(), e = window[`omega_medias_collage_${o}`];
      n.push(e);
    }), n;
  }, getVisibleItemsCount: function() {
    const t = window.innerWidth;
    return t <= 768 ? 2 : t <= 1024 ? 3 : 4;
  }, getUrlSocialAccount: function(t, n) {
    return t && n && "instagram" === n.toLowerCase() ? `https://www.instagram.com/${t}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/omega.collage.core.js
  !(function() {
    function e() {
      if (window.__omegaCollageState.isProcessing) return;
      window.__omegaCollageState.isProcessing = true;
      const e2 = document.querySelectorAll(".omega-collage-container");
      0 !== e2.length ? e2.forEach((e3) => {
        const o = e3.dataset.blockId || e3.getAttribute("data-block-id");
        if (!o) return;
        if (window.__omegaCollageState.renderedContainers.has(o)) return;
        const a = window.OmegaCollageUtils.getDataMedia(o);
        let i = "";
        0 !== a?.length && a?.[0] || !window?.Shopify?.designMode ? a?.forEach((e4, o2) => {
          let a2 = e4?.medias ?? [];
          const n = window.OmegaCollageUtils.getUrlSocialAccount(e4?.socialAccount?.username, e4?.socialAccount?.platform), t = (o3, a3) => {
            if (!o3) return "";
            let i2 = e4?.mediaProducts?.filter((e5) => e5?.media_id === o3?.media_id);
            return `<div
            class="omega-collage-item"
            onclick="window.OmegaCollageModal.openModalCollage(this)"
            data-item="${window.omegaUtils.encodeToBase64({ ...o3, listProduct: i2, socialAccount: e4?.socialAccount || "", urlSocialAccount: n })}"
            data-media-products="${window.omegaUtils.encodeToBase64(e4?.mediaProducts)}"
          >
            <div class="omega-collage-wrapper">
              ${"VIDEO" === o3.media.type ? `
                <img
                  src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.thumbnail_url, "video") : o3.media.thumbnail_url}"
                  alt="Media error or was deleted"
                  class="omega-collage-img omega-collage-thumbnail"
                  crossorigin="anonymous"
                  loading="${a3 < 3 ? "eager" : "lazy"}"
                />
                <video
                  class="omega-collage-video"
                  src="${o3.media.media_url}"
                  muted
                  loop
                  preload="${a3 < 3 ? "auto" : "metadata"}"
                  crossorigin="anonymous"
                  poster="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.thumbnail_url, "video") : o3.media.thumbnail_url}"
                  playsinline
                ></video>
                <div class="omega-collage-play-button"></div>
              ` : `
                <img
                  src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(o3.media.media_url, "image") : o3.media.media_url}"
                  alt="Media error or was deleted"
                  class="omega-collage-img"
                  crossorigin="anonymous"
                  loading="${a3 < 3 ? "eager" : "lazy"}"
                />
              `}
            </div>
          </div>`;
          }, l = a2?.sort((e5, o3) => e5.position - o3.position), d = [];
          for (let e5 = 0; e5 < l.length; e5 += 3) d.push(l.slice(e5, e5 + 3));
          const r = [];
          for (let e5 = 0; e5 < d.length; e5 += 3) r.push(d.slice(e5, e5 + 3));
          const s = r.map((e5, o3) => `<div class="omega-collage-row">${e5.map((e6, a3) => `<div class="omega-collage-column">
              ${e6[0] ? `<div class="omega-collage-big">${t(e6[0], 9 * o3 + 3 * a3)}</div>` : ""}
              <div class="omega-collage-small-grid">
                ${e6[1] ? t(e6[1], 9 * o3 + 3 * a3 + 1) : ""}
                ${e6[2] ? t(e6[2], 9 * o3 + 3 * a3 + 2) : ""}
              </div>
            </div>`).join("")}</div>`).join("");
          let m = `
          <div class="omega-collage-title">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(e4) : e4?.title || ""}
          </div>
          <div class="omega-collage-subtitle">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(e4) : e4?.subtitle || ""}
          </div>
          ${n ? `<button onclick="window.open('${n}', '_blank')" class="omega-collage-btn-follow-us-top">FOLLOW US</button>` : ""}
          <div class="omega-collage-layout">
            ${s}
          </div>
          ${n ? `<button onclick="window.open('${n}', '_blank')" class="omega-collage-btn-follow-us-bottom">FOLLOW US</button>` : ""}
        `;
          a2?.length > 0 && (i += m);
        }) : i = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', i && (e3.innerHTML = i, setTimeout(() => {
          window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeContainerMedia && (window.omegaMediaOptimizer.optimizeContainerMedia(e3), "function" == typeof window.omegaMediaOptimizer.setupEnhancedLazyLoading && window.omegaMediaOptimizer.setupEnhancedLazyLoading(e3)), (function() {
            const e4 = window.customizeSettingInstagramFeedOmega?.customizeCollage, o2 = Array.isArray(e4?.videoPlay) ? e4?.videoPlay?.[0] : e4?.videoPlay;
            document.querySelectorAll(".omega-collage-item").forEach((e5, a2) => {
              const i2 = e5.querySelector(".omega-collage-video"), n = e5.querySelector(".omega-collage-thumbnail"), t = e5.querySelector(".omega-collage-play-button");
              if (!i2 || !t) return;
              if (t.style.display = "flex", o2 && "play-on-hover" !== o2) return;
              if (a2 < 3 && (i2.preload = "auto", i2.src)) {
                const e6 = document.createElement("link");
                e6.rel = "preload", e6.as = "video", e6.href = i2.src, e6.crossOrigin = "anonymous", document.head.appendChild(e6);
              }
              let l;
              e5.addEventListener("mouseenter", function() {
                l && clearTimeout(l), l = setTimeout(() => {
                  i2.readyState >= 2 && (i2.play().catch((e6) => {
                  }), t.style.display = "none", n && (n.style.opacity = "0"));
                }, 50);
              }), e5.addEventListener("mouseleave", function() {
                l && clearTimeout(l), i2.pause(), i2.currentTime = 0, t.style.display = "flex", n && (n.style.opacity = "1");
              });
            });
          })(), window.OmegaCollageUtils && window.OmegaCollageUtils.renderCustomListCollage ? (window.OmegaCollageUtils.renderCustomListCollage(), window.__omegaCollageState.renderedContainers.add(o)) : window.__omegaCollageState.renderedContainers.add(o);
        }, 100)), window.__omegaCollageState.isProcessing = false;
      }) : window.__omegaCollageState.isProcessing = false;
    }
    window.__omegaCollageState = window.__omegaCollageState || { renderedContainers: /* @__PURE__ */ new Set(), lastMobileState: void 0, isProcessing: false }, document.addEventListener("DOMContentLoaded", function() {
      if (window.__omegaCollageInitialized) return;
      window.__omegaCollageInitialized = true, e(), setTimeout(() => {
        window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeAllPageMedia && window.omegaMediaOptimizer.optimizeAllPageMedia();
      }, 1e3), window.__omegaCollageResizeHandlerBound || (window.__omegaCollageResizeHandlerBound = true, window.addEventListener("resize", /* @__PURE__ */ (function(e2, o) {
        let a;
        return function() {
          const i = this, n = arguments;
          clearTimeout(a), a = setTimeout(() => e2.apply(i, n), o);
        };
      })(() => {
        const o = window.innerWidth <= 768, a = window.__omegaCollageState.lastMobileState;
        if (void 0 === a || a !== o) window.__omegaCollageState.lastMobileState = o, window.__omegaCollageState.renderedContainers.clear(), e();
        else {
          document.querySelectorAll(".omega-collage").forEach((e2) => {
            e2.updateNavigation && e2.updateNavigation();
          });
        }
      }, 150)));
      document.querySelectorAll(".omega-widget-empty").forEach((e2, o) => {
        e2.style.display = 0 === o ? "block" : "none";
      });
      window;
      window.OmegaCollageAnalytics?.trackMediaImpression && window.OmegaCollageAnalytics.trackMediaImpression();
    }), window.OmegaCollageCore = { handleRenderCollage: e };
  })();

  // extensions/theme-extension-instagram-feed/assets/omega.hierarchical.core.js
  !(function() {
    function i() {
      if (window.__omegaHierarchicalState.isProcessing) return;
      window.__omegaHierarchicalState.isProcessing = true;
      const i2 = document.querySelectorAll(".omega-hierarchical-container");
      0 !== i2.length ? i2.forEach((i3) => {
        const e = i3.dataset.blockId || i3.getAttribute("data-block-id");
        if (!e) return;
        if (window.__omegaHierarchicalState.renderedContainers.has(e)) return;
        const a = window.OmegaHierarchicalUtils.getDataMedia(e);
        let o = "";
        0 !== a?.length && a?.[0] || !window?.Shopify?.designMode ? a?.forEach((i4, e2) => {
          let a2 = i4?.medias ?? [];
          a2 = a2.sort((i5, e3) => (i5.position ?? 0) - (e3.position ?? 0));
          const n = window.OmegaHierarchicalUtils.getUrlSocialAccount(i4?.socialAccount?.username, i4?.socialAccount?.platform), t = (e3, a3) => {
            if (!e3) return "";
            const o2 = "VIDEO" === e3.media.type;
            return `
                <div class="media-wrapper-hierarchical"
                     onclick="window.OmegaHierarchicalModal.openModalHierarchical(this)"
                     data-item="${window.omegaUtils.encodeToBase64({ ...e3, listProduct: i4?.mediaProducts?.filter((i5) => i5?.media_id === e3?.media_id) || [], socialAccount: i4?.socialAccount || "", urlSocialAccount: n })}"
                     data-media-products="${window.omegaUtils.encodeToBase64(i4?.mediaProducts)}"
                >
                    ${o2 ? `
                <video
                  class="media-video"
                  src="${e3.media.media_url}"
                  muted
                  loop
                  playsinline
                  poster="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(e3.media.thumbnail_url, "video") : e3.media.thumbnail_url}"
                ></video>
                <div class="omega-hierarchical-play-button"></div>
              ` : `
                <img
                  src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(e3.media.media_url, "image") : e3.media.media_url}"
                  alt="${e3.media.alt_text || ""}"
                  class="media-img"
                  crossorigin="anonymous"
                  loading="lazy"
                />
              `}
                </div>
            `;
          };
          let r = `
          <div class="omega-hierarchical-header">
              <div class="omega-hierarchical-title">
                ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(i4) : i4?.title || ""}
              </div>
              <div class="omega-hierarchical-subtitle">
                ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(i4) : i4?.subtitle || ""}
              </div>
              ${n ? `<button onclick="window.open('${n}', '_blank')" class="omega-hierarchical-btn-follow-us-top">FOLLOW US</button>` : ""}
          </div>
          <div class="omega-hierarchical-layout">
            ${(() => {
            const i5 = [];
            for (let e3 = 0; e3 < a2.length; e3 += 6) {
              const o2 = a2.slice(e3, e3 + 6);
              i5.push(`<div class="omega-hierarchical-group" key="${e3}">
                  <div class="omega-hierarchical-top-row">
                    <div class="omega-hierarchical-item large-square">
                      ${t(o2[0])}
                    </div>
                    <div class="omega-hierarchical-right-col">
                      <div class="omega-hierarchical-item large-horizontal">
                        ${t(o2[1])}
                      </div>
                      <div class="omega-hierarchical-small-row">
                        <div class="omega-hierarchical-item small">
                          ${t(o2[2])}
                        </div>
                        <div class="omega-hierarchical-item small">
                          ${t(o2[3])}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="omega-hierarchical-bottom-row">
                    <div class="omega-hierarchical-item large-horizontal left">
                      ${t(o2[4])}
                    </div>
                    <div class="omega-hierarchical-item large-horizontal right">
                      ${t(o2[5])}
                    </div>
                  </div>
                </div>`);
            }
            return i5.join("");
          })()}
          </div>
          <div class="omega-hierarchical-footer">
            ${n ? `<button onclick="window.open('${n}', '_blank')" class="omega-hierarchical-btn-follow-us-bottom">FOLLOW US</button>` : ""}
          </div>
        `;
          a2?.length > 0 && (o += r);
        }) : o = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', o && (i3.innerHTML = o, setTimeout(() => {
          window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeContainerMedia && (window.omegaMediaOptimizer.optimizeContainerMedia(i3), "function" == typeof window.omegaMediaOptimizer.setupEnhancedLazyLoading && window.omegaMediaOptimizer.setupEnhancedLazyLoading(i3)), (function() {
            const i4 = document.querySelectorAll(".media-wrapper-hierarchical"), e2 = window.customizeSettingInstagramFeedOmega?.customizeHierarchical, a2 = Array.isArray(e2?.videoPlay) ? e2?.videoPlay?.[0] : e2?.videoPlay, o2 = !a2 || "play-on-hover" === a2;
            i4.forEach((i5, e3) => {
              const a3 = i5.querySelector(".media-video"), n = i5.querySelector(".omega-hierarchical-play-button");
              if (a3) {
                if (n && (n.style.display = "block"), !o2) return void (n && (n.style.display = "none"));
                let t;
                e3 < 3 && (a3.preload = "auto"), i5.addEventListener("mouseenter", () => {
                  n && (n.style.display = "none"), t && clearTimeout(t), t = setTimeout(() => {
                    a3.readyState >= 2 && a3.play().catch((i6) => {
                    });
                  }, 50);
                }), i5.addEventListener("mouseleave", () => {
                  n && (n.style.display = "block"), t && clearTimeout(t), a3.pause(), a3.currentTime = 0;
                });
              }
            });
          })(), window.OmegaHierarchicalUtils && window.OmegaHierarchicalUtils.renderCustomListHierarchical ? (window.OmegaHierarchicalUtils.renderCustomListHierarchical(), window.__omegaHierarchicalState.renderedContainers.add(e)) : window.__omegaHierarchicalState.renderedContainers.add(e);
        }, 100)), window.__omegaHierarchicalState.isProcessing = false;
      }) : window.__omegaHierarchicalState.isProcessing = false;
    }
    window.__omegaHierarchicalState = window.__omegaHierarchicalState || { renderedContainers: /* @__PURE__ */ new Set(), lastMobileState: void 0, isProcessing: false }, document.addEventListener("DOMContentLoaded", function() {
      if (window.__omegaHierarchicalInitialized) return;
      window.__omegaHierarchicalInitialized = true, i(), setTimeout(() => {
        window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeAllPageMedia && window.omegaMediaOptimizer.optimizeAllPageMedia();
      }, 1e3);
      document.querySelectorAll(".omega-widget-empty").forEach((i2, e) => {
        i2.style.display = 0 === e ? "block" : "none";
      });
      window;
      window.OmegaHierarchicalAnalytics?.trackMediaImpression && window.OmegaHierarchicalAnalytics.trackMediaImpression();
    }), window.OmegaHierarchicalCore = { handleRenderHierarchical: i };
  })();

  // extensions/theme-extension-instagram-feed/assets/hierarchical-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaHierarchicalAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: r } = t2;
      if (!e || !i || !r) return void console.warn("Missing required config for impression tracking");
      const c = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, o = await r(t4);
          o && this.trackEvent({ eventType: "impression", objectType: i }, o), c.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        c.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const r = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, r);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-hierarchical .omega-mcpl-item", "#omega-modal-hierarchical .omega-mcp-detail"].forEach((r) => {
          this.setupImpressionTracking({ selector: r, objectType: "product", getData: function(r2) {
            const c = r2.getAttribute("data-product-id"), o = c?.split("/").pop(), a = t2?.find((t3) => t3?.id === Number(o)), n = e?.find((t3) => t3?.product_id?.split("/").pop() === c);
            return { id: Number(o) || 0, title: n?.title || a?.title || "Unnamed product", media_id: n?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-hierarchical-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let r = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: r };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/hierarchical-modal.js
  !(function() {
    let e = [], a = {}, n = null, i = null, o = null, t = window.omegaHierarchicalShowBrandmark, c = [], d = 0;
    function l(o2, t2, c2 = null) {
      const d2 = document.querySelector(".omega-mc-info");
      if (d2) {
        if (a = {}, n = t2, "list_product" === o2) d2.innerHTML = `
      ${t2?.length > 0 ? `
        <div>
          <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
          </div>
          <div class="omega-mcp-list-title" >Featured products</div>
            <div class="omega-mcp-list">
            ${t2.map((e2) => `
              <div class="omega-mcpl-item"
              data-product-id='${e2?.id}'
              data-item="${window.omegaUtils.encodeToBase64(c2)}"
              onclick="window.OmegaHierarchicalModal.handleShowProductHierarchical(${e2?.id}, event)"
              >
                <div class="omega-mcpl-item-info">
                <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
                </div>
                <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
                </div>
                    <div class="omega-mcpl-item-price">
                      ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                          ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                        </span>` : ""}
                      <span class="omega-mcpl-item-price-current list-product">
                        ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                      </span>
                      </div>
                </div>
                <div
                class="omega-mcpl-item-actions"
                >
                Add to cart
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === o2) {
          let n2 = null;
          t2?.variants?.[0] && (n2 = t2.variants[0], t2.options.forEach((e2, i2) => {
            a[e2.name] = n2[`option${i2 + 1}`];
          }), i = n2), d2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${t2?.id}" data-item="${window.omegaUtils.encodeToBase64(c2)}">
        <div class="omega-mcpd-back">
         ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaHierarchicalModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
        </div>
          <div class="omega-mcpd-main">
          <div class="omega-mcpdm-list-image">
            ${t2?.images?.length > 0 ? t2?.images?.map((e2, a2) => `
            <img
              src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
              style="${a2 === t2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
            />
            `).join("") : `
            <img
              src="${window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
            />`}
          </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${t2?.title}
              </div>
              <div class="omega-mcpl-item-price">
                ${n2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(n2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(n2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(n2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(n2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${t2?.options?.length > 0 && t2?.options?.filter((e2) => "Title" !== e2?.name).map((e2, n3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((n4) => `
                    <div
                      class="omega-mcpdm-option-value ${a[e2.name] === n4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${n4}"
                    >
                      ${n4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...c2 })}"
              onclick="window.OmegaHierarchicalModal.handleBuyItNowHierarchical(${t2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...c2 })}"
              onclick="window.OmegaHierarchicalModal.handleAddToCartHierarchical(${t2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaHierarchicalModal.handleOpenProductHierarchical('${t2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaHierarchicalModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${t2?.body_html ? t2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(t2?.images)), e2.addEventListener("click", window.OmegaHierarchicalModal.handleOptionChangeHierarchical);
          }), d2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function m(e2, a2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const n2 = e2.querySelector("video");
        n2 && (n2.pause(), n2.muted = true), e2.style.display = "none", document.body.classList.remove(a2), e2.innerHTML = "";
      }), e2.addEventListener("click", (n2) => {
        if (n2.target === e2) {
          const n3 = e2.querySelector("video");
          n3 && (n3.pause(), n3.muted = true), e2.style.display = "none", document.body.classList.remove(a2), e2.innerHTML = "";
        }
      });
    }
    function s(a2, n2, i2, s2) {
      window;
      let r = [];
      r = (n2 ?? []).filter((e2) => e2?.media_id === a2?.media_id), window.omegaUtils.throttleTrack(`click-media-${a2?.media_id}`, () => {
        window.OmegaHierarchicalAnalytics.trackMediaClick(a2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", w = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', h = false;
      g && (h = false === p || !a2?.socialAccount?.username || !a2?.media?.caption || "INSTAGRAM" !== a2?.media?.source, h && (u = "aspect-ratio: 9 / 16;", w = ""));
      const v = d > 0, f = d < c.length - 1;
      i2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${v ? '\n        <button class="omega-hierarchical-prev omega-mc-nav-btn-prev" onclick="window.OmegaHierarchicalModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${f ? '\n        <button class="omega-hierarchical-next omega-mc-nav-btn-next" onclick="window.OmegaHierarchicalModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${h ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === a2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${a2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${a2.media?.media_url}">`}
            ${a2?.media?.permalink ? `
            <button
             style="${"VIDEO" !== a2?.media?.type ? "bottom: 20px;" : ""}"
             class="omega-mc-instagram omega-tooltip
              ${"VIDEO" === a2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
              ${g ? "omega-mc-empty-product" : ""}"
             aria-label="Toggle sound"
             onclick="window.omegaUtils.openPermalink('${a2?.media?.permalink || ""}')"
             >
              <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
              </svg>
            </button>
            ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n               >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${w}
      </div>
    </div>
  `, document.body.appendChild(i2), i2.style.display = "flex", document.body.classList.add(s2), t && window.omegaUtils.waitForElement("#omega-modal-hierarchical").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-hierarchical", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), m(i2, s2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const a3 = await fetch(`/products/${e2?.handle}.json`);
          if (a3.ok && 200 === a3.status) {
            const e3 = await a3.json();
            return e3?.product;
          }
          return null;
        } catch (a3) {
          return console.error(`Error fetching product ${e2?.handle}:`, a3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], a2) : l("list_product", e, a2);
      }) : window.omegaModal.generateModalInfoCaption(a2), o = a2, window.omegaUtils.setupModalSoundToggle();
    }
    window.OmegaHierarchicalModal = { openModalHierarchical: function(a2) {
      if (!a2) return;
      if (a2.classList && (a2.classList.contains("quickview") || a2.classList.contains("product__add-cart") || "SELECT-OPTION" === a2.tagName)) return;
      if (!(a2.closest ? a2.closest(".omega-hierarchical-container") : null)) return;
      const n2 = a2.getAttribute("data-item");
      if (!n2 || "" === n2.trim()) return;
      const i2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!i2.test(n2)) return;
      const r = a2.getAttribute("data-media-products");
      if (r && "" !== r.trim() && !i2.test(r)) return;
      const g = window.omegaUtils.decodeBase64(n2), p = r ? window.omegaUtils.decodeBase64(r) : null;
      if (!g || !g.media_id) return;
      const u = a2.closest(".omega-hierarchical-container").querySelectorAll("[data-item]");
      c = Array.from(u).map((e2) => window.omegaUtils.decodeBase64(e2.getAttribute("data-item"))), d = c.findIndex((e2) => e2.media_id === g.media_id);
      const w = document.getElementById("omega-modal-hierarchical"), h = "omega-mc-open";
      window;
      let v = [];
      v = (p ?? []).filter((e2) => e2?.media_id === g?.media_id), window.omegaUtils.throttleTrack(`click-media-${g?.media_id}`, () => {
        window.OmegaHierarchicalAnalytics.trackMediaClick(g, v);
      }), e = [];
      const f = Array.isArray(v) && 0 === v.length, { showPostCaption: C } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", $ = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', b = false;
      f && (b = false === C || !g?.socialAccount?.username || !g?.media?.caption || "INSTAGRAM" !== g?.media?.source, b && (y = "aspect-ratio: 9 / 16;", $ = "")), w.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
        <div class="${b ? "omega-mc-main-no-product" : "omega-mc-main"}">
            <div class="omega-mc-media-container">
              ${"VIDEO" === g?.media?.type ? `
                      <video
                        class="omega-mc-media-video"
                        src="${g.media?.media_url}"
                        autoplay
                        loop
                        ${window.omegaUtils.isAndroid() ? "muted" : ""}
                        playsinline
                      ></video>
                      <button
                        class="omega-mc-sound-toggle ${f ? "omega-mc-sound-toggle-empty-product" : ""}"
                        aria-label="Toggle sound"
                      >
                        <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                          <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                          <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                        </svg>
                      </button>
                    ` : `<img class="omega-mc-media-image" src="${g.media?.media_url}">`}
              ${g?.media?.permalink ? `
              <button
               style="${"VIDEO" !== g?.media?.type ? "bottom: 20px;" : ""}"
               class="omega-mc-instagram omega-tooltip
                ${"VIDEO" === g?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                ${f ? "omega-mc-empty-product" : ""}"
               aria-label="Toggle sound"
               onclick="window.omegaUtils.openPermalink('${g?.media?.permalink || ""}')"
               >
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
              ${!f && '<button class="omega-mc-btn-collapse-sheet"\n                onclick="window.omegaUtils.expandProductSheet()"\n                >\n                  <img\n                    src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                    alt="btn-cart"\n                    width="20px"\n                    height="100%"\n                  />\n                  View featured products\n                </button>'}
            </div>
          ${$}
        </div>
      </div>
    `, document.body.appendChild(w), w.style.display = "flex", document.body.classList.add(h), t && window.omegaUtils.waitForElement("#omega-modal-hierarchical").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-hierarchical", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), m(w, h), v?.length > 0 ? Promise.all(v?.map(async (e2) => {
        try {
          const a3 = await fetch(`/products/${e2?.handle}.json`);
          if (a3.ok && 200 === a3.status) {
            const e3 = await a3.json();
            return e3?.product;
          }
          return null;
        } catch (a3) {
          return console.error(`Error fetching product ${e2?.handle}:`, a3), null;
        }
      })).then((a3) => {
        e = a3.filter(Boolean), 1 === e?.length ? l("detail_product", e?.[0], g) : l("list_product", e, g), v?.length && window.OmegaHierarchicalAnalytics.trackProductImpression(e, v, g);
      }) : (window.omegaModal.generateModalInfoCaption(g), v?.length && window.OmegaHierarchicalAnalytics.trackProductImpression(e, v, g)), o = g, window.omegaUtils.setupModalSoundToggle(), s(g, p, w, h);
    }, generateModalInfoHTMLHierarchical: l, handleOptionChangeHierarchical: function(e2) {
      if (!n) return;
      const o2 = e2.target, t2 = o2.dataset.optionName, c2 = o2.dataset.value;
      a[t2] = c2, i = n?.variants?.find((e3) => Object.entries(a).every(([a2, i2]) => {
        const o3 = n.options.findIndex((e4) => e4.name === a2);
        if (-1 === o3) return false;
        return e3[`option${o3 + 1}`] === i2;
      }));
      const d2 = o2.closest(".omega-mcpdm-option-group");
      if (d2) {
        d2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === o2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (i) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const a2 = `
          ${i.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(i.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(i.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(i.price)} ${window.omegaUtils.getCurrencySymbol(i.price_currency)}
          </span>
        `;
          e3.innerHTML = a2;
        }
      }
      if (i && n?.images) {
        const a2 = n.images.find((e3) => e3?.id === i?.image_id), o3 = document.querySelector(".omega-mcpdm-list-image");
        if (o3) {
          const n2 = JSON.parse(e2.target.dataset.images || "[]");
          o3.innerHTML = a2?.src ? `
          <img
            src="${a2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : n2?.length > 0 ? n2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartHierarchical: function(a2, n2) {
      const o2 = window.omegaUtils.decodeBase64(n2.target.dataset.item), t2 = (window, e.find((e2) => e2?.id === a2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(i?.id, 1) && window.OmegaHierarchicalAnalytics.trackAddToCart(t2, o2);
      }
    }, handleBuyItNowHierarchical: function(a2, n2) {
      if (window.omegaUtils.decodeBase64(n2.target.dataset.item), window, e.find((e2) => e2?.id === a2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(i?.id, 1);
      }
    }, handleShowProductHierarchical: function(a2, n2) {
      const i2 = n2.currentTarget, t2 = window.omegaUtils.decodeBase64(i2?.dataset?.item);
      window, o = t2;
      let c2 = e.find((e2) => e2?.id === a2);
      if (!c2) throw new Error(`Product with ID ${a2} not found in listDetailProductsHierarchical`);
      window.omegaUtils.throttleTrack(`product-click-${c2?.id}`, () => {
        window.OmegaHierarchicalAnalytics.trackProductClick(c2, t2);
      }), l("detail_product", c2, t2);
    }, handleOpenProductHierarchical: function(e2, a2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      l("list_product", e, o), n = null, a = null, i = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), a2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", a2.textContent = "\u2212") : (e2.style.display = "none", a2.textContent = "+");
    }, goToPrevious: function() {
      if (d > 0) {
        d--;
        const e2 = c[d], a2 = document.getElementById("omega-modal-hierarchical"), n2 = "omega-mc-open", i2 = document.querySelectorAll("[data-item]"), o2 = Array.from(i2).find((a3) => window.omegaUtils.decodeBase64(a3.getAttribute("data-item")).media_id === e2.media_id), t2 = window.omegaUtils.decodeBase64(o2.getAttribute("data-media-products"));
        s(e2, t2, a2, n2);
      }
    }, goToNext: function() {
      if (d < c.length - 1) {
        d++;
        const e2 = c[d], a2 = document.getElementById("omega-modal-hierarchical"), n2 = "omega-mc-open", i2 = document.querySelectorAll("[data-item]"), o2 = Array.from(i2).find((a3) => {
          const n3 = window.omegaUtils.decodeBase64(a3.getAttribute("data-item"));
          return n3 && n3.media_id === e2.media_id;
        }), t2 = o2 ? window.omegaUtils.decodeBase64(o2.getAttribute("data-media-products")) : null;
        s(e2, t2, a2, n2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/hierarchical-utils.js
  window.OmegaHierarchicalUtils = { getDataMedia: function(t) {
    let i = [];
    return window?.[`omega_keys_array_hierarchical_${t}`]?.forEach((t2) => {
      const n = t2.toString(), a = window[`omega_medias_hierarchical_${n}`];
      i.push(a);
    }), i;
  }, getVisibleItemsCount: function() {
    const t = window.innerWidth;
    return t <= 768 ? 2 : t <= 1024 ? 3 : 4;
  }, getUrlSocialAccount: function(t, i) {
    return t && i && "instagram" === i.toLowerCase() ? `https://www.instagram.com/${t}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/stacked-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaStackedAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: o } = t2;
      if (!e || !i || !o) return void console.warn("Missing required config for impression tracking");
      const c = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, r = await o(t4);
          r && this.trackEvent({ eventType: "impression", objectType: i }, r), c.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        c.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const o = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, o);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-stacked .omega-mcpl-item", "#omega-modal-stacked .omega-mcp-detail"].forEach((o) => {
          this.setupImpressionTracking({ selector: o, objectType: "product", getData: function(o2) {
            const c = o2.getAttribute("data-product-id"), r = c?.split("/").pop(), n = t2?.find((t3) => t3?.id === Number(r)), a = e?.find((t3) => t3?.product_id?.split("/").pop() === c);
            return { id: Number(r) || 0, title: a?.title || n?.title || "Unnamed product", media_id: a?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-stacked-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let o = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: o };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/stacked-modal.js
  !(function() {
    let e = [], n = {}, a = null, t = null, o = null, i = window.omegaStackedShowBrandmark, d = [], c = 0;
    function s(o2, i2, d2 = null) {
      const c2 = document.querySelector(".omega-mc-info");
      if (c2) {
        if (n = {}, a = i2, "list_product" === o2) c2.innerHTML = `
      ${i2?.length > 0 ? `
        <div>
          <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
          </div>
          <div class="omega-mcp-list-title" >Featured products</div>
            <div class="omega-mcp-list">
            ${i2.map((e2) => `
              <div class="omega-mcpl-item"
              data-product-id='${e2?.id}'
              data-item="${window.omegaUtils.encodeToBase64(d2)}"
              onclick="window.OmegaStackedModal.handleShowProductStacked(${e2?.id}, event)"
              >
                <div class="omega-mcpl-item-info">
                <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
                </div>
                <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
                </div>
                    <div class="omega-mcpl-item-price">
                      ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                          ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                        </span>` : ""}
                      <span class="omega-mcpl-item-price-current list-product">
                        ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                      </span>
                      </div>
                </div>
                <div
                class="omega-mcpl-item-actions"
                >
                Add to cart
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === o2) {
          let a2 = null;
          i2?.variants?.[0] && (a2 = i2.variants[0], i2.options.forEach((e2, t2) => {
            n[e2.name] = a2[`option${t2 + 1}`];
          }), t = a2), c2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${i2?.id}" data-item="${window.omegaUtils.encodeToBase64(d2)}">
        <div class="omega-mcpd-back">
         ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaStackedModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
        </div>
          <div class="omega-mcpd-main">
          <div class="omega-mcpdm-list-image">
            ${i2?.images?.length > 0 ? i2?.images?.map((e2, n2) => `
            <img
              src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
              style="${n2 === i2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
            />
            `).join("") : `
            <img
              src="${window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
            />`}
          </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${i2?.title}
              </div>
              <div class="omega-mcpl-item-price">
                ${a2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(a2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(a2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(a2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(a2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${i2?.options?.length > 0 && i2?.options?.filter((e2) => "Title" !== e2?.name).map((e2, a3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((a4) => `
                    <div
                      class="omega-mcpdm-option-value ${n[e2.name] === a4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${a4}"
                    >
                      ${a4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaStackedModal.handleBuyItNowStacked(${i2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaStackedModal.handleAddToCartStacked(${i2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaStackedModal.handleOpenProductStacked('${i2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaStackedModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${i2?.body_html ? i2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          c2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(i2?.images)), e2.addEventListener("click", window.OmegaStackedModal.handleOptionChangeStacked);
          }), c2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function m(e2, n2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const a2 = e2.querySelector("video");
        a2 && (a2.pause(), a2.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
      }), e2.addEventListener("click", (a2) => {
        if (a2.target === e2) {
          const a3 = e2.querySelector("video");
          a3 && (a3.pause(), a3.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
        }
      });
    }
    function l(n2, a2, t2, l2) {
      window;
      let r = [];
      r = (a2 ?? []).filter((e2) => e2?.media_id === n2?.media_id), window.omegaUtils.throttleTrack(`click-media-${n2?.media_id}`, () => {
        window.OmegaStackedAnalytics.trackMediaClick(n2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", w = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', v = false;
      g && (v = false === p || !n2?.socialAccount?.username || !n2?.media?.caption || "INSTAGRAM" !== n2?.media?.source, v && (u = "aspect-ratio: 9 / 16;", w = ""));
      const h = c > 0, f = c < d.length - 1;
      t2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${h ? '\n        <button class="omega-stacked-prev omega-mc-nav-btn-prev" onclick="window.OmegaStackedModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${f ? '\n        <button class="omega-stacked-next omega-mc-nav-btn-next" onclick="window.OmegaStackedModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${v ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === n2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${n2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${n2.media?.media_url}">`}
            ${n2?.media?.permalink ? `
            <button
             style="${"VIDEO" !== n2?.media?.type ? "bottom: 20px;" : ""}"
             class="omega-mc-instagram omega-tooltip
              ${"VIDEO" === n2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
              ${g ? "omega-mc-empty-product" : ""}"
             aria-label="Toggle sound"
             onclick="window.omegaUtils.openPermalink('${n2?.media?.permalink || ""}')"
             >
              <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
              </svg>
            </button>
            ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n               >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${w}
      </div>
    </div>
  `, document.body.appendChild(t2), t2.style.display = "flex", document.body.classList.add(l2), i && window.omegaUtils.waitForElement("#omega-modal-stacked").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-stacked", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), m(t2, l2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((a3) => {
        e = a3.filter(Boolean), 1 === e?.length ? s("detail_product", e?.[0], n2) : s("list_product", e, n2);
      }) : window.omegaModal.generateModalInfoCaption(n2), o = n2, window.omegaUtils.setupModalSoundToggle();
    }
    window.OmegaStackedModal = { openModalStacked: function(n2) {
      if (!n2) return;
      if (n2.classList && (n2.classList.contains("quickview") || n2.classList.contains("product__add-cart") || "SELECT-OPTION" === n2.tagName)) return;
      if (!(n2.closest ? n2.closest(".omega-stacked-container") : null)) return;
      const a2 = n2.getAttribute("data-item");
      if (!a2 || "" === a2.trim()) return;
      const t2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!t2.test(a2)) return;
      const r = n2.getAttribute("data-media-products");
      if (r && "" !== r.trim() && !t2.test(r)) return;
      const g = window.omegaUtils.decodeBase64(a2), p = r ? window.omegaUtils.decodeBase64(r) : null;
      if (!g || !g.media_id) return;
      const u = n2.closest(".omega-stacked-container").querySelectorAll("[data-item]");
      d = Array.from(u).map((e2) => window.omegaUtils.decodeBase64(e2.getAttribute("data-item"))), c = d.findIndex((e2) => e2.media_id === g.media_id);
      const w = document.getElementById("omega-modal-stacked"), v = "omega-mc-open";
      window;
      let h = [];
      h = (p ?? []).filter((e2) => e2?.media_id === g?.media_id), window.omegaUtils.throttleTrack(`click-media-${g?.media_id}`, () => {
        window.OmegaStackedAnalytics.trackMediaClick(g, h);
      }), e = [];
      const f = Array.isArray(h) && 0 === h.length, { showPostCaption: C } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", k = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', $ = false;
      f && ($ = false === C || !g?.socialAccount?.username || !g?.media?.caption || "INSTAGRAM" !== g?.media?.source, $ && (y = "aspect-ratio: 9 / 16;", k = "")), w.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
        <div class="${$ ? "omega-mc-main-no-product" : "omega-mc-main"}">
            <div class="omega-mc-media-container">
              ${"VIDEO" === g?.media?.type ? `
                      <video
                        class="omega-mc-media-video"
                        src="${g.media?.media_url}"
                        autoplay
                        loop
                        ${window.omegaUtils.isAndroid() ? "muted" : ""}
                        playsinline
                      ></video>
                      <button
                        class="omega-mc-sound-toggle ${f ? "omega-mc-sound-toggle-empty-product" : ""}"
                        aria-label="Toggle sound"
                      >
                        <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                          <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                          <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                        </svg>
                      </button>
                    ` : `<img class="omega-mc-media-image" src="${g.media?.media_url}">`}
              ${g?.media?.permalink ? `
              <button
               style="${"VIDEO" !== g?.media?.type ? "bottom: 20px;" : ""}"
               class="omega-mc-instagram omega-tooltip
                ${"VIDEO" === g?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                ${f ? "omega-mc-empty-product" : ""}"
               aria-label="Toggle sound"
               onclick="window.omegaUtils.openPermalink('${g?.media?.permalink || ""}')"
               >
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
              ${!f && '<button class="omega-mc-btn-collapse-sheet"\n                onclick="window.omegaUtils.expandProductSheet()"\n                >\n                  <img\n                    src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                    alt="btn-cart"\n                    width="20px"\n                    height="100%"\n                  />\n                  View featured products\n                </button>'}
            </div>
          ${k}
        </div>
      </div>
    `, document.body.appendChild(w), w.style.display = "flex", document.body.classList.add(v), i && window.omegaUtils.waitForElement("#omega-modal-stacked").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-stacked", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), m(w, v), h?.length > 0 ? Promise.all(h?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? s("detail_product", e?.[0], g) : s("list_product", e, g), h?.length && window.OmegaStackedAnalytics.trackProductImpression(e, h, g);
      }) : (window.omegaModal.generateModalInfoCaption(g), h?.length && window.OmegaStackedAnalytics.trackProductImpression(e, h, g)), o = g, window.omegaUtils.setupModalSoundToggle(), l(g, p, w, v);
    }, generateModalInfoHTMLStacked: s, handleOptionChangeStacked: function(e2) {
      if (!a) return;
      const o2 = e2.target, i2 = o2.dataset.optionName, d2 = o2.dataset.value;
      n[i2] = d2, t = a?.variants?.find((e3) => Object.entries(n).every(([n2, t2]) => {
        const o3 = a.options.findIndex((e4) => e4.name === n2);
        if (-1 === o3) return false;
        return e3[`option${o3 + 1}`] === t2;
      }));
      const c2 = o2.closest(".omega-mcpdm-option-group");
      if (c2) {
        c2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === o2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (t) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const n2 = `
          ${t.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(t.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(t.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(t.price)} ${window.omegaUtils.getCurrencySymbol(t.price_currency)}
          </span>
        `;
          e3.innerHTML = n2;
        }
      }
      if (t && a?.images) {
        const n2 = a.images.find((e3) => e3?.id === t?.image_id), o3 = document.querySelector(".omega-mcpdm-list-image");
        if (o3) {
          const a2 = JSON.parse(e2.target.dataset.images || "[]");
          o3.innerHTML = n2?.src ? `
          <img
            src="${n2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : a2?.length > 0 ? a2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartStacked: function(n2, a2) {
      const o2 = window.omegaUtils.decodeBase64(a2.target.dataset.item), i2 = (window, e.find((e2) => e2?.id === n2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(t?.id, 1) && window.OmegaStackedAnalytics.trackAddToCart(i2, o2);
      }
    }, handleBuyItNowStacked: function(n2, a2) {
      if (window.omegaUtils.decodeBase64(a2.target.dataset.item), window, e.find((e2) => e2?.id === n2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(t?.id, 1);
      }
    }, handleShowProductStacked: function(n2, a2) {
      const t2 = a2.currentTarget, i2 = window.omegaUtils.decodeBase64(t2?.dataset?.item);
      window, o = i2;
      let d2 = e.find((e2) => e2?.id === n2);
      if (!d2) throw new Error(`Product with ID ${n2} not found in listDetailProductsStacked`);
      window.omegaUtils.throttleTrack(`product-click-${d2?.id}`, () => {
        window.OmegaStackedAnalytics.trackProductClick(d2, i2);
      }), s("detail_product", d2, i2);
    }, handleOpenProductStacked: function(e2, n2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      s("list_product", e, o), a = null, n = null, t = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), n2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", n2.textContent = "\u2212") : (e2.style.display = "none", n2.textContent = "+");
    }, goToPrevious: function() {
      if (c > 0) {
        c--;
        const e2 = d[c], n2 = document.getElementById("omega-modal-stacked"), a2 = "omega-mc-open", t2 = document.querySelectorAll("[data-item]"), o2 = Array.from(t2).find((n3) => window.omegaUtils.decodeBase64(n3.getAttribute("data-item")).media_id === e2.media_id), i2 = window.omegaUtils.decodeBase64(o2.getAttribute("data-media-products"));
        l(e2, i2, n2, a2);
      }
    }, goToNext: function() {
      if (c < d.length - 1) {
        c++;
        const e2 = d[c], n2 = document.getElementById("omega-modal-stacked"), a2 = "omega-mc-open", t2 = document.querySelectorAll("[data-item]"), o2 = Array.from(t2).find((n3) => {
          const a3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return a3 && a3.media_id === e2.media_id;
        }), i2 = o2 ? window.omegaUtils.decodeBase64(o2.getAttribute("data-media-products")) : null;
        l(e2, i2, n2, a2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/stacked-utils.js
  window.OmegaStackedUtils = { getDataMedia: function(t) {
    let n = [];
    return window?.[`omega_keys_array_stacked_${t}`]?.forEach((t2) => {
      const e = t2.toString(), a = window[`omega_medias_stacked_${e}`];
      n.push(a);
    }), n;
  }, getVisibleItemsCount: function() {
    const t = window.innerWidth;
    return t <= 768 ? 2 : t <= 1024 ? 3 : 4;
  }, getUrlSocialAccount: function(t, n) {
    return t && n && "instagram" === n.toLowerCase() ? `https://www.instagram.com/${t}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/omega.stacked.core.js
  !(function() {
    function e() {
      if (window.__omegaStackedState.isProcessing) return;
      window.__omegaStackedState.isProcessing = true;
      const e2 = document.querySelectorAll(".omega-stacked-container");
      0 !== e2.length ? (e2.forEach((e3) => {
        const o = e3.dataset.blockId || e3.getAttribute("data-block-id");
        if (!o) return;
        if (window.__omegaStackedState.renderedContainers.has(o)) return;
        const n = window.OmegaStackedUtils.getDataMedia(o);
        let i = "";
        0 !== n?.length && n?.[0] || !window?.Shopify?.designMode ? n?.forEach((e4, t2) => {
          let n2 = e4?.medias ?? [];
          n2 = n2.sort((e5, a2) => (e5.position ?? 0) - (a2.position ?? 0));
          const d = window.OmegaStackedUtils.getUrlSocialAccount(e4?.socialAccount?.username, e4?.socialAccount?.platform), r = `${o}-${t2}`;
          window.__omegaStackedState.carouselStates[r] || (window.__omegaStackedState.carouselStates[r] = { currentIndex: 0, listMedia: n2, dataMedia: e4, urlSocialAccount: d });
          let s = `
          <div class="omega-stacked-title">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(e4) : e4?.title || ""}
          </div>
          <div class="omega-stacked-subtitle">
            ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(e4) : e4?.subtitle || ""}
          </div>
          ${d ? `<button onclick="window.open('${d}', '_blank')" class="omega-stacked-btn-follow-us-top">FOLLOW US</button>` : ""}
          <div class="omega-stacked-carousel-wrapper">
            <div class="omega-stacked-carousel-container">
              <div class="omega-stacked-carousel-viewport" data-carousel-id="${r}">
                ${(function(e5) {
            const t3 = window.__omegaStackedState.carouselStates[e5];
            if (!t3) return "";
            const { currentIndex: o2, listMedia: n3, dataMedia: i2, urlSocialAccount: d2 } = t3, r2 = n3.length, s2 = r2 >= 5 ? 5 : r2, c = Math.floor(s2 / 2);
            let l = "";
            for (let e6 = 0; e6 < s2; e6++) {
              const t4 = (o2 - c + e6 + r2) % r2, s3 = -c + e6, m = n3[t4], u = "VIDEO" === m.media.type;
              let g = i2?.mediaProducts?.filter((e7) => e7?.media_id === m?.media_id);
              const w = a(s3), p = `transform: ${w.transform}; z-index: ${w.zIndex}; opacity: ${w.opacity};`;
              let k;
              k = u ? `
          <img
            src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(m.media.thumbnail_url, "video") : m.media.thumbnail_url}"
            alt="Media thumbnail"
            class="omega-stacked-media omega-stacked-thumbnail"
            crossorigin="anonymous"
            loading="lazy"
          />
          <video
            class="omega-stacked-media omega-stacked-video"
            src="${m.media.media_url}"
            muted
            loop
            playsInline
            crossorigin="anonymous"
            poster="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(m.media.thumbnail_url, "video") : m.media.thumbnail_url}"
          ></video>
          <div class="omega-media-carousel-play-button-default"></div>
        ` : `
          <img
            src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(m.media.media_url, "image") : m.media.media_url}"
            alt="Media error or was deleted"
            class="omega-stacked-media omega-stacked-image"
            crossorigin="anonymous"
            loading="lazy"
          />
        `, l += `
        <div
          class="omega-stacked-card"
          style="${p}"
          data-offset="${s3}"
          data-media-index="${t4}"
          onclick="window.OmegaStackedModal?.openModalStacked && window.OmegaStackedModal.openModalStacked(this)"
          data-item="${window.omegaUtils.encodeToBase64({ ...m, listProduct: g, socialAccount: i2?.socialAccount || "", urlSocialAccount: d2 })}"
          data-media-products="${window.omegaUtils.encodeToBase64(i2?.mediaProducts)}"
        >
          <div class="omega-stacked-card-inner">
            ${k}
          </div>
        </div>
      `;
            }
            return l;
          })(r)}
              </div>
              ${n2.length > 1 ? `
                    <div class="omega-stacked-carousel-controls">
                      <button class="omega-stacked-control-button omega-stacked-prev-carousel" data-carousel-id="${r}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                      </button>
                      <button class="omega-stacked-control-button omega-stacked-next-carousel" data-carousel-id="${r}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                      </button>
                    </div>` : ""}
            </div>
          </div>
          ${d ? `<button onclick="window.open('${d}', '_blank')" class="omega-stacked-btn-follow-us-bottom">FOLLOW US</button>` : ""}
        `;
          n2?.length > 0 && (i += s);
        }) : i = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', i && (e3.innerHTML = i, setTimeout(() => {
          var a2;
          window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeContainerMedia && (window.omegaMediaOptimizer.optimizeContainerMedia(e3), "function" == typeof window.omegaMediaOptimizer.setupEnhancedLazyLoading && window.omegaMediaOptimizer.setupEnhancedLazyLoading(e3)), document.querySelectorAll(".omega-stacked-card").forEach((e4, a3) => {
            const t2 = e4.querySelector(".omega-stacked-media[src*='mp4'], .omega-stacked-media[src*='video']"), o2 = e4.querySelector(".omega-media-carousel-play-button-default");
            if (t2 && o2) {
              let a4;
              e4.addEventListener("mouseenter", () => {
                a4 && clearTimeout(a4), a4 = setTimeout(() => {
                  t2.readyState >= 2 && (t2.play().catch((e5) => {
                  }), o2 && (o2.style.display = "none"));
                }, 50);
              }), e4.addEventListener("mouseleave", () => {
                a4 && clearTimeout(a4), t2.pause(), t2.currentTime = 0, o2 && (o2.style.display = "flex");
              });
            }
          }), window.OmegaStackedUtils && window.OmegaStackedUtils.renderCustomListStacked ? (window.OmegaStackedUtils.renderCustomListStacked(), window.__omegaStackedState.renderedContainers.add(o)) : window.__omegaStackedState.renderedContainers.add(o), (a2 = e3).querySelectorAll(".omega-stacked-carousel-viewport").forEach((e4) => {
            const o2 = e4.dataset.carouselId, n2 = a2.querySelector(`.omega-stacked-prev-carousel[data-carousel-id="${o2}"]`), i2 = a2.querySelector(`.omega-stacked-next-carousel[data-carousel-id="${o2}"]`);
            if (!n2 || !i2) return;
            n2._omegaNavHandler && n2.removeEventListener("click", n2._omegaNavHandler), i2._omegaNavHandler && i2.removeEventListener("click", i2._omegaNavHandler), e4._omegaCardClickHandler && e4.removeEventListener("click", e4._omegaCardClickHandler, true);
            const d = (a3) => {
              a3.preventDefault(), a3.stopPropagation(), t(e4, o2, -1);
            }, r = (a3) => {
              a3.preventDefault(), a3.stopPropagation(), t(e4, o2, 1);
            };
            n2._omegaNavHandler = d, i2._omegaNavHandler = r, n2.addEventListener("click", d), i2.addEventListener("click", r);
            const s = (a3) => {
              const n3 = a3.target.closest(".omega-stacked-card");
              if (!n3) return;
              const i3 = parseInt(n3.dataset.offset);
              if (isNaN(i3) || 0 === i3) return;
              a3.preventDefault(), a3.stopPropagation();
              const d2 = Math.abs(i3), r2 = i3 > 0 ? 1 : -1;
              for (let a4 = 0; a4 < d2; a4++) t(e4, o2, r2);
            };
            e4._omegaCardClickHandler = s, e4.addEventListener("click", s, true);
          });
        }, 100)), window.__omegaStackedState.isProcessing = false;
      }), (function() {
        const e3 = window.customizeSettingInstagramFeedOmega?.customizeStacked, a2 = Array.isArray(e3?.videoPlay) ? e3?.videoPlay?.[0] : e3?.videoPlay;
        if (a2 && "play-on-hover" !== a2) return;
        document.querySelectorAll(".omega-stacked-card").forEach((e4) => {
          const a3 = e4.querySelector(".omega-stacked-media[src*='mp4'], .omega-stacked-media[src*='video']"), t2 = e4.querySelector(".omega-media-carousel-play-button-default");
          a3 && (t2 && (t2.style.display = "flex"), e4.addEventListener("mouseenter", function() {
            a3.play().catch((e5) => {
            }), t2 && (t2.style.display = "none");
            const o = e4.querySelector(".omega-stacked-thumbnail");
            o && (o.style.display = "none");
          }), e4.addEventListener("mouseleave", function() {
            a3.pause(), a3.currentTime = 0, t2 && (t2.style.display = "flex");
            const o = e4.querySelector(".omega-stacked-thumbnail");
            o && (o.style.display = "block");
          }));
        });
      })()) : window.__omegaStackedState.isProcessing = false;
    }
    function a(e2) {
      const a2 = window.innerWidth <= 768, t2 = Math.abs(e2);
      if (0 === e2) return { transform: "translateX(-50%) translateY(-50%) scale(1) rotateY(0deg)", zIndex: 50, opacity: 1 };
      const o = e2 > 0 ? 1 : -1;
      let n, i, d, r, s;
      a2 ? (n = 90 * o, i = 0.8, d = 0.9, r = 12 * o, s = 10) : 1 === t2 ? (n = 120 * o, i = 0.8, d = 1, r = 10 * o, s = 10) : (n = 220 * o, i = 0.7, d = 0.9, r = 18 * o, s = 15);
      return { transform: `translateX(calc(-50% + ${n}px)) translateY(calc(-50% + ${s}px)) scale(${i}) rotateY(${r}deg)`, zIndex: 50 - 10 * t2, opacity: d };
    }
    function t(e2, t2, o) {
      const n = window.__omegaStackedState.carouselStates[t2];
      if (!n) return;
      const { listMedia: i, dataMedia: d, urlSocialAccount: r } = n, s = i.length;
      n.currentIndex = 1 === o ? (n.currentIndex + 1) % s : (n.currentIndex - 1 + s) % s;
      const { currentIndex: c } = n, l = window.innerWidth <= 768;
      let m;
      m = l ? s >= 3 ? 3 : s : s >= 5 ? 5 : s;
      const u = Math.floor(m / 2);
      Array.from(e2.querySelectorAll(".omega-stacked-card")).forEach((e3) => {
        let t3 = parseInt(e3.dataset.offset) - o;
        const n2 = m % 2 == 0 ? u - 1 : u, l2 = -u;
        t3 < l2 ? t3 = n2 : t3 > n2 && (t3 = l2);
        const g = (c + t3 + s) % s, w = i[g];
        !(function(e4, a2) {
          e4.style.transform = a2.transform, e4.style.zIndex = a2.zIndex, e4.style.opacity = a2.opacity;
        })(e3, a(t3)), (function(e4, a2) {
          const t4 = e4.querySelector(".omega-stacked-card-inner");
          if (!t4) return;
          const o2 = "VIDEO" === a2.media.type, n3 = t4.querySelector(".omega-stacked-video"), i2 = t4.querySelector(".omega-stacked-image"), d2 = t4.querySelector(".omega-stacked-thumbnail"), r2 = !!n3, s2 = a2.media.media_url, c2 = o2 ? a2.media.thumbnail_url : null, l3 = window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(s2, o2 ? "video" : "image") : s2, m2 = o2 && window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(c2, "video") : c2;
          if (o2 === r2) if (o2) {
            n3.src = l3, n3.poster = m2, d2 && (d2.src = m2), n3.pause(), n3.currentTime = 0, n3.load();
            const e5 = t4.querySelector(".omega-media-carousel-play-button-default");
            e5 && (e5.style.display = "flex");
          } else i2 && (i2.src = l3);
          else {
            let e5;
            e5 = o2 ? `
          <img
            src="${m2}"
            alt="Media thumbnail"
            class="omega-stacked-media omega-stacked-thumbnail"
            crossorigin="anonymous"
            loading="lazy"
          />
          <video
            class="omega-stacked-media omega-stacked-video"
            src="${l3}"
            muted
            loop
            playsInline
            crossorigin="anonymous"
            poster="${m2}"
          ></video>
          <div class="omega-media-carousel-play-button-default"></div>
        ` : `
          <img
            src="${l3}"
            alt="Media error or was deleted"
            class="omega-stacked-media omega-stacked-image"
            crossorigin="anonymous"
            loading="lazy"
          />
        `, t4.innerHTML = e5;
          }
          o2 && (function(e5) {
            const a3 = e5.querySelector(".omega-stacked-video"), t5 = e5.querySelector(".omega-media-carousel-play-button-default");
            if (!a3 || !t5) return;
            const o3 = e5._omegaVideoEnterHandler, n4 = e5._omegaVideoLeaveHandler;
            o3 && e5.removeEventListener("mouseenter", o3), n4 && e5.removeEventListener("mouseleave", n4);
            const i3 = () => {
              a3.readyState >= 2 && (a3.play().catch((e6) => {
              }), t5.style.display = "none");
            }, d3 = () => {
              a3.pause(), a3.currentTime = 0, t5.style.display = "flex";
            };
            e5._omegaVideoEnterHandler = i3, e5._omegaVideoLeaveHandler = d3, e5.addEventListener("mouseenter", i3), e5.addEventListener("mouseleave", d3);
          })(e4);
        })(e3, w), e3.dataset.offset = t3, e3.dataset.mediaIndex = g;
        let p = d?.mediaProducts?.filter((e4) => e4?.media_id === w?.media_id);
        e3.dataset.item = window.omegaUtils.encodeToBase64({ ...w, listProduct: p, socialAccount: d?.socialAccount || "", urlSocialAccount: r });
      });
    }
    window.__omegaStackedState = window.__omegaStackedState || { renderedContainers: /* @__PURE__ */ new Set(), lastMobileState: void 0, isProcessing: false, carouselStates: {} }, document.addEventListener("DOMContentLoaded", function() {
      if (window.__omegaStackedInitialized) return;
      window.__omegaStackedInitialized = true, e(), setTimeout(() => {
        window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeAllPageMedia && window.omegaMediaOptimizer.optimizeAllPageMedia();
      }, 1e3), window.__omegaStackedResizeHandlerBound || (window.__omegaStackedResizeHandlerBound = true, window.addEventListener("resize", /* @__PURE__ */ (function(e2, a2) {
        let t2;
        return function() {
          const o = this, n = arguments;
          clearTimeout(t2), t2 = setTimeout(() => e2.apply(o, n), a2);
        };
      })(() => {
        const a2 = window.innerWidth <= 768, t2 = window.__omegaStackedState.lastMobileState;
        void 0 !== t2 && t2 === a2 || (window.__omegaStackedState.lastMobileState = a2, window.__omegaStackedState.renderedContainers.clear(), e());
      }, 150)));
      document.querySelectorAll(".omega-widget-empty").forEach((e2, a2) => {
        e2.style.display = 0 === a2 ? "block" : "none";
      });
      window;
      window.OmegaStackedAnalytics?.trackMediaImpression && window.OmegaStackedAnalytics.trackMediaImpression();
    }), window.OmegaStackedCore = { handleRenderStacked: e };
  })();

  // extensions/theme-extension-instagram-feed/assets/highlight-analytics.js
  !(function() {
    async function t(t2) {
      if (!Array.isArray(t2) || 0 === t2.length) return [];
      const e = [];
      for (const i of t2) try {
        const t3 = await fetch(`/products/${i?.handle}.json`);
        t3.ok && 200 === t3.status && e.push(i?.product_id);
      } catch (t3) {
      }
      return e;
    }
    window.OmegaHighlightAnalytics = { trackEvent: function(t2, e) {
      try {
        window.trackEvent && window.trackEvent(t2, e);
      } catch (t3) {
        console.error("Error tracking event:", t3);
      }
    }, setupImpressionTracking: function(t2) {
      const { selector: e, objectType: i, getData: o } = t2;
      if (!e || !i || !o) return void console.warn("Missing required config for impression tracking");
      const r = new IntersectionObserver(async (t3) => {
        for (const e2 of t3) if (e2.isIntersecting) {
          const t4 = e2.target, c = await o(t4);
          c && this.trackEvent({ eventType: "impression", objectType: i }, c), r.unobserve(t4);
        }
      }, { threshold: 0.1, rootMargin: "50px" });
      document.querySelectorAll(e).forEach((t3) => {
        r.observe(t3);
      });
    }, trackAddToCart: function(t2, e) {
      this.trackEvent({ eventType: "add_to_cart", objectType: "product" }, { ...t2, ...e });
    }, trackProductClick: function(t2, e) {
      this.trackEvent({ eventType: "click", objectType: "product" }, { ...t2, ...e });
    }, trackMediaClick: async function(e, i) {
      const o = { ...e, product_ids: await t(i) };
      this.trackEvent({ eventType: "click", objectType: "media" }, o);
    }, trackProductImpression: function(t2, e, i) {
      setTimeout(() => {
        ["#omega-modal-highlight .omega-mcpl-item", "#omega-modal-highlight .omega-mcp-detail"].forEach((o) => {
          this.setupImpressionTracking({ selector: o, objectType: "product", getData: function(o2) {
            const r = o2.getAttribute("data-product-id"), c = r?.split("/").pop(), n = t2?.find((t3) => t3?.id === Number(c)), a = e?.find((t3) => t3?.product_id?.split("/").pop() === r);
            return { id: Number(c) || 0, title: a?.title || n?.title || "Unnamed product", media_id: a?.media_id, image: i?.image?.src, widget_id: i?.widget_id, shop_url: i?.media?.shop };
          } });
        });
      }, 100);
    }, trackMediaImpression: function() {
      this.setupImpressionTracking({ selector: ".omega-highlight-item", objectType: "media", getData: async (e) => {
        const i = e?.dataset?.item;
        if (!i) return null;
        try {
          const e2 = window.omegaUtils.decodeBase64(i);
          let o = await t(e2?.listProduct ?? []);
          return { id: e2.media.id, title: e2.media.title, media_url: e2.media.media_url, media_id: e2.media.id, widget_id: e2.widget_id, shop_url: e2.media.shop, type: e2.media.type, product_ids: o };
        } catch (t2) {
          return console.warn("Failed to decode data-item:", t2), null;
        }
      } });
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/highlight-modal.js
  !(function() {
    let e = [], n = {}, i = null, t = null, a = null, o = window.omegaHighlightShowBrandmark, d = [], l = 0;
    function m(a2, o2, d2 = null) {
      const l2 = document.querySelector(".omega-mc-info");
      if (l2) {
        if (n = {}, i = o2, "list_product" === a2) l2.innerHTML = `
      ${o2?.length > 0 ? `
        <div>
          <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
          </div>
          <div class="omega-mcp-list-title">Featured products</div>
            <div class="omega-mcp-list">
            ${o2.map((e2) => `
              <div class="omega-mcpl-item"
              data-product-id='${e2?.id}'
              data-item="${window.omegaUtils.encodeToBase64(d2)}"
              onclick="window.OmegaHighlightModal.handleShowProductHighlight(${e2?.id}, event)"
              >
                <div class="omega-mcpl-item-info">
                <div class="omega-mcpl-item-image">
                <img src="${e2?.image?.src ?? window.omegaUtils.defaultImageUrl}" />
                </div>
                <div class="omega-tooltip">
                ${e2?.title?.trim()?.length >= 37 ? `<span class="omega-tooltip-text list-product"
                style="top: unset !important;
                width: 200px !important;
                bottom: 45px !important;
                font-size: 11px !important;
                ">${e2?.title}</span>` : ""}
                    <div class="omega-mcpl-item-title-wrapper-mobile">
                      <div class="omega-mcpl-item-title">
                        ${e2?.title}
                      </div>
                      <div class="omega-mcpl-item-btn-cart">
                        <svg viewBox="0 0 40 40" focusable="false" aria-hidden="true" width="40px" height="100%">
                          <path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"></path>
                          <path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                          <path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path>
                        </svg>
                      </div>
                    </div>
                </div>
                    <div class="omega-mcpl-item-price">
                      ${e2?.variants?.[0]?.compare_at_price ? `<span class="omega-mcpl-item-price-compare list-product">
                          ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.compare_at_price_currency)}
                        </span>` : ""}
                      <span class="omega-mcpl-item-price-current list-product">
                        ${window.omegaUtils.formatNumberWithCommas(e2?.variants?.[0]?.price)} ${window.omegaUtils.getCurrencySymbol(e2?.variants?.[0]?.price_currency)}
                      </span>
                      </div>
                </div>
                <div
                class="omega-mcpl-item-actions"
                >
                Add to cart
                </div>
              </div>
            `).join("")}
          </div>
        </div>
        ` : '<div class="omega-modal-info-empty-product">\n          No products tagged yet\n        </div>'}
      `, window.omegaUtils.handleCheckOverflowWidthPricing(), setTimeout(() => {
          window.omegaUtils.renderCustomizeProductPopupDetail();
        }, 0);
        else if ("detail_product" === a2) {
          let i2 = null;
          o2?.variants?.[0] && (i2 = o2.variants[0], o2.options.forEach((e2, t2) => {
            n[e2.name] = i2[`option${t2 + 1}`];
          }), t = i2), l2.innerHTML = `
        <div class="omega-drag-indicator-wrapper">
            <div class="omega-drag-indicator"></div>
        </div>
        <div class="omega-mcp-detail" data-product-id="${o2?.id}" data-item="${window.omegaUtils.encodeToBase64(d2)}">
        <div class="omega-mcpd-back">
         ${e?.length > 1 ? '\n            <img\n              src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram_feed_arrow_back.png?v=1752140378"\n              alt="back"\n              class="omega-mcpd-back-image"\n              onclick="window.OmegaHighlightModal.handleBack()"\n            />\n            ' : ""}
            <div class="omega-mcpd-back-title">Product detail</div>
        </div>
          <div class="omega-mcpd-main">
          <div class="omega-mcpdm-list-image">
            ${o2?.images?.length > 0 ? o2?.images?.map((e2, n2) => `
            <img
              src="${e2?.src ?? window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
              style="${n2 === o2?.images?.length - 1 ? "margin-right: 10px !important;" : ""}"
            />
            `).join("") : `
            <img
              src="${window.omegaUtils.defaultImageUrl}"
              alt="No image"
              class="omega-mcpdm-image"
            />`}
          </div>
            <div class="omega-mcpdm-info">
              <div class="omega-mcpdm-title">
                ${o2?.title}
              </div>
              <div class="omega-mcpl-item-price">
                ${i2?.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
                    ${window.omegaUtils.formatNumberWithCommas(i2.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(i2.price_currency)}
                  </span>` : ""}
                <span class="omega-mcpl-item-price-current">
                  ${window.omegaUtils.formatNumberWithCommas(i2?.price || 0)} ${window.omegaUtils.getCurrencySymbol(i2?.price_currency || "")}
                </span>
              </div>
            </div>
          </div>
          <div class="omega-mcpdm-variant">
            ${o2?.options?.length > 0 && o2?.options?.filter((e2) => "Title" !== e2?.name).map((e2, i3) => `
              <div class="omega-mcpdm-option-group">
                <div class="omega-mcpdm-option-label">${e2.name}</div>
                <div class="omega-mcpdm-option-values">
                  ${e2.values.map((i4) => `
                    <div
                      class="omega-mcpdm-option-value ${n[e2.name] === i4 ? "selected" : ""}"
                      data-option-name="${e2.name}"
                      data-value="${i4}"
                    >
                      ${i4}
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="omega-mcpd-action">
            <button
              class="omega-mcpd-bin"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaHighlightModal.handleBuyItNowHighlight(${o2?.id}, event)"
            >
              Buy now
            </button>
            <button
              class="omega-mcpd-atc"
              data-item="${window.omegaUtils.encodeToBase64({ ...d2 })}"
              onclick="window.OmegaHighlightModal.handleAddToCartHighlight(${o2?.id}, event)"
            >
              Add to cart
            </button>
            <button class="omega-mcpd-info omega-tooltip" onclick="window.OmegaHighlightModal.handleOpenProductHighlight('${o2?.handle}', event)">
              <span class="omega-tooltip-text omega-tooltip-text-75" style="min-width: 140px !important;">View product details</span>
              <img style="width: 18px;" src="https://cdn.shopify.com/s/files/1/0742/5553/2320/files/info-circle-svgrepo-com.svg?v=1749112332" alt="info" />
            </button>
          </div>
          <div class="omega-mcpd-divider">
          </div>
          <div class="omega-mcpd-description-collapse">
            <div class="omega-mcpd-collapse-header" onclick="window.OmegaHighlightModal.toggleDescription()">
              <span>Description</span>
              <span class="omega-mcpd-collapse-icon" id="omega-mcpd-collapse-icon">-</span>
            </div>
            <div class="omega-mcpd-collapse-content" id="omega-mcpd-collapse-content">
              ${o2?.body_html ? o2.body_html : "No description."}
            </div>
          </div>
        </div>
      `;
          l2.querySelectorAll(".omega-mcpdm-option-value").forEach((e2) => {
            e2.setAttribute("data-images", JSON.stringify(o2?.images)), e2.addEventListener("click", window.OmegaHighlightModal.handleOptionChangeHighlight);
          }), l2.scrollTo({ top: 0, behavior: "smooth" }), window.omegaUtils.handleAddScrollImagesDetailProduct(), setTimeout(() => {
            window.omegaUtils.renderCustomizeProductPopupDetail();
          }, 0);
        }
        window.omegaUtils.setupDragForModalInfo();
      }
    }
    function s(e2, n2) {
      e2.querySelector("#omega-mc-close").addEventListener("click", () => {
        const i2 = e2.querySelector("video");
        i2 && (i2.pause(), i2.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
      }), e2.addEventListener("click", (i2) => {
        if (i2.target === e2) {
          const i3 = e2.querySelector("video");
          i3 && (i3.pause(), i3.muted = true), e2.style.display = "none", document.body.classList.remove(n2), e2.innerHTML = "";
        }
      });
    }
    function c(n2, i2, t2, c2) {
      window;
      let r = [];
      r = (i2 ?? []).filter((e2) => e2?.media_id === n2?.media_id), window.omegaUtils.throttleTrack(`click-media-${n2?.media_id}`, () => {
        window.OmegaHighlightAnalytics.trackMediaClick(n2, r);
      }), e = [];
      const g = Array.isArray(r) && 0 === r.length, { showPostCaption: p } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let u = "", h = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', w = false;
      g && (w = false === p || !n2?.socialAccount?.username || !n2?.media?.caption || "INSTAGRAM" !== n2?.media?.source, w && (u = "aspect-ratio: 9 / 16;", h = ""));
      const v = l > 0, f = l < d.length - 1;
      t2.innerHTML = `
    <div class="omega-mc-content" style="${u}">
      <span class="omega-mc-close" id="omega-mc-close">&times;</span>

      ${v ? '\n        <button class="omega-highlight-prev omega-mc-nav-btn-prev" onclick="window.OmegaHighlightModal.goToPrevious()">\n        </button>\n      ' : ""}

      ${f ? '\n        <button class="omega-highlight-next omega-mc-nav-btn-next" onclick="window.OmegaHighlightModal.goToNext()">\n        </button>\n      ' : ""}

      <div class="${w ? "omega-mc-main-no-product" : "omega-mc-main"}">
          <div class="omega-mc-media-container">
            ${"VIDEO" === n2?.media?.type ? `
                    <video
                      class="omega-mc-media-video"
                      src="${n2.media?.media_url}"
                      autoplay
                      loop
                      ${window.omegaUtils.isAndroid() ? "muted" : ""}
                      playsinline
                    ></video>
                    <button
                      class="omega-mc-sound-toggle ${g ? "omega-mc-sound-toggle-empty-product" : ""}"
                      aria-label="Toggle sound"
                    >
                      <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                        <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                        <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                      </svg>
                    </button>
                  ` : `<img class="omega-mc-media-image" src="${n2.media?.media_url}">`}
            ${n2?.media?.permalink ? `
            <button
             style="${"VIDEO" !== n2?.media?.type ? "bottom: 20px;" : ""}"
             class="omega-mc-instagram omega-tooltip
              ${"VIDEO" === n2?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
              ${g ? "omega-mc-empty-product" : ""}"
             aria-label="Toggle sound"
             onclick="window.omegaUtils.openPermalink('${n2?.media?.permalink || ""}')"
             >
              <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
              </svg>
            </button>
            ` : ""}
            ${!g && '<button class="omega-mc-btn-collapse-sheet"\n              onclick="window.omegaUtils.expandProductSheet()"\n               >\n                <img\n                  src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                  alt="btn-cart"\n                  width="20px"\n                  height="100%"\n                />\n                View featured products\n              </button>'}
          </div>
        ${h}
      </div>
    </div>
  `, document.body.appendChild(t2), t2.style.display = "flex", document.body.classList.add(c2), o && window.omegaUtils.waitForElement("#omega-modal-highlight").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-highlight", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), s(t2, c2), r?.length > 0 ? Promise.all(r?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((i3) => {
        e = i3.filter(Boolean), 1 === e?.length ? m("detail_product", e?.[0], n2) : m("list_product", e, n2);
      }) : window.omegaModal.generateModalInfoCaption(n2), a = n2, window.omegaUtils.setupModalSoundToggle();
    }
    window.OmegaHighlightModal = { openModalHighlight: function(n2) {
      if (!n2) return;
      if (n2.classList && (n2.classList.contains("quickview") || n2.classList.contains("product__add-cart") || "SELECT-OPTION" === n2.tagName)) return;
      if (!(n2.closest ? n2.closest(".omega-highlight-container") : null)) return;
      const i2 = n2.getAttribute("data-item");
      if (!i2 || "" === i2.trim()) return;
      const t2 = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!t2.test(i2)) return;
      const r = window.omegaUtils.decodeBase64(i2);
      if (!r || !r.media_id) return;
      const g = n2.getAttribute("data-media-products"), p = g && t2.test(g) ? window.omegaUtils.decodeBase64(g) : [], u = n2.closest(".omega-highlight-container").querySelectorAll("[data-item]");
      d = Array.from(u).map((e2) => window.omegaUtils.decodeBase64(e2.getAttribute("data-item"))), l = d.findIndex((e2) => e2.media_id === r.media_id);
      const h = document.getElementById("omega-modal-highlight"), w = "omega-mc-open";
      window;
      let v = [];
      v = (p ?? []).filter((e2) => e2?.media_id === r?.media_id), window.omegaUtils.throttleTrack(`click-media-${r?.media_id}`, () => {
        window.OmegaHighlightAnalytics.trackMediaClick(r, v);
      }), e = [];
      const f = Array.isArray(v) && 0 === v.length, { showPostCaption: C } = window?.customizeSettingInstagramFeedOmega?.customizeProductPopupDetail || {};
      let y = "", $ = '<div class="omega-mc-info"><div class="omega-mc-loading"></div></div>', b = false;
      f && (b = false === C || !r?.socialAccount?.username || !r?.media?.caption || "INSTAGRAM" !== r?.media?.source, b && (y = "aspect-ratio: 9 / 16;", $ = "")), h.innerHTML = `
      <div class="omega-mc-content" style="${y}">
        <span class="omega-mc-close" id="omega-mc-close">&times;</span>
        <div class="${b ? "omega-mc-main-no-product" : "omega-mc-main"}">
            <div class="omega-mc-media-container">
              ${"VIDEO" === r?.media?.type ? `
                      <video
                        class="omega-mc-media-video"
                        src="${r.media?.media_url}"
                        autoplay
                        loop
                        ${window.omegaUtils.isAndroid() ? "muted" : ""}
                        playsinline
                      ></video>
                      <button
                        class="omega-mc-sound-toggle ${f ? "omega-mc-sound-toggle-empty-product" : ""}"
                        aria-label="Toggle sound"
                      >
                        <svg class="omega-mc-sound-icon" viewBox="0 0 24 24" width="24" height="24">
                          <path class="omega-mc-sound-on" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" ${window.omegaUtils.isAndroid() ? 'style="display: none;"' : ""}/>
                          <path class="omega-mc-sound-off" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" ${window.omegaUtils.isAndroid() ? "" : 'style="display: none;"'}/>
                        </svg>
                      </button>
                    ` : `<img class="omega-mc-media-image" src="${r.media?.media_url}">`}
              ${r?.media?.permalink ? `
              <button
               style="${"VIDEO" !== r?.media?.type ? "bottom: 20px;" : ""}"
               class="omega-mc-instagram omega-tooltip
                ${"VIDEO" === r?.media?.type ? "omega-mc-has-video" : "omega-mc-no-video"}
                ${f ? "omega-mc-empty-product" : ""}"
               aria-label="Toggle sound"
               onclick="window.omegaUtils.openPermalink('${r?.media?.permalink || ""}')"
               >
                <span class="omega-tooltip-text" style="right: -16px !important;">View on Instagram</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24" fill="none">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFFFFF"/>
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#FFFFFF"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#FFFFFF"/>
                </svg>
              </button>
              ` : ""}
              ${!f && '<button class="omega-mc-btn-collapse-sheet"\n                onclick="window.omegaUtils.expandProductSheet()"\n                >\n                  <img\n                    src="https://cdn.shopify.com/s/files/1/0931/0466/8987/files/instagram-feed-cart.png?v=1753339243"\n                    alt="btn-cart"\n                    width="20px"\n                    height="100%"\n                  />\n                  View featured products\n                </button>'}
            </div>
          ${$}
        </div>
      </div>
    `, document.body.appendChild(h), h.style.display = "flex", document.body.classList.add(w), o && window.omegaUtils.waitForElement("#omega-modal-highlight").then(() => {
        window.omegaBrandmark.insertProtectedBrandmarkAfter("#omega-modal-highlight", ".omega-mc-content");
      }).catch((e2) => {
        console.error("\u274C Brandmark insertion failed:", e2);
      }), s(h, w), v?.length > 0 ? Promise.all(v?.map(async (e2) => {
        try {
          const n3 = await fetch(`/products/${e2?.handle}.json`);
          if (n3.ok && 200 === n3.status) {
            const e3 = await n3.json();
            return e3?.product;
          }
          return null;
        } catch (n3) {
          return console.error(`Error fetching product ${e2?.handle}:`, n3), null;
        }
      })).then((n3) => {
        e = n3.filter(Boolean), 1 === e?.length ? m("detail_product", e?.[0], r) : m("list_product", e, r), v?.length && window.OmegaHighlightAnalytics.trackProductImpression(e, v, r);
      }) : (window.omegaModal.generateModalInfoCaption(r), v?.length && window.OmegaHighlightAnalytics.trackProductImpression(e, v, r)), a = r, window.omegaUtils.setupModalSoundToggle(), c(r, p, h, w);
    }, generateModalInfoHTMLHighlight: m, handleOptionChangeHighlight: function(e2) {
      if (!i) return;
      const a2 = e2.target, o2 = a2.dataset.optionName, d2 = a2.dataset.value;
      n[o2] = d2, t = i?.variants?.find((e3) => Object.entries(n).every(([n2, t2]) => {
        const a3 = i.options.findIndex((e4) => e4.name === n2);
        if (-1 === a3) return false;
        return e3[`option${a3 + 1}`] === t2;
      }));
      const l2 = a2.closest(".omega-mcpdm-option-group");
      if (l2) {
        l2.querySelectorAll(".omega-mcpdm-option-value").forEach((e3) => {
          e3 === a2 ? e3.classList.add("selected") : e3.classList.remove("selected");
        });
      }
      if (t) {
        const e3 = document.querySelector(".omega-mcpl-item-price");
        if (e3) {
          const n2 = `
          ${t.compare_at_price ? `<span class="omega-mcpl-item-price-compare">
              ${window.omegaUtils.formatNumberWithCommas(t.compare_at_price)} ${window.omegaUtils.getCurrencySymbol(t.price_currency)}
            </span>` : ""}
          <span class="omega-mcpl-item-price-current">
            ${window.omegaUtils.formatNumberWithCommas(t.price)} ${window.omegaUtils.getCurrencySymbol(t.price_currency)}
          </span>
        `;
          e3.innerHTML = n2;
        }
      }
      if (t && i?.images) {
        const n2 = i.images.find((e3) => e3?.id === t?.image_id), a3 = document.querySelector(".omega-mcpdm-list-image");
        if (a3) {
          const i2 = JSON.parse(e2.target.dataset.images || "[]");
          a3.innerHTML = n2?.src ? `
          <img
            src="${n2?.src}"
            alt="No image"
            class="omega-mcpdm-image"
          />
        ` : i2?.length > 0 ? i2?.map((e3) => `
          <img
            src="${e3?.src ?? window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />
          `).join("") : `
          <img
            src="${window.omegaUtils.defaultImageUrl}"
            alt="No image"
            class="omega-mcpdm-image"
          />`;
        }
      }
    }, handleAddToCartHighlight: function(n2, i2) {
      const a2 = window.omegaUtils.decodeBase64(i2.target.dataset.item), o2 = (window, e.find((e2) => e2?.id === n2));
      if (window.omegaUtils && window.omegaUtils.handleAddToCart) {
        window.omegaUtils.handleAddToCart(t?.id, 1) && window.OmegaHighlightAnalytics.trackAddToCart(o2, a2);
      }
    }, handleBuyItNowHighlight: function(n2, i2) {
      if (window.omegaUtils.decodeBase64(i2.target.dataset.item), window, e.find((e2) => e2?.id === n2), window.omegaUtils && window.omegaUtils.handleBuyItNow) {
        window.omegaUtils.handleBuyItNow(t?.id, 1);
      }
    }, handleShowProductHighlight: function(n2, i2) {
      const t2 = i2.currentTarget, o2 = window.omegaUtils.decodeBase64(t2?.dataset?.item);
      window, a = o2;
      let d2 = e.find((e2) => e2?.id === n2);
      if (!d2) throw new Error(`Product with ID ${n2} not found in listDetailProductsHighlight`);
      window.omegaUtils.throttleTrack(`product-click-${d2?.id}`, () => {
        window.OmegaHighlightAnalytics.trackProductClick(d2, o2);
      }), m("detail_product", d2, o2);
    }, handleOpenProductHighlight: function(e2, n2) {
      e2 && window.open(`https://${window.location.host}/products/${e2}`, "_blank");
    }, handleBack: function() {
      m("list_product", e, a), i = null, n = null, t = null;
    }, toggleDescription: function() {
      const e2 = document.getElementById("omega-mcpd-collapse-content"), n2 = document.getElementById("omega-mcpd-collapse-icon");
      "none" === e2.style.display ? (e2.style.display = "block", n2.textContent = "\u2212") : (e2.style.display = "none", n2.textContent = "+");
    }, goToPrevious: function() {
      if (l > 0) {
        l--;
        const e2 = d[l], n2 = document.getElementById("omega-modal-highlight"), i2 = "omega-mc-open", t2 = document.querySelectorAll("[data-item]"), a2 = Array.from(t2).find((n3) => window.omegaUtils.decodeBase64(n3.getAttribute("data-item")).media_id === e2.media_id), o2 = window.omegaUtils.decodeBase64(a2.getAttribute("data-media-products"));
        c(e2, o2, n2, i2);
      }
    }, goToNext: function() {
      if (l < d.length - 1) {
        l++;
        const e2 = d[l], n2 = document.getElementById("omega-modal-highlight"), i2 = "omega-mc-open", t2 = document.querySelectorAll("[data-item]"), a2 = Array.from(t2).find((n3) => {
          const i3 = window.omegaUtils.decodeBase64(n3.getAttribute("data-item"));
          return i3 && i3.media_id === e2.media_id;
        }), o2 = a2 ? window.omegaUtils.decodeBase64(a2.getAttribute("data-media-products")) : null;
        c(e2, o2, n2, i2);
      }
    } };
  })();

  // extensions/theme-extension-instagram-feed/assets/highlight-utils.js
  window.OmegaHighlightUtils = { getDataMedia: function(t) {
    let i = [];
    return window?.[`omega_keys_array_highlight_${t}`]?.forEach((t2) => {
      const n = t2.toString(), o = window[`omega_medias_highlight_${n}`];
      i.push(o);
    }), i;
  }, getVisibleItemsCount: function() {
    const t = window.innerWidth;
    return t <= 768 ? 2 : t <= 1024 ? 3 : 4;
  }, getUrlSocialAccount: function(t, i) {
    return t && i && "instagram" === i.toLowerCase() ? `https://www.instagram.com/${t}` : null;
  } };

  // extensions/theme-extension-instagram-feed/assets/omega.highlight.core.js
  !(function() {
    function e() {
      if (window.__omegaHighlightState.isProcessing) return;
      window.__omegaHighlightState.isProcessing = true;
      const e2 = document.querySelectorAll(".omega-highlight-container");
      0 !== e2.length ? (e2.forEach((e3) => {
        const i = e3.dataset.blockId || e3.getAttribute("data-block-id");
        if (!i || window.__omegaHighlightState.renderedContainers.has(i)) return;
        const t = window.OmegaHighlightUtils.getDataMedia(i);
        let n = "";
        t && 0 !== t.length && t[0]?.medias && 0 !== t[0].medias.length || !window?.Shopify?.designMode ? t.forEach((e4) => {
          const i2 = e4?.medias.sort((e5, i3) => e5.position - i3.position) || [];
          if (0 === i2.length) return;
          const t2 = e4?.socialAccount, o = e4?.mediaProducts || [], a = window.OmegaHighlightUtils.getUrlSocialAccount(e4?.socialAccount?.username, e4?.socialAccount?.platform), d = i2[0], l = i2.slice(1), g = (s = l.length) <= 4 ? 2 : s <= 7 ? 3 : s <= 9 ? 4 : 5;
          var s;
          const r = (e5, i3) => {
            if (!e5) return "";
            return "VIDEO" === e5.media.type ? `
                  <video
                    class="omega-highlight-media"
                    src="${e5.media.media_url}"
                    muted
                    loop
                    playsinline
                    preload="${i3 < 3 ? "auto" : "metadata"}"
                    poster="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(e5.media.thumbnail_url, "video") : e5.media.thumbnail_url}"
                  ></video>
                  <div class="omega-highlight-play-button"></div>
                ` : `
                  <img
                    src="${window.omegaMediaOptimizer?.optimizeMediaUrl ? window.omegaMediaOptimizer.optimizeMediaUrl(e5.media.media_url, "image") : e5.media.media_url}"
                    alt="${e5.media.alt_text || "Media"}"
                    class="omega-highlight-media"
                    crossorigin="anonymous"
                    loading="${i3 < 3 ? "eager" : "lazy"}"
                  />
                `;
          };
          let h = "";
          if (d) {
            const e5 = o.filter((e6) => e6?.media_id === d?.media_id);
            h = `
              <div class="omega-highlight-item-large"
                  onclick="window.OmegaHighlightModal.openModalHighlight(this)"
                  data-item="${window.omegaUtils.encodeToBase64({ ...d, listProduct: e5, socialAccount: t2 || "", urlSocialAccount: a }) || ""}"
                  data-media-products="${window.omegaUtils.encodeToBase64(o) || ""}">
                  ${r(d, 0)}
              </div>
            `;
          }
          let m = "";
          if (l.length > 0) {
            const e5 = window.omegaUtils.encodeToBase64(o);
            m = `
              <div class="omega-highlight-grid-small" style="grid-template-columns: repeat(${g}, minmax(0, 1fr)); flex: ${g < 4 ? 2 : 3};">
                  ${l.map((i3, n2) => {
              const d2 = o.filter((e6) => e6?.media_id === i3?.media_id);
              return `
                        <div class="omega-highlight-item-small"
                            onclick="window.OmegaHighlightModal.openModalHighlight(this)"
                            data-item="${window.omegaUtils.encodeToBase64({ ...i3, listProduct: d2, socialAccount: t2 || "", urlSocialAccount: a }) || ""}"
                            data-media-products="${e5 || ""}">
                            ${r(i3, n2 + 1)}
                        </div>
                      `;
            }).join("")}
              </div>
            `;
          }
          const c = `
              <div class="omega-highlight-layout-wrapper">
                ${h}
                ${m}
              </div>
            `;
          n += `
              <div class="omega-highlight-header">
                  <div class="omega-highlight-title">
                    ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedTitle(e4) : e4?.title || ""}
                  </div>
                  <div class="omega-highlight-subtitle">
                    ${window.OmegaTranslationHelper ? window.OmegaTranslationHelper.getLocalizedSubtitle(e4) : e4?.subtitle || ""}
                  </div>
                  ${a ? `<button onclick="window.open('${a}', '_blank')" class="omega-highlight-btn-follow-us-top">FOLLOW US</button>` : ""}
              </div>

              ${c}

              <div class="omega-highlight-footer">
                ${a ? `<button onclick="window.open('${a}', '_blank')" class="omega-highlight-btn-follow-us-bottom">FOLLOW US</button>` : ""}
              </div>
            `;
        }) : n = '\n          <div class="omega-widget-empty">\n            <p class="omega-widget-empty_text">Paste the Widget ID to appear.</p>\n            <p>Paste widget ID from the app to theme editor app block.</p>\n          </div>\n        ', n && (e3.innerHTML = n, window.__omegaHighlightState.renderedContainers.add(i), setTimeout(() => {
          window.omegaMediaOptimizer && "function" == typeof window.omegaMediaOptimizer.optimizeContainerMedia && window.omegaMediaOptimizer.optimizeContainerMedia(e3), document.querySelectorAll(".omega-highlight-item-large, .omega-highlight-item-small").forEach((e4) => {
            const i2 = e4.querySelector("video.omega-highlight-media"), t2 = e4.querySelector(".omega-highlight-play-button");
            i2 && (t2 && (t2.style.display = "flex"), e4.addEventListener("mouseenter", () => {
              i2.play().catch((e5) => {
              }), t2 && (t2.style.display = "none");
            }), e4.addEventListener("mouseleave", () => {
              i2.pause(), i2.currentTime = 0, t2 && (t2.style.display = "flex");
            }));
          });
        }, 100));
      }), window.__omegaHighlightState.isProcessing = false) : window.__omegaHighlightState.isProcessing = false;
    }
    window.__omegaHighlightState = window.__omegaHighlightState || { renderedContainers: /* @__PURE__ */ new Set(), isProcessing: false }, document.addEventListener("DOMContentLoaded", function() {
      if (window.__omegaHighlightInitialized) return;
      window.__omegaHighlightInitialized = true, e(), window.__omegaHighlightResizeHandlerBound || (window.__omegaHighlightResizeHandlerBound = true, window.addEventListener("resize", /* @__PURE__ */ (function(e2, i) {
        let t;
        return function() {
          const n = this, o = arguments;
          clearTimeout(t), t = setTimeout(() => e2.apply(n, o), i);
        };
      })(() => {
        window.__omegaHighlightState.renderedContainers.clear(), e();
      }, 150)));
      window;
      window.OmegaHighlightAnalytics?.trackMediaImpression && window.OmegaHighlightAnalytics.trackMediaImpression();
    }), window.Shopify && window.Shopify.designMode && (document.addEventListener("shopify:section:load", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    }), document.addEventListener("shopify:section:reorder", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    }), document.addEventListener("shopify:section:select", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    }), document.addEventListener("shopify:section:deselect", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    }), document.addEventListener("shopify:block:select", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    }), document.addEventListener("shopify:block:deselect", function() {
      window.__omegaHighlightState.renderedContainers.clear(), e();
    })), window.OmegaHighlightCore = { handleRenderHighlight: e };
  })();
})();
