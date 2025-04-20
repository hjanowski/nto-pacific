// Main JavaScript for NTO Pacific website

// Global state
const state = {
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    currentUser: null,
    currentProductNotify: null
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements
    const loginBtn = document.getElementById('login-btn');
    const cartBtn = document.getElementById('cart-btn');
    const modals = document.querySelectorAll('.modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const overlay = document.querySelector('.overlay');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const notifyButtons = document.querySelectorAll('.notify-me');
    const checkoutBtn = document.getElementById('checkout-btn');
    const closeConfirmationButtons = document.querySelectorAll('.close-confirmation');

    // Forms
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const checkoutForm = document.getElementById('checkout-form');
    const notifyForm = document.getElementById('notify-form');
    const newsletterForm = document.getElementById('newsletter-form');

    // Initialize event tracking
    initializeEventTracking();

    // Event Listeners
    loginBtn.addEventListener('click', () => {
        openModal('login-modal');
        trackEvent('login_attempt', { source: 'header' });
    });

    cartBtn.addEventListener('click', () => {
        openModal('cart-modal');
        updateCartDisplay();
    });

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('signup-modal');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('signup-modal');
        openModal('login-modal');
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            close
