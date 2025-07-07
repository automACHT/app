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
addIngredientBtn.addEventListener('click', () => {
    const ingredientItem = document.createElement('div');
    ingredientItem.className = 'ingredient-item';
    ingredientItem.innerHTML = `
        <input type="text" placeholder="Hoeveelheid" class="ingredient-amount">
        <input type="text" placeholder="Ingredient" class="ingredient-name">
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
    
    // Focus on the first input
    ingredientItem.querySelector('.ingredient-amount').focus();
});

// Add step functionality
addStepBtn.addEventListener('click', () => {
    const stepNumber = stepsContainer.children.length + 1;
    const stepItem = document.createElement('div');
    stepItem.className = 'step-item';
    stepItem.innerHTML = `
        <div class="step-number">${stepNumber}</div>
        <textarea placeholder="Beschrijf stap ${stepNumber}..." class="step-description" rows="1"></textarea>
        <button type="button" class="remove-step" title="Verwijderen">
            <span class="material-symbols-outlined">close</span>
        </button>
    `;
    
    // Add remove functionality
    const removeBtn = stepItem.querySelector('.remove-step');
    removeBtn.addEventListener('click', () => {
        stepItem.remove();
        updateStepNumbers();
    });
    
    stepsContainer.appendChild(stepItem);
    
    // Set initial height for the new textarea
    const newTextarea = stepItem.querySelector('.step-description');
    newTextarea.style.height = '44px';
    
    // Focus on the textarea
    newTextarea.focus();
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
        
        // Upload photo if one is selected
        if (photoInput.files[0]) {
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
            steps: steps,
            notes: formData.get('notes') || null,
            photo_url: photoUrl  // Gebruik photo_url zoals in de database
        };
        
        // Save to Supabase
        const result = await RecipeService.saveRecipe(recipe);
        
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
