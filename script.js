function initScrollFade() {
  const targets = document.querySelectorAll('.fade-in, .fade-in-stagger');
  if (!targets.length) return;

  // Respect users who prefer less motion: show everything immediately.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    }
  );

  targets.forEach((el) => observer.observe(el));
}

initScrollFade();

function initLogoFallback() {
  const logo = document.querySelector('.brand-logo');
  if (!logo) return;

  const fallbacks = (logo.dataset.fallbacks || '').split(',').filter(Boolean);
  logo.addEventListener('error', () => {
    const next = fallbacks.shift();
    if (next) {
      logo.src = next;
      logo.dataset.fallbacks = fallbacks.join(',');
      return;
    }

    logo.closest('.brand')?.classList.add('logo-missing');
  });
}

initLogoFallback();

// Stripe Payment Links — these are currently TEST MODE links (note the
// "test_" in each URL). Swap in the live-mode equivalents from the Stripe
// Dashboard once you're ready to accept real payments.
// For "Group Session", make sure "Customer can adjust quantity" is turned on
// for that Payment Link so a group of N players is charged $45 x N.
const paymentLinks = {
  "1:1 Training": "https://buy.stripe.com/test_cNifZj3trbXG5293Vt3gk02",
  "One Week Intensive": "https://buy.stripe.com/test_6oU9AV6FDe5OeCJ4Zx3gk03",
  "Group Session": "https://buy.stripe.com/test_bJe00l3tr2n6amt9fN3gk01"
};

const modal = document.querySelector("#paymentModal");
const paymentSummary = document.querySelector("#paymentSummary");
const paymentLink = document.querySelector("#paymentLink");

document.querySelectorAll(".pay-button").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    const price = button.dataset.price;
    const link = paymentLinks[plan];
    const isConfigured = Boolean(link) && !link.includes("REPLACE_WITH");

    paymentSummary.textContent = `${plan} payment selected: ${price}.`;
    paymentLink.href = isConfigured ? link : "#";
    paymentLink.textContent = isConfigured
      ? "Continue to Stripe Checkout"
      : "Stripe link not set up yet";
    paymentLink.classList.toggle("is-disabled", !isConfigured);
    paymentLink.setAttribute("aria-disabled", String(!isConfigured));

    if (typeof modal.showModal === "function") {
      modal.showModal();
    }
  });
});
