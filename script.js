// Updated script.js with null-check guards for optional elements

// Global state
const state = {
    cart: [],
    cartCount: 0,
    cartTotal: 0,
    currentUser: null,
    currentProductNotify: null
};

// DOM-ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize elements safely
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

    // Initialize auth state
    initializeAuthState();

    // Event listeners with guards
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (state.currentUser) showLogoutConfirmation();
            else openModal('login-modal');
        });
    }

    if (cartBtn) {
        cartBtn.addEventListener('click', () => {
            openModal('cart-modal');
            updateCartDisplay();
        });
    }

    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('login-modal');
            openModal('signup-modal');
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('signup-modal');
            openModal('login-modal');
        });
    }

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    if (overlay) {
        overlay.addEventListener('click', closeAllModals);
    }

    // Add to cart functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) addToCart(productCard);
        });
    });

    // Notify-me functionality
    notifyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                state.currentProductNotify = {
                    id: productCard.dataset.productId,
                    name: productCard.dataset.productName
                };
                const notifyName = document.getElementById('notify-product-name');
                if (notifyName) notifyName.textContent = state.currentProductNotify.name;
                openModal('notify-modal');
            }
        });
    });

    // Fix Continue Shopping buttons
    fixContinueShoppingButtons();

    // Checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            // existing checkout logic...
        });
    }

    // Form submissions, authenticated with guards
    if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);
    if (signupForm) signupForm.addEventListener('submit', handleSignupSubmit);
    if (notifyForm) notifyForm.addEventListener('submit', handleNotifySubmit);
    if (newsletterForm) newsletterForm.addEventListener('submit', handleNewsletterSubmit);
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Initial cart count display
    updateCartCount();
});

// ... rest of your utility functions, API tracking code, and helper functions unchanged ...
