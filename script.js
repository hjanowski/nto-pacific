// script.js — Fixed: closeAllModals is defined, and login toggles now work

// -- Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null
};

// -- Utility selectors
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return Array.from(document.querySelectorAll(selector)); }

// -- Modal controls
function openModal(id) {
  const modal = document.getElementById(id);
  const overlay = $('.overlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
  // Hide overlay if no modals open
  const anyOpen = $$('.modal').some(m => m.style.display === 'block');
  const overlay = $('.overlay');
  if (!anyOpen && overlay) overlay.style.display = 'none';
}

function closeAllModals() {
  $$('.modal').forEach(m => m.style.display = 'none');
  const overlay = $('.overlay');
  if (overlay) overlay.style.display = 'none';
}

// -- Confirmation modal
function showConfirmation(message) {
  const textEl = $('#confirmation-text');
  if (textEl) textEl.textContent = message;
  openModal('confirmation-modal');
}

function closeConfirmationModal() {
  closeModal('confirmation-modal');
}

// -- Authentication toggles
function switchToSignup(e) {
  e.preventDefault();
  closeModal('login-modal');
  openModal('signup-modal');
}

function switchToLogin(e) {
  e.preventDefault();
  closeModal('signup-modal');
  openModal('login-modal');
}

function onLoginButton() {
  if (state.currentUser) {
    showLogoutConfirmation();
  } else {
    openModal('login-modal');
  }
}

// -- Cart actions
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
  const existing = state.cart.find(item => item.id === id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ id, name, price, quantity: 1 });
  updateCartCount();
  updateCartDisplay();
  showConfirmation(`${name} has been added to your cart!`);
}

// -- Notify Me
function onNotifyMe(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  state.currentProductNotify = {
    id: card.dataset.productId,
    name: card.dataset.productName
  };
  const nameEl = $('#notify-product-name');
  if (nameEl) nameEl.textContent = state.currentProductNotify.name;
  openModal('notify-modal');
}

// -- Checkout actions
function onCheckoutClick() {
  if (state.currentUser) {
    closeModal('cart-modal');
    openModal('checkout-modal');
  } else {
    closeModal('cart-modal');
    openModal('login-modal');
  }
}

// -- Form handlers
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
  e.preventDefault();
  clearFormError(e.target);
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

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const email = e.target.querySelector('input').value;
  showConfirmation('Thanks for subscribing!');
  e.target.reset();
}

function handleNotifySubmit(e) {
  e.preventDefault();
  closeModal('notify-modal');
  showConfirmation(`We'll notify you when ${state.currentProductNotify.name} is back in stock!`);
  e.target.reset();
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  closeModal('checkout-modal');
  showConfirmation('Order placed!');
  state.cart = [];
  updateCartCount();
  updateCartDisplay();
  e.target.reset();
}

// -- UI updates
function updateLoginButton() {
  const btn = $('#login-btn');
  if (!btn) return;
  if (state.currentUser) {
    btn.textContent = state.currentUser.name.split(' ')[0] || 'Account';
  } else {
    btn.textContent = 'Login';
  }
}

function updateCartCount() {
  state.cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const el = $('.cart-count');
  if (el) el.textContent = state.cartCount;
}

function updateCartDisplay() {
  const itemsEl = $('#cart-items');
  const subEl = $('#cart-subtotal');
  const shipEl = $('#cart-shipping');
  const totEl = $('#cart-total');
  if (!itemsEl || !subEl || !shipEl || !totEl) return;
  itemsEl.innerHTML = '';
  if (!state.cart.length) {
    itemsEl.innerHTML = '<p>Your cart is empty.</p>';
    subEl.textContent = '$0.00';
    shipEl.textContent = '$0.00';
    totEl.textContent = '$0.00';
    $('#checkout-btn').disabled = true;
    return;
  }
  let subtotal = 0;
  state.cart.forEach(item => {
    subtotal += item.price * item.quantity;
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `<span>${item.name} x${item.quantity}</span><span>$${(item.price * item.quantity).toFixed(2)}</span>`;
    itemsEl.append(row);
  });
  const shipping = subtotal > 0 ? 10 : 0;
  subEl.textContent = `$${subtotal.toFixed(2)}`;
  shipEl.textContent = `$${shipping.toFixed(2)}`;
  totEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;
  $('#checkout-btn').disabled = false;
}

// -- Auth and storage
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

// -- Salesforce integration (unchanged)
function startSalesforce() {
  let tries = 0;
  const max = 20;
  function check() {
    if (window.SalesforceInteractions && window.SalesforceInteractions.init) return initConsent();
    if (++tries < max) setTimeout(check, 1000);
    else console.error('[SF] SDK failed to load');
  }
  check();
}

function initConsent() {
  window.SalesforceInteractions.init({
    consents: [{ provider: 'CampaignAttribution', purpose: 'Tracking', status: 'Opt In' }]
  }).then(res => sendIdentity()).catch(err => console.error(err));
}

function sendIdentity() {
  window.SalesforceInteractions.sendEvent({ user: { attributes: { eventType: 'identity', email: state.currentUser?.email || '', isAnonymous: !state.currentUser } } })
    .catch(err => console.error(err));
}

function sendSalesforceEvent(type, data) {
  if (!window.SalesforceInteractions) return;
  const payload = { interaction: { name: 'Campaigns Events', eventType: 'campaignsEvents', campaignName: 'Default', campaignSource: 'Default', campaignContent: 'Default', custom1: type, custom2: data.product || data.email, custom3: new Date().toISOString() } };
  window.SalesforceInteractions.sendEvent(payload).catch(err => console.error(err));
}

// -- Error display
function showFormError(form, msg) {
  form.querySelectorAll('.form-error').forEach(e => e.remove());
  const p = document.createElement('p');
  p.className = 'form-error';
  p.textContent = msg;
  form.prepend(p);
}

function clearFormError(form) {
  form.querySelectorAll('.form-error').forEach(e => e.remove());
}
