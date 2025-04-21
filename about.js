// about.js - JavaScript for the about page

document.addEventListener('DOMContentLoaded', () => {
    // No special functionality needed for this basic about page
    // This file is included for future enhancements
    
    // If you want to add image gallery functionality, fade-in effects, 
    // or other interactive elements to the about page, you can add them here
    
    // Example: Add fade-in effect for team members
    const teamMembers = document.querySelectorAll('.team-member');
    
    if (teamMembers.length > 0) {
        // Create fade-in animation on scroll
        const fadeInObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    fadeInObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });
        
        teamMembers.forEach(member => {
            member.style.opacity = '0';
            member.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
            fadeInObserver.observe(member);
        });
    }
    
    // Add animation class
    document.head.insertAdjacentHTML('beforeend', `
        <style>
            .fade-in {
                opacity: 1 !important;
            }
            
            @keyframes slideInFromBottom {
                0% {
                    opacity: 0;
                    transform: translateY(40px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .team-member.fade-in {
                animation: slideInFromBottom 0.8s ease forwards;
            }
        </style>
    `);
});