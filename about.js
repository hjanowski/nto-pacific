// about.js - JavaScript for the about page

document.addEventListener('DOMContentLoaded', () => {
    // Add fade-in animations for team members
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
    
    // Handle team images to ensure consistent size
    const teamImages = document.querySelectorAll('.team-img');
    
    if (teamImages.length > 0) {
        teamImages.forEach(img => {
            // Add error handling for images
            img.addEventListener('error', function() {
                // If image fails to load, show a fallback
                this.src = '/api/placeholder/300/220';
                this.alt = 'Team Member';
            });
        });
    }
});
