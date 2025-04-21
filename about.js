// about.js - JavaScript for the about page

document.addEventListener('DOMContentLoaded', () => {
    // Immediately apply size constraints to images
    const teamImages = document.querySelectorAll('.team-img');
    teamImages.forEach(img => {
        // Force the correct size immediately
        img.style.width = '100%';
        img.style.height = '220px';
        img.style.maxHeight = '220px';
        img.style.objectFit = 'cover';
        img.style.objectPosition = 'center';
        
        // Add error handling for images
        img.addEventListener('error', function() {
            // If image fails to load, show a fallback
            this.src = '/api/placeholder/300/220';
            this.alt = 'Team Member';
        });
    });
    
    // Prevent image size from changing after load
    window.addEventListener('load', function() {
        teamImages.forEach(img => {
            img.style.width = '100%';
            img.style.height = '220px';
            img.style.maxHeight = '220px';
            img.style.objectFit = 'cover';
        });
    });
    
    // Add nice fade-in animations for team members
    const teamMembers = document.querySelectorAll('.team-member');
    
    if (teamMembers.length > 0) {
        // Add initial styles for animation
        teamMembers.forEach(member => {
            member.style.opacity = '0';
            member.style.transform = 'translateY(20px)';
            member.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        });
        
        // Create fade-in animation on scroll
        const fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    
                    // Ensure images stay correctly sized during animation
                    const img = entry.target.querySelector('.team-img');
                    if (img) {
                        img.style.width = '100%';
                        img.style.height = '220px';
                        img.style.maxHeight = '220px';
                        img.style.objectFit = 'cover';
                    }
                    
                    fadeInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px'
        });
        
        // Observe each team member
        teamMembers.forEach(member => {
            fadeInObserver.observe(member);
        });
    }
    
    // Add meta tag to prevent caching (helps with refreshing issues)
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);
});
