// Recipe service for all recipe-related database operations
class RecipeService {
  constructor() {
    this.supabase = null;
    this.isReady = false;
    
    // Wait for Supabase to be ready
    if (window.SupabaseConfig && window.SupabaseConfig.client) {
      this.supabase = window.SupabaseConfig.client;
      this.isReady = true;
    } else {
      this._waitForSupabase();
    }
  }

  _waitForSupabase() {
    const checkSupabase = () => {
      if (window.SupabaseConfig && window.SupabaseConfig.client) {
        this.supabase = window.SupabaseConfig.client;
        this.isReady = true;
        window.dispatchEvent(new CustomEvent('recipeServiceReady'));
      } else {
        setTimeout(checkSupabase, 100);
      }
    };
    checkSupabase();
  }

  // Recept opslaan
  async saveRecipe(recipeData) {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .insert([recipeData])
        .select();
      
      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    }
  }

  // Alle recepten ophalen
  async getAllRecipes() {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      const { data, error } = await this.supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return { success: false, error: error.message };
    }
  }

  // Recept ophalen op ID
  async getRecipe(id) {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      const { data, error } = await this.supabase
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
  }

  // Recept bijwerken
  async updateRecipe(id, updates) {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      const { data, error } = await this.supabase
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
  }

  // Recept verwijderen
  async deleteRecipe(id) {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      const { error } = await this.supabase
        .from('recipes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting recipe:', error);
      return { success: false, error: error.message };
    }
  }

  // Foto uploaden naar Supabase Storage
  async uploadPhoto(file, fileName) {
    if (!this.isReady) {
      throw new Error('Recipe service not ready yet');
    }
    
    try {
      console.log('Starting photo upload to Supabase:', fileName);
      
      const { data, error } = await this.supabase.storage
        .from('recipe-photos')
        .upload(fileName, file);
      
      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }
      
      console.log('Upload successful, getting public URL...');
      
      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from('recipe-photos')
        .getPublicUrl(fileName);
      
      console.log('Public URL generated:', publicUrl);
      
      return { success: true, url: publicUrl };
    } catch (error) {
      console.error('Error uploading photo:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create a singleton instance
const recipeService = new RecipeService();

// Export the service instance
window.RecipeService = recipeService;
