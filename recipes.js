// Recepten pagina JavaScript
class RecipesPage {
    constructor() {
        this.recipes = [];
        this.filteredRecipes = [];
        this.currentFilters = {
            search: '',
            course: '',
            time: ''
        };
        this.currentSort = 'created_at';
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        console.log('Initializing RecipesPage...');
        
        // Wacht tot alle scripts geladen zijn
        await this.waitForSupabase();
        
        this.setupEventListeners();
        
        // Laad recepten EERST
        await this.loadRecipes();
        
        // Reset filters NA het laden (voor volgende keren)
        this.resetAllFilters();
        
        // Herlaad recepten wanneer de pagina weer zichtbaar wordt
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Page became visible, reloading recipes...');
                this.loadRecipes();
            }
        });
        
        // Herlaad recepten wanneer de pagina focus krijgt
        window.addEventListener('focus', () => {
            console.log('Window got focus, reloading recipes...');
            this.loadRecipes();
        });
    }
    
    async waitForSupabase() {
        let attempts = 0;
        while (attempts < 50) { // Max 5 seconden wachten
            if (typeof getAllRecipes === 'function') {
                console.log('Supabase functions ready');
                return;
            }
            console.log('Waiting for Supabase...', attempts);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        throw new Error('Supabase functions not loaded');
    }

    setupEventListeners() {
        // Zoek en filter knoppen
        const searchBtn = document.getElementById('searchBtn');
        const filterBtn = document.getElementById('filterBtn');
        const searchBar = document.getElementById('searchBar');
        const filterPanel = document.getElementById('filterPanel');
        
        searchBtn?.addEventListener('click', () => this.toggleSearch());
        filterBtn?.addEventListener('click', () => this.toggleFilter());
        
        // Zoek input
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));
        clearSearch?.addEventListener('click', () => this.clearSearch());
        
        // Filter controls
        const courseFilter = document.getElementById('courseFilter');
        const timeFilter = document.getElementById('timeFilter');
        const clearFilters = document.getElementById('clearFilters');
        
        courseFilter?.addEventListener('change', (e) => this.handleFilter('course', e.target.value));
        timeFilter?.addEventListener('change', (e) => this.handleFilter('time', e.target.value));
        clearFilters?.addEventListener('click', () => this.clearAllFilters());
        
        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        sortSelect?.addEventListener('change', (e) => this.handleSort(e.target.value));
        
        // Click outside to close panels
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-bar') && !e.target.closest('.search-btn')) {
                searchBar?.classList.remove('show');
            }
            if (!e.target.closest('.filter-panel') && !e.target.closest('.filter-btn')) {
                filterPanel?.classList.remove('show');
            }
        });
        
        // Escape key to close panels
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchBar?.classList.remove('show');
                filterPanel?.classList.remove('show');
            }
        });
    }

    async loadRecipes() {
        try {
            this.showLoading(true);
            
            console.log('Starting to load recipes from Supabase...');
            
            // Haal recepten op uit Supabase
            const recipes = await getAllRecipes();
            this.recipes = recipes || [];
            
            console.log(`${this.recipes.length} recepten geladen:`, this.recipes);
            console.log('Current filters:', this.currentFilters);
            
            // Controleer of er filters actief zijn, zo niet reset dan alles
            const hasActiveFilters = this.currentFilters.search || this.currentFilters.course || this.currentFilters.time;
            if (!hasActiveFilters) {
                console.log('No active filters, ensuring clean state');
                this.currentFilters = {
                    search: '',
                    course: '',
                    time: ''
                };
            }
            
            // Filter en toon recepten
            this.applyFiltersAndSort();
            
        } catch (error) {
            console.error('Fout bij laden recepten:', error);
            this.showError(`Er is een fout opgetreden bij het laden van de recepten: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const recipesGrid = document.getElementById('recipesGrid');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');
        
        if (show) {
            loadingState?.style.setProperty('display', 'block');
            recipesGrid?.style.setProperty('display', 'none');
            emptyState?.style.setProperty('display', 'none');
            noResultsState?.style.setProperty('display', 'none');
        } else {
            loadingState?.style.setProperty('display', 'none');
        }
        
        this.isLoading = show;
    }

    showError(message) {
        // Toon een eenvoudige foutmelding
        alert(message);
    }

    toggleSearch() {
        const searchBar = document.getElementById('searchBar');
        const filterPanel = document.getElementById('filterPanel');
        
        // Sluit filter panel
        filterPanel?.classList.remove('show');
        
        // Toggle search bar
        searchBar?.classList.toggle('show');
        
        // Focus op search input als het open gaat
        if (searchBar?.classList.contains('show')) {
            setTimeout(() => {
                document.getElementById('searchInput')?.focus();
            }, 100);
        }
    }

    toggleFilter() {
        const searchBar = document.getElementById('searchBar');
        const filterPanel = document.getElementById('filterPanel');
        
        // Sluit search bar
        searchBar?.classList.remove('show');
        
        // Toggle filter panel
        filterPanel?.classList.toggle('show');
    }

    handleSearch(searchTerm) {
        this.currentFilters.search = searchTerm.toLowerCase().trim();
        this.applyFiltersAndSort();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
            this.handleSearch('');
        }
    }

    handleFilter(type, value) {
        this.currentFilters[type] = value;
        this.applyFiltersAndSort();
    }

    clearAllFilters() {
        // Gebruik de resetAllFilters functie
        this.resetAllFilters();
        this.applyFiltersAndSort();
    }

    resetAllFilters() {
        // Reset alle filters in het object
        this.currentFilters = {
            search: '',
            course: '',
            time: ''
        };
        
        // Reset UI elements (gebruik optional chaining voor veiligheid)
        const searchInput = document.getElementById('searchInput');
        const courseFilter = document.getElementById('courseFilter');
        const timeFilter = document.getElementById('timeFilter');
        
        if (searchInput) searchInput.value = '';
        if (courseFilter) courseFilter.value = '';
        if (timeFilter) timeFilter.value = '';
        
        console.log('All filters reset');
        
        // Update de weergave alleen als er al recepten geladen zijn
        // Dit voorkomt problemen bij de eerste initialisatie
        if (this.recipes && this.recipes.length > 0) {
            console.log('Applying filters after reset because recipes are loaded');
            this.applyFiltersAndSort();
        } else {
            console.log('Skipping filter application - no recipes loaded yet');
        }
    }

    // Debug functie om de Supabase verbinding te testen
    async debugSupabaseConnection() {
        console.log('Testing Supabase connection...');
        try {
            // Test basis verbinding met een eenvoudige query
            const { data, error, count } = await supabase
                .from('recipes')
                .select('*', { count: 'exact', head: true });
                
            if (error) {
                console.error('Supabase connection error:', error);
                return false;
            }
            
            console.log('Supabase connection successful, total recipes:', count);
            return true;
        } catch (err) {
            console.error('Supabase test failed:', err);
            return false;
        }
    }

    handleSort(sortBy) {
        this.currentSort = sortBy;
        this.applyFiltersAndSort();
    }

    applyFiltersAndSort() {
        if (this.isLoading) return;
        
        console.log('Applying filters and sort...');
        console.log('Total recipes:', this.recipes.length);
        console.log('Current filters:', this.currentFilters);
        
        // Filter recepten
        this.filteredRecipes = this.recipes.filter(recipe => {
            // Zoek filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search;
                const searchableText = [
                    recipe.name,
                    recipe.course_type,
                    ...(recipe.ingredients || [])
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            // Course filter
            if (this.currentFilters.course && recipe.course_type !== this.currentFilters.course) {
                return false;
            }
            
            // Time filter
            if (this.currentFilters.time) {
                const cookingTime = recipe.cooking_time || 0;
                const timeRange = this.currentFilters.time;
                
                switch (timeRange) {
                    case '0-15':
                        if (cookingTime > 15) return false;
                        break;
                    case '15-30':
                        if (cookingTime <= 15 || cookingTime > 30) return false;
                        break;
                    case '30-60':
                        if (cookingTime <= 30 || cookingTime > 60) return false;
                        break;
                    case '60+':
                        if (cookingTime <= 60) return false;
                        break;
                }
            }
            
            return true;
        });
        
        console.log('Filtered recipes:', this.filteredRecipes.length);
        
        // Sorteer recepten
        this.filteredRecipes.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name, 'nl');
                case 'cooking_time':
                    return (a.cooking_time || 0) - (b.cooking_time || 0);
                case 'created_at':
                default:
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });
        
        this.updateRecipeCount();
        this.renderRecipes();
    }

    updateRecipeCount() {
        const recipeCount = document.getElementById('recipeCount');
        const count = this.filteredRecipes.length;
        const countElement = recipeCount?.querySelector('.count');
        
        if (countElement) {
            countElement.textContent = count;
        }
        
        if (recipeCount) {
            const hasFilters = this.currentFilters.search || this.currentFilters.course || this.currentFilters.time;
            recipeCount.innerHTML = `<span class="count">${count}</span> ${hasFilters ? 'recepten gevonden' : 'recepten'}`;
        }
    }

    renderRecipes() {
        const recipesGrid = document.getElementById('recipesGrid');
        const emptyState = document.getElementById('emptyState');
        const noResultsState = document.getElementById('noResultsState');
        
        console.log('Rendering recipes...');
        console.log('Grid element found:', !!recipesGrid);
        
        if (!recipesGrid) return;
        
        // Toon/verberg states
        const hasOriginalRecipes = this.recipes.length > 0;
        const hasFilteredRecipes = this.filteredRecipes.length > 0;
        const hasActiveFilters = this.currentFilters.search || this.currentFilters.course || this.currentFilters.time;
        
        console.log('hasOriginalRecipes:', hasOriginalRecipes);
        console.log('hasFilteredRecipes:', hasFilteredRecipes);
        console.log('hasActiveFilters:', hasActiveFilters);
        
        if (!hasOriginalRecipes) {
            // Geen recepten in database
            recipesGrid.style.display = 'none';
            emptyState?.style.setProperty('display', 'block');
            noResultsState?.style.setProperty('display', 'none');
        } else if (!hasFilteredRecipes && hasActiveFilters) {
            // Wel recepten in database, maar geen resultaten door filters
            recipesGrid.style.display = 'none';
            emptyState?.style.setProperty('display', 'none');
            noResultsState?.style.setProperty('display', 'block');
        } else {
            // Toon recepten
            recipesGrid.style.display = 'grid';
            emptyState?.style.setProperty('display', 'none');
            noResultsState?.style.setProperty('display', 'none');
            
            // Render recipe cards
            recipesGrid.innerHTML = this.filteredRecipes.map(recipe => this.createRecipeCard(recipe)).join('');
        }
    }

    createRecipeCard(recipe) {
        // Gebruik photo_url zoals gedefinieerd in de database
        const imageUrl = recipe.photo_url || '';
        const name = this.escapeHtml(recipe.name || 'Naamloos recept');
        const courseType = this.escapeHtml(recipe.course_type || '');
        const cookingTime = recipe.cooking_time || 0;
        const servings = recipe.servings || 1;
        
        // Debug logging voor afbeelding
        console.log(`Recipe "${name}" photo_url:`, recipe.photo_url, 'final imageUrl:', imageUrl);
        
        const courseIcon = this.getCourseIcon(recipe.course_type);
        const timeText = this.formatCookingTime(cookingTime);
        
        return `
            <div class="recipe-card" onclick="window.recipesPage.openRecipeDetail('${recipe.id}')" tabindex="0" role="button" aria-label="Open recept ${name}">
                <div class="recipe-image">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${name}" loading="lazy">` : 
                        `<span class="material-symbols-outlined placeholder-icon">restaurant</span>`
                    }
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${name}</h3>
                    <div class="recipe-meta">
                        <div class="recipe-time">
                            <span class="material-symbols-outlined">schedule</span>
                            <span>${timeText}</span>
                        </div>
                        ${courseType ? `
                            <div class="recipe-course">
                                <span class="material-symbols-outlined">${courseIcon}</span>
                                <span>${courseType}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getCourseIcon(courseType) {
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

    formatCookingTime(minutes) {
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openRecipeDetail(recipeId) {
        // Voor nu simpelweg terug naar home, later kunnen we een detail pagina maken
        console.log('Open recept detail:', recipeId);
        // window.location.href = `recipeDetail.html?id=${recipeId}`;
    }
}

// Maak keyboard toegankelijkheid voor recipe cards
document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('recipe-card') && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        e.target.click();
    }
});

// Start de app wanneer de pagina geladen is
document.addEventListener('DOMContentLoaded', () => {
    // Controleer of we de juiste pagina zijn
    if (document.getElementById('recipesGrid')) {
        // Wacht een kort moment om ervoor te zorgen dat alle scripts geladen zijn
        setTimeout(() => {
            window.recipesPage = new RecipesPage();
        }, 100);
    }
});
