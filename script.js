// Complete script.js file with added authentication functionality

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

    // Initialize auth state
    initializeAuthState();
    
    // Event Listeners
    loginBtn.addEventListener('click', () => {
        if (state.currentUser) {
            // If user is logged in, show logout confirmation
            showLogoutConfirmation();
        } else {
            // If not logged in, show login modal
            openModal('login-modal');
        }
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
            // Find the closest modal
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });

    overlay.addEventListener('click', () => {
        closeAllModals();
    });

    // Add to cart functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                addToCart(productCard);
            }
        });
    });

    // Notify me functionality
    notifyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                state.currentProductNotify = {
                    id: productCard.dataset.productId,
                    name: productCard.dataset.productName
                };
                document.getElementById('notify-product-name').textContent = state.currentProductNotify.name;
                openModal('notify-modal');
            }
        });
    });

    // Checkout button
   // Checkout button
checkoutBtn.addEventListener('click', () => {
    if (state.currentUser) {
        // If user is logged in, proceed to checkout
        closeModal('cart-modal');
        openModal('checkout-modal');
        
        // Calculate the total including shipping
        const subtotal = state.cartTotal;
        const shipping = subtotal > 0 ? 10 : 0; // Fixed shipping cost for simplicity
        const total = subtotal + shipping;
        
        // Create a detailed order summary
        const orderSummary = document.querySelector('.order-summary');
        orderSummary.innerHTML = ''; // Clear previous content
        
        // Add heading
        const heading = document.createElement('h3');
        heading.textContent = 'Order Summary';
        orderSummary.appendChild(heading);
        
        // Add item list
        if (state.cart.length > 0) {
            const itemsList = document.createElement('div');
            itemsList.classList.add('order-items');
            
            state.cart.forEach(item => {
                const itemRow = document.createElement('div');
                itemRow.classList.add('order-item');
                itemRow.innerHTML = `
                    <span>${item.name} × ${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                `;
                itemsList.appendChild(itemRow);
            });
            
            orderSummary.appendChild(itemsList);
            
            // Add subtotal
            const subtotalRow = document.createElement('div');
            subtotalRow.classList.add('order-subtotal');
            subtotalRow.innerHTML = `
                <span>Subtotal</span>
                <span>$${subtotal.toFixed(2)}</span>
            `;
            orderSummary.appendChild(subtotalRow);
            
            // Add shipping
            const shippingRow = document.createElement('div');
            shippingRow.classList.add('order-shipping');
            shippingRow.innerHTML = `
                <span>Shipping</span>
                <span>$${shipping.toFixed(2)}</span>
            `;
            orderSummary.appendChild(shippingRow);
            
            // Add total
            const totalRow = document.createElement('div');
            totalRow.classList.add('order-total-row');
            totalRow.innerHTML = `
                <span>Total</span>
                <span id="order-total">$${total.toFixed(2)}</span>
            `;
            orderSummary.appendChild(totalRow);
        } else {
            // If cart is empty (shouldn't happen normally)
            const emptyMessage = document.createElement('p');
            emptyMessage.textContent = 'Your cart is empty.';
            orderSummary.appendChild(emptyMessage);
        }
        
        // Pre-fill shipping name with user's name if available
        if (state.currentUser.name) {
            document.getElementById('shipping-name').value = state.currentUser.name;
        }
    } else {
        // If not logged in, prompt to login
        closeModal('cart-modal');
        openModal('login-modal');
        // Show message that login is required
        const loginForm = document.getElementById('login-form');
        const message = document.createElement('p');
        message.classList.add('error-message');
        message.textContent = 'Please login to proceed with checkout';
        message.style.color = 'var(--accent-aqua)';
        message.style.textAlign = 'center';
        message.style.marginBottom = '1rem';
        
        // Check if message already exists
        const existingMessage = loginForm.querySelector('.error-message');
        if (!existingMessage) {
            loginForm.prepend(message);
        }
    }
});
    // ========== Authentication Form Submissions ==========
    
    // Login Form
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (loginUser(email, password)) {
            // Success
            closeModal('login-modal');
            updateLoginButton();
            showConfirmation('You have successfully logged in!');
            
            // Reset form
            loginForm.reset();
        } else {
            // Error - show message
            const errorElement = document.createElement('p');
            errorElement.classList.add('form-error');
            errorElement.textContent = 'Invalid email or password';
            errorElement.style.color = 'red';
            errorElement.style.textAlign = 'center';
            errorElement.style.marginTop = '1rem';
            
            // Remove previous error if exists
            const existingError = loginForm.querySelector('.form-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Add error message to form
            loginForm.appendChild(errorElement);
        }
    });
    
    // Signup Form
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Reset any previous errors
        const existingError = signupForm.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Validate passwords match
        if (password !== confirmPassword) {
            const errorElement = document.createElement('p');
            errorElement.classList.add('form-error');
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.color = 'red';
            errorElement.style.textAlign = 'center';
            errorElement.style.marginTop = '1rem';
            signupForm.appendChild(errorElement);
            return;
        }
        
        // Check if email already exists
        const users = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
        if (users.some(user => user.email === email)) {
            const errorElement = document.createElement('p');
            errorElement.classList.add('form-error');
            errorElement.textContent = 'Email already registered';
            errorElement.style.color = 'red';
            errorElement.style.textAlign = 'center';
            errorElement.style.marginTop = '1rem';
            signupForm.appendChild(errorElement);
            return;
        }
        
        // Create new user
        if (registerUser(name, email, password)) {
            // Success
            closeModal('signup-modal');
            updateLoginButton();
            showConfirmation('Account created successfully! You are now logged in.');
            
            // Reset form
            signupForm.reset();
        }
    });

    // Notify form submission
    notifyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('notify-email').value;
        
        // In a real app, this would send the data to the server
        // For simulation, just show confirmation
        closeModal('notify-modal');
        showConfirmation(`We'll notify you when ${state.currentProductNotify.name} is back in stock!`);
        notifyForm.reset();
    });

    // Newsletter form submission
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        
        // In a real app, this would send the data to the server
        // For simulation, just show confirmation
        showConfirmation('Thank you for subscribing to our newsletter!');
        newsletterForm.reset();
    });

    // Checkout form submission
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // In a real app, this would process the payment and order
        // For simulation, just show confirmation
        closeModal('checkout-modal');
        showConfirmation('Your order has been placed! Thank you for your purchase.');
        
        // Clear cart
        state.cart = [];
        state.cartCount = 0;
        state.cartTotal = 0;
        updateCartCount();
        
        // Reset form
        checkoutForm.reset();
    });
});

// ========== Authentication Functions ==========

function initializeAuthState() {
    // Check if user is already logged in
    const currentUser = localStorage.getItem('ntoCurrentUser');
    if (currentUser) {
        state.currentUser = JSON.parse(currentUser);
        updateLoginButton();
    }
}

function updateLoginButton() {
    const loginBtn = document.getElementById('login-btn');
    
    if (state.currentUser) {
        // User is logged in
        loginBtn.textContent = state.currentUser.name.split(' ')[0] || 'Account';
        loginBtn.classList.add('logged-in');
    } else {
        // User is logged out
        loginBtn.textContent = 'Login';
        loginBtn.classList.remove('logged-in');
    }
}

function registerUser(name, email, password) {
    try {
        // Get existing users or create empty array
        const users = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
        
        // Create new user object (in a real app, password would be hashed)
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password, // In a real app, never store plain text passwords!
            createdAt: new Date().toISOString()
        };
        
        // Add to users array
        users.push(newUser);
        
        // Save back to localStorage
        localStorage.setItem('ntoUsers', JSON.stringify(users));
        
        // Set as current user
        state.currentUser = { id: newUser.id, name, email };
        localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
        
        return true;
    } catch (error) {
        console.error('Error registering user:', error);
        return false;
    }
}

function loginUser(email, password) {
    try {
        // Get users from localStorage
        const users = JSON.parse(localStorage.getItem('ntoUsers') || '[]');
        
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Set as current user (don't include password in session)
            state.currentUser = { id: user.id, name: user.name, email: user.email };
            localStorage.setItem('ntoCurrentUser', JSON.stringify(state.currentUser));
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error logging in user:', error);
        return false;
    }
}

function logoutUser() {
    // Clear current user
    state.currentUser = null;
    localStorage.removeItem('ntoCurrentUser');
    updateLoginButton();
    showConfirmation('You have been logged out successfully.');
}

function showLogoutConfirmation() {
    // Create confirmation modal content
    document.getElementById('confirmation-text').textContent = `${state.currentUser.name}, are you sure you want to log out?`;
    
    // Change the continue shopping button to a logout button
    const continueButton = document.querySelector('.close-confirmation');
    continueButton.textContent = 'Cancel';
    
    // Add logout button if it doesn't exist
    let logoutButton = document.querySelector('#logout-confirm-btn');
    if (!logoutButton) {
        logoutButton = document.createElement('button');
        logoutButton.id = 'logout-confirm-btn';
        logoutButton.classList.add('btn-secondary', 'btn-full');
        logoutButton.style.marginTop = '10px';
        logoutButton.textContent = 'Log Out';
        
        const confirmationMessage = document.querySelector('.confirmation-message');
        confirmationMessage.appendChild(logoutButton);
        
        // Add event listener
        logoutButton.addEventListener('click', () => {
            logoutUser();
            closeModal('confirmation-modal');
            
            // Reset the continue button text
            continueButton.textContent = 'Continue Shopping';
        });
    } else {
        // Button exists, make sure it's visible
        logoutButton.style.display = 'block';
    }
    
    openModal('confirmation-modal');
}

// ========== Utility Functions ==========

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.querySelector('.overlay');
    
    if (modal) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = 'none';
        
        // Only hide overlay if no other modals are open
        if (!document.querySelector('.modal[style*="display: block"]')) {
            document.querySelector('.overlay').style.display = 'none';
        }
        
        // Reset any form errors
        const form = modal.querySelector('form');
        if (form) {
            const errorElements = form.querySelectorAll('.form-error');
            errorElements.forEach(el => el.remove());
        }
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.querySelector('.overlay').style.display = 'none';
}

function showConfirmation(message) {
    const confirmationText = document.getElementById('confirmation-text');
    confirmationText.textContent = message;
    
    // Reset the continue button text if needed
    const continueButton = document.querySelector('.close-confirmation');
    if (continueButton) {
        continueButton.textContent = 'Continue Shopping';
    }
    
    // Hide logout button if present
    const logoutButton = document.querySelector('#logout-confirm-btn');
    if (logoutButton) {
        logoutButton.style.display = 'none';
    }
    
    openModal('confirmation-modal');
}

function addToCart(productCard) {
    const productId = productCard.dataset.productId;
    const productName = productCard.dataset.productName;
    const productPrice = parseFloat(productCard.dataset.productPrice);
    
    // Check if product is already in cart
    const existingProduct = state.cart.find(item => item.id === productId);
    
    if (existingProduct) {
        // Increment quantity
        existingProduct.quantity += 1;
    } else {
        // Add new product to cart
        state.cart.push({
            id: productId,
            name: productName,
            price: productPrice,
            quantity: 1
        });
    }
    
    // Update cart count and total
    state.cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
    state.cartTotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Update UI
    updateCartCount();
    
    // Show confirmation
    showConfirmation(`${productName} has been added to your cart.`);
}

function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    cartCount.textContent = state.cartCount;
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartShipping = document.getElementById('cart-shipping');
    const cartTotal = document.getElementById('cart-total');
    
    // Clear previous items
    cartItems.innerHTML = '';
    
    if (state.cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
        cartSubtotal.textContent = '$0.00';
        cartShipping.textContent = '$0.00';
        cartTotal.textContent = '$0.00';
        
        // Disable checkout button
        document.getElementById('checkout-btn').disabled = true;
        document.getElementById('checkout-btn').style.opacity = '0.5';
        
        return;
    }
    
    // Enable checkout button
    document.getElementById('checkout-btn').disabled = false;
    document.getElementById('checkout-btn').style.opacity = '1';
    
    // Add cart items
    state.cart.forEach(item => {
        const cartItemElement = document.createElement('div');
        cartItemElement.classList.add('cart-item');
        
        cartItemElement.innerHTML = `
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                <span class="quantity-number">${item.quantity}</span>
                <button class="quantity-btn increase" data-id="${item.id}">+</button>
            </div>
        `;
        
        cartItems.appendChild(cartItemElement);
    });
    
    // Add event listeners for quantity buttons
    document.querySelectorAll('.quantity-btn.decrease').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.id;
            decreaseQuantity(productId);
            updateCartDisplay();
        });
    });
    
    document.querySelectorAll('.quantity-btn.increase').forEach(button => {
        button.addEventListener('click', () => {
            const productId = button.dataset.id;
            increaseQuantity(productId);
            updateCartDisplay();
        });
    });
    
    // Update totals
    const subtotal = state.cartTotal;
    const shipping = subtotal > 0 ? 10 : 0; // Fixed shipping cost for simplicity
    const total = subtotal + shipping;
    
    cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
    cartShipping.textContent = `$${shipping.toFixed(2)}`;
    cartTotal.textContent = `$${total.toFixed(2)}`;
}

function decreaseQuantity(productId) {
    const productIndex = state.cart.findIndex(item => item.id === productId);
    
    if (productIndex !== -1) {
        if (state.cart[productIndex].quantity > 1) {
            // Decrease quantity
            state.cart[productIndex].quantity -= 1;
        } else {
            // Remove item if quantity will be 0
            state.cart.splice(productIndex, 1);
        }
        
        // Update cart count and total
        state.cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
        state.cartTotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Update UI
        updateCartCount();
    }
}

function increaseQuantity(productId) {
    const product = state.cart.find(item => item.id === productId);
    
    if (product) {
        // Increase quantity
        product.quantity += 1;
        
        // Update cart count and total
        state.cartCount = state.cart.reduce((total, item) => total + item.quantity, 0);
        state.cartTotal = state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Update UI
        updateCartCount();
    }
}

// Initialize event tracking - placeholder for analytics implementation
function initializeEventTracking() {
    // This would typically connect to an analytics platform
    window.trackEvent = function(eventName, eventData) {
        console.log(`Event tracked: ${eventName}`, eventData);
    };
}

// Call this on page load to initialize the cart count display
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
