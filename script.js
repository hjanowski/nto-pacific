// script.js

// Generic event‑tracker stub; replace with your analytics SDK call.
function trackEvent(type, details) {
  console.log(`[TRACK] ${type}`, details);
  // e.g. analytics.track(type, details);
}

// 1. Capture login/signup
document.getElementById('auth-form')
  .addEventListener('submit', function(e) {
    e.preventDefault();
    const email = e.target.email.value;
    trackEvent('signup_login', { email });
    // …your auth logic here…
    alert('Thanks! Check console for tracked event.');
  });

// 2. Capture checkout/purchase
document.getElementById('checkout-btn')
  .addEventListener('click', function() {
    // In a real shop you'd sum cart items; here we hard‑code:
    const cartValue = 120; 
    trackEvent('purchase', { cartValue });
    alert(`Purchase tracked: $${cartValue}`);
  });

// 3. Capture out‑of‑stock notifications
document.querySelectorAll('.order-btn')
  .forEach(btn => btn.addEventListener('click', function() {
    const product = this.closest('.product').querySelector('h3').innerText;
    trackEvent('out_of_stock_order', { product });
    alert(`We'll notify you when "${product}" is back in stock.`);
  }));
