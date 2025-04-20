// catalog.js - JavaScript for the catalog page functionality

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const priceRange = document.getElementById('price-range');
    const priceDisplay = document.getElementById('price-display');
    const categoryLinks = document.querySelectorAll('.category-list a');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const productCards = document.querySelectorAll('.product-card');
    
    // Initialize price display
    updatePriceDisplay();
    
    // Event for price range slider
    priceRange.addEventListener('input', updatePriceDisplay);
    
    // Function to update price display
    function updatePriceDisplay() {
        const value = priceRange.value;
        priceDisplay.textContent = value >= 1000 ? '$1000+' : `$${value}`;
    }
    
    // Category navigation (smooth scroll)
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
                targetSection.scrollIntoView({ behavior: 'smooth' });
                
                // Add a highlight effect (CSS handles this with :target)
                window.location.hash = targetId;
            }
        });
    });
    
    // Apply filters button
    applyFiltersBtn.addEventListener('click', applyFilters);
    
    // Function to apply filters
    function applyFilters() {
        const maxPrice = parseInt(priceRange.value);
        const brandCheckboxes = document.querySelectorAll('.filter-group:nth-of-type(2) input[type="checkbox"]');
        const availabilityCheckboxes = document.querySelectorAll('.filter-group:nth-of-type(3) input[type="checkbox"]');
        
        // Get selected brands
        const selectedBrands = Array.from(brandCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map((_, index) => ['NTO Pacific', 'Aqua Lung', 'Mares', 'Cressi', 'ScubaPro'][index]);
        
        // Check if "In Stock" is selected
        const showInStock = availabilityCheckboxes[0].checked;
        // Check if "Out of Stock" is selected
        const showOutOfStock = availabilityCheckboxes[1].checked;
        
        // Filter products
        productCards.forEach(card => {
            const productPrice = parseFloat(card.dataset.productPrice);
            const inStock = card.dataset.inStock === "true";
            // For a real site, we would have brand data for each product
            // Here we'll assume all products match the brand filter for simplicity
            
            // Check price filter
            const matchesPrice = productPrice <= maxPrice;
            
            // Check availability filter
            const matchesAvailability = (inStock && showInStock) || (!inStock && showOutOfStock);
            
            // Show/hide based on all filters
            if (matchesPrice && matchesAvailability) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Show filter confirmation
        showFilterConfirmation();
    }
    
    // Function to show filter confirmation
    function showFilterConfirmation() {
        const confirmationText = document.getElementById('confirmation-text');
        confirmationText.textContent = 'Filters have been applied to products.';
        
        openModal('confirmation-modal');
    }
    
    // Initialize event handlers for products
    initializeProductButtons();
});

// Connect "Shop Now" button on home page to catalog
function connectShopNowButton() {
    // This function should be called from the home page script
    // to connect the "Shop Now" button to the catalog page
    const shopNowBtn = document.querySelector('.hero-content .btn-primary');
    if (shopNowBtn) {
        shopNowBtn.addEventListener('click', () => {
            window.location.href = 'catalog.html';
        });
    }
}

// If we're on the home page, connect the button
if (window.location.pathname === '/' || window.location.pathname.includes('index.html')) {
    document.addEventListener('DOMContentLoaded', connectShopNowButton);
}
