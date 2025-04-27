// script.js — Complete site logic with switchToSignup/Login added

// Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null
};

// Utility shortcuts
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// ========== DOM READY ===========
document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const loginBtn = $('#login-btn');
  const cartBtn = $('#cart-btn');
  const overlay = $('.overlay');
  const showSignupLink = $('#show-signup');
  const showLoginLink = $('#show-login');
  const addToCartButtons = $$('.add-to-cart');
  const notifyButtons = $$('.notify-me');
  const checkoutBtn = $('#checkout-btn');
  const closeModalButtons = $$('.close-modal');

  // Modals & forms
  const loginForm = $('#login-form');
  const signupForm = $('#signup-form');
  const notifyForm = $('#notify-form');
  const newsletterForm = $('#newsletter-form');
  const newsletterFooterForm = $('#newsletter-form-footer');
  const checkoutForm = $('#checkout-form');

  // Initialize state
  initializeAuthState();
  updateLoginButton();
  updateCartCount();
  startSalesforce();

  // Bind modal close icons
  closeModalButtons.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal').id)));

  // Continue Shopping
  $$('.close-confirmation').forEach(btn => btn.addEventListener('click', closeConfirmationModal));

  // Add to Cart
  addToCartButtons.forEach(btn => btn.addEventListener('click', onAddToCart));

  // Notify Me
  notifyButtons.forEach(btn => btn.addEventListener('click', onNotifyMe));

  // Login/Cart buttons
  if (loginBtn) loginBtn.addEventListener('click', onLoginButton);
  if (cartBtn) cartBtn.addEventListener('click', onCartButton);
  if (overlay) overlay.addEventListener('click', closeAllModals);

  // Signup/Login toggle links
  if (showSignupLink) showSignupLink.addEventListener('click', switchToSignup);
  if (showLoginLink) showLoginLink.addEventListener('click', switchToLogin);

  // Checkout button
  if (checkoutBtn) checkoutBtn.addEventListener('click', onCheckoutClick);

  // Form submissions
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
  if (notifyForm) notifyForm.addEventListener('submit', handleNotifySubmit);
  if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  if (newsletterFooterForm) newsletterFooterForm.addEventListener('submit', handleNewsletterSubmit);
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
});

// ========== Toggle between Login and Signup ===========
function switchToSignup(event) {
  event.preventDefault();
  closeModal('login-modal');
  openModal('signup-modal');
}

function switchToLogin(event) {
  event.preventDefault();
  closeModal('signup-modal');
  openModal('login-modal');
}

// ========== Interaction Handlers ===========
function onLoginButton() {
  if (state.currentUser) showLogoutConfirmation();
  else openModal('login-modal');
}

function onCartButton() {
  openModal('cart-modal');
  updateCartDisplay();
}

function onAddToCart(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const id = card.dataset.productId;
  const name = card.dataset.productName;
  const price = parseFloat(card.dataset.productPrice);
  const existing = state.cart.find(i => i.id === id);
  if (existing) existing.quantity++;
  else state.cart.push({ id, name, price, quantity: 1 });
  state.cartCount = state.cart.reduce((s, i) => s + i.quantity, 0);
  state.cartTotal = state.cart.reduce((s, i) => s + i.price * i.quantity, 0);
  updateCartCount();
  updateCartDisplay();
  showConfirmation(`${name} has been added to your cart!`);
  sendSalesforceEvent('AddToCart', { product: name });
}

function onNotifyMe(e) {
  const card = e.target.closest('.product-card'); if (!card) return;
  state.currentProductNotify = { id: card.dataset.productId, name: card.dataset.productName };
  const nameEl = $('#notify-product-name'); if (nameEl) nameEl.textContent = state.currentProductNotify.name;
  openModal('notify-modal');
}

function onCheckoutClick() {
  if (state.currentUser) {
    closeModal('cart-modal');
    openModal('checkout-modal');
    prepareCheckoutModal();
  } else {
    closeModal('cart-modal');
    openModal('login-modal');
    promptLoginMessage();
  }
}

// ========== Form Handlers ===========
function handleLoginSubmit(e) {
  e.preventDefault();
  const email = $('#email').value;
  const pwd = $('#password').value;
  if (loginUser(email, pwd)) {
    closeModal('login-modal');
    updateLoginButton();
    showConfirmation('Logged in successfully');
    e.target.reset();
  } else {
    showFormError(e.target, 'Invalid email or password');
  }
}

function handleSignupSubmit(e) {
  e.preventDefault(); clearFormError(e.target);
  const name = $('#name').value;
  const email = $('#signup-email').value;
  const pw = $('#signup-password').value;
  const cpw = $('#confirm-password').value;
  if (pw !== cpw) return showFormError(e.target, 'Passwords do not match');
  if (!registerUser(name, email, pw)) return showFormError(e.target, 'Email already registered');
  closeModal('signup-modal');
  updateLoginButton();
  showConfirmation('Account created and logged in');
  e.target.reset();
}

function handleNotifySubmit(e) {
  e.preventDefault();
  closeModal('notify-modal');
  showConfirmation(`We'll notify when ${state.currentProductNotify.name} is back in stock!`);
  e.target.reset();
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  showConfirmation('Thanks for subscribing!');
  sendSalesforceEvent('NewsletterSignup', { email });
  e.target.reset();
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  closeModal('checkout-modal');
  showConfirmation('Order placed!');
  state.cart = [];
  state.cartCount = 0;
  state.cartTotal = 0;
  updateCartCount();
  updateCartDisplay();
  e.target.reset();
}

// ===== Confirmation Modal =====
function showConfirmation(message) {
  const textEl = $('#confirmation-text'); if (textEl) textEl.textContent = message;
  const modal = $('#confirmation-modal'); const overlay = $('.overlay');
  if (modal) modal.style.display = 'block'; if (overlay) overlay.style.display = 'block';
}

function closeConfirmationModal() {
  const modal = $('#confirmation-modal'); const overlay = $('.overlay');
  if (modal) modal.style.display = 'none';
  const anyOpen = $$('.modal').some(m => m.style.display === 'block');
  if (!anyOpen && overlay) overlay.style.display = 'none';
}

// ===== Salesforce Integration =====
function sendSalesforceEvent(type, data) {
  if (!window.SalesforceInteractions) return;
  const payload = { interaction: {
      name: 'Campaigns Events', eventType: 'campaignsEvents',
      campaignName: 'Default', campaignSource: 'Default', campaignContent: 'Default',
      custom1: type, custom2: data.product || data.email, custom3: new Date().toISOString()
  }};
  console.log('[SF]', type, 'payload', payload);
  window.SalesforceInteractions.sendEvent(payload)
    .then(r => console.log('[SF]', type, 'success', r))
    .catch(e => console.error('[SF]', type, 'error', e));
}

function startSalesforce() {
  let tries = 0, max = 20;
  const check = () => {
    if (window.SalesforceInteractions && window.SalesforceInteractions.init) return initConsent();
    if (++tries < max) setTimeout(check, 1000);
    else console.error('[SF] SDK failed to load');
  };
  check();
}

function initConsent() {
  console.log('[SF] initConsent');
  window.SalesforceInteractions.init({
    consents: [{ provider: 'CampaignAttribution', purpose: 'Tracking', status: 'Opt In' }]
  }).then(r => { console.log('[SF] consent ok', r); sendIdentity(); })
    .catch(e => console.error('[SF] consent err', e));
}

function sendIdentity() {
  console.log('[SF] sendIdentity');
  window.SalesforceInteractions.sendEvent({
    user: { attributes: { eventType: 'identity', email: state.currentUser?.email || '', isAnonymous: !state.currentUser } }
  }).then(r => console.log('[SF] identity ok', r))
    .catch(e => console.error('[SF] identity err', e));
}

// ===== Auth & UI Helpers =====
function initializeAuthState() {
  const u = localStorage.getItem('ntoCurrentUser');
  if (u) state.currentUser = JSON.parse(u);
}

function loginUser(email, pwd) {
  const users = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
  const u = users.find(x => x.email === email && x.password === pwd);
  if (u) {
    state.currentUser = { id: u.id, name: u.name, email: u.email };
    localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
    return true;
  }
  return false;
}

function registerUser(name, email, pw) {
  const arr = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
  if (arr.some(x => x.email === email)) return false;
  const u = { id: Date.now().toString(), name, email, password: pw, createdAt: new Date().toISOString() };
  arr.push(u);
  localStorage.setItem('ntoUsers', JSON.stringify(arr));
  state.currentUser = { id: u.id, name: u.name, email: u.email };
  localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
  return true;
}

function updateLoginButton() {
  const b = $('#login-btn');
  if (!b) return;
  if (state.currentUser) {
    b.textContent = state.currentUser.name.split(' ')[0] || 'Account';
    b.classList.add('logged-in');
  } else {
    b.textContent = 'Login';
    b.classList.remove('logged-in');
  }
}

function updateCartCount() {
  const el = $('.cart-count'); if (el) el.textContent = state.cartCount;
}

function updateCartDisplay() {
  const itemsEl = $('#cart-items'); const subEl = $('#cart-subtotal'); const shipEl = $('#cart-shipping'); const totEl = $('#cart-total');
  if (!itemsEl || !subEl || !shipEl || !totEl) return;
  itemsEl.innerHTML = '';
  if (!state.cart.length) {
    itemsEl.innerHTML = '<p>Your cart is empty.</p>';
    subEl.textContent = '$0.00'; shipEl.textContent = '$0.00'; totEl.textContent = '$0.00';
    $('#checkout-btn').disabled = true;
    return;
  }
  state.cart.forEach(it => { const row = document.createElement('div'); row.className='cart-item'; row.innerHTML=`<span>${it.name} x${it.quantity}</span><span>$${(it.price*it.quantity).toFixed(2)}</span>`; itemsEl.append(row); });
  subEl.textContent = `$${state.cart.reduce((sum,i)=>sum+i.price*i.quantity,0).toFixed(2)}`;
  const shipping = state.cartTotal>0?10:0;
  shipEl.textContent = `$${shipping.toFixed(2)}`;
  totEl.textContent = `$${(state.cartTotal+shipping).toFixed(2)}`;
}

function prepareCheckoutModal() { /* populate checkout fields if needed */ }
function promptLoginMessage() { /* show login required message inside login-form */ }
function showLogoutConfirmation() { /* implement logout UI flow */ }
function fixContinueShoppingButtons() { /* no-op */ }
