// DOM elements
const addButton = document.getElementById('addButton');
const modal = document.getElementById('categoryModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const categoryCards = document.querySelectorAll('.modal-category-card');

// Open modal when FAB is clicked
addButton.addEventListener('click', () => {
    modal.classList.add('show');
    modalOverlay.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
});

// Close modal when overlay is clicked
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// Close modal when close button is clicked
modalCloseBtn.addEventListener('click', () => {
    closeModal();
});

// Close modal function
function closeModal() {
    modal.classList.remove('show');
    modalOverlay.classList.remove('show');
    document.body.style.overflow = ''; // Restore scrolling
}

// Handle category selection
categoryCards.forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        console.log(`Selected category: ${category}`);
        
        // Navigate to the appropriate page based on category
        switch(category) {
            case 'recepten':
                window.location.href = 'createRecipe.html';
                break;
            case 'kleding':
                // TODO: Create kleding page
                console.log('Kleding page not yet implemented');
                break;
            case 'boodschappen':
                // TODO: Create boodschappen page
                console.log('Boodschappen page not yet implemented');
                break;
            case 'notities':
                // TODO: Create notities page
                console.log('Notities page not yet implemented');
                break;
            case 'ideeen':
                // TODO: Create ideeen page
                console.log('Ideeen page not yet implemented');
                break;
            case 'taken':
                // TODO: Create taken page
                console.log('Taken page not yet implemented');
                break;
            default:
                console.log('Unknown category');
        }
        
        closeModal();
    });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        closeModal();
    }
});

// Handle main category card clicks (to view existing items)
document.addEventListener('DOMContentLoaded', () => {
    const mainCategoryCards = document.querySelectorAll('.category-card');
    
    mainCategoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            console.log(`Viewing category: ${category}`);
            
            // Navigate to the appropriate overview page
            switch(category) {
                case 'recepten':
                    window.location.href = 'recipes.html';
                    break;
                case 'kleding':
                    // TODO: Create kleding overview page
                    console.log('Kleding overview page not yet implemented');
                    break;
                case 'boodschappen':
                    // TODO: Create boodschappen overview page
                    console.log('Boodschappen overview page not yet implemented');
                    break;
                case 'notities':
                    // TODO: Create notities overview page
                    console.log('Notities overview page not yet implemented');
                    break;
                case 'ideeen':
                    // TODO: Create ideeen overview page
                    console.log('Ideeen overview page not yet implemented');
                    break;
                case 'taken':
                    // TODO: Create taken overview page
                    console.log('Taken overview page not yet implemented');
                    break;
                default:
                    console.log('Unknown category');
            }
        });
    });
});

// Functions for updating category counts
async function updateCategoryCounts() {
    try {
        // Update recipes count
        await updateRecipesCount();
        
        // TODO: Add other category counts here when implemented
        // await updateKledingCount();
        // await updateBoodschappenCount();
        // etc.
        
    } catch (error) {
        console.error('Error updating category counts:', error);
    }
}

async function updateRecipesCount() {
    try {
        // Check if we're on the right page
        const recipesCard = document.querySelector('.category-card[data-category="recepten"] .item-count');
        if (!recipesCard) {
            return; // Not on home page
        }
        
        const loadingSpan = recipesCard.querySelector('.count-loading');
        const valueSpan = recipesCard.querySelector('.count-value');
        
        // Wait for supabase to be available
        if (typeof getAllRecipes === 'function') {
            console.log('Fetching recipes count...');
            const recipes = await getAllRecipes();
            const count = recipes ? recipes.length : 0;
            
            if (loadingSpan && valueSpan) {
                // Update the text
                valueSpan.textContent = `${count} ${count === 1 ? 'recept' : 'recepten'}`;
                valueSpan.style.color = 'var(--text-primary)'; // Reset color
                
                // Hide loading, show value
                loadingSpan.style.display = 'none';
                valueSpan.style.display = 'inline';
            }
            
            console.log(`Updated recipes count: ${count}`);
        } else {
            console.log('Supabase functions not yet available for count update');
        }
    } catch (error) {
        console.error('Error updating recipes count:', error);
        
        // On error, hide loading and show error message
        const recipesCard = document.querySelector('.category-card[data-category="recepten"] .item-count');
        const loadingSpan = recipesCard?.querySelector('.count-loading');
        const valueSpan = recipesCard?.querySelector('.count-value');
        
        if (loadingSpan && valueSpan) {
            valueSpan.textContent = 'Fout bij laden';
            valueSpan.style.color = 'var(--primary-color)';
            loadingSpan.style.display = 'none';
            valueSpan.style.display = 'inline';
        }
    }
}

// Function to wait for Supabase and then update counts
async function initializeCounts() {
    // Quick check - if Supabase is already ready, update immediately
    if (window.supabaseReady && typeof getAllRecipes === 'function') {
        console.log('Supabase already ready, updating counts immediately...');
        await updateCategoryCounts();
        return;
    }
    
    let attempts = 0;
    const maxAttempts = 30; // Max 3 seconden wachten (30 * 100ms)
    
    const tryUpdate = async () => {
        // Check if we're still on the home page
        if (!document.querySelector('.category-card[data-category="recepten"]')) {
            return false;
        }
        
        // Check for multiple conditions to ensure Supabase is fully ready
        if ((window.supabaseReady || typeof getAllRecipes === 'function') && 
            typeof window.supabase !== 'undefined' && 
            window.supabase !== null) {
            console.log('Supabase ready, updating counts...');
            await updateCategoryCounts();
            return true;
        } else if (attempts < maxAttempts) {
            attempts++;
            if (attempts % 10 === 0) { // Log elke seconde
                console.log(`Waiting for Supabase... attempt ${attempts}/${maxAttempts}`);
                console.log('Supabase status:', {
                    supabaseReady: window.supabaseReady,
                    supabaseExists: typeof window.supabase !== 'undefined',
                    supabaseNotNull: window.supabase !== null,
                    getAllRecipesExists: typeof getAllRecipes === 'function'
                });
            }
            setTimeout(tryUpdate, 100); // Probeer elke 100ms
            return false;
        } else {
            console.error('Supabase functions not loaded after maximum attempts');
            console.log('Final status:', {
                supabaseReady: window.supabaseReady,
                supabaseExists: typeof window.supabase !== 'undefined',
                supabaseNotNull: window.supabase !== null,
                getAllRecipesExists: typeof getAllRecipes === 'function'
            });
            // Show fallback values
            showCountError();
            return false;
        }
    };
    
    // Start immediately
    await tryUpdate();
}

// Function to show error state
function showCountError() {
    const recipesCard = document.querySelector('.category-card[data-category="recepten"] .item-count');
    const loadingSpan = recipesCard?.querySelector('.count-loading');
    const valueSpan = recipesCard?.querySelector('.count-value');
    
    if (loadingSpan && valueSpan) {
        valueSpan.textContent = 'Probeer opnieuw';
        valueSpan.style.color = 'var(--primary-color)';
        valueSpan.style.cursor = 'pointer';
        loadingSpan.style.display = 'none';
        valueSpan.style.display = 'inline';
        
        // Add click handler to retry
        valueSpan.onclick = () => {
            valueSpan.style.display = 'none';
            loadingSpan.style.display = 'flex';
            valueSpan.onclick = null;
            initializeCounts();
        };
    }
}

// Update counts when page loads - multiple approaches for fastest loading
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting count initialization...');
    initializeCounts();
});

// Listen for Supabase ready event for immediate response
window.addEventListener('supabaseReady', () => {
    console.log('Supabase ready event received, updating counts immediately...');
    updateCategoryCounts();
});

// Also try immediately if DOM is already ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCounts);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // DOM is already ready, start immediately
    console.log('DOM already ready, starting count initialization...');
    initializeCounts();
}

// Additional attempt after a short delay to catch any late-loading scripts
setTimeout(() => {
    if (document.querySelector('.count-loading')?.style.display !== 'none') {
        console.log('Retrying count initialization after delay...');
        initializeCounts();
    }
}, 500);

// Update counts when page becomes visible (user returns to tab)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        console.log('Page became visible, updating counts...');
        updateCategoryCounts();
    }
});

// Update counts when window gets focus
window.addEventListener('focus', () => {
    console.log('Window got focus, updating counts...');
    updateCategoryCounts();
});

// Global function that can be called from other pages to refresh counts
window.refreshHomeCounts = function() {
    if (document.getElementById('recipesGrid')) {
        // We're not on the home page, skip
        return;
    }
    updateCategoryCounts();
};

// Export the update function for use in other scripts
window.updateCategoryCounts = updateCategoryCounts;
