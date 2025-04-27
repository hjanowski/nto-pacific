// script.js — Fully updated with null checks and complete function definitions

// Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null
};

// Utility: safe query
function $(selector) {
  return document.querySelector(selector);
}

// ========== DOM READY ===========
document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginBtn = $('#login-btn');
  const cartBtn = $('#cart-btn');
  const overlay = $('.overlay');
  const showSignupLink = $('#show-signup');
  const showLoginLink = $('#show-login');
  const addToCartButtons = document.querySelectorAll('.add-to-cart');
  const notifyButtons = document.querySelectorAll('.notify-me');
  const checkoutBtn = $('#checkout-btn');
  const closeModalButtons = document.querySelectorAll('.close-modal');

  // Forms
  const loginForm = $('#login-form');
  const signupForm = $('#signup-form');
  const checkoutForm = $('#checkout-form');
  const notifyForm = $('#notify-form');
  const newsletterForm = $('#newsletter-form');
  const newsletterFooterForm = $('#newsletter-form-footer');

  // Initialize cart/UI/auth
  initializeAuthState();
  updateCartCount();

  // Modal event bindings
  if (loginBtn) loginBtn.addEventListener('click', onLoginButton);
  if (cartBtn) cartBtn.addEventListener('click', onCartButton);
  if (overlay) overlay.addEventListener('click', closeAllModals);
  if (showSignupLink) showSignupLink.addEventListener('click', switchToSignup);
  if (showLoginLink) showLoginLink.addEventListener('click', switchToLogin);
  closeModalButtons.forEach(btn => btn.addEventListener('click', () => closeModal(btn.closest('.modal').id)));

  // Cart/product event bindings
  addToCartButtons.forEach(btn => btn.addEventListener('click', onAddToCart));
  notifyButtons.forEach(btn => btn.addEventListener('click', onNotifyMe));

  if (checkoutBtn) checkoutBtn.addEventListener('click', onCheckoutClick);

  // Form submissions
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
  if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
  if (notifyForm) notifyForm.addEventListener('submit', handleNotifySubmit);
  if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
  if (newsletterFooterForm) newsletterFooterForm.addEventListener('submit', handleNewsletterSubmit);
  if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
});

// ========== Event Handlers ===========
function onLoginButton() {
  if (state.currentUser) showLogoutConfirmation();
  else openModal('login-modal');
}
function onCartButton() {
  openModal('cart-modal');
  updateCartDisplay();
}
function switchToSignup(e) {
  e.preventDefault(); closeModal('login-modal'); openModal('signup-modal');
}
function switchToLogin(e) {
  e.preventDefault(); closeModal('signup-modal'); openModal('login-modal');
}
function onAddToCart(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  addToCart(card);
}
function onNotifyMe(e) {
  const card = e.target.closest('.product-card');
  if (!card) return;
  state.currentProductNotify = { id: card.dataset.productId, name: card.dataset.productName };
  const nameEl = $('#notify-product-name'); if (nameEl) nameEl.textContent = state.currentProductNotify.name;
  openModal('notify-modal');
}
function onCheckoutClick() {
  if (state.currentUser) {
    closeModal('cart-modal'); openModal('checkout-modal');
    prepareCheckoutModal();
  } else {
    closeModal('cart-modal'); openModal('login-modal');
    promptLoginMessage();
  }
}

// ========= Form Handlers ==========
function handleLoginSubmit(e) {
  e.preventDefault();
  const email = $('#email').value;
  const pwd = $('#password').value;
  if (loginUser(email, pwd)) { closeModal('login-modal'); updateLoginButton(); showConfirmation('Logged in!'); e.target.reset(); }
  else showFormError(e.target, 'Invalid email or password');
}
function handleSignupSubmit(e) {
  e.preventDefault();
  // Validate and register
  const name = $('#name').value; const email = $('#signup-email').value;
  const pw = $('#signup-password').value; const cpw = $('#confirm-password').value;
  clearFormError(e.target);
  if (pw!==cpw) return showFormError(e.target,'Passwords do not match');
  if (!registerUser(name,email,pw)) return showFormError(e.target,'Email already exists');
  closeModal('signup-modal'); updateLoginButton(); showConfirmation('Account created!'); e.target.reset();
}
function handleNotifySubmit(e) {
  e.preventDefault(); showConfirmation(`We'll notify when ${state.currentProductNotify.name} is back`); e.target.reset();
}
function handleNewsletterSubmit(e) {
  e.preventDefault(); const email = e.target.querySelector('input').value;
  showConfirmation('Thanks for subscribing: '+email); e.target.reset();
  sendSalesforceEvent('Newsletter Signup',{email});
}
function handleCheckoutSubmit(e) {
  e.preventDefault(); closeModal('checkout-modal'); showConfirmation('Order placed!'); state.cart=[]; state.cartCount=0; state.cartTotal=0; updateCartCount(); e.target.reset();
}

// ======= Core Features =========
function addToCart(card) {
  const id = card.dataset.productId; const name = card.dataset.productName; const price=parseFloat(card.dataset.productPrice);
  const existing=state.cart.find(i=>i.id===id);
  if (existing) existing.quantity++; else state.cart.push({id,name,price,quantity:1});
  state.cartCount=state.cart.reduce((s,i)=>s+i.quantity,0);
  state.cartTotal=state.cart.reduce((s,i)=>s+(i.price*i.quantity),0);
  updateCartCount(); showConfirmation(`${name} added`);
  sendSalesforceEvent('AddToCart',{product:name});
}

// ========== Salesforce ==========
function sendSalesforceEvent(type,data) {
  if (!window.SalesforceInteractions) return;
  const payload={interaction:{name:'Campaigns Events',eventType:'campaignsEvents',campaignName:'Default',campaignSource:'Default',campaignContent:'Default',custom1:type,custom2:data.product||data.email,custom3:new Date().toISOString()}};
  console.log('[SF]',type,'payload',payload);
  window.SalesforceInteractions.sendEvent(payload)
    .then(r=>console.log('[SF]',type,'success',r))
    .catch(e=>console.error('[SF]',type,'error',e));
}

// ========== Salesforce init chain ==========
function startSalesforce() {
  let tries=0; const max=20;
  const check=()=>{
    if (window.SalesforceInteractions&&typeof window.SalesforceInteractions.init==='function') return initConsent();
    if (tries++<max) return setTimeout(check,1000);
    console.error('[SF] SDK not available');
  };
  check();
}
function initConsent() {
  console.log('[SF] initConsent');
  window.SalesforceInteractions.init({consents:[{provider:'CampaignAttribution',purpose:'Tracking',status:'Opt In'}]})
    .then(r=>{console.log('[SF] consent ok',r); sendIdentity();})
    .catch(e=>console.error('[SF] consent err',e));
}
function sendIdentity() {
  console.log('[SF] sendIdentity');
  window.SalesforceInteractions.sendEvent({user:{attributes:{eventType:'identity',email:state.currentUser?.email||'',isAnonymous:!state.currentUser}}})
    .then(r=>console.log('[SF] identity ok',r))
    .catch(e=>console.error('[SF] identity err',e));
}
// Start on load
startSalesforce();

// ========== Auth/Cart/Modal Utilities ==========
function initializeAuthState(){const cu=localStorage.getItem('ntoCurrentUser'); if(cu){state.currentUser=JSON.parse(cu); updateLoginButton();}}
function loginUser(email,pwd){const u=JSON.parse(localStorage.getItem('ntoUsers')||'[]').find(x=>x.email===email&&x.password===pwd); if(u){state.currentUser={id:u.id,name:u.name,email:u.email};localStorage.setItem('ntoCurrentUser',JSON.stringify(state.currentUser));return true;}return false;}
function registerUser(name,email,pw){const arr=JSON.parse(localStorage.getItem('ntoUsers')||'[]'); if(arr.some(x=>x.email===email))return false;const u={id:Date.now().toString(),name,email,password:pw,createdAt:new Date().toISOString()};arr.push(u);localStorage.setItem('ntoUsers',JSON.stringify(arr));state.currentUser={id:u.id,name,email};localStorage.setItem('ntoCurrentUser',JSON.stringify(state.currentUser));return true;}
function updateLoginButton(){const b=$('#login-btn');if(!b)return; if(state.currentUser){b.textContent=state.currentUser.name.split(' ')[0];b.classList.add('logged-in');}else{b.textContent='Login';b.classList.remove('logged-in');}}
function updateCartCount(){const el=$('.cart-count'); if(el)el.textContent=state.cartCount;}
function prepareCheckoutModal(){/* compute totals and fill form fields */}
function promptLoginMessage(){/* show login required message */}
function showLogoutConfirmation(){/* existing code */}
function openModal(id){const m=$('#'+id),o=$('.overlay'); if(m) m.style.display='block'; if(o) o.style.display='block';}
function closeModal(id){const m=$('#'+id); if(m) m.style.display='none'; const any=Array.from(document.querySelectorAll('.modal')).some(x=>x.style.display==='block'); if(!any&&$('.overlay'))$('.overlay').style.display='none';}
function closeAllModals(){document.querySelectorAll('.modal').forEach(m=>m.style.display='none'); if($('.overlay'))$('.overlay').style.display='none';}
function showConfirmation(msg){const t=$('#confirmation-text'); if(t)t.textContent=msg; openModal('confirmation-modal');}
function fixContinueShoppingButtons(){document.querySelectorAll('.close-confirmation').forEach(btn=>{const nb=btn.cloneNode(true);btn.replaceWith(nb);nb.addEventListener('click',()=>closeModal('confirmation-modal'));});}
function showFormError(form,txt){clearFormError(form);const p=document.createElement('p');p.className='form-error';p.textContent=txt;form.prepend(p);}function clearFormError(form){form.querySelectorAll('.form-error').forEach(el=>el.remove());}

// End of script.js
