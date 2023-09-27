// JavaScript code to toggle the visibility of navigation elements based on screen width

// Function to toggle navigation elements based on screen width
function toggleNavigation() {
    const desktopMenu = document.getElementById('desktop-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');

    // Check the screen width
    const screenWidth = window.innerWidth;

    // If the screen width is less than or equal to 768px, show mobile menu and button
    if (screenWidth <= 768) {
        desktopMenu.style.display = 'none';
        mobileMenu.style.display = 'block';
        mobileMenuButton.style.display = 'block';
    } else {
        // If the screen width is greater than 768px, show desktop menu and hide button
        desktopMenu.style.display = 'block';
        mobileMenu.style.display = 'none';
        mobileMenuButton.style.display = 'none';
    }
}

// JavaScript code to toggle the mobile menu

// Function to open/close the mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileMenuButton = document.getElementById('mobile-menu-button');

    if (mobileMenu.style.display === 'block') {
        mobileMenu.style.display = 'none';
    } else {
        mobileMenu.style.display = 'block';
    }
}

// Add an event listener to check and toggle navigation elements on page load and resize
window.addEventListener('load', toggleNavigation);
window.addEventListener('resize', toggleNavigation);

// Add an event listener to the mobile menu button
document.getElementById('mobile-menu-button').addEventListener('click', toggleMobileMenu);
