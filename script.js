// script.js — Fixed: Added all missing event listeners and comprehensive console logging

// -- Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null
};

// -- Logging function
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'error':
      console.error(`${prefix} ❌ ${message}`);
      break;
    case 'success':
      console.log(`${prefix} ✅ ${message}`);
      break;
    case 'info':
      console.log(`${prefix} ℹ️ ${message}`);
      break;
    case 'event':
      console.log(`${prefix} 🎯 EVENT: ${message}`);
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
}

// -- Utility selectors
function $(selector) { return document.querySelector(selector); }
function $$(selector) { return Array.from(document.querySelectorAll(selector)); }

// -- Modal controls
function openModal(id) {
  log(`Opening modal: ${id}`, 'event');
  const modal = document.getElementById(id);
  const overlay = $('.overlay');
  if (modal) {
    modal.style.display = 'block';
    log(`Modal ${id} opened`, 'success');
  } else {
    log(`Modal ${id} not found`, 'error');
  }
  if (overlay) overlay.style.display = 'block';
}

function closeModal(id) {
  log(`Closing modal: ${id}`, 'event');
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    log(`Modal ${id} closed`, 'success');
  }
  // Hide overlay if no modals open
  const anyOpen = $$('.modal').some(m => m.style.display === 'block');
  const overlay = $('.overlay');
  if (!anyOpen && overlay) overlay.style.display = 'none';
}

function closeAllModals() {
  log('Closing all modals', 'event');
  $$('.modal').forEach(m => m.style.display = 'none');
  const overlay = $('.overlay');
  if (overlay) overlay.style.display = 'none';
}

// -- Confirmation modal
function showConfirmation(message) {
  log(`Showing confirmation: ${message}`, 'event');
  const textEl = $('#confirmation-text');
  if (textEl) textEl.textContent = message;
  openModal('confirmation-modal');
}

function closeConfirmationModal() {
  log('Closing confirmation modal', 'event');
  closeModal('confirmation-modal');
}

// -- Authentication toggles
function switchToSignup(e) {
  e.preventDefault();
  log('Switching to signup modal', 'event');
  closeModal('login-modal');
  openModal('signup-modal');
}

function switchToLogin(e) {
  e.preventDefault();
  log('Switching to login modal', 'event');
  closeModal('signup-modal');
  openModal('login-modal');
}

function onLoginButton() {
  log('Login button clicked', 'event');
  if (state.currentUser) {
    log('User is logged in, showing logout confirmation', 'info');
    showLogoutConfirmation();
  } else {
    log('User is not logged in, opening login modal', 'info');
    openModal('login-modal');
  }
}

// -- Cart actions
function onCartButton() {
  log('Cart button clicked', 'event');
  openModal('cart-modal');
  updateCartDisplay();
}

function onAddToCart(e) {
  log('Add to Cart button clicked', 'event');
  const card = e.target.closest('.product-card');
  if (!card) {
    log('Product card not found', 'error');
    return;
  }
  
  const id = card.dataset.productId;
  const name = card.dataset.productName;
  const price = parseFloat(card.dataset.productPrice);
  
  log(`Adding to cart: ${name} (${id}) - $${price}`, 'info');
  
  const existing = state.cart.find(item => item.id === id);
  if (existing) {
    existing.quantity += 1;
    log(`Incremented quantity for ${name} to ${existing.quantity}`, 'success');
  } else {
    state.cart.push({ id, name, price, quantity: 1 });
    log(`Added new item to cart: ${name}`, 'success');
  }
  
  updateCartCount();
  updateCartDisplay();
  showConfirmation(`${name} has been added to your cart!`);
}

// -- Notify Me
function onNotifyMe(e) {
  log('Notify Me button clicked', 'event');
  const card = e.target.closest('.product-card');
  if (!card) {
    log('Product card not found', 'error');
    return;
  }
  
  state.currentProductNotify = {
    id: card.dataset.productId,
    name: card.dataset.productName
  };
  
  log(`Setting up notification for: ${state.currentProductNotify.name}`, 'info');
  
  const nameEl = $('#notify-product-name');
  if (nameEl) nameEl.textContent = state.currentProductNotify.name;
  openModal('notify-modal');
}

// -- Checkout actions
function onCheckoutClick() {
  log('Checkout button clicked', 'event');
  if (state.currentUser) {
    log('User is logged in, proceeding to checkout', 'info');
    closeModal('cart-modal');
    openModal('checkout-modal');
  } else {
    log('User is not logged in, redirecting to login', 'info');
    closeModal('cart-modal');
    openModal('login-modal');
  }
}

// -- Form handlers
function handleLoginSubmit(e) {
  e.preventDefault();
  log('Login form submitted', 'event');
  
  const email = $('#email').value;
  const pwd = $('#password').value;
  
  log(`Attempting login with email: ${email}`, 'info');
  
  if (loginUser(email, pwd)) {
    log('Login successful', 'success');
    closeModal('login-modal');
    updateLoginButton();
    showConfirmation('Logged in successfully');
    e.target.reset();
  } else {
    log('Login failed', 'error');
    showFormError(e.target, 'Invalid email or password');
  }
}

function handleSignupSubmit(e) {
  e.preventDefault();
  log('Signup form submitted', 'event');
  
  clearFormError(e.target);
  
  const name = $('#name').value;
  const email = $('#signup-email').value;
  const pw = $('#signup-password').value;
  const cpw = $('#confirm-password').value;
  
  log(`Attempting signup: ${name} (${email})`, 'info');
  
  if (pw !== cpw) {
    log('Password mismatch', 'error');
    return showFormError(e.target, 'Passwords do not match');
  }
  
  if (!registerUser(name, email, pw)) {
    log('Email already registered', 'error');
    return showFormError(e.target, 'Email already registered');
  }
  
  log('Signup successful', 'success');
  closeModal('signup-modal');
  updateLoginButton();
  showConfirmation('Account created and logged in');
  e.target.reset();
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  log('Newsletter form submitted', 'event');
  
  const email = e.target.querySelector('input').value;
  log(`Newsletter signup: ${email}`, 'info');
  
  showConfirmation('Thanks for subscribing!');
  e.target.reset();
}

function handleNotifySubmit(e) {
  e.preventDefault();
  log('Notify form submitted', 'event');
  
  const email = $('#notify-email').value;
  log(`Notification requested for ${state.currentProductNotify.name} by ${email}`, 'info');
  
  closeModal('notify-modal');
  showConfirmation(`We'll notify you when ${state.currentProductNotify.name} is back in stock!`);
  e.target.reset();
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  log('Checkout form submitted', 'event');
  
  closeModal('checkout-modal');
  showConfirmation('Order placed!');
  
  log(`Order placed with ${state.cart.length} items, clearing cart`, 'info');
  
  state.cart = [];
  updateCartCount();
  updateCartDisplay();
  e.target.reset();
}

// -- UI updates
function updateLoginButton() {
  log('Updating login button', 'info');
  const btn = $('#login-btn');
  if (!btn) {
    log('Login button not found', 'error');
    return;
  }
  
  if (state.currentUser) {
    const displayName = state.currentUser.name.split(' ')[0] || 'Account';
    btn.textContent = displayName;
    log(`Login button updated to: ${displayName}`, 'success');
  } else {
    btn.textContent = 'Login';
    log('Login button reset to default', 'success');
  }
}

function updateCartCount() {
  state.cartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  log(`Updating cart count to: ${state.cartCount}`, 'info');
  
  const el = $('.cart-count');
  if (el) {
    el.textContent = state.cartCount;
    log('Cart count display updated', 'success');
  } else {
    log('Cart count element not found', 'error');
  }
}

function updateCartDisplay() {
  log('Updating cart display', 'info');
  
  const itemsEl = $('#cart-items');
  const subEl = $('#cart-subtotal');
  const shipEl = $('#cart-shipping');
  const totEl = $('#cart-total');
  
  if (!itemsEl || !subEl || !shipEl || !totEl) {
    log('Cart display elements missing', 'error');
    return;
  }
  
  itemsEl.innerHTML = '';
  
  if (!state.cart.length) {
    log('Cart is empty', 'info');
    itemsEl.innerHTML = '<p>Your cart is empty.</p>';
    subEl.textContent = '$0.00';
    shipEl.textContent = '$0.00';
    totEl.textContent = '$0.00';
    $('#checkout-btn').disabled = true;
    return;
  }
  
  let subtotal = 0;
  state.cart.forEach((item, index) => {
    log(`Displaying cart item ${index + 1}: ${item.name} x${item.quantity}`, 'info');
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
  
  log(`Cart updated: Subtotal: $${subtotal.toFixed(2)}, Shipping: $${shipping}, Total: $${(subtotal + shipping).toFixed(2)}`, 'success');
}

// -- Auth and storage
function initializeAuthState() {
  log('Initializing auth state', 'info');
  const u = localStorage.getItem('ntoCurrentUser');
  if (u) {
    state.currentUser = JSON.parse(u);
    log(`User found in storage: ${state.currentUser.name}`, 'success');
  } else {
    log('No user found in storage', 'info');
  }
}

function loginUser(email, pwd) {
  log(`Attempting login for: ${email}`, 'info');
  const users = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
  const u = users.find(x => x.email === email && x.password === pwd);
  
  if (u) {
    state.currentUser = { id: u.id, name: u.name, email: u.email };
    localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
    log(`Login successful for: ${u.name}`, 'success');
    return true;
  }
  
  log('Login failed: Invalid credentials', 'error');
  return false;
}

function registerUser(name, email, pw) {
  log(`Attempting to register user: ${name} (${email})`, 'info');
  const arr = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
  
  if (arr.some(x => x.email === email)) {
    log('Registration failed: Email already exists', 'error');
    return false;
  }
  
  const u = { id: Date.now().toString(), name, email, password: pw, createdAt: new Date().toISOString() };
  arr.push(u);
  localStorage.setItem('ntoUsers', JSON.stringify(arr));
  state.currentUser = { id: u.id, name: u.name, email: u.email };
  localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
  
  log(`Registration successful for: ${name}`, 'success');
  return true;
}

// -- Salesforce integration
function startSalesforce() {
  log('Starting Salesforce integration', 'info');
  let tries = 0;
  const max = 20;
  
  function check() {
    if (window.SalesforceInteractions && window.SalesforceInteractions.init) {
      log('SalesforceInteractions available', 'success');
      return initConsent();
    }
    if (++tries < max) {
      log(`Checking for SalesforceInteractions (${tries}/${max})`, 'info');
      setTimeout(check, 1000);
    } else {
      log('SalesforceInteractions SDK failed to load', 'error');
    }
  }
  check();
}

function initConsent() {
  log('Initializing Salesforce consent', 'info');
  window.SalesforceInteractions.init({
    consents: [{ provider: 'CampaignAttribution', purpose: 'Tracking', status: 'Opt In' }]
  }).then(res => {
    log('Salesforce consent initialized', 'success');
    sendIdentity();
  }).catch(err => {
    log(`Salesforce consent error: ${err}`, 'error');
  });
}

function sendIdentity() {
  log('Sending identity to Salesforce', 'info');
  window.SalesforceInteractions.sendEvent({ 
    user: { 
      attributes: { 
        eventType: 'identity', 
        email: state.currentUser?.email || '', 
        isAnonymous: !state.currentUser 
      } 
    } 
  }).then(() => {
    log('Identity sent to Salesforce', 'success');
  }).catch(err => {
    log(`Salesforce identity error: ${err}`, 'error');
  });
}

function sendSalesforceEvent(type, data) {
  if (!window.SalesforceInteractions) {
    log('Cannot send Salesforce event: SalesforceInteractions not available', 'error');
    return;
  }
  
  log(`Sending Salesforce event: ${type}`, 'info');
  
  const payload = { 
    interaction: { 
      name: 'Campaigns Events', 
      eventType: 'campaignsEvents', 
      campaignName: 'Default', 
      campaignSource: 'Default', 
      campaignContent: 'Default', 
      custom1: type, 
      custom2: data.product || data.email, 
      custom3: new Date().toISOString() 
    } 
  };
  
  window.SalesforceInteractions.sendEvent(payload)
    .then(() => {
      log(`Salesforce event sent: ${type}`, 'success');
    })
    .catch(err => {
      log(`Salesforce event error: ${err}`, 'error');
    });
}

// -- Error display
function showFormError(form, msg) {
  log(`Showing form error: ${msg}`, 'error');
  form.querySelectorAll('.form-error').forEach(e => e.remove());
  const p = document.createElement('p');
  p.className = 'form-error';
  p.textContent = msg;
  form.prepend(p);
}

function clearFormError(form) {
  log('Clearing form errors', 'info');
  form.querySelectorAll('.form-error').forEach(e => e.remove());
}

// -- Logout functionality
function showLogoutConfirmation() {
  log('Showing logout confirmation', 'event');
  if (confirm('Are you sure you want to logout?')) {
    log('User confirmed logout', 'info');
    state.currentUser = null;
    localStorage.removeItem('ntoCurrentUser');
    updateLoginButton();
    showConfirmation('Logged out successfully');
    log('User logged out successfully', 'success');
  } else {
    log('User cancelled logout', 'info');
  }
}

// -- Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  log('=== PAGE LOADED - INITIALIZING NTO PACIFIC ===', 'info');
  
  // Initialize auth state
  initializeAuthState();
  updateLoginButton();
  updateCartCount();
  
  // Login button event
  const loginBtn = $('#login-btn');
  if (loginBtn) {
    log('Attaching login button event listener', 'info');
    loginBtn.addEventListener('click', onLoginButton);
  } else {
    log('Login button not found', 'error');
  }
  
  // Cart button event
  const cartBtn = $('#cart-btn');
  if (cartBtn) {
    log('Attaching cart button event listener', 'info');
    cartBtn.addEventListener('click', onCartButton);
  } else {
    log('Cart button not found', 'error');
  }
  
  // Add to cart buttons
  const addToCartButtons = $$('.add-to-cart');
  log(`Found ${addToCartButtons.length} Add to Cart buttons`, 'info');
  addToCartButtons.forEach((btn, index) => {
    log(`Attaching Add to Cart listener to button ${index + 1}`, 'info');
    btn.addEventListener('click', onAddToCart);
  });
  
  // Notify me buttons
  const notifyButtons = $$('.notify-me');
  log(`Found ${notifyButtons.length} Notify Me buttons`, 'info');
  notifyButtons.forEach((btn, index) => {
    log(`Attaching Notify Me listener to button ${index + 1}`, 'info');
    btn.addEventListener('click', onNotifyMe);
  });
  
  // Form submissions
  const loginForm = $('#login-form');
  if (loginForm) {
    log('Attaching login form submit listener', 'info');
    loginForm.addEventListener('submit', handleLoginSubmit);
  } else {
    log('Login form not found', 'error');
  }
  
  const signupForm = $('#signup-form');
  if (signupForm) {
    log('Attaching signup form submit listener', 'info');
    signupForm.addEventListener('submit', handleSignupSubmit);
  } else {
    log('Signup form not found', 'error');
  }
  
  const newsletterForm = $('#newsletter-form-footer');
  if (newsletterForm) {
    log('Attaching newsletter form submit listener', 'info');
    newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  } else {
    log('Newsletter form not found', 'error');
  }
  
  const notifyForm = $('#notify-form');
  if (notifyForm) {
    log('Attaching notify form submit listener', 'info');
    notifyForm.addEventListener('submit', handleNotifySubmit);
  } else {
    log('Notify form not found', 'error');
  }
  
  const checkoutForm = $('#checkout-form');
  if (checkoutForm) {
    log('Attaching checkout form submit listener', 'info');
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  } else {
    log('Checkout form not found', 'error');
  }
  
  // Auth toggle links
  const showSignupLink = $('#show-signup');
  if (showSignupLink) {
    log('Attaching show signup link listener', 'info');
    showSignupLink.addEventListener('click', switchToSignup);
  } else {
    log('Show signup link not found', 'error');
  }
  
  const showLoginLink = $('#show-login');
  if (showLoginLink) {
    log('Attaching show login link listener', 'info');
    showLoginLink.addEventListener('click', switchToLogin);
  } else {
    log('Show login link not found', 'error');
  }
  
  // Checkout button in cart
  const checkoutBtn = $('#checkout-btn');
  if (checkoutBtn) {
    log('Attaching checkout button listener', 'info');
    checkoutBtn.addEventListener('click', onCheckoutClick);
  } else {
    log('Checkout button not found', 'error');
  }
  
  // Close modal buttons
  const closeModalButtons = $$('.close-modal');
  log(`Found ${closeModalButtons.length} close modal buttons`, 'info');
  closeModalButtons.forEach((btn, index) => {
    log(`Attaching close modal listener to button ${index + 1}`, 'info');
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        closeModal(modal.id);
      }
    });
  });
  
  // Close confirmation modal button
  const closeConfirmationBtn = $('.close-confirmation');
  if (closeConfirmationBtn) {
    log('Attaching close confirmation button listener', 'info');
    closeConfirmationBtn.addEventListener('click', closeConfirmationModal);
  } else {
    log('Close confirmation button not found', 'error');
  }
  
  // Shop now button
  const shopNowBtn = $('#shop-now-btn');
  if (shopNowBtn) {
    log('Attaching shop now button listener', 'info');
    shopNowBtn.addEventListener('click', () => {
      log('Shop Now button clicked, redirecting to catalog', 'event');
      window.location.href = 'catalog.html';
    });
  } else {
    log('Shop now button not found', 'error');
  }
  
  // Start Salesforce integration
  startSalesforce();
  
  log('=== INITIALIZATION COMPLETE ===', 'success');
});
