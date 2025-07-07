// Supabase configuratie
// Vervang deze waarden met je eigen Supabase project details

const SUPABASE_URL = 'https://tcplmqgxuuduxkgfaner.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcGxtcWd4dXVkdXhrZ2ZhbmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODUzMDcsImV4cCI6MjA2NzQ2MTMwN30.NXR33Eb04sYjN0-8qw5HxMtf0xOwNAIV-AzUaAfVHt0';

// Supabase client initialiseren
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility functions voor recepten
const RecipeService = {
  // Recept opslaan
  async saveRecipe(recipeData) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert([recipeData])
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Alle recepten ophalen
  async getAllRecipes() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return { success: false, error: error.message };
    }
  },

  // Recept ophalen op ID
  async getRecipe(id) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Recept bijwerken
  async updateRecipe(id, updates) {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error updating recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Recept verwijderen
  async deleteRecipe(id) {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return { success: false, error: error.message };
    }
  },

  // Foto uploaden naar Supabase Storage
  async uploadPhoto(file, fileName) {
    try {
      console.log('Starting photo upload to Supabase:', fileName);
      
      const { data, error } = await supabase.storage
        .from('recipe-photos')
        .upload(fileName, file);
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      console.log('Upload successful, getting public URL...');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('recipe-photos')
        .getPublicUrl(fileName);
      
      console.log('Public URL generated:', publicUrl);
      
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    }
  }
};

// Globale wrapper functies voor makkelijke toegang
async function saveRecipe(recipeData) {
  const result = await RecipeService.saveRecipe(recipeData);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function getAllRecipes() {
  const result = await RecipeService.getAllRecipes();
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function getRecipe(id) {
  const result = await RecipeService.getRecipe(id);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function updateRecipe(id, updates) {
  const result = await RecipeService.updateRecipe(id, updates);
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function deleteRecipe(id) {
  const result = await RecipeService.deleteRecipe(id);
  if (result.success) {
    return true;
  } else {
    throw new Error(result.error);
  }
}

async function uploadPhoto(file, fileName) {
  const result = await RecipeService.uploadPhoto(file, fileName);
  if (result.success) {
    return result.url;
  } else {
    throw new Error(result.error);
  }
}

// Signal that Supabase is fully loaded and ready
console.log('Supabase config loaded, dispatching ready event...');
window.dispatchEvent(new CustomEvent('supabaseReady', { 
  detail: { 
    supabase, 
    functions: { getAllRecipes, uploadPhoto } 
  } 
}));

// Also set a global flag for polling functions
window.supabaseReady = true;
