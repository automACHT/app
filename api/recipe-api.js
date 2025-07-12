// Global wrapper functions for easy access to recipe operations
// Deze functies bieden een eenvoudige interface voor de RecipeService

// Wacht tot de RecipeService klaar is
function ensureRecipeServiceReady() {
  return new Promise((resolve) => {
    if (window.RecipeService && window.RecipeService.isReady) {
      resolve();
    } else {
      const handler = () => {
        if (window.RecipeService && window.RecipeService.isReady) {
          window.removeEventListener('recipeServiceReady', handler);
          resolve();
        }
      };
      window.addEventListener('recipeServiceReady', handler);
      
      // Fallback: check periodically
      const checkInterval = setInterval(() => {
        if (window.RecipeService && window.RecipeService.isReady) {
          clearInterval(checkInterval);
          window.removeEventListener('recipeServiceReady', handler);
          resolve();
        }
      }, 100);
    }
  });
}

async function saveRecipe(recipeData) {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.saveRecipe(recipeData);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function getAllRecipes() {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.getAllRecipes();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function getRecipe(id) {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.getRecipe(id);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function updateRecipe(id, updates) {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.updateRecipe(id, updates);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function deleteRecipe(id) {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.deleteRecipe(id);
  if (result.success) {
    return true;
  } else {
    throw new Error(result.error);
  }
}

async function uploadPhoto(file, fileName) {
  await ensureRecipeServiceReady();
  const result = await window.RecipeService.uploadPhoto(file, fileName);
  if (result.success) {
    return result.url;
  } else {
    throw new Error(result.error);
  }
}

// Signal that all recipe functions are ready
console.log('Recipe API loaded');
window.dispatchEvent(new CustomEvent('recipeAPIReady', { 
  detail: { 
    functions: { getAllRecipes, uploadPhoto, saveRecipe, getRecipe, updateRecipe, deleteRecipe } 
  } 
}));

// Set global flag for backward compatibility
window.supabaseReady = true;
