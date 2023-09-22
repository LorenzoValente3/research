// JavaScript code for the falling stars effect


// Function to create falling stars
function createStars() {
  const numberOfStars = 150; // Number of falling stars
  const body = document.body;

  for (let i = 0; i < numberOfStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';

    // Set random position and size for the stars
    const xy = getRandomPosition();
    star.style.left = xy[0] + 'px';
    star.style.top = xy[1] + 'px';

    // Add the star to the document's body
    body.appendChild(star);
  }
}

// Function to get a random position within the window
function getRandomPosition() {
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  return [x, y];
}

// Hide the welcome message with a fade-out effect
function hideWelcomeMessage() {
  const welcomeMessage = document.getElementById('welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.opacity = 0; // Set opacity to 0 for fade-out effect
    setTimeout(() => {
      welcomeMessage.style.display = 'none'; // Hide the welcome message
      createStars(); // Call the function to create falling stars
    }, 1000); // Delay for 1 second (1000 milliseconds) before hiding
  }
}

// Start the timer after 5 seconds
setTimeout(function () {
  hideWelcomeMessage();
}, 5000); // Delay for 5 seconds (5000 milliseconds) before hiding