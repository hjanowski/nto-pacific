// Connect the "Shop Now" button to the catalog page
document.addEventListener('DOMContentLoaded', () => {
    const shopNowBtn = document.getElementById('shop-now-btn');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            window.location.href = 'catalog.html';
        });
    }
});

// Salesforce Interactions beacon script
// <script src="https://cdn.c360a.salesforce.com/beacon/c360a/233a8f36-3f93-4e01-84e5-c210837a6c97/scripts/c360a.min.js"></script>

// Simple debug function to make logs more visible
function debugLog(message) {
    console.log('%c[NTO DEBUG] ' + message, 'background: #f0f0f0; color: #0a66c2; font-weight: bold; padding: 3px 5px; border-radius: 3px;');
}

// Test logging
debugLog('Script started - console logging is working');

// Define getUTMParameters globally so it's accessible to all functions
function getUTMParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        utm_content: urlParams.get('utm_content') || '',
        utm_term: urlParams.get('utm_term') || ''
    };
}

// Check if SalesforceInteractions is available
function checkSalesforceInteractions() {
    if (typeof window.SalesforceInteractions === 'undefined') {
        debugLog('⚠️ SalesforceInteractions is NOT available');
        return false;
    }
    
    if (typeof window.SalesforceInteractions.sendEvent !== 'function') {
        debugLog('⚠️ SalesforceInteractions.sendEvent is NOT a function');
        return false;
    }
    
    debugLog('✅ SalesforceInteractions is available and ready');
    return true;
}

// Ensure SalesforceInteractions is initialized
function ensureSalesforceInitialized() {
    return new Promise((resolve, reject) => {
        // Check if SalesforceInteractions is already initialized
        if (window.SalesforceInteractions && typeof window.SalesforceInteractions.sendEvent === 'function') {
            resolve();
            return;
        }

        // If not, wait a bit and check again (retry pattern)
        let attempts = 0;
        const maxAttempts = 5;
        const checkInterval = setInterval(() => {
            attempts++;
            if (window.SalesforceInteractions && typeof window.SalesforceInteractions.sendEvent === 'function') {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('SalesforceInteractions not initialized after multiple attempts'));
            }
        }, 1000);
    });
}

// Keep track of handler attachment to prevent duplicates
let handlersAttached = false;

// Check if user is already logged in
const currentUser = localStorage.getItem('ntoCurrentUser');
if (currentUser) {
    debugLog('User is logged in, initializing identity');
    try {
        const parseduser = JSON.parse(currentUser);
        const Firstname = parseduser.name.split(" ")[0];
        const Lastname = parseduser.name.split(" ")[1];
        const Email = parseduser.email;

        // Initialize Salesforce with consent if not already initialized
        ensureSalesforceInitialized()
            .then(() => {
                return SalesforceInteractions.init({
                    consents: [{
                        provider: "CampaignAttribution",
                        purpose: "Tracking",
                        status: "Opt In"
                    }]
                });
            })
            .then(res => {
                debugLog("Initialization successful");
                // Send identity event
                return SalesforceInteractions.sendEvent({
                    user: {
                        attributes: {
                            eventType: 'identity',
                            firstName: Firstname,
                            lastName: Lastname,
                            email: Email,
                            isAnonymous: 0
                        }
                    }
                });
            })
            .then(res => {
                debugLog("Identity event sent successfully");
            })
            .catch(err => {
                debugLog('⚠️ Error in user initialization flow: ' + (err.message || err));
            });
    } catch (error) {
        debugLog('⚠️ Error processing user data: ' + (error.message || error));
    }
} else {
    debugLog('User is not logged in');
}

// Function to attach all event handlers
function attachEventHandlers() {
    if (handlersAttached) {
        debugLog('Event handlers already attached, skipping');
        return;
    }

    debugLog('Attaching all event handlers');
    
    // 1. Shop Now button handler
    const shopNowBtn = document.getElementById('shop-now-btn');
    if (shopNowBtn) {
        debugLog('Shop Now button found, attaching event listener');
        shopNowBtn.addEventListener('click', () => {
            debugLog('Shop Now button clicked');
            
            // Get UTM parameters before navigation
            const utmParams = getUTMParameters();
            debugLog('UTM Parameters for Shop Now click: ' + JSON.stringify(utmParams));
            
            // Try to send event before navigation
            if (checkSalesforceInteractions()) {
                SalesforceInteractions.sendEvent({
                    interaction: {
                        name: "Campaigns Events",
                        eventType: "campaignsEvents",
                        campaignName: utmParams.utm_campaign || "",
                        campaignSource: utmParams.utm_source || "",
                        campaignContent: utmParams.utm_content || "",
                        custom1: "shop_now_click",
                        custom2: "homepage_hero",
                        custom3: new Date().toISOString()
                    }
                }).then(() => {
                    debugLog('Shop Now click event sent successfully');
                    window.location.href = 'catalog.html';
                }).catch(err => {
                    debugLog('⚠️ Error sending Shop Now click event: ' + (err.message || err));
                    window.location.href = 'catalog.html';
                });
            } else {
                window.location.href = 'catalog.html';
            }
        });
    } else {
        debugLog('⚠️ Shop Now button not found in the DOM');
    }
    
    // 2. Add to Cart event tracking
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    if (addToCartButtons.length > 0) {
        debugLog(`Found ${addToCartButtons.length} Add to Cart buttons, attaching event listeners`);
        
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                debugLog('Add to Cart button clicked!');
                
                try {
                    // Get the product data from the parent product card
                    const productCard = button.closest('.product-card');
                    if (!productCard) {
                        debugLog('⚠️ Cannot find parent product card');
                        return;
                    }
                    
                    const productId = productCard.dataset.productId;
                    const productName = productCard.dataset.productName;
                    const productPrice = productCard.dataset.productPrice;
                    
                    debugLog(`Product: ${productName} (${productId}) - $${productPrice}`);
                    
                    // Get UTM parameters from URL
                    const utmParams = getUTMParameters();
                    debugLog('UTM Parameters for Add to Cart: ' + JSON.stringify(utmParams));
                    
                    try {
                        // Ensure Salesforce is initialized before sending
                        await ensureSalesforceInitialized();
                        
                        // Try first format - using interaction property
                        const interactionPayload = {
                            interaction: {
                                name: "Campaigns Events",
                                eventType: "campaignsEvents",
                                campaignName: utmParams.utm_campaign || "",
                                campaignSource: utmParams.utm_source || "",
                                campaignMedium: utmParams.utm_medium || "",
                                campaignContent: utmParams.utm_content || "",
                                campaignTerm: utmParams.utm_term || "",
                                custom1: "product_add_to_cart",
                                custom2: productName,
                                custom3: parseFloat(productPrice)
                            }
                        };
                        
                        debugLog('Sending event with payload (interaction format):', interactionPayload);
                        
                        // Send the event using the interaction format
                        window.SalesforceInteractions.sendEvent(interactionPayload)
                            .then(res => {
                                debugLog('✅ Add to Cart event sent successfully (interaction format)');
                                
                                // Show cart confirmation or update cart count here
                                const cartCount = document.querySelector('.cart-count');
                                if (cartCount) {
                                    const currentCount = parseInt(cartCount.textContent || '0');
                                    cartCount.textContent = currentCount + 1;
                                }
                            })
                            .catch(err => {
                                debugLog('⚠️ Failed to send event (interaction format): ' + (err.message || err));
                                
                                // Try second format if first fails - using event property
                                debugLog('Attempting alternative format...');
                                const eventPayload = {
                                    event: {
                                        name: "Add to Cart",
                                        eventType: "Behavioral",
                                        campaignName: utmParams.utm_campaign || "",
                                        campaignSource: utmParams.utm_source || "",
                                        campaignContent: utmParams.utm_content || "",
                                        custom1: "product_add_to_cart",
                                        custom2: productName,
                                        custom3: parseFloat(productPrice)
                                    }
                                };
                                
                                window.SalesforceInteractions.sendEvent(eventPayload)
                                    .then(res => {
                                        debugLog('✅ Add to Cart event sent successfully (event format)');
                                        
                                        // Update cart count here too
                                        const cartCount = document.querySelector('.cart-count');
                                        if (cartCount) {
                                            const currentCount = parseInt(cartCount.textContent || '0');
                                            cartCount.textContent = currentCount + 1;
                                        }
                                    })
                                    .catch(alternativeErr => {
                                        debugLog('⚠️ Failed to send event (event format): ' + (alternativeErr.message || alternativeErr));
                                    });
                            });
                    } catch (initError) {
                        debugLog('⚠️ Salesforce initialization error: ' + (initError.message || initError));
                    }
                } catch (error) {
                    debugLog('⚠️ Error in Add to Cart event handling: ' + (error.message || error));
                }
            });
        });
    } else {
        debugLog('⚠️ No Add to Cart buttons found');
    }
    
    // 3. Newsletter signup event tracking
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        debugLog('Newsletter form found, attaching event listener');
        
        newsletterForm.addEventListener('submit', function(event) {
            debugLog('Newsletter form submitted');
            event.preventDefault(); // Prevent the default form submission
            
            try {
                // Get the email input value
                const emailInput = newsletterForm.querySelector('input[type="email"]');
                if (!emailInput) {
                    debugLog('⚠️ Email input not found in the newsletter form');
                    return;
                }
                
                const userEmail = emailInput.value;
                debugLog(`Email value: "${userEmail}"`);
                
                if (!userEmail) {
                    debugLog('⚠️ Email input is empty');
                    return;
                }
                
                // Get UTM parameters from URL
                const utmParams = getUTMParameters();
                debugLog('UTM Parameters for Newsletter: ' + JSON.stringify(utmParams));
                
                // Ensure Salesforce is initialized
                ensureSalesforceInitialized()
                    .then(() => {
                        // Send the "Newsletter Signup" event to Salesforce Interactions
                        return window.SalesforceInteractions.sendEvent({
                            interaction: {
                                name: "Campaigns Events",
                                eventType: "campaignsEvents",
                                campaignName: utmParams.utm_campaign || "",
                                campaignSource: utmParams.utm_source || "",
                                campaignMedium: utmParams.utm_medium || "",
                                campaignContent: utmParams.utm_content || "",
                                campaignTerm: utmParams.utm_term || "",
                                custom1: "newsletter_signup",
                                custom2: "homepage_footer",
                                custom3: userEmail
                            }
                        });
                    })
                    .then(res => {
                        debugLog('✅ Newsletter event sent successfully!');
                        
                        // Clear the form
                        emailInput.value = '';
                        
                        // Show a confirmation modal or message
                        const confirmationModal = document.getElementById('confirmation-modal');
                        const confirmationText = document.getElementById('confirmation-text');
                        if (confirmationModal && confirmationText) {
                            confirmationText.textContent = 'You have been subscribed to our newsletter!';
                            confirmationModal.style.display = 'block';
                            document.querySelector('.overlay').style.display = 'block';
                        } else {
                            // Fallback to alert if modal not found
                            alert('Thank you for subscribing to our newsletter!');
                        }
                    })
                    .catch(err => {
                        debugLog('⚠️ Newsletter event sending error: ' + (err.message || err));
                        // Still show confirmation
                        alert('Thank you for subscribing to our newsletter!');
                    });
            } catch (error) {
                debugLog('⚠️ Error in Newsletter event handling: ' + (error.message || error));
                alert('Thank you for subscribing to our newsletter!');
            }
        });
        
        debugLog('Newsletter form submit handler attached');
    } else {
        debugLog('⚠️ Newsletter form not found');
    }
    
    // 4. Notify Me button event tracking
    const notifyButtons = document.querySelectorAll('.notify-me');
    if (notifyButtons.length > 0) {
        debugLog(`Found ${notifyButtons.length} Notify Me buttons, attaching event listeners`);
        
        notifyButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                debugLog('Notify Me button clicked!');
                
                try {
                    // Get the product data
                    const productCard = button.closest('.product-card');
                    if (!productCard) {
                        debugLog('⚠️ Cannot find parent product card');
                        return;
                    }
                    
                    const productId = productCard.dataset.productId;
                    const productName = productCard.dataset.productName;
                    
                    // Show notify modal
                    const notifyModal = document.getElementById('notify-modal');
                    const notifyProductName = document.getElementById('notify-product-name');
                    
                    if (notifyModal && notifyProductName) {
                        notifyProductName.textContent = productName;
                        notifyModal.style.display = 'block';
                        document.querySelector('.overlay').style.display = 'block';
                    }
                    
                    // Get UTM parameters from URL for later use when form is submitted
                    const utmParams = getUTMParameters();
                    debugLog('UTM Parameters for Notify Me: ' + JSON.stringify(utmParams));
                    
                    // Store UTM parameters for the notify form submission
                    window.notifyUtmParams = utmParams;
                } catch (error) {
                    debugLog('⚠️ Error in Notify Me button handling: ' + (error.message || error));
                }
            });
        });
        
        // Handle the notify form submission
        const notifyForm = document.getElementById('notify-form');
        if (notifyForm) {
            notifyForm.addEventListener('submit', function(event) {
                event.preventDefault();
                
                const notifyEmail = document.getElementById('notify-email').value;
                const productName = document.getElementById('notify-product-name').textContent;
                
                if (!notifyEmail) {
                    debugLog('⚠️ Notify email is empty');
                    return;
                }
                
                // Get stored UTM parameters
                const utmParams = window.notifyUtmParams || getUTMParameters();
                
                // Send event to Salesforce
                if (checkSalesforceInteractions()) {
                    window.SalesforceInteractions.sendEvent({
                        interaction: {
                            name: "Campaigns Events",
                            eventType: "campaignsEvents",
                            campaignName: utmParams.utm_campaign || "",
                            campaignSource: utmParams.utm_source || "",
                            campaignContent: utmParams.utm_content || "",
                            custom1: "product_notification",
                            custom2: productName,
                            custom3: notifyEmail
                        }
                    }).then(() => {
                        debugLog('✅ Notify Me event sent successfully');
                        
                        // Close the notify modal
                        document.getElementById('notify-modal').style.display = 'none';
                        
                        // Show confirmation
                        const confirmationModal = document.getElementById('confirmation-modal');
                        const confirmationText = document.getElementById('confirmation-text');
                        if (confirmationModal && confirmationText) {
                            confirmationText.textContent = `We'll notify you when ${productName} becomes available.`;
                            confirmationModal.style.display = 'block';
                        } else {
                            alert(`We'll notify you when ${productName} becomes available.`);
                        }
                    }).catch(err => {
                        debugLog('⚠️ Error sending Notify Me event: ' + (err.message || err));
                        alert(`We'll notify you when ${productName} becomes available.`);
                    });
                } else {
                    alert(`We'll notify you when ${productName} becomes available.`);
                }
            });
        }
    }
    
    // 5. Login/Signup modal handling
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            document.getElementById('login-modal').style.display = 'block';
            document.querySelector('.overlay').style.display = 'block';
        });
    }
    
    const showSignupLink = document.getElementById('show-signup');
    if (showSignupLink) {
        showSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('signup-modal').style.display = 'block';
        });
    }
    
    const showLoginLink = document.getElementById('show-login');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('signup-modal').style.display = 'none';
            document.getElementById('login-modal').style.display = 'block';
        });
    }
    
    // Close modal buttons
    const closeButtons = document.querySelectorAll('.close-modal, .close-confirmation');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Close all modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
            document.querySelector('.overlay').style.display = 'none';
        });
    });
    
    // Handle login form submission with UTM parameters
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get UTM parameters
            const utmParams = getUTMParameters();
            
            // Process login and track with UTM parameters
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Here you would normally validate and authenticate the user
            debugLog(`Login attempt: ${email}`);
            
            if (checkSalesforceInteractions()) {
                window.SalesforceInteractions.sendEvent({
                    interaction: {
                        name: "Campaigns Events",
                        eventType: "campaignsEvents",
                        campaignName: utmParams.utm_campaign || "",
                        campaignSource: utmParams.utm_source || "",
                        campaignContent: utmParams.utm_content || "",
                        custom1: "user_login",
                        custom2: email,
                        custom3: new Date().toISOString()
                    }
                }).then(() => {
                    debugLog('✅ Login event sent successfully');
                }).catch(err => {
                    debugLog('⚠️ Error sending login event: ' + (err.message || err));
                });
            }
            
            // Close modals
            document.getElementById('login-modal').style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
        });
    }
    
    // Handle signup form submission with UTM parameters
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get UTM parameters
            const utmParams = getUTMParameters();
            
            // Process signup and track with UTM parameters
            const name = document.getElementById('name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            
            // Here you would normally create a user account
            debugLog(`Signup attempt: ${email}, ${name}`);
            
            if (checkSalesforceInteractions()) {
                window.SalesforceInteractions.sendEvent({
                    interaction: {
                        name: "Campaigns Events",
                        eventType: "campaignsEvents",
                        campaignName: utmParams.utm_campaign || "",
                        campaignSource: utmParams.utm_source || "",
                        campaignContent: utmParams.utm_content || "",
                        custom1: "user_signup",
                        custom2: email,
                        custom3: new Date().toISOString()
                    }
                }).then(() => {
                    debugLog('✅ Signup event sent successfully');
                }).catch(err => {
                    debugLog('⚠️ Error sending signup event: ' + (err.message || err));
                });
            }
            
            // Close modals
            document.getElementById('signup-modal').style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
        });
    }
    
    handlersAttached = true;
    debugLog('All event handlers attached successfully');
}

// Ensure handlers are attached after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    debugLog('DOMContentLoaded event fired');
    attachEventHandlers();
});

// Backup approach in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    debugLog('Document already loaded, attaching handlers immediately');
    setTimeout(attachEventHandlers, 0);
}

// Expose a test function globally for debugging via console
window.testNewsletterSubmit = function() {
    debugLog('Manual newsletter submit test triggered');
    const form = document.getElementById('newsletter-form');
    if (form) {
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput && !emailInput.value) {
            emailInput.value = 'test@example.com';
        }
        debugLog('Triggering submit event on newsletter form');
        form.dispatchEvent(new Event('submit'));
    } else {
        debugLog('Cannot find newsletter form for testing');
    }
};

// Check SalesforceInteractions periodically 
let checkCount = 0;
const maxChecks = 5;
const checkInterval = setInterval(function() {
    checkCount++;
    if (checkSalesforceInteractions()) {
        debugLog(`SalesforceInteractions became available after ${checkCount} checks`);
        clearInterval(checkInterval);
    } else if (checkCount >= maxChecks) {
        debugLog(`SalesforceInteractions still not available after ${maxChecks} checks`);
        clearInterval(checkInterval);
    }
}, 1000);

debugLog('Initialization complete');
