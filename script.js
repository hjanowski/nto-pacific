// script-updated.js — Full Add-to-Cart with working confirmation modal

// Global cart state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0
};

// Utility selectors
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// Close the confirmation modal
function closeConfirmationModal() {
  const modal = $('#confirmation-modal');
  const overlay = $('.overlay');
  if (modal) modal.style.display = 'none';
  // Hide overlay only if no other modal open
  const anyOpen = $$('.modal').some(m => m.style.display === 'block');
  if (!anyOpen && overlay) overlay.style.display = 'none';
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Bind Continue Shopping button(s)
  $$('.close-confirmation').forEach(btn => {
    btn.addEventListener('click', closeConfirmationModal);
  });

  // Bind Add to Cart buttons
  $$('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', event => {
      const card = event.target.closest('.product-card');
      if (!card) return;

      // Extract product data
      const id = card.dataset.productId;
      const name = card.dataset.productName;
      const price = parseFloat(card.dataset.productPrice);

      // Update cart state
      const existing = state.cart.find(item => item.id === id);
      if (existing) {
        existing.quantity += 1;
      } else {
        state.cart.push({ id, name, price, quantity: 1 });
      }
      state.cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);
      state.cartTotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

      // Update cart count UI
      const cartCountEl = $('.cart-count');
      if (cartCountEl) cartCountEl.textContent = state.cartCount;

      // Show confirmation modal
      const textEl = $('#confirmation-text');
      if (textEl) textEl.textContent = `${name} has been added to your cart!`;
      const modal = $('#confirmation-modal');
      const overlay = $('.overlay');
      if (modal) modal.style.display = 'block';
      if (overlay) overlay.style.display = 'block';
    });
  });
});
