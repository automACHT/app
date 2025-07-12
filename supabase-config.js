// Main Supabase initialization file
// This file orchestrates the initialization of all Supabase-related modules
// All modules should be loaded via script tags in the HTML files

console.log('🔧 Supabase orchestrator loaded');

// Function to check if all modules are loaded
function checkModulesLoaded() {
  const configLoaded = window.SupabaseConfig && window.SupabaseConfig.client;
  const serviceLoaded = window.RecipeService;
  const apiLoaded = typeof getAllRecipes === 'function';
  
  return { configLoaded, serviceLoaded, apiLoaded, allLoaded: configLoaded && serviceLoaded && apiLoaded };
}

// Wait for all modules to be loaded
async function waitForAllModules() {
  let attempts = 0;
  const maxAttempts = 100; // 10 seconds max wait
  
  while (attempts < maxAttempts) {
    const status = checkModulesLoaded();
    
    if (status.allLoaded) {
      console.log('✅ All Supabase modules ready!');
      return true;
    }
    
    if (attempts % 10 === 0) { // Log every second
      console.log('⏳ Waiting for Supabase modules...', {
        config: status.configLoaded ? '✅' : '❌',
        service: status.serviceLoaded ? '✅' : '❌',
        api: status.apiLoaded ? '✅' : '❌',
        attempt: `${attempts}/${maxAttempts}`
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  console.error('❌ Failed to load all Supabase modules within timeout');
  return false;
}

// Initialize when DOM is ready
async function initializeSupabase() {
  try {
    console.log('🚀 Starting Supabase initialization...');
    
    const success = await waitForAllModules();
    
    if (success) {
      // Maintain backward compatibility
      console.log('📡 Dispatching supabaseReady event...');
      window.dispatchEvent(new CustomEvent('supabaseReady', { 
        detail: { 
          supabase: window.SupabaseConfig.client,
          functions: { getAllRecipes, uploadPhoto, saveRecipe, getRecipe, updateRecipe, deleteRecipe }
        } 
      }));
      
      // Set global flag
      window.supabaseReady = true;
      console.log('🎉 Supabase fully initialized and ready!');
    } else {
      console.error('💥 Supabase initialization failed');
    }
    
  } catch (error) {
    console.error('❌ Error during Supabase initialization:', error);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSupabase);
} else {
  initializeSupabase();
}
