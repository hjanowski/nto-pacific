// catalog.js - JavaScript for the catalog page functionality

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const priceSlider = document.getElementById('price-slider');
    const priceDisplay = document.getElementById('price-display');
    const categoryLinks = document.querySelectorAll('.categories-list a');
    const applyFiltersBtn = document.querySelector('.apply-filters');
    const productCards = document.querySelectorAll('.product-card');
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    const notifyButtons = document.querySelectorAll('.notify-me');
    
    // Initialize price display
    if (priceSlider && priceDisplay) {
        updatePriceDisplay();
        
        // Event for price range slider
        priceSlider.addEventListener('input', updatePriceDisplay);
    }
    
    // Function to update price display
    function updatePriceDisplay() {
        const value = priceSlider.value;
        priceDisplay.textContent = value >= 1000 ? '$1000+' : `$${value}`;
    }
    
    // Smooth scrolling for category navigation
    if (categoryLinks) {
        categoryLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all links
                categoryLinks.forEach(l => l.classList.remove('active'));
                
                // Add active class to clicked link
                link.classList.add('active');
                
                // Get the target section
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    // Smooth scroll to the section
                    window.scrollTo({
                        top: targetSection.offsetTop - 20,
                        behavior: 'smooth'
                    });
                    
                    // Highlight the section briefly
                    highlightSection(targetSection);
                }
            });
        });
    }
    
    // Apply filters functionality
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    // Function to apply filters
    function applyFilters() {
        // Get filter values
        const maxPrice = parseInt(priceSlider.value);
        
        // Brand checkboxes
        const brandNTO = document.getElementById('brand-nto')?.checked || false;
        const brandAqua = document.getElementById('brand-aqua')?.checked || false;
        const brandMares = document.getElementById('brand-mares')?.checked || false;
        const brandCressi = document.getElementById('brand-cressi')?.checked || false;
        const brandScubaPro = document.getElementById('brand-scubapro')?.checked || false;
        
        // Availability checkboxes
        const showInStock = document.getElementById('in-stock')?.checked || false;
        const showOutOfStock = document.getElementById('out-of-stock')?.checked || false;
        
        // Create array of selected brands
        const selectedBrands = [];
        if (brandNTO) selectedBrands.push('NTO Pacific');
        if (brandAqua) selectedBrands.push('Aqua Lung');
        if (brandMares) selectedBrands.push('Mares');
        if (brandCressi) selectedBrands.push('Cressi');
        if (brandScubaPro) selectedBrands.push('ScubaPro');
        
        // Filter products (if there are any to filter)
        if (productCards && productCards.length > 0) {
            let visibleCount = 0;
            
            productCards.forEach(card => {
                const productPrice = parseFloat(card.dataset.productPrice);
                const inStock = card.dataset.inStock === "true";
                // In a real application, we would check the brand from data attributes
                // For this example, we'll assume all products match the brand filter if any brand is selected
                const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes('NTO Pacific'); // Simplified
                
                // Apply filters
                const matchesPrice = productPrice <= maxPrice;
                const matchesAvailability = (inStock && showInStock) || (!inStock && showOutOfStock);
                
                // Show/hide based on filters
                if (matchesPrice && matchesBrand && matchesAvailability) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Show results message
            const resultsMsg = `Showing ${visibleCount} of ${productCards.length} products`;
            showFilterFeedback(resultsMsg);
        }
    }
    
    // Function to provide filter feedback to user
    function showFilterFeedback(message) {
        // Check if feedback element exists, create if not
        let feedbackEl = document.querySelector('.filter-feedback');
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.className = 'filter-feedback';
            feedbackEl.style.cssText = 'background-color: #e9f7f6; color: #40bfb4; padding: 10px; border-radius: 4px; margin-bottom: 20px; font-weight: 500; text-align: center;';
            
            const productsSection = document.querySelector('.products-section');
            if (productsSection) {
                productsSection.insertBefore(feedbackEl, productsSection.firstChild);
            }
        }
        
        // Update message
        feedbackEl.textContent = message;
        
        // Show feedback with fade effect
        feedbackEl.style.opacity = '0';
        feedbackEl.style.display = 'block';
        
        setTimeout(() => {
            feedbackEl.style.transition = 'opacity 0.5s ease';
            feedbackEl.style.opacity = '1';
        }, 10);
        
        // Hide after 5 seconds
        setTimeout(() => {
            feedbackEl.style.opacity = '0';
            setTimeout(() => {
                feedbackEl.style.display = 'none';
            }, 500);
        }, 5000);
    }
    
    // Function to highlight a section temporarily
    function highlightSection(section) {
        const originalBackground = section.style.backgroundColor;
        
        // Add highlight effect
        section.style.transition = 'background-color 0.5s ease';
        section.style.backgroundColor = 'rgba(64, 191, 180, 0.1)';
        
        // Remove highlight after animation
        setTimeout(() => {
            section.style.backgroundColor = originalBackground;
        }, 1000);
    }
    
    // Connect Add to Cart buttons
    if (addToCartButtons && addToCartButtons.length > 0) {
        addToCartButtons.forEach(button => {
            button.addEventListener('click', handleAddToCart);
        });
    }
    
    // Connect Notify Me buttons
    if (notifyButtons && notifyButtons.length > 0) {
        notifyButtons.forEach(button => {
            button.addEventListener('click', handleNotifyMe);
        });
    }
    
    // Add to Cart handler
    function handleAddToCart(e) {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        
        const productId = productCard.dataset.productId;
        const productName = productCard.dataset.productName;
        const productPrice = parseFloat(productCard.dataset.productPrice);
        
        // Animation effect for better feedback
        animateAddToCart(e.target);
        
        // If the main site's addToCart function exists, call it
        if (typeof window.addToCart === 'function') {
            window.addToCart(productCard);
        } else {
            // If main site's cart functionality isn't available, implement basic cart behavior
            // This is just a fallback in case the main site's cart functionality is not accessible
            console.log(`Added to cart: ${productName} ($${productPrice})`);
            
            // Show feedback to user
            showFilterFeedback(`Added ${productName} to your cart`);
            
            // Update cart count if element exists
            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                let count = parseInt(cartCount.textContent || '0');
                cartCount.textContent = count + 1;
            }
        }
    }
    
    // Notify Me handler
    function handleNotifyMe(e) {
        const productCard = e.target.closest('.product-card');
        if (!productCard) return;
        
        const productName = productCard.dataset.productName;
        
        // If the main site's openModal function exists, use it
        if (typeof window.openModal === 'function') {
            // Set the current product for notification if state exists
            if (window.state) {
                window.state.currentProductNotify = {
                    id: productCard.dataset.productId,
                    name: productName
                };
            }
            
            // Update the modal text
            const notifyProductNameEl = document.getElementById('notify-product-name');
            if (notifyProductNameEl) {
                notifyProductNameEl.textContent = productName;
            }
            
            // Open the notify modal
            window.openModal('notify-modal');
        } else {
            // Fallback if main functionality isn't available
            console.log(`Notification requested for: ${productName}`);
            alert(`We'll notify you when ${productName} is back in stock!`);
        }
    }
    
    // Animation for add to cart button
    function animateAddToCart(button) {
        // Save original text
        const originalText = button.textContent;
        
        // Add animation class
        button.classList.add('animating');
        button.textContent = 'Added!';
        button.disabled = true;
        
        // Restore original state after animation
        setTimeout(() => {
            button.classList.remove('animating');
            button.textContent = originalText;
            button.disabled = false;
        }, 1500);
    }
    
    // Add necessary styles for animations
    const style = document.createElement('style');
    style.textContent = `
        .add-to-cart.animating {
            background-color: #40bfb4;
            color: white;
            pointer-events: none;
        }
        
        .filter-feedback {
            display: none;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `;
    document.head.appendChild(style);
    
    // Make sure the Shop Now button on the home page links to the catalog
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        const shopNowBtn = document.querySelector('.hero-content .btn-primary');
        if (shopNowBtn) {
            shopNowBtn.addEventListener('click', () => {
                window.location.href = 'catalog.html';
            });
        }
    }
});
