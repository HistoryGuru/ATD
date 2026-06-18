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
  "1-on-1 Training": "#stripe-1-on-1-training",
  "4-Session Pack": "#stripe-4-session-pack",
  "Small Group": "#stripe-small-group"
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
