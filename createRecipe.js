// DOM Elements
const photoUpload = document.getElementById('photoUpload');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoPreviewContainer = document.querySelector('.photo-preview-container');
const removePhotoBtn = document.getElementById('removePhoto');
const decreaseBtn = document.getElementById('decreaseServings');
const increaseBtn = document.getElementById('increaseServings');
const servingsInput = document.getElementById('servings');
const addIngredientBtn = document.getElementById('addIngredient');
const addStepBtn = document.getElementById('addStep');
const ingredientsContainer = document.getElementById('ingredientsContainer');
const stepsContainer = document.getElementById('stepsContainer');
const saveBtn = document.getElementById('saveRecipe');
const saveFab = document.getElementById('saveFab');
const recipeForm = document.getElementById('recipeForm');

// Edit mode variables
let isEditMode = false;
let editRecipeId = null;
let currentRecipe = null;

// Check if we're in edit mode
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    editRecipeId = urlParams.get('edit');
    
    if (editRecipeId) {
        isEditMode = true;
        console.log('Edit mode activated for recipe ID:', editRecipeId);
        // Update page title
        document.title = 'Recept bewerken - Autom8';
        // Update header title if present
        const headerTitle = document.querySelector('.page-title h1');
        if (headerTitle) {
            headerTitle.textContent = 'Recept bewerken';
        }
        // Update save button text
        if (saveBtn) saveBtn.textContent = 'Wijzigingen opslaan';
        // Load recipe for editing
        loadRecipeForEdit();
    }
}

// Load recipe data for editing
async function loadRecipeForEdit() {
    try {
        // Wait for Supabase to be ready
        await waitForSupabase();
        
        const recipe = await getRecipeById(editRecipeId);
        if (!recipe) {
            alert('Recept niet gevonden');
            window.location.href = 'recipes.html';
            return;
        }
        
        currentRecipe = recipe;
        populateForm(recipe);
        
    } catch (error) {
        console.error('Error loading recipe for edit:', error);
        alert('Fout bij het laden van het recept');
        window.location.href = 'recipes.html';
    }
}

// Wait for Supabase to be available
async function waitForSupabase() {
    let attempts = 0;
    while (attempts < 50) {
        if (typeof getRecipeById === 'function' && window.supabase) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
    }
    throw new Error('Supabase not available');
}

// Get recipe by ID
async function getRecipeById(id) {
    try {
        const { data, error } = await supabase
            .from('recipes')
            .select('*')
            .eq('id', id)
            .single();
            
        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error fetching recipe:', error);
        return null;
    }
}

// Populate form with recipe data
function populateForm(recipe) {
    // Basic fields
    document.getElementById('recipeName').value = recipe.name || '';
    document.getElementById('servings').value = recipe.servings || 1;
    document.getElementById('courseType').value = recipe.course_type || '';
    document.getElementById('cookingTime').value = recipe.cooking_time || '';
    document.getElementById('notes').value = recipe.notes || '';
    
    // Photo
    if (recipe.photo_url) {
        photoPreview.src = recipe.photo_url;
        photoPreviewContainer.style.display = 'block';
        photoUpload.querySelector('.photo-placeholder').style.display = 'none';
    }
    
    // Parse and handle ingredients
    let ingredients = recipe.ingredients;
    if (typeof ingredients === 'string') {
        try {
            ingredients = JSON.parse(ingredients);
            console.log('Parsed ingredients from JSON string for editing:', ingredients);
        } catch (e) {
            console.error('Failed to parse ingredients JSON for editing:', e, ingredients);
            ingredients = [];
        }
    }
    
    if (ingredients && Array.isArray(ingredients)) {
        // Clear existing ingredients
        ingredientsContainer.innerHTML = '';
        
        ingredients.forEach(ingredient => {
            // Handle both string format and object format
            if (typeof ingredient === 'string') {
                // Split string format "amount name" into components
                const parts = ingredient.split(' ');
                const amount = parts[0] || '';
                const name = parts.slice(1).join(' ') || '';
                addIngredientField({ amount, name });
            } else {
                // Object format { amount, name }
                addIngredientField(ingredient);
            }
        });
    }
    
    // Parse and handle instructions (check both steps and instructions columns)
    let instructions = recipe.instructions || recipe.steps;
    if (typeof instructions === 'string') {
        try {
            instructions = JSON.parse(instructions);
            console.log('Parsed instructions from JSON string for editing:', instructions);
        } catch (e) {
            console.error('Failed to parse instructions JSON for editing:', e, instructions);
            instructions = [];
        }
    }
    
    if (instructions && Array.isArray(instructions)) {
        // Clear existing steps
        stepsContainer.innerHTML = '';
        
        instructions.forEach(instruction => {
            // Handle both string format and object format
            if (typeof instruction === 'string') {
                addStepField({ description: instruction });
            } else if (instruction.description) {
                // Object format { description } or { number, description }
                addStepField({ description: instruction.description });
            } else {
                // Fallback: convert object to string
                addStepField({ description: JSON.stringify(instruction) });
            }
        });
    }
}

// Photo upload functionality
photoUpload.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.src = e.target.result;
            photoPreviewContainer.style.display = 'block';
            photoUpload.querySelector('.photo-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Remove photo functionality
removePhotoBtn.addEventListener('click', () => {
    // Clear the file input
    photoInput.value = '';
    
    // Hide preview and show placeholder
    photoPreviewContainer.style.display = 'none';
    photoUpload.querySelector('.photo-placeholder').style.display = 'block';
    
    // Clear the preview src
    photoPreview.src = '';
});

// Number input functionality
decreaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(servingsInput.value);
    if (currentValue > 1) {
        servingsInput.value = currentValue - 1;
    }
});

increaseBtn.addEventListener('click', () => {
    const currentValue = parseInt(servingsInput.value);
    if (currentValue < 20) {
        servingsInput.value = currentValue + 1;
    }
});

// Add ingredient functionality
function addIngredientField(ingredientData = null) {
    const ingredientItem = document.createElement('div');
    ingredientItem.className = 'ingredient-item';
    ingredientItem.innerHTML = `
        <input type="text" placeholder="Hoeveelheid" class="ingredient-amount" value="${ingredientData?.amount || ''}">
        <input type="text" placeholder="Ingredient" class="ingredient-name" value="${ingredientData?.name || ''}">
        <button type="button" class="remove-ingredient" title="Verwijderen">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = ingredientItem.querySelector('.remove-ingredient');
    removeBtn.addEventListener('click', () => {
        ingredientItem.remove();
    });
    
    ingredientsContainer.appendChild(ingredientItem);
    
    // Focus on the first input if no data provided (new ingredient)
    if (!ingredientData) {
        ingredientItem.querySelector('.ingredient-amount').focus();
    }
}

addIngredientBtn.addEventListener('click', () => {
    addIngredientField();
});

// Add step functionality
function addStepField(stepData = null) {
    const stepNumber = stepsContainer.children.length + 1;
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
        <div class="step-number">${stepNumber}</div>
        <textarea placeholder="Beschrijf stap ${stepNumber}..." class="step-description" rows="1">${stepData?.description || ''}</textarea>
        <button type="button" class="remove-step" title="Verwijderen">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    // Add remove functionality and auto-resize
    const removeBtn = stepItem.querySelector('.remove-step');
    const textarea = stepItem.querySelector('.step-description');
    
    removeBtn.addEventListener('click', () => {
        stepItem.remove();
        updateStepNumbers();
    });
    
    // Auto-resize textarea
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    });
    
    stepsContainer.appendChild(stepItem);
    
    // Focus on textarea if no data provided (new step)
    if (!stepData) {
        textarea.focus();
    }
    
    // Auto-resize immediately if content is provided
    if (stepData?.description) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }
}

addStepBtn.addEventListener('click', () => {
    addStepField();
});

// Update step numbers after removal
function updateStepNumbers() {
    const stepItems = stepsContainer.querySelectorAll('.step-item');
    stepItems.forEach((item, index) => {
        const stepNumber = item.querySelector('.step-number');
        const textarea = item.querySelector('.step-description');
        stepNumber.textContent = index + 1;
        textarea.placeholder = `Beschrijf stap ${index + 1}...`;
    });
}

// Add remove functionality to existing ingredients and steps
document.addEventListener('DOMContentLoaded', () => {
    // Existing ingredients
    const existingIngredients = document.querySelectorAll('.remove-ingredient');
    existingIngredients.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.ingredient-item').remove();
        });
    });
    
    // Existing steps
    const existingSteps = document.querySelectorAll('.remove-step');
    existingSteps.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.step-item').remove();
            updateStepNumbers();
        });
    });
});

// Save recipe functionality
async function saveRecipe() {
    const formData = new FormData(recipeForm);
    
    // Get ingredients
    const ingredients = [];
    const ingredientItems = document.querySelectorAll('.ingredient-item');
    ingredientItems.forEach(item => {
        const amount = item.querySelector('.ingredient-amount').value.trim();
        const name = item.querySelector('.ingredient-name').value.trim();
        if (amount && name) {
            ingredients.push({ amount, name });
        }
    });
    
    // Get steps
    const steps = [];
    const stepItems = document.querySelectorAll('.step-item');
    stepItems.forEach((item, index) => {
        const description = item.querySelector('.step-description').value.trim();
        if (description) {
            steps.push({ number: index + 1, description });
        }
    });
    
    // Validate required fields
    const recipeName = formData.get('recipeName');
    if (!recipeName) {
        alert('Vul alsjeblieft een naam in voor het recept.');
        document.getElementById('recipeName').focus();
        return;
    }
    
    if (ingredients.length === 0) {
        alert('Voeg minimaal één ingredient toe.');
        return;
    }
    
    if (steps.length === 0) {
        alert('Voeg minimaal één bereidingsstap toe.');
        return;
    }
    
    // Show loading state
    const saveButtons = [saveBtn, saveFab];
    saveButtons.forEach(btn => {
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span>';
    });
    
    try {
        let photoUrl = null;
        
        // Handle photo upload
        if (photoInput.files[0]) {
            // New photo uploaded
            const file = photoInput.files[0];
            const fileName = `recipe-${Date.now()}-${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
            
            console.log('Uploading photo:', fileName, 'File size:', file.size);
            
            const photoResult = await RecipeService.uploadPhoto(file, fileName);
            if (photoResult.success) {
                photoUrl = photoResult.url;
                console.log('Photo uploaded successfully:', photoUrl);
            } else {
                console.warn('Photo upload failed:', photoResult.error);
            }
        } else if (isEditMode && currentRecipe && currentRecipe.photo_url && photoPreview.src) {
            // Keep existing photo if preview is showing and no new photo was uploaded
            photoUrl = currentRecipe.photo_url;
            console.log('Keeping existing photo:', photoUrl);
        } else {
            console.log('No photo selected for upload');
        }
        
        // Create recipe object
        const recipe = {
            name: recipeName,
            servings: parseInt(formData.get('servings')),
            course_type: formData.get('courseType') || null,
            cooking_time: formData.get('cookingTime') ? parseInt(formData.get('cookingTime')) : null,
            ingredients: ingredients,
            steps: steps, // Save as 'steps' to match existing database schema
            notes: formData.get('notes') || null,
            photo_url: photoUrl  // Gebruik photo_url zoals in de database
        };
        
        console.log('Saving recipe with data:', recipe);
        console.log('Ingredients type:', typeof recipe.ingredients, 'Array?', Array.isArray(recipe.ingredients));
        console.log('Steps type:', typeof recipe.steps, 'Array?', Array.isArray(recipe.steps));
        
        let result;
        if (isEditMode && currentRecipe) {
            // Update recipe
            result = await RecipeService.updateRecipe(currentRecipe.id, recipe);
        } else {
            // Save new recipe
            result = await RecipeService.saveRecipe(recipe);
        }
        
        if (result.success) {
            alert('Recept succesvol opgeslagen!');
            // Navigate to recipes page
            window.location.href = 'recipes.html';
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('Error saving recipe:', error);
        alert(`Er is een fout opgetreden bij het opslaan: ${error.message}`);
        
        // Restore buttons
        saveButtons.forEach(btn => {
            btn.disabled = false;
            btn.innerHTML = '<span class="material-symbols-outlined">save</span>';
        });
    }
}

// Add event listeners for save buttons
saveBtn.addEventListener('click', saveRecipe);
saveFab.addEventListener('click', saveRecipe);

// Form submission
recipeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveRecipe();
});

// Auto-resize textareas
document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA') {
        // Reset height to recalculate
        e.target.style.height = 'auto';
        
        // Calculate the scroll height and set it
        const scrollHeight = e.target.scrollHeight;
        
        // Set minimum height for step descriptions
        if (e.target.classList.contains('step-description')) {
            const minHeight = 44; // Match CSS min-height + padding
            e.target.style.height = Math.max(scrollHeight, minHeight) + 'px';
        } else {
            e.target.style.height = scrollHeight + 'px';
        }
    }
});

// Initialize textarea heights on page load
document.addEventListener('DOMContentLoaded', () => {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        if (textarea.classList.contains('step-description')) {
            textarea.style.height = '44px';
        } else {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
    });
});

// Prevent form submission on Enter in input fields
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        e.preventDefault();
        
        // Move focus to next input or add new ingredient/step
        const currentInput = e.target;
        const currentItem = currentInput.closest('.ingredient-item, .step-item');
        
        if (currentItem && currentItem.classList.contains('ingredient-item')) {
            const nextInput = currentInput.nextElementSibling;
            if (nextInput && nextInput.tagName === 'INPUT') {
                nextInput.focus();
            } else {
                addIngredientBtn.click();
            }
        }
    }
});

// Check edit mode on page load
document.addEventListener('DOMContentLoaded', checkEditMode);
