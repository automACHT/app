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
