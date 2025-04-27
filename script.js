// script-updated.js — Adds explicit 'Continue Shopping' handler for confirmation modal

// Global state
const state = { cart: [], cartCount: 0, cartTotal: 0, currentUser: null, currentProductNotify: null };

// Utility for query
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const addToCartButtons = $$('.add-to-cart');

  // Show confirmation modal when needed
  function showConfirmation(msg) {
    const textEl = $('#confirmation-text');
    if (textEl) textEl.textContent = msg;
    const modal = $('#confirmation-modal');
    const overlay = $('.overlay');
    if (modal) modal.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  }

  // Close confirmation
  const closeConfButtons = $$('.close-confirmation');
  closeConfButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = $('#confirmation-modal');
      const overlay = $('.overlay');
      if (modal) modal.style.display = 'none';
      // hide overlay only if no other modals open
      const anyOpen = $$('.modal').some(m => m.style.display === 'block');
      if (!anyOpen && overlay) overlay.style.display = 'none';
    });
  });

  // Add to cart
  addToCartButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      const name = card.dataset.productName;
      // Update cart state (omitted here)
      // ...
      showConfirmation(`${name} has been added to your cart!`);
    });
  });
});
