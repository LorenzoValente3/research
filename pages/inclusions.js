// Create a function to include the menu and footer using JavaScript
function includeInclusions() {
    // Include the navigation bar
    const menuContainer = document.createElement('div');
    menuContainer.innerHTML = `
        <nav>
        <ul class="menu">
            <li><a href="../index.html">Lorenzo Valente</a></li>
            <li><a href="biography.html">Biography</a></li>
            <li><a href="research.html">Research</a></li>
            <li><a href="publications.html">Publications</a></li>
            <li><a href="talks.html">Talks</a></li>
            </ul>
        </nav>
    `;
    document.body.prepend(menuContainer);

    // Create a footer element
    const footer = document.createElement('footer');

    // Create a left footer section
    const leftFooter = document.createElement('div');
    leftFooter.classList.add('left-footer');
    leftFooter.innerHTML = `    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css">

    <footer>
    <!-- <div class="panel-footer"> -->
        <div class="left-footer">
                <p>
                    <a href="mailto:lorenzo.valente3@studio.unibo.it" target="_blank" style="color: rgb(0, 200, 255);">
                        <i class="fa fa-envelope fa-1x" style="color: rgb(0, 200, 255);"></i> Email Lorenzo
                    </a>
                    <br/>
                    <a href="https://github.com/LorenzoValente3" target="_blank"  style="color: rgb(0, 200, 255);">
                        <i class="fab fa-github fa-1x" style="color: rgb(0, 200, 255);"></i> GitHub Profile
                    </a>
                </p>
            </div>
            <div class="right-footer">
                Experimental Particle Physicist - <br> working at DESY (University of Hamburg)
            </div>
            
                
            </div>
        </div>
    </footer>
    `;

    // // Create a right footer section
    // const rightFooter = document.createElement('div');
    // rightFooter.classList.add('right-footer');
    // rightFooter.innerHTML = 'Experimental Particle Physicist - <br> working at DESY (University of Hamburg)';

    // Append the left and right footer sections to the footer element
    footer.appendChild(leftFooter);

    // Add the footer to the document body
    document.body.appendChild(footer);}

// Call the includeInclusions() function to include the menu and footer
includeInclusions();
