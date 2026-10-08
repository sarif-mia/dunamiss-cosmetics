class CartOfferProgress extends HTMLElement {
  connectedCallback() {
    this.handleCartUpdate = (event) => this.update(event.detail?.cart);
    document.addEventListener("cart:updated", this.handleCartUpdate);
    this.update(Number(this.dataset.amount || 0));
  }

  disconnectedCallback() {
    document.removeEventListener("cart:updated", this.handleCartUpdate);
  }

  getMilestones() {
    return [...this.querySelectorAll("[data-cart-offer-milestone]")]
      .map((element) => ({
        element,
        threshold: Number(element.dataset.threshold),
        type: element.dataset.type,
        label: element.dataset.label,
      }))
      .filter((milestone) => milestone.threshold > 0)
      .sort((first, second) => first.threshold - second.threshold);
  }

  getProperty(item, name) {
    if (Array.isArray(item?.properties)) {
      const property = item.properties.find((candidate) =>
        Array.isArray(candidate) ? candidate[0] === name : candidate?.name === name
      );
      return Array.isArray(property) ? property[1] : property?.value;
    }
    return item?.properties?.[name];
  }

  isAutomaticGift(item) {
    return this.getProperty(item, "_dm_auto_gift") === "1" ||
      (this.getProperty(item, "_gift_pick") === "1" && this.getProperty(item, "_gift_tier_id"));
  }

  getQualifyingSubtotal(cart) {
    if (Number.isFinite(cart)) return cart;
    if (!Array.isArray(cart?.items)) return Number(cart?.items_subtotal_price || 0);

    const hasLinePrices = cart.items.every((item) =>
      Number.isFinite(Number(item.final_line_price ?? item.finalLinePrice))
    );
    if (!hasLinePrices) return Number(cart.items_subtotal_price || cart.subtotal || 0);

    return cart.items.reduce((total, item) => {
      if (this.isAutomaticGift(item)) return total;
      return total + Number(item.final_line_price ?? item.finalLinePrice);
    }, 0);
  }

  money(cents) {
    if (window.Shopify?.formatMoney) {
      return Shopify.formatMoney(
        Math.max(0, Math.round(cents)),
        window.cartStrings?.money_format || "₹ {{amount_no_decimals}}"
      );
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: this.dataset.currency || "INR",
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  icon(type) {
    const icons = {
      shipping: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.5 6.5h10v10h-10zM13.5 10h3.2l3.8 3.7v2.8h-7zM7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      gift: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10h16v10H4zM3 6.5h18V10H3zM12 6.5V20M12 6.5H8.4a2.2 2.2 0 1 1 2.2-2.2c0 1.2 1.4 2.2 1.4 2.2Zm0 0h3.6a2.2 2.2 0 1 0-2.2-2.2c0 1.2-1.4 2.2-1.4 2.2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      discount: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4.5 12 7.5-7.5h6.5a1 1 0 0 1 1 1V12L12 19.5 4.5 12Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.8 8.2h.01M9.2 14.8l5.6-5.6M10 10.2h.01M14 13.8h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      complete: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5.5 12.5 4 4 9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    return icons[type] || "";
  }

  update(cart) {
    const milestones = this.getMilestones();
    if (!milestones.length) return;

    const amount = this.getQualifyingSubtotal(cart) / 100;
    const maximum = milestones.at(-1).threshold;
    const next = milestones.find((milestone) => amount < milestone.threshold);
    const progress = Math.min(100, Math.max(0, amount / maximum * 100));
    const track = this.querySelector("[data-cart-offer-track]");
    const fill = this.querySelector("[data-cart-offer-fill]");

    fill.style.width = `${progress}%`;
    track.setAttribute("aria-valuemax", String(maximum));
    track.setAttribute("aria-valuenow", String(Math.min(maximum, Math.max(0, amount))));

    milestones.forEach((milestone) => {
      const unlocked = amount >= milestone.threshold;
      const isNext = next === milestone;
      milestone.element.style.setProperty("--position", `${milestone.threshold / maximum * 100}%`);
      milestone.element.classList.toggle("is-unlocked", unlocked);
      milestone.element.classList.toggle("is-next", isNext);
      milestone.element.setAttribute(
        "aria-label",
        `${milestone.label} at ${this.money(milestone.threshold * 100)}${unlocked ? ", unlocked" : ""}`
      );
      milestone.element.innerHTML = this.icon(unlocked ? "complete" : milestone.type);
    });

    this.querySelectorAll("[data-cart-offer-label]").forEach((label) => {
      const threshold = Number(label.dataset.threshold);
      label.classList.toggle("is-unlocked", amount >= threshold);
      label.classList.toggle("is-next", next?.threshold === threshold);
    });

    const messageIcon = this.querySelector("[data-cart-offer-message-icon]");
    const messageText = this.querySelector("[data-cart-offer-message-text]");
    messageIcon.innerHTML = this.icon(next?.type || "complete");
    messageText.textContent = next
      ? `Add ${this.money((next.threshold - amount) * 100)} more to get ${next.label}`
      : "All cart rewards unlocked";
  }
}

if (!customElements.get("cart-offer-progress")) {
  customElements.define("cart-offer-progress", CartOfferProgress);
}
