// script.js — Enhanced Salesforce event queuing + existing functionality preserved
'use strict';

// -- Global state
const state = {
  cart: [],
  cartCount: 0,
  cartTotal: 0,
  currentUser: null,
  currentProductNotify: null,
  salesforceInitialized: false,  // Track if Salesforce init succeeded
  identitySent: false,          // Track if identity event sent
  sfEventQueue: []              // Queue events fired before ready
};

// -- Logging helper
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}]`;
  switch (type) {
    case 'error': console.error(`${prefix} ❌ ${message}`); break;
    case 'success': console.log(`${prefix} ✅ ${message}`); break;
    case 'info': console.log(`${prefix} ℹ️ ${message}`); break;
    case 'event': console.log(`${prefix} 🎯 EVENT: ${message}`); break;
    default: console.log(`${prefix} ${message}`);
  }
}

// -- DOM selectors
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.from(document.querySelectorAll(sel)); }

// -- Modal controls
function openModal(id) {
  log(`Opening modal: ${id}`, 'event');
  const m = document.getElementById(id);
  const o = $('.overlay');
  if (m) m.style.display='block';
  if (o) o.style.display='block';
}
function closeModal(id) {
  log(`Closing modal: ${id}`, 'event');
  const m = document.getElementById(id);
  if (m) m.style.display='none';
  const any = $$('.modal').some(x=>x.style.display==='block');
  const o = $('.overlay'); if (!any && o) o.style.display='none';
}
function closeAllModals() {
  log('Closing all modals','event');
  $$('.modal').forEach(m=>m.style.display='none');
  const o = $('.overlay'); if (o) o.style.display='none';
}

// -- Confirmation
function showConfirmation(msg) {
  log(`Confirmation: ${msg}`,'event');
  const t = $('#confirmation-text'); if (t) t.textContent=msg;
  openModal('confirmation-modal');
}
function closeConfirmationModal() {
  log('Closing confirmation modal','event');
  closeModal('confirmation-modal');
}

// -- Salesforce init + identity
function startSalesforce() {
  log('Starting Salesforce SDK','info');
  let tries=0, max=20;
  (function check(){
    if (window.SalesforceInteractions && typeof window.SalesforceInteractions.init==='function'){
      log('SalesforceInteractions loaded','success'); initConsent();
    } else if(++tries<max){
      log(`Retrying SDK load (${tries}/${max})`,'info'); setTimeout(check,1000);
    } else log('Failed to load SalesforceInteractions SDK','error');
  })();
}
function initConsent(){
  log('Initializing consent','info');
  window.SalesforceInteractions.init({
    consents:[{provider:'CampaignAttribution',purpose:'Tracking',status:'Opt In'}]
  })
  .then(res=>{ log('Consent OK','success'); state.salesforceInitialized=true; sendIdentity(); })
  .catch(e=>log(`Consent error: ${e}`,'error'));
}
function sendIdentity(){
  if(!state.salesforceInitialized){ log('Cannot send identity; SDK not ready','error'); return; }
  if(state.identitySent){ log('Identity already sent; skipping','info'); return; }
  log('Sending identity event','info');
  window.SalesforceInteractions.sendEvent({
    user:{attributes:{eventType:'identity',email:state.currentUser?.email||'',isAnonymous:!state.currentUser}}
  })
    .then(()=>{
      log('Identity sent','success'); state.identitySent=true; drainSfQueue();
    })
    .catch(e=>log(`Identity error: ${e}`,'error'));
}
function canSendSf(){ return state.salesforceInitialized && state.identitySent; }
function drainSfQueue(){
  log(`Draining SF queue (${state.sfEventQueue.length} events)`,'info');
  state.sfEventQueue.forEach(evt=>{ _sendSf(evt.type,evt.data); });
  state.sfEventQueue=[];
}
function _sendSf(type,data){
  log(`Sending SF event: ${type}`,'event');
  // UTM fallback
  const urlParams=new URLSearchParams(window.location.search);
  const utm_source=urlParams.get('utm_source')||'Default';
  const utm_campaign=urlParams.get('utm_campaign')||'Default';
  const utm_content=urlParams.get('utm_content')||'Default';
  const payload={interaction:{
    name:'Campaigns Events',eventType:'campaignsEvents',
    campaignName:utm_campaign,campaignSource:utm_source,campaignContent:utm_content,
    custom1:type,custom2:data.product||data.email,custom3:new Date().toISOString()
  }};
  window.SalesforceInteractions.sendEvent(payload)
    .then(r=>log(`SF ${type} OK`,'success'))
    .catch(e=>log(`SF ${type} error: ${e}`,'error'));
}
function sendSalesforceEvent(type,data){
  if(!window.SalesforceInteractions){ log('SF SDK missing; cannot send','error'); return; }
  if(canSendSf()){ _sendSf(type,data); }
  else { log(`Queuing SF event: ${type}`,'info'); state.sfEventQueue.push({type,data}); }
}

// -- Authentication toggles
function switchToSignup(e){ e.preventDefault(); closeModal('login-modal'); openModal('signup-modal'); }
function switchToLogin(e){ e.preventDefault(); closeModal('signup-modal'); openModal('login-modal'); }
function onLoginButton(){ log('Login button clicked','event'); if(state.currentUser) showLogoutConfirmation(); else openModal('login-modal'); }
function showLogoutConfirmation(){
  log('Prompting logout','event');
  if(confirm('Logout?')){
    log('Confirmed logout','info');
    state.currentUser=null; state.identitySent=false; localStorage.removeItem('ntoCurrentUser');
    updateLoginButton(); sendIdentity(); showConfirmation('Logged out');
  } else log('Logout canceled','info');
}

// -- Cart actions
function onCartButton(){ log('Cart button clicked','event'); openModal('cart-modal'); updateCartDisplay(); }
function onAddToCart(e){ log('Add to cart','event');
  const card=e.target.closest('.product-card'); if(!card){ log('Card not found','error');return; }
  const id=card.dataset.productId,name=card.dataset.productName,price=parseFloat(card.dataset.productPrice);
  const ex=state.cart.find(x=>x.id===id);
  if(ex){ ex.quantity++; log(`Incremented ${name}`,'success'); } else { state.cart.push({id,name,price,quantity:1}); log(`Added ${name}`,'success'); }
  updateCartCount(); updateCartDisplay(); showConfirmation(`${name} added to cart`);
  sendSalesforceEvent('product_add_to_cart',{product:name});
}

// -- Notify Me
function onNotifyMe(e){ log('Notify me','event');
  const card=e.target.closest('.product-card'); if(!card){ log('Card missing','error');return; }
  state.currentProductNotify={id:card.dataset.productId,name:card.dataset.productName};
  $('#notify-product-name').textContent=state.currentProductNotify.name;
  openModal('notify-modal');
}

// -- Checkout
function onCheckoutClick(){ log('Checkout click','event');
  if(state.currentUser) { closeModal('cart-modal'); openModal('checkout-modal'); updateCheckoutSummary(); }
  else { closeModal('cart-modal'); openModal('login-modal'); }
}

function updateCheckoutSummary(){ log('Updating checkout summary','info');
  const el=$('.order-summary'); if(!el){ log('Summary el missing','error');return; }
  let html='<h3>Order Summary</h3>',subtotal=0;
  state.cart.forEach(it=>{ subtotal+=it.price*it.quantity; html+=`<div><span>${it.name} x${it.quantity}</span><span>$${(it.price*it.quantity).toFixed(2)}</span></div>`; });
  const shipping=subtotal>0?10:0,total=subtotal+shipping;
  html+=`<div>Subtotal: $${subtotal.toFixed(2)}</div><div>Shipping: $${shipping.toFixed(2)}</div><div>Total: $${total.toFixed(2)}</div>`;
  el.innerHTML=html; log('Checkout summary set','success');
}

// -- Form handlers
function handleLoginSubmit(e){e.preventDefault();log('Login submit','event');clearFormError(e.target);
  const email=$('#email').value,pwd=$('#password').value; log(`Login attempt ${email}`,'info');
  if(loginUser(email,pwd)){ log('Login ok','success');sendIdentity();closeModal('login-modal');updateLoginButton();showConfirmation('Logged in');e.target.reset(); }
  else{ log('Login fail','error'); showFormError(e.target,'Invalid credentials'); }}
function handleSignupSubmit(e){e.preventDefault();log('Signup submit','event');clearFormError(e.target);
  const name=$('#name').value,email=$('#signup-email').value,pw=$('#signup-password').value,cpw=$('#confirm-password').value;
  if(pw!==cpw){log('PW mismatch','error');return showFormError(e.target,'Passwords mismatch');}
  if(!registerUser(name,email,pw)){log('Email exists','error');return showFormError(e.target,'Email already registered');}
  log('Signup ok','success');sendIdentity();closeModal('signup-modal');updateLoginButton();showConfirmation('Account created');e.target.reset();}
function handleNewsletterSubmit(e){e.preventDefault();const email=e.target.querySelector('input').value;log(`Newsletter ${email}`,'info');
  sendSalesforceEvent('Newsletter Signup',{email});showConfirmation('Thanks for subscribing');e.target.reset();}
function handleNotifySubmit(e){e.preventDefault();log('Notify submit','event');const email=$('#notify-email').value;log(`Notify ${email}`,'info');closeModal('notify-modal');showConfirmation(`We'll notify when ${state.currentProductNotify.name}`);e.target.reset();}
function handleCheckoutSubmit(e){e.preventDefault();log('Checkout submit','event');
  const total=state.cart.reduce((s,i)=>s+i.price*i.quantity,0);log(`Order total $${total}`,'info');
  sendSalesforceEvent('purchase_complete',{product:`Order Total: $${total}`});closeModal('checkout-modal');showConfirmation('Order placed');state.cart=[];updateCartCount();updateCartDisplay();e.target.reset();}

// -- UI updates
function updateLoginButton(){log('Updating login button','info');const btn=$('#login-btn');if(!btn)return;btn.textContent=state.currentUser?state.currentUser.name.split(' ')[0]:'Login';}
function updateCartCount(){state.cartCount=state.cart.reduce((s,i)=>s+i.quantity,0);const el=$('.cart-count');if(el)el.textContent=state.cartCount;}
function updateCartDisplay(){log('Updating cart display','info');const itemsEl=$('#cart-items'),subEl=$('#cart-subtotal'),shipEl=$('#cart-shipping'),totEl=$('#cart-total');if(!itemsEl||!subEl||!shipEl||!totEl){log('Cart els missing','error');return;}itemsEl.innerHTML='';if(!state.cart.length){itemsEl.innerHTML='<p>Your cart is empty.</p>';subEl.textContent='$0.00';shipEl.textContent='$0.00';totEl.textContent='$0.00';$('#checkout-btn').disabled=true;return;}let subtotal=0;state.cart.forEach(item=>{subtotal+=item.price*item.quantity;const row=document.createElement('div');row.className='cart-item';row.innerHTML=`<span>${item.name} x${item.quantity}</span><span>$${(item.price*item.quantity).toFixed(2)}</span>`;itemsEl.append(row);} );const shipping=subtotal>0?10:0;subEl.textContent=`$${subtotal.toFixed(2)}`;shipEl.textContent=`$${shipping.toFixed(2)}`;totEl.textContent=`$${(subtotal+shipping).toFixed(2)}`;$('#checkout-btn').disabled=false;}

// -- Auth & storage
function initializeAuthState(){log('Init auth state','info');const u=localStorage.getItem('ntoCurrentUser');if(u){state.currentUser=JSON.parse(u);log(`Found user ${state.currentUser.name}`,'success');}else log('No user in storage','info');}
function loginUser(email,pwd){log(`Login ${email}`,'info');const users=JSON.parse(localStorage.getItem('ntoUsers')||'[]');const u=users.find(x=>x.email===email&&x.password===pwd);if(u){state.currentUser={id:u.id,name:u.name,email:u.email};localStorage.setItem('ntoCurrentUser',JSON.stringify(state.currentUser));return true;}return false;}
function registerUser(name,email,pw){log(`Register ${name}`,'info');const arr=JSON.parse(localStorage.getItem('ntoUsers')||'[]');if(arr.some(x=>x.email===email))return false;const u={id:Date.now().toString(),name,email,password:pw,createdAt:new Date().toISOString()};arr.push(u);localStorage.setItem('ntoUsers',JSON.stringify(arr));state.currentUser={id:u.id,name:u.name,email:u.email};localStorage.setItem('ntoCurrentUser',JSON.stringify(state.currentUser));return true;}

// -- Form error display
function showFormError(form,msg){log(`Form error: ${msg}`,'error');form.querySelectorAll('.form-error').forEach(e=>e.remove());const p=document.createElement('p');p.className='form-error';p.textContent=msg;form.prepend(p);}function clearFormError(form){form.querySelectorAll('.form-error').forEach(e=>e.remove());}

// -- On DOM ready
document.addEventListener('DOMContentLoaded',()=>{
  log('=== PAGE LOAD ===','info'); initializeAuthState(); updateLoginButton(); updateCartCount();
  // UI bindings
  const loginBtn=$('#login-btn'); if(loginBtn)loginBtn.addEventListener('click',onLoginButton);
  const cartBtn=$('#cart-btn'); if(cartBtn)cartBtn.addEventListener('click',onCartButton);
  const overlay=$('.overlay'); if(overlay)overlay.addEventListener('click',closeAllModals);
  $$('.close-modal').forEach(btn=>btn.addEventListener('click',e=>closeModal(e.target.closest('.modal').id)));
  $$('.close-confirmation').forEach(btn=>btn.addEventListener('click',closeConfirmationModal));
  $$('.add-to-cart').forEach(btn=>btn.addEventListener('click',onAddToCart));
  $$('.notify-me').forEach(btn=>btn.addEventListener('click',onNotifyMe));
  const checkoutBtn=$('#checkout-btn'); if(checkoutBtn)checkoutBtn.addEventListener('click',onCheckoutClick);
  const loginForm=$('#login-form'); if(loginForm)loginForm.addEventListener('submit',handleLoginSubmit);
  const signupForm=$('#signup-form'); if(signupForm)signupForm.addEventListener('submit',handleSignupSubmit);
  const newsletterForms=['#newsletter-form','#newsletter-form-footer']; newsletterForms.forEach(sel=>{const f=$(sel); if(f)f.addEventListener('submit',handleNewsletterSubmit);});
  const notifyForm=$('#notify-form'); if(notifyForm)notifyForm.addEventListener('submit',handleNotifySubmit);
  const checkoutForm=$('#checkout-form'); if(checkoutForm)checkoutForm.addEventListener('submit',handleCheckoutSubmit);
  const showSignupLink=$('#show-signup'); if(showSignupLink)showSignupLink.addEventListener('click',switchToSignup);
  const showLoginLink=$('#show-login'); if(showLoginLink)showLoginLink.addEventListener('click',switchToLogin);
  startSalesforce(); log('=== INIT COMPLETE ===','success');
});
