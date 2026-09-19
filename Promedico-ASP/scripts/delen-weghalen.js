(function() {
    'use strict';

    // ============================================================================
    // MOVE AND COLLAPSE "DELEN" SECTION
    // ============================================================================

    function moveAndCollapseDelen() {
        // Find the "Delen" section by looking for h2 with text "Delen"
        const allH2 = document.querySelectorAll('h2');
        let delenH2 = null;
        
        for (let h2 of allH2) {
            if (h2.textContent.trim() === 'Delen') {
                delenH2 = h2;
                break;
            }
        }
        
        if (!delenH2) {
            return;
        }

        // Find the parent row of the Delen header
        const delenHeaderRow = delenH2.closest('tr');
        if (!delenHeaderRow) {
            return;
        }

        // Find the content row (next sibling)
        const delenContentRow = delenHeaderRow.nextElementSibling;
        if (!delenContentRow) {
            return;
        }

        // Find the Episode section
        let episodeH2 = null;
        for (let h2 of allH2) {
            if (h2.textContent.trim() === 'Episode') {
                episodeH2 = h2;
                break;
            }
        }

        if (!episodeH2) {
            return;
        }

        // Find the last row of the Episode section
        // We need to find all rows until we hit the next section or end
        let episodeRow = episodeH2.closest('tr');
        let lastEpisodeRow = episodeRow;
        
        // Walk through siblings to find the last Episode-related row
        let currentRow = episodeRow.nextElementSibling;
        while (currentRow) {
            // Check if this row contains an h2 (new section)
            if (currentRow.querySelector('h2')) {
                break;
            }
            lastEpisodeRow = currentRow;
            currentRow = currentRow.nextElementSibling;
        }

        // Move Delen rows after Episode section
        const parentTable = delenHeaderRow.parentNode;
        
        // Remove the rows from their current position
        const delenRows = [delenHeaderRow, delenContentRow];
        delenRows.forEach(row => row.remove());
        
        // Insert after last Episode row
        if (lastEpisodeRow.nextSibling) {
            lastEpisodeRow.parentNode.insertBefore(delenHeaderRow, lastEpisodeRow.nextSibling);
            delenHeaderRow.parentNode.insertBefore(delenContentRow, delenHeaderRow.nextSibling);
        } else {
            lastEpisodeRow.parentNode.appendChild(delenHeaderRow);
            lastEpisodeRow.parentNode.appendChild(delenContentRow);
        }

        // Make the section collapsible
        makeDelenCollapsible(delenH2, delenContentRow);
    }

    function makeDelenCollapsible(headerElement, contentRow) {
        // Create a wrapper div for the header to make it clickable
        const headerCell = headerElement.closest('td');
        if (!headerCell) {
            return;
        }

        // Add cursor pointer to header
        headerCell.style.cursor = 'pointer';
        headerCell.style.userSelect = 'none';

        // Create toggle indicator
        const toggleIcon = document.createElement('span');
        toggleIcon.innerHTML = ' ▼';
        toggleIcon.style.cssText = `
            font-size: 14px;
            margin-left: 8px;
            transition: transform 0.3s;
            display: inline-block;
        `;
        headerElement.appendChild(toggleIcon);

        // Initially collapsed
        contentRow.style.display = 'none';
        toggleIcon.style.transform = 'rotate(-90deg)';

        // Track collapsed state
        let isCollapsed = true;

        // Add click handler
        headerCell.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            isCollapsed = !isCollapsed;

            if (isCollapsed) {
                contentRow.style.display = 'none';
                toggleIcon.style.transform = 'rotate(-90deg)';
            } else {
                contentRow.style.display = '';
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        });

        // Add hover effect
        headerCell.addEventListener('mouseenter', function() {
            headerCell.style.backgroundColor = '#f5f5f5';
        });

        headerCell.addEventListener('mouseleave', function() {
            headerCell.style.backgroundColor = '';
        });
    }

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    function initialize() {
        // Wait for the page to be loaded
        const checkInterval = setInterval(() => {
            const delenSection = Array.from(document.querySelectorAll('h2')).find(
                h2 => h2.textContent.trim() === 'Delen'
            );
            
            if (delenSection) {
                clearInterval(checkInterval);
                moveAndCollapseDelen();
            }
        }, 500);

        // Stop checking after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
        }, 10000);
    }

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();