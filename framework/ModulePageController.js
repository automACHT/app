/**
 * Module Page Controller
 * Beheert de verschillende pagina's voor een module
 */

class ModulePageController {
    constructor(configPath) {
        this.framework = new ModuleFramework();
        this.viewGenerator = null;
        this.configPath = configPath;
        this.currentView = 'list'; // 'list', 'detail', 'create', 'edit'
        this.currentItem = null;
        this.searchTerm = '';
        this.filters = {};
        this.allItems = [];
        this.filteredItems = [];
    }

    /**
     * Initialiseer de controller
     */
    async init() {
        try {
            const success = await this.framework.init(this.configPath);
            if (!success) {
                throw new Error('Framework initialisatie gefaald');
            }

            this.viewGenerator = new ModuleViewGenerator(this.framework);
            this.setupEventHandlers();
            this.updateTheme();

            // Bepaal welke view te tonen op basis van URL parameters
            this.determineInitialView();

            return true;
        } catch (error) {
            console.error('Page controller initialisatie gefaald:', error);
            this.showError('Er is een fout opgetreden bij het laden van de pagina.');
            return false;
        }
    }

    /**
     * Bepaal welke view te tonen op basis van URL
     */
    determineInitialView() {
        const urlParams = new URLSearchParams(window.location.search);
        const view = urlParams.get('view') || 'list';
        const id = urlParams.get('id');
        const edit = urlParams.get('edit');

        if (edit) {
            this.showEditView(edit);
        } else if (view === 'detail' && id) {
            this.showDetailView(id);
        } else if (view === 'create') {
            this.showCreateView();
        } else {
            this.showListView();
        }
    }

    /**
     * Setup event handlers
     */
    setupEventHandlers() {
        // Framework events
        this.framework.on('view', (item) => {
            this.showDetailView(item.id);
        });

        this.framework.on('edit', (item) => {
            this.showEditView(item.id);
        });

        this.framework.on('delete', (item) => {
            this.confirmDelete(item);
        });

        // Global events
        this.setupGlobalEvents();
    }

    /**
     * Setup globale events (navigation, save, etc.)
     */
    setupGlobalEvents() {
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        const saveFab = document.getElementById('saveFab');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.handleSave());
        }
        if (saveFab) {
            saveFab.addEventListener('click', () => this.handleSave());
        }

        // Create button
        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateView());
        }

        // Back buttons
        const backBtns = document.querySelectorAll('.back-btn');
        backBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleBack());
        });

        // Edit button (in detail view)
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                if (this.currentItem) {
                    this.showEditView(this.currentItem.id);
                }
            });
        }

        // Delete button (in detail view)
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                if (this.currentItem) {
                    this.confirmDelete(this.currentItem);
                }
            });
        }
    }

    /**
     * Update theme op basis van configuratie
     */
    updateTheme() {
        const themeColor = this.framework.getThemeColor();
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor);
        }

        // Update CSS custom property
        document.documentElement.style.setProperty('--theme-color', themeColor);
    }

    /**
     * Toon lijst view
     */
    async showListView() {
        this.currentView = 'list';
        this.updateURL({ view: 'list' });
        this.updatePageTitle(`${this.framework.getCategory()}`);

        // Show loading
        this.showLoading();

        try {
            // Fetch data
            this.allItems = await this.framework.fetchData();
            if (!this.allItems) {
                this.allItems = [];
            }

            this.applyFilters();
            this.renderListView();
        } catch (error) {
            console.error('Error loading list view:', error);
            this.showError('Er is een fout opgetreden bij het laden van de gegevens.');
        }
    }

    /**
     * Render lijst view
     */
    renderListView() {
        // Show main content containers
        this.showMainContent();
        
        const container = document.getElementById('mainContent');
        if (!container) return;

        // Clear loading
        this.hideLoading();

        // Setup search and filters
        const searchContainer = document.getElementById('searchContainer');
        if (searchContainer) {
            this.viewGenerator.generateSearchFilter(
                searchContainer,
                (searchTerm) => this.handleSearch(searchTerm),
                (field, value) => this.handleFilter(field, value)
            );
        }

        // Render list
        this.viewGenerator.generateListView(container, this.filteredItems);

        // Update UI elements
        this.updateListViewUI();
    }

    /**
     * Update lijst view UI elements
     */
    updateListViewUI() {
        // Show/hide create button
        const createBtn = document.getElementById('createBtn');
        if (createBtn) {
            createBtn.style.display = 'block';
        }

        // Hide detail/edit specific buttons
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    /**
     * Toon detail view
     */
    async showDetailView(itemId) {
        this.currentView = 'detail';
        this.updateURL({ view: 'detail', id: itemId });

        // Show loading
        this.showLoading();

        try {
            const item = await this.framework.fetchData(itemId);
            if (!item) {
                this.showError('Item niet gevonden.');
                return;
            }

            this.currentItem = item;
            this.updatePageTitle(this.getItemTitle(item));

            // Hide other containers and show main content
            this.hideAllContainers();
            
            // Render detail view
            const container = document.getElementById('mainContent');
            if (container) {
                container.style.display = 'block';
                this.hideLoading();
                this.viewGenerator.generateDetailView(container, item);
            }

            this.updateDetailViewUI();
        } catch (error) {
            console.error('Error loading detail view:', error);
            this.showError('Er is een fout opgetreden bij het laden van de details.');
        }
    }

    /**
     * Update detail view UI elements
     */
    updateDetailViewUI() {
        // Show edit and delete buttons
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (editBtn) editBtn.style.display = 'block';
        if (deleteBtn) deleteBtn.style.display = 'block';

        // Hide create button
        const createBtn = document.getElementById('createBtn');
        if (createBtn) createBtn.style.display = 'none';
    }

    /**
     * Toon create view
     */
    showCreateView() {
        this.currentView = 'create';
        this.updateURL({ view: 'create' });
        this.updatePageTitle(`Nieuwe ${this.framework.getCategory().slice(0, -1)}`);

        this.framework.currentMode = 'create';
        this.framework.currentItemId = null;

        // Hide other containers
        this.hideAllContainers();

        // Show and render form
        const formContainer = document.getElementById('formContainer');
        const mainContent = document.getElementById('mainContent');
        
        if (formContainer) {
            formContainer.style.display = 'block';
            this.framework.generateForm(formContainer, 'create');
        } else if (mainContent) {
            mainContent.style.display = 'block';
            this.framework.generateForm(mainContent, 'create');
        }

        this.updateCreateEditViewUI();
    }

    /**
     * Toon edit view
     */
    async showEditView(itemId) {
        this.currentView = 'edit';
        this.updateURL({ view: 'edit', id: itemId });

        // Show loading
        this.showLoading();

        try {
            const item = await this.framework.fetchData(itemId);
            if (!item) {
                this.showError('Item niet gevonden.');
                return;
            }

            this.currentItem = item;
            this.updatePageTitle(`${this.getItemTitle(item)} bewerken`);

            this.framework.setEditMode(itemId);

            // Hide other containers
            this.hideAllContainers();

            // Show and render form
            const formContainer = document.getElementById('formContainer');
            const mainContent = document.getElementById('mainContent');
            
            if (formContainer) {
                this.hideLoading();
                formContainer.style.display = 'block';
                this.framework.generateForm(formContainer, 'edit');
                
                // Populate form with data
                setTimeout(() => {
                    this.framework.populateForm(item);
                }, 150);
            } else if (mainContent) {
                this.hideLoading();
                mainContent.style.display = 'block';
                this.framework.generateForm(mainContent, 'edit');
                
                // Populate form with data
                setTimeout(() => {
                    this.framework.populateForm(item);
                }, 150);
            }

            this.updateCreateEditViewUI();
        } catch (error) {
            console.error('Error loading edit view:', error);
            this.showError('Er is een fout opgetreden bij het laden van de bewerkingsgegevens.');
        }
    }

    /**
     * Update create/edit view UI elements
     */
    updateCreateEditViewUI() {
        // Show save buttons
        const saveBtn = document.getElementById('saveBtn');
        const saveFab = document.getElementById('saveFab');
        if (saveBtn) saveBtn.style.display = 'block';
        if (saveFab) saveFab.style.display = 'block';

        // Hide other buttons
        const createBtn = document.getElementById('createBtn');
        const editBtn = document.getElementById('editBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (createBtn) createBtn.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';
        if (deleteBtn) deleteBtn.style.display = 'none';
    }

    /**
     * Handle save action
     */
    async handleSave() {
        try {
            // Disable save buttons during save
            this.disableSaveButtons();

            const formData = this.framework.getFormData();
            const result = await this.framework.saveData(formData);

            if (result.success) {
                this.showSuccess(
                    this.currentView === 'create' ? 
                    'Item succesvol aangemaakt!' : 
                    'Wijzigingen succesvol opgeslagen!'
                );

                // Navigate based on view
                if (this.currentView === 'create') {
                    // Go to detail view of new item
                    this.showDetailView(result.data.id);
                } else {
                    // Stay in edit or go to detail
                    this.showDetailView(this.framework.currentItemId);
                }
            } else {
                this.showErrors(result.errors);
            }
        } catch (error) {
            console.error('Error saving:', error);
            this.showError('Er is een fout opgetreden bij het opslaan.');
        } finally {
            this.enableSaveButtons();
        }
    }

    /**
     * Handle back navigation
     */
    handleBack() {
        if (this.currentView === 'detail' || this.currentView === 'create' || this.currentView === 'edit') {
            this.showListView();
        } else {
            window.history.back();
        }
    }

    /**
     * Handle search
     */
    handleSearch(searchTerm) {
        this.searchTerm = searchTerm;
        this.applyFilters();
        this.renderListView();
    }

    /**
     * Handle filter
     */
    handleFilter(field, value) {
        if (value === '') {
            delete this.filters[field];
        } else {
            this.filters[field] = value;
        }
        this.applyFilters();
        this.renderListView();
    }

    /**
     * Apply filters en search
     */
    applyFilters() {
        this.filteredItems = this.viewGenerator.filterItems(
            this.allItems, 
            this.searchTerm, 
            this.filters
        );
    }

    /**
     * Confirm delete
     */
    async confirmDelete(item) {
        const itemTitle = this.getItemTitle(item);
        const confirmed = confirm(`Weet je zeker dat je "${itemTitle}" wilt verwijderen?`);
        
        if (confirmed) {
            try {
                const result = await this.framework.deleteData(item.id);
                if (result.success) {
                    this.showSuccess('Item succesvol verwijderd!');
                    this.showListView(); // Refresh list
                } else {
                    this.showErrors(result.errors);
                }
            } catch (error) {
                console.error('Error deleting item:', error);
                this.showError('Er is een fout opgetreden bij het verwijderen.');
            }
        }
    }

    /**
     * Get item title voor display
     */
    getItemTitle(item) {
        const primaryField = this.framework.config.fields.find(f => f.type === 'text') || 
                           this.framework.config.fields[0];
        return item[primaryField.name] || 'Zonder titel';
    }

    /**
     * Update page title
     */
    updatePageTitle(title) {
        document.title = `${title} - Autom8`;
        
        const pageTitle = document.querySelector('.page-title h1');
        if (pageTitle) {
            pageTitle.textContent = title;
        }
    }

    /**
     * Update URL zonder page refresh
     */
    updateURL(params) {
        const url = new URL(window.location);
        
        // Bewaar belangrijke parameters die we willen behouden
        const category = url.searchParams.get('category');
        
        // Clear existing params
        url.searchParams.delete('view');
        url.searchParams.delete('id');
        url.searchParams.delete('edit');

        // Herstel category parameter als die bestond
        if (category) {
            url.searchParams.set('category', category);
        }

        // Add new params
        Object.entries(params).forEach(([key, value]) => {
            if (value) {
                url.searchParams.set(key, value);
            }
        });

        window.history.pushState(null, '', url);
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'block';
        }
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        this.hideLoading();
        // Implementeer toast/notification systeem
        console.error(message);
        alert(message); // Temporary - vervang met betere UI
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        // Implementeer toast/notification systeem
        console.log(message);
        // Temporary - vervang met betere UI
    }

    /**
     * Show multiple errors
     */
    showErrors(errors) {
        const message = errors.join('\n');
        this.showError(message);
    }

    /**
     * Disable save buttons
     */
    disableSaveButtons() {
        const saveBtn = document.getElementById('saveBtn');
        const saveFab = document.getElementById('saveFab');
        if (saveBtn) saveBtn.disabled = true;
        if (saveFab) saveFab.disabled = true;
    }

    /**
     * Enable save buttons
     */
    enableSaveButtons() {
        const saveBtn = document.getElementById('saveBtn');
        const saveFab = document.getElementById('saveFab');
        if (saveBtn) saveBtn.disabled = false;
        if (saveFab) saveFab.disabled = false;
    }

    /**
     * Hide all containers voor view switching
     */
    hideAllContainers() {
        const containers = ['formContainer', 'mainContent', 'searchContainer'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.style.display = 'none';
            }
        });
    }

    /**
     * Show main content container
     */
    showMainContent() {
        this.hideAllContainers();
        const mainContent = document.getElementById('mainContent');
        const searchContainer = document.getElementById('searchContainer');
        
        if (mainContent) mainContent.style.display = 'block';
        if (searchContainer) searchContainer.style.display = 'block';
    }

    /**
     * Get de configuratie van het framework
     */
    get config() {
        return this.framework?.config;
    }
}

// Export voor gebruik in andere bestanden
window.ModulePageController = ModulePageController;
