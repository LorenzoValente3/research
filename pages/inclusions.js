// Create a function to include the menu and footer using JavaScript
function includeInclusions() {
    // Include the navigation bar
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = '<nav><ul class="menu"><li><a href="../index.html">Lorenzo Valente</a></li><li><a href="biography.html">Biography</a></li><li><a href="research.html">Research</a></li><li><a href="publications.html">Publications</a></li><li><a href="talks.html">Talks</a></li><li><a href="team.html">Team</a></li></ul></nav>';
    document.body.prepend(menuContainer);

    // Include the footer
    const footerContainer = document.createElement('div');
    footerContainer.innerHTML = '<footer><p>Contact: <a href="mailto:lorenzo.valente3@studio.unibo.it">lorenzo.valente3@studio.unibo.it</a></p></footer>';
    document.body.appendChild(footerContainer);
}

// Call the includeInclusions() function to include the menu and footer
includeInclusions();
