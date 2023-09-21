// JavaScript code for the falling stars effect 

// Function to create falling stars
function createStars() {
    const numberOfStars = 1000; // Number of falling stars
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
  
  // Start the timer after 5 seconds
  setTimeout(function () {
    createStars(); // Call the function to create falling stars
  }, 2000); // in milliseconds (2 seconds)
  