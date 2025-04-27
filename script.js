// script-updated.js — Removed auto-close to ensure Continue Shopping is visible

// Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null
};

// Utility: shorthand query
const $ = selector => document.querySelector(selector);

// ========== DOM READY ===========
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = $('#login-btn');
  const cartBtn = $('#cart-btn');
  const overlay = $('.overlay');
  const showSignupLink = $('#show-signup');
  const showLoginLink = $('#show-login');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const notifyButtons = document.querySelectorAll('.notify-me');
  const checkoutBtn = $('#checkout-btn');
  const closeModalButtons = document.querySelectorAll('.close-modal');

  const loginForm = $('#login-form');
  const signupForm = $('#signup-form');
  const checkoutForm = $('#checkout-form');
  const notifyForm = $('#notify-form');
  const newsletterForm = $('#newsletter-form');
  const newsletterFooterForm = $('#newsletter-form-footer');

  initializeAuthState();
  updateCartCount();

  if (loginBtn) loginBtn.addEventListener('click', onLoginButton);
  if (cartBtn) cartBtn.addEventListener('click', onCartButton);
  if (overlay) overlay.addEventListener('click', closeAllModals);
  if (showSignupLink) showSignupLink.addEventListener('click', switchToSignup);
  if (showLoginLink) showLoginLink.addEventListener('click', switchToLogin);
  closeModalButtons.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal').id)));

  addToCartButtons.forEach(btn => btn.addEventListener('click', onAddToCart));
  notifyButtons.forEach(btn => btn.addEventListener('click', onNotifyMe));

  if (checkoutBtn) checkoutBtn.addEventListener('click', onCheckoutClick);

  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
  if (notifyForm) notifyForm.addEventListener('submit', handleNotifySubmit);
  if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  if (newsletterFooterForm) newsletterFooterForm.addEventListener('submit', handleNewsletterSubmit);
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  startSalesforce();
});

// Handlers
function onLoginButton() { state.currentUser ? showLogoutConfirmation() : openModal('login-modal'); }
function onCartButton() { openModal('cart-modal'); updateCartDisplay(); }
function switchToSignup(e) { e.preventDefault(); closeModal('login-modal'); openModal('signup-modal'); }
function switchToLogin(e) { e.preventDefault(); closeModal('signup-modal'); openModal('login-modal'); }
function onAddToCart(e) {
  const card = e.target.closest('.product-card'); if (!card) return;
  addToCart(card);
}
function onNotifyMe(e) {
  const card = e.target.closest('.product-card'); if (!card) return;
  state.currentProductNotify = { id: card.dataset.productId, name: card.dataset.productName };
  const nameEl = $('#notify-product-name'); if (nameEl) nameEl.textContent = state.currentProductNotify.name;
  openModal('notify-modal');
}
function onCheckoutClick() {
  if (state.currentUser) { closeModal('cart-modal'); openModal('checkout-modal'); prepareCheckoutModal(); }
  else { closeModal('cart-modal'); openModal('login-modal'); promptLoginMessage(); }
}

// Form Handlers
function handleLoginSubmit(e) { e.preventDefault(); const email=$('#email').value, pwd=$('#password').value;
  if (loginUser(email,pwd)) { closeModal('login-modal'); updateLoginButton(); showConfirmation('Logged in!'); e.target.reset(); }
  else showFormError(e.target,'Invalid credentials'); }
function handleSignupSubmit(e) { e.preventDefault(); clearFormError(e.target);
  const name=$('#name').value, email=$('#signup-email').value, pw=$('#signup-password').value, cpw=$('#confirm-password').value;
  if (pw!==cpw) return showFormError(e.target,'Passwords do not match');
  if (!registerUser(name,email,pw)) return showFormError(e.target,'Email exists');
  closeModal('signup-modal'); updateLoginButton(); showConfirmation('Account created!'); e.target.reset(); }
function handleNotifySubmit(e) { e.preventDefault(); showConfirmation(`We'll notify when ${state.currentProductNotify.name} is back`); e.target.reset(); }
function handleNewsletterSubmit(e) { e.preventDefault(); const email=e.target.querySelector('input').value; showConfirmation('Thanks for subscribing!'); e.target.reset(); sendSalesforceEvent('Newsletter Signup',{email}); }
function handleCheckoutSubmit(e) { e.preventDefault(); closeModal('checkout-modal'); showConfirmation('Order placed!'); state.cart=[]; state.cartCount=0; state.cartTotal=0; updateCartCount(); e.target.reset(); }

// Core Features
function addToCart(card) {
  const id=card.dataset.productId, name=card.dataset.productName, price=parseFloat(card.dataset.productPrice);
  const existing=state.cart.find(i=>i.id===id);
  if (existing) existing.quantity++; else state.cart.push({id,name,price,quantity:1});
  state.cartCount=state.cart.reduce((s,i)=>s+i.quantity,0);
  state.cartTotal=state.cart.reduce((s,i)=>s+(i.price*i.quantity),0);
  updateCartCount(); showConfirmation(`${name} added to cart!`);
}

// Salesforce
function sendSalesforceEvent(type,data) { /* ... */ }
function startSalesforce() { /* ... */ }
function initConsent() { /* ... */ }
function sendIdentity() { /* ... */ }

// Auth & UI Helpers
function initializeAuthState(){ /* ... */ }
function loginUser(email,pwd){ /* ... */ }
function registerUser(name,email,pw){ /* ... */ }
function updateLoginButton(){ /* ... */ }
function updateCartCount(){ /* ... */ }
function prepareCheckoutModal(){ /* ... */ }
function promptLoginMessage(){ /* ... */ }
function showLogoutConfirmation(){ /* ... */ }
function openModal(id){ /* ... */ }
function closeModal(id){ /* ... */ }
function closeAllModals(){ /* ... */ }
function showConfirmation(msg){
  const t=$('#confirmation-text'); if (t) t.textContent=msg;
  openModal('confirmation-modal');
}
function showFormError(form,txt){ /* ... */ }
function clearFormError(form){ /* ... */ }
function fixContinueShoppingButtons(){ /* ... */ }
