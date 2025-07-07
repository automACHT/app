// Recipe Detail Page JavaScript

let currentRecipe = null;
let originalServings = 1;
let currentServings = 1;

// Get recipe ID from URL parameter
function getRecipeIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// Load recipe data
async function loadRecipe() {
    const recipeId = getRecipeIdFromUrl();
    
    if (!recipeId) {
        showError('Geen recept ID opgegeven');
        return;
    }

    try {
        // Wait for Supabase to be ready
        await waitForSupabase();
        
        console.log('Loading recipe with ID:', recipeId);
        const recipe = await getRecipeById(recipeId);
        
        if (!recipe) {
            showError('Recept niet gevonden');
            return;
        }

        currentRecipe = recipe;
        originalServings = recipe.servings || 1;
        currentServings = originalServings;
        
        displayRecipe(recipe);
        
    } catch (error) {
        console.error('Error loading recipe:', error);
        showError('Fout bij het laden van het recept');
    }
}

// Wait for Supabase to be available
async function waitForSupabase() {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (attempts < maxAttempts) {
        if (typeof getRecipeById === 'function' && window.supabase) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    throw new Error('Supabase not available');
}

// Get recipe by ID from Supabase
async function getRecipeById(id) {
    try {
        console.log('Fetching recipe with ID:', id);
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        
        console.log('Raw recipe data from database:', data);
        return data;
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return null;
    }
}

// Display recipe data
function displayRecipe(recipe) {
    // Hide loading state
    document.getElementById('loadingState').style.display = 'none';
    
    // Show recipe content
    document.getElementById('recipeContent').style.display = 'block';
    
    // Update page title and header
    document.getElementById('recipeTitle').textContent = recipe.name;
    document.title = `${recipe.name} - Autom8`;
    
    // Display basic info with proper formatting
    document.getElementById('recipeNameDisplay').textContent = recipe.name;
    document.getElementById('servingsDisplay').textContent = `${recipe.servings || 1} personen`;
    document.getElementById('cookingTimeDisplay').textContent = formatCookingTime(recipe.cooking_time);
    document.getElementById('courseTypeDisplay').textContent = recipe.course_type || 'Niet opgegeven';
    
    // Update course type icon
    const courseTypeIcon = document.getElementById('courseTypeIcon');
    if (courseTypeIcon) {
        courseTypeIcon.textContent = getCourseIcon(recipe.course_type);
    }
    
    // Handle recipe image
    const recipeImage = document.getElementById('recipeImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    
    if (recipe.photo_url) {
        recipeImage.src = recipe.photo_url;
        recipeImage.alt = recipe.name;
        recipeImage.onload = () => {
            recipeImage.classList.add('loaded');
            imagePlaceholder.style.display = 'none';
        };
        recipeImage.onerror = () => {
            console.log('Error loading image, showing placeholder');
            imagePlaceholder.style.display = 'flex';
        };
    } else {
        imagePlaceholder.style.display = 'flex';
    }
    
    // Parse ingredients if they're stored as JSON string
    let ingredients = recipe.ingredients;
    if (typeof ingredients === 'string') {
        try {
            ingredients = JSON.parse(ingredients);
            console.log('Parsed ingredients from JSON string:', ingredients);
        } catch (e) {
            console.error('Failed to parse ingredients JSON:', e, ingredients);
            ingredients = [];
        }
    }
    
    // Parse instructions if they're stored as JSON string
    let instructions = recipe.instructions || recipe.steps; // Check both columns
    if (typeof instructions === 'string') {
        try {
            instructions = JSON.parse(instructions);
            console.log('Parsed instructions from JSON string:', instructions);
        } catch (e) {
            console.error('Failed to parse instructions JSON:', e, instructions);
            instructions = [];
        }
    }
    
    // Display ingredients
    console.log('Recipe ingredients:', ingredients);
    displayIngredients(ingredients);
    
    // Display instructions
    console.log('Recipe instructions (from steps or instructions):', instructions);
    displayInstructions(instructions);
    
    // Display notes if present
    if (recipe.notes && recipe.notes.trim()) {
        document.getElementById('notesSection').style.display = 'block';
        document.getElementById('recipeNotes').textContent = recipe.notes;
    }
    
    // Show action buttons
    document.getElementById('editBtn').style.display = 'block';
    document.getElementById('deleteBtn').style.display = 'block';
    document.getElementById('shareBtn').style.display = 'block';
    
    // Update servings display
    document.getElementById('currentServings').textContent = currentServings;
}

// Display ingredients list
function displayIngredients(ingredients) {
    const container = document.getElementById('ingredientsList');
    container.innerHTML = '';
    
    console.log('displayIngredients called with:', ingredients);
    console.log('Is array?', Array.isArray(ingredients));
    console.log('Length:', ingredients?.length);
    
    if (!ingredients || !Array.isArray(ingredients)) {
        console.log('No ingredients or not an array, showing fallback message');
        container.innerHTML = '<p>Geen ingrediënten opgegeven</p>';
        return;
    }
    
    if (ingredients.length === 0) {
        console.log('Empty ingredients array');
        container.innerHTML = '<p>Geen ingrediënten toegevoegd</p>';
        return;
    }
    
    ingredients.forEach((ingredient, index) => {
        console.log(`Ingredient ${index}:`, ingredient, typeof ingredient);
        
        const ingredientDiv = document.createElement('div');
        ingredientDiv.className = 'ingredient-item';
        
        let ingredientText = '';
        
        // Handle both object format {amount, name} and string format
        if (typeof ingredient === 'object' && ingredient.amount && ingredient.name) {
            ingredientText = `${ingredient.amount} ${ingredient.name}`;
        } else if (typeof ingredient === 'string') {
            ingredientText = ingredient;
        } else {
            ingredientText = JSON.stringify(ingredient); // Fallback for debugging
        }
        
        console.log(`Final ingredient text: "${ingredientText}"`);
        
        ingredientDiv.innerHTML = `
            <div class="ingredient-checkbox" onclick="toggleIngredient(this)"></div>
            <span class="ingredient-text">${adjustIngredientQuantity(ingredientText)}</span>
        `;
        container.appendChild(ingredientDiv);
    });
}

// Display instructions list
function displayInstructions(instructions) {
    const container = document.getElementById('instructionsList');
    container.innerHTML = '';
    
    console.log('displayInstructions called with:', instructions);
    console.log('Is array?', Array.isArray(instructions));
    console.log('Length:', instructions?.length);
    
    if (!instructions || !Array.isArray(instructions)) {
        console.log('No instructions or not an array, showing fallback message');
        container.innerHTML = '<p>Geen bereidingsinstructies opgegeven</p>';
        return;
    }
    
    if (instructions.length === 0) {
        console.log('Empty instructions array');
        container.innerHTML = '<p>Geen bereidingsstappen toegevoegd</p>';
        return;
    }
    
    instructions.forEach((instruction, index) => {
        console.log(`Instruction ${index}:`, instruction, typeof instruction);
        
        const instructionDiv = document.createElement('div');
        instructionDiv.className = 'instruction-item';
        
        let instructionText = '';
        
        // Handle both object format {description} and string format
        if (typeof instruction === 'object' && instruction.description) {
            instructionText = instruction.description;
        } else if (typeof instruction === 'string') {
            instructionText = instruction;
        } else {
            instructionText = JSON.stringify(instruction); // Fallback for debugging
        }
        
        console.log(`Final instruction text: "${instructionText}"`);
        
        instructionDiv.innerHTML = `
            <div class="instruction-number">${index + 1}</div>
            <div class="instruction-text">${instructionText}</div>
        `;
        container.appendChild(instructionDiv);
    });
}

// Adjust ingredient quantities based on servings
function adjustIngredientQuantity(ingredient) {
    if (currentServings === originalServings) {
        return ingredient;
    }
    
    const ratio = currentServings / originalServings;
    
    // Try to find and adjust numbers in the ingredient text
    return ingredient.replace(/(\d+(?:[.,]\d+)?)/g, (match) => {
        const number = parseFloat(match.replace(',', '.'));
        const adjusted = number * ratio;
        
        // Round to reasonable decimal places
        if (adjusted % 1 === 0) {
            return adjusted.toString();
        } else if (adjusted < 1) {
            return adjusted.toFixed(2).replace(/\.?0+$/, '');
        } else {
            return adjusted.toFixed(1).replace(/\.?0+$/, '');
        }
    });
}

// Toggle ingredient checked state
function toggleIngredient(checkbox) {
    checkbox.classList.toggle('checked');
    checkbox.parentElement.classList.toggle('checked');
}

// Adjust servings
function adjustServings(direction) {
    if (direction === 'increase') {
        currentServings++;
    } else if (direction === 'decrease' && currentServings > 1) {
        currentServings--;
    }
    
    document.getElementById('currentServings').textContent = currentServings;
    
    // Re-display ingredients with adjusted quantities
    if (currentRecipe && currentRecipe.ingredients) {
        displayIngredients(currentRecipe.ingredients);
    }
}

// Show error state
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    
    const errorText = document.querySelector('#errorState p');
    if (errorText && message) {
        errorText.textContent = message;
    }
}

// Delete recipe
async function deleteRecipe() {
    if (!currentRecipe) return;
    
    try {
        const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', currentRecipe.id);
            
        if (error) {
            console.error('Error deleting recipe:', error);
            alert('Fout bij het verwijderen van het recept');
            return;
        }
        
        // Redirect to recipes page
        window.location.href = 'recipes.html';
        
    } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Fout bij het verwijderen van het recept');
    }
}

// Share recipe
function shareRecipe() {
    if (!currentRecipe) return;
    
    const url = window.location.href;
    const text = `Bekijk dit recept: ${currentRecipe.name}`;
    
    if (navigator.share) {
        navigator.share({
            title: currentRecipe.name,
            text: text,
            url: url
        }).catch(err => {
            console.log('Error sharing:', err);
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

// Copy URL to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link gekopieerd naar klembord!');
        }).catch(() => {
            fallbackCopyToClipboard(text);
        });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        alert('Link gekopieerd naar klembord!');
    } catch (err) {
        alert('Kon link niet kopiëren. URL: ' + text);
    }
    
    document.body.removeChild(textArea);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadRecipe();
    
    // Servings adjustment buttons
    document.getElementById('increaseServings').addEventListener('click', () => {
        adjustServings('increase');
    });
    
    document.getElementById('decreaseServings').addEventListener('click', () => {
        adjustServings('decrease');
    });
    
    // Action buttons
    document.getElementById('editBtn').addEventListener('click', () => {
        if (currentRecipe) {
            window.location.href = `createRecipe.html?edit=${currentRecipe.id}`;
        }
    });
    
    document.getElementById('deleteBtn').addEventListener('click', () => {
        document.getElementById('deleteModalOverlay').style.display = 'block';
    });
    
    document.getElementById('shareBtn').addEventListener('click', shareRecipe);
    
    // Delete modal events
    document.getElementById('cancelDelete').addEventListener('click', () => {
        document.getElementById('deleteModalOverlay').style.display = 'none';
    });
    
    document.getElementById('confirmDelete').addEventListener('click', () => {
        document.getElementById('deleteModalOverlay').style.display = 'none';
        deleteRecipe();
    });
    
    // Close modal when clicking overlay
    document.getElementById('deleteModalOverlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            document.getElementById('deleteModalOverlay').style.display = 'none';
        }
    });
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('deleteModalOverlay').style.display = 'none';
    }
});

// Helper functions for formatting
function getCourseIcon(courseType) {
    const icons = {
        'voorgerecht': 'tapas',
        'hoofdgerecht': 'dinner_dining',
        'bijgerecht': 'rice_bowl',
        'nagerecht': 'cake',
        'snack': 'cookie',
        'drank': 'local_cafe'
    };
    return icons[courseType] || 'restaurant';
}

function formatCookingTime(minutes) {
    if (!minutes || minutes === 0) return 'Onbekend';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours} uur`;
    } else {
        return `${hours}u ${remainingMinutes}m`;
    }
}
