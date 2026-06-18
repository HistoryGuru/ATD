function initScrollFade() {
  const targets = document.querySelectorAll('.fade-in');
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

const paymentLinks = {
  "1:1 Training": "#stripe-1-1-training",
  "One Week Intensive": "#stripe-one-week-intensive",
  "Group Session": "#stripe-group-session"
};

const modal = document.querySelector("#paymentModal");
const paymentSummary = document.querySelector("#paymentSummary");
const paymentLink = document.querySelector("#paymentLink");

document.querySelectorAll(".pay-button").forEach((button) => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    const price = button.dataset.price;
    paymentSummary.textContent = `${plan} payment selected: ${price}.`;
    paymentLink.href = paymentLinks[plan] || "#";

    if (typeof modal.showModal === "function") {
      modal.showModal();
    }
  });
});
