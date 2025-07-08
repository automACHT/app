/**
 * View Generator voor het tonen van module data
 * Genereert views op basis van configuratie
 */

class ModuleViewGenerator {
    constructor(framework) {
        this.framework = framework;
        this.config = framework.config;
    }

    /**
     * Genereer lijst view
     * @param {HTMLElement} container - Container voor de lijst
     * @param {Array} items - Items om te tonen
     * @param {Object} options - Opties voor de lijst
     */
    generateListView(container, items, options = {}) {
        container.innerHTML = '';

        if (!items || items.length === 0) {
            this.showEmptyState(container);
            return;
        }

        const listContainer = document.createElement('div');
        listContainer.className = 'module-list';

        items.forEach(item => {
            const listItem = this.createListItem(item, options);
            listContainer.appendChild(listItem);
        });

        container.appendChild(listContainer);
    }

    /**
     * Maak een lijst item
     */
    createListItem(item, options = {}) {
        const itemElement = document.createElement('div');
        itemElement.className = 'module-list-item';
        itemElement.dataset.id = item.id;

        // Vind primary field (meestal de eerste text field)
        const primaryField = this.config.fields.find(f => f.type === 'text') || this.config.fields[0];
        const imageField = this.config.fields.find(f => f.type === 'image');

        // Maak item content
        const itemContent = document.createElement('div');
        itemContent.className = 'item-content';

        // Image (als beschikbaar)
        if (imageField && item[imageField.name]) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'item-image';
            
            const img = document.createElement('img');
            img.src = item[imageField.name];
            img.alt = item[primaryField.name] || 'Item afbeelding';
            img.loading = 'lazy';
            
            imageContainer.appendChild(img);
            itemContent.appendChild(imageContainer);
        }

        // Text content
        const textContent = document.createElement('div');
        textContent.className = 'item-text';

        // Title
        const title = document.createElement('h3');
        title.className = 'item-title';
        title.textContent = item[primaryField.name] || 'Geen titel';
        textContent.appendChild(title);

        // Metadata (andere velden)
        const metadata = document.createElement('div');
        metadata.className = 'item-metadata';

        this.config.fields.forEach(field => {
            if (field.name !== primaryField.name && field.type !== 'image' && field.type !== 'textarea') {
                if (item[field.name]) {
                    const metaItem = document.createElement('span');
                    metaItem.className = 'meta-item';
                    
                    let value = item[field.name];
                    
                    // Handle different field types
                    if (field.type === 'array') {
                        // Voor array fields, toon de items als een leesbare lijst
                        if (Array.isArray(value)) {
                            if (field.name === 'items' && value.length > 0) {
                                // Voor grocery list items, toon alleen de namen
                                const itemNames = value.map(item => item.name || item).filter(name => name);
                                if (itemNames.length > 0) {
                                    value = `${itemNames.length} item${itemNames.length !== 1 ? 's' : ''}`;
                                    // Optioneel: toon eerste paar items
                                    if (itemNames.length <= 3) {
                                        value = itemNames.join(', ');
                                    } else {
                                        value = `${itemNames.slice(0, 2).join(', ')} en ${itemNames.length - 2} meer`;
                                    }
                                } else {
                                    value = 'Geen items';
                                }
                            } else {
                                value = `${value.length} item${value.length !== 1 ? 's' : ''}`;
                            }
                        } else {
                            value = 'Geen items';
                        }
                    } else if (field.type === 'number' && field.name.includes('time')) {
                        value = `${value} min`;
                    }
                    
                    metaItem.textContent = value;
                    metadata.appendChild(metaItem);
                }
            }
        });

        textContent.appendChild(metadata);
        itemContent.appendChild(textContent);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        const viewBtn = document.createElement('button');
        viewBtn.className = 'action-btn view-btn';
        viewBtn.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
        viewBtn.title = 'Bekijken';
        viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.framework.trigger('view', item);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'action-btn edit-btn';
        editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>';
        editBtn.title = 'Bewerken';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.framework.trigger('edit', item);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'action-btn delete-btn';
        deleteBtn.innerHTML = '<span class="material-symbols-outlined">delete</span>';
        deleteBtn.title = 'Verwijderen';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.framework.trigger('delete', item);
        });

        actions.appendChild(viewBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        itemElement.appendChild(itemContent);
        itemElement.appendChild(actions);

        // Click event voor hele item
        itemElement.addEventListener('click', () => {
            this.framework.trigger('view', item);
        });

        return itemElement;
    }

    /**
     * Genereer detail view
     * @param {HTMLElement} container - Container voor de detail view
     * @param {Object} item - Item om te tonen
     */
    generateDetailView(container, item) {
        container.innerHTML = '';

        const detailContainer = document.createElement('div');
        detailContainer.className = 'module-detail';

        // Header met image (als beschikbaar)
        const imageField = this.config.fields.find(f => f.type === 'image');
        if (imageField && item[imageField.name]) {
            const header = document.createElement('div');
            header.className = 'detail-header';
            
            const img = document.createElement('img');
            img.src = item[imageField.name];
            img.alt = 'Detail afbeelding';
            img.className = 'detail-image';
            
            header.appendChild(img);
            detailContainer.appendChild(header);
        }

        // Content sections
        const content = document.createElement('div');
        content.className = 'detail-content';

        this.config.fields.forEach(field => {
            if (field.type !== 'image' && item[field.name]) {
                const section = this.createDetailSection(field, item[field.name]);
                content.appendChild(section);
            }
        });

        detailContainer.appendChild(content);
        container.appendChild(detailContainer);
    }

    /**
     * Maak detail sectie
     */
    createDetailSection(field, value) {
        const section = document.createElement('div');
        section.className = 'detail-section';

        const label = document.createElement('h3');
        label.className = 'detail-label';
        label.textContent = field.label;

        const content = document.createElement('div');
        content.className = 'detail-value';

        if (field.type === 'textarea') {
            // Behoud line breaks voor textarea content
            content.innerHTML = value.replace(/\n/g, '<br>');
        } else if (field.type === 'array') {
            // Handle array fields
            if (Array.isArray(value) && value.length > 0) {
                const list = document.createElement('ul');
                list.className = 'array-items-list';
                
                value.forEach(item => {
                    const listItem = document.createElement('li');
                    listItem.className = 'array-item-display';
                    
                    if (typeof item === 'object' && item.name) {
                        // Voor grocery list items met naam en checked status
                        const itemContent = document.createElement('div');
                        itemContent.className = 'array-item-content';
                        
                        const checkbox = document.createElement('span');
                        checkbox.className = 'array-item-checkbox';
                        checkbox.textContent = item.checked ? '✅' : '☐';
                        
                        const name = document.createElement('span');
                        name.className = 'array-item-name';
                        name.textContent = item.name;
                        if (item.checked) {
                            name.style.textDecoration = 'line-through';
                            name.style.opacity = '0.7';
                        }
                        
                        itemContent.appendChild(checkbox);
                        itemContent.appendChild(name);
                        listItem.appendChild(itemContent);
                    } else {
                        // Voor eenvoudige string items
                        listItem.textContent = item.toString();
                    }
                    
                    list.appendChild(listItem);
                });
                
                content.appendChild(list);
            } else {
                content.textContent = 'Geen items';
            }
        } else if (field.type === 'select' && field.name === 'ingredients') {
            // Special handling voor ingredients (als het een array is)
            if (Array.isArray(value)) {
                const list = document.createElement('ul');
                list.className = 'ingredients-list';
                value.forEach(ingredient => {
                    const item = document.createElement('li');
                    item.textContent = ingredient;
                    list.appendChild(item);
                });
                content.appendChild(list);
            } else {
                content.textContent = value;
            }
        } else {
            content.textContent = value;
        }

        section.appendChild(label);
        section.appendChild(content);

        return section;
    }

    /**
     * Toon empty state
     */
    showEmptyState(container) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <span class="material-symbols-outlined">inbox</span>
            </div>
            <h3>Geen ${this.config.category.toLowerCase()} gevonden</h3>
            <p>Voeg je eerste ${this.config.category.toLowerCase().slice(0, -1)} toe om te beginnen.</p>
        `;
        container.appendChild(emptyState);
    }

    /**
     * Genereer search en filter UI
     * @param {HTMLElement} container - Container voor search/filter
     * @param {Function} onSearch - Callback voor search
     * @param {Function} onFilter - Callback voor filter
     */
    generateSearchFilter(container, onSearch, onFilter) {
        container.innerHTML = '';

        // Search bar
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = `Zoek ${this.config.category.toLowerCase()}...`;
        searchInput.addEventListener('input', (e) => {
            onSearch(e.target.value);
        });

        const searchIcon = document.createElement('span');
        searchIcon.className = 'material-symbols-outlined search-icon';
        searchIcon.textContent = 'search';

        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(searchInput);

        // Filter options (voor select fields)
        const filterContainer = document.createElement('div');
        filterContainer.className = 'filter-container';

        const selectFields = this.config.fields.filter(f => f.type === 'select');
        selectFields.forEach(field => {
            if (field.options) {
                const filter = document.createElement('select');
                filter.className = 'filter-select';
                filter.dataset.field = field.name;

                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `Alle ${field.label.toLowerCase()}`;
                filter.appendChild(defaultOption);

                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option.value;
                    optionElement.textContent = option.label;
                    filter.appendChild(optionElement);
                });

                filter.addEventListener('change', (e) => {
                    onFilter(field.name, e.target.value);
                });

                filterContainer.appendChild(filter);
            }
        });

        container.appendChild(searchContainer);
        if (filterContainer.children.length > 0) {
            container.appendChild(filterContainer);
        }
    }

    /**
     * Filter items op basis van search en filter criteria
     * @param {Array} items - Items om te filteren
     * @param {string} searchTerm - Search term
     * @param {Object} filters - Filter criteria
     * @returns {Array} Gefilterde items
     */
    filterItems(items, searchTerm = '', filters = {}) {
        return items.filter(item => {
            // Search filter
            if (searchTerm) {
                const searchFields = this.config.fields.filter(f => 
                    f.type === 'text' || f.type === 'textarea'
                );
                
                const matchesSearch = searchFields.some(field => {
                    const value = item[field.name];
                    return value && value.toLowerCase().includes(searchTerm.toLowerCase());
                });
                
                if (!matchesSearch) return false;
            }

            // Field filters
            for (const [fieldName, filterValue] of Object.entries(filters)) {
                if (filterValue && item[fieldName] !== filterValue) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Sorteer items
     * @param {Array} items - Items om te sorteren
     * @param {string} sortBy - Field om op te sorteren
     * @param {string} sortOrder - 'asc' of 'desc'
     * @returns {Array} Gesorteerde items
     */
    sortItems(items, sortBy, sortOrder = 'asc') {
        return [...items].sort((a, b) => {
            const aVal = a[sortBy];
            const bVal = b[sortBy];

            if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }
}

// Export voor gebruik in andere bestanden
window.ModuleViewGenerator = ModuleViewGenerator;
