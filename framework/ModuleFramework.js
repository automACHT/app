/**
 * Modulair Framework voor Autom8
 * Configureert modules op basis van JSON configuratie bestanden
 */

class ModuleFramework {
    constructor() {
        this.config = null;
        this.supabase = null;
        this.currentMode = 'view'; // 'create', 'edit', 'view', 'list'
        this.currentItemId = null;
        this.callbacks = {};
    }

    /**
     * Initialiseer het framework met een configuratie
     * @param {string} configPath - Pad naar de JSON configuratie
     */
    async init(configPath) {
        try {
            // Laad configuratie
            this.config = await this.loadConfig(configPath);
            
            // Wacht op Supabase
            await this.waitForSupabase();
            this.supabase = window.supabase;
            
            console.log('ModuleFramework geïnitialiseerd voor:', this.config.category);
            return true;
        } catch (error) {
            console.error('Framework initialisatie gefaald:', error);
            return false;
        }
    }

    /**
     * Laad configuratie van JSON bestand of fallback
     */
    async loadConfig(configPath) {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`Configuratie niet gevonden: ${configPath}`);
            }
            return await response.json();
        } catch (error) {
            // Fallback voor CORS issues of als bestand niet gevonden
            console.warn('Kon configuratie niet laden:', error.message);
            console.log('Probeer fallback configuratie...');
            
            // Probeer inline configuratie uit window object
            const configName = configPath.split('/').pop().replace('.json', '').replace('conf.', '');
            const inlineConfig = window[`${configName}Config`];
            
            if (inlineConfig) {
                console.log('Inline configuratie gevonden');
                return inlineConfig;
            }
            
            // Laatste fallback - standaard recipe configuratie
            if (configPath.includes('recipe')) {
                console.log('Gebruik standaard recipe configuratie');
                return this.getDefaultRecipeConfig();
            }
            
            throw new Error(`Geen configuratie beschikbaar voor: ${configPath}`);
        }
    }

    /**
     * Standaard recipe configuratie als fallback
     */
    getDefaultRecipeConfig() {
        return {
            "category": "Recipes",
            "theme-color": "#FF5733",
            "table": "recipes",
            "storage-bucket": "recipes",
            "fields": [
                {
                    "name": "name",
                    "type": "text",
                    "label": "Naam van het recept",
                    "required": true,
                    "placeholder": "Bijvoorbeeld: Spaghetti Carbonara"
                },
                {
                    "name": "photo_url",
                    "type": "image",
                    "label": "Recept afbeelding",
                    "required": false
                },
                {
                    "name": "cooking_time",
                    "type": "number",
                    "label": "Bereidingstijd (minuten)",
                    "required": false,
                    "min": 1,
                    "placeholder": "30"
                },
                {
                    "name": "servings",
                    "type": "number",
                    "label": "Aantal personen",
                    "required": true,
                    "min": 1,
                    "max": 20,
                    "value": 4
                },
                { 
                    "name": "course_type",
                    "type": "select",
                    "label": "Soort gerecht",
                    "required": false,
                    "options": [
                        {
                            "value": "voorgerecht",
                            "label": "Voorgerecht"
                        },
                        {
                            "value": "hoofdgerecht",
                            "label": "Hoofdgerecht"
                        },
                        {
                            "value": "bijgerecht",
                            "label": "Bijgerecht"
                        },
                        {
                            "value": "nagerecht",
                            "label": "Nagerecht"
                        },
                        {
                            "value": "snack",
                            "label": "Snack"
                        },
                        {
                            "value": "drank",
                            "label": "Drank"
                        }
                    ]
                },
                {
                    "name": "ingredients",
                    "type": "textarea",
                    "label": "Ingrediënten",
                    "required": true,
                    "placeholder": "Voer de ingrediënten in, elk op een nieuwe regel",
                    "rows": 6
                },
                {
                    "name": "steps",
                    "type": "textarea",
                    "label": "Bereidingswijze",
                    "required": true,
                    "placeholder": "Beschrijf de bereidingswijze stap voor stap",
                    "rows": 8
                },
                {
                    "name": "notes",
                    "type": "textarea",
                    "label": "Extra notities",
                    "required": false,
                    "placeholder": "Bijvoorbeeld: Tips, variaties, of bijzondere informatie...",
                    "rows": 4
                }
            ]
        };
    }

    /**
     * Wacht tot Supabase beschikbaar is
     */
    async waitForSupabase() {
        let attempts = 0;
        while (attempts < 50) {
            if (window.supabase) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        throw new Error('Supabase niet beschikbaar');
    }

    /**
     * Genereer een formulier op basis van de configuratie
     * @param {HTMLElement} container - Container waar het formulier in komt
     * @param {string} mode - 'create' of 'edit'
     */
    generateForm(container, mode = 'create') {
        this.currentMode = mode;
        container.innerHTML = '';

        const form = document.createElement('form');
        form.className = 'module-form';
        form.id = 'moduleForm';

        this.config.fields.forEach(field => {
            const section = this.createFormField(field);
            form.appendChild(section);
        });

        container.appendChild(form);
        this.attachFormEvents();
    }

    /**
     * Maak een form field op basis van field configuratie
     */
    createFormField(field) {
        const section = document.createElement('div');
        section.className = 'form-section';

        switch (field.type) {
            case 'text':
                section.appendChild(this.createTextField(field));
                break;
            case 'textarea':
                section.appendChild(this.createTextArea(field));
                break;
            case 'number':
                section.appendChild(this.createNumberField(field));
                break;
            case 'select':
                section.appendChild(this.createSelectField(field));
                break;
            case 'image':
                section.appendChild(this.createImageField(field));
                break;
            default:
                console.warn(`Onbekend field type: ${field.type}`);
        }

        return section;
    }

    /**
     * Maak text input field
     */
    createTextField(field) {
        const container = document.createElement('div');
        container.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        label.textContent = field.label + (field.required ? ' *' : '');

        const input = document.createElement('input');
        input.type = 'text';
        input.id = field.name;
        input.name = field.name;
        input.required = field.required || false;
        if (field.placeholder) input.placeholder = field.placeholder;

        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    /**
     * Maak textarea field
     */
    createTextArea(field) {
        const container = document.createElement('div');
        container.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        label.textContent = field.label + (field.required ? ' *' : '');

        const textarea = document.createElement('textarea');
        textarea.id = field.name;
        textarea.name = field.name;
        textarea.required = field.required || false;
        textarea.rows = field.rows || 4;
        if (field.placeholder) textarea.placeholder = field.placeholder;

        container.appendChild(label);
        container.appendChild(textarea);
        return container;
    }

    /**
     * Maak number input field
     */
    createNumberField(field) {
        const container = document.createElement('div');
        container.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        label.textContent = field.label + (field.required ? ' *' : '');

        const input = document.createElement('input');
        input.type = 'number';
        input.id = field.name;
        input.name = field.name;
        input.required = field.required || false;
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
        if (field.value !== undefined) input.value = field.value;
        if (field.placeholder) input.placeholder = field.placeholder;

        container.appendChild(label);
        container.appendChild(input);
        return container;
    }

    /**
     * Maak select field
     */
    createSelectField(field) {
        const container = document.createElement('div');
        container.className = 'form-group';

        const label = document.createElement('label');
        label.setAttribute('for', field.name);
        label.textContent = field.label + (field.required ? ' *' : '');

        const select = document.createElement('select');
        select.id = field.name;
        select.name = field.name;
        select.required = field.required || false;

        // Default empty option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = `Selecteer ${field.label.toLowerCase()}`;
        select.appendChild(defaultOption);

        // Voeg opties toe als ze gedefinieerd zijn
        if (field.options) {
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                select.appendChild(optionElement);
            });
        }

        container.appendChild(label);
        container.appendChild(select);
        return container;
    }

    /**
     * Maak image upload field
     */
    createImageField(field) {
        const container = document.createElement('div');
        container.className = 'form-group image-field';

        const label = document.createElement('label');
        label.textContent = field.label + (field.required ? ' *' : '');

        const uploadArea = document.createElement('div');
        uploadArea.className = 'image-upload-area';
        uploadArea.id = `${field.name}Upload`;

        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = `
            <span class="material-symbols-outlined">add_a_photo</span>
            <p>Voeg een afbeelding toe</p>
            <small>Klik om een afbeelding te selecteren</small>
        `;

        const input = document.createElement('input');
        input.type = 'file';
        input.id = field.name;
        input.name = field.name;
        input.accept = 'image/*';
        input.hidden = true;
        input.required = field.required || false;

        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-container';
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = `
            <img class="image-preview" id="${field.name}Preview">
            <button type="button" class="remove-image-btn" title="Afbeelding verwijderen">
                <span class="material-symbols-outlined">close</span>
            </button>
        `;

        uploadArea.appendChild(placeholder);
        uploadArea.appendChild(input);
        uploadArea.appendChild(previewContainer);

        container.appendChild(label);
        container.appendChild(uploadArea);

        // Events will be attached later in attachFormEvents()

        return container;
    }

    /**
     * Koppel events aan image fields
     */
    attachImageEvents(fieldName) {
        // Increase timeout further to ensure DOM is fully ready
        setTimeout(() => {
            try {
                if (!document || typeof document.getElementById !== 'function') {
                    console.warn('Document not ready for attachImageEvents');
                    return;
                }

                const uploadArea = document.getElementById(`${fieldName}Upload`);
                const input = document.getElementById(fieldName);
                
                if (!uploadArea || !input) {
                    console.warn(`Image elements niet gevonden voor field: ${fieldName}`);
                    return;
                }

                // Extra null check before querySelector calls
                if (!uploadArea.querySelector || typeof uploadArea.querySelector !== 'function') {
                    console.warn(`uploadArea heeft geen querySelector method voor field: ${fieldName}`);
                    return;
                }

                const preview = document.getElementById(`${fieldName}Preview`);
                const previewContainer = uploadArea.querySelector('.image-preview-container');
                const placeholder = uploadArea.querySelector('.image-placeholder');
                const removeBtn = uploadArea.querySelector('.remove-image-btn');

                if (!previewContainer || !placeholder) {
                    console.warn(`Image containers niet gevonden voor field: ${fieldName}`);
                    return;
                }

                uploadArea.addEventListener('click', () => {
                    if (placeholder.style.display !== 'none') {
                        input.click();
                    }
                });

                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            if (preview) {
                                preview.src = e.target.result;
                                placeholder.style.display = 'none';
                                previewContainer.style.display = 'block';
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                });

                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        input.value = '';
                        placeholder.style.display = 'block';
                        previewContainer.style.display = 'none';
                    });
                }
            } catch (error) {
                console.error(`Error attaching image events for field ${fieldName}:`, error);
            }
        }, 200); // Verhoog timeout voor DOM rendering
    }

    /**
     * Koppel form events
     */
    attachFormEvents() {
        // Wacht even voor DOM rendering
        setTimeout(() => {
            try {
                // Implementeer specifieke field events hier
                this.config.fields.forEach(field => {
                    if (field.type === 'image') {
                        this.attachImageEvents(field.name);
                    }
                });
            } catch (error) {
                console.error('Error attaching form events:', error);
            }
        }, 200); // Increased timeout to ensure DOM is ready
    }

    /**
     * Vul formulier met data (voor edit mode)
     * @param {Object} data - Data om het formulier mee te vullen
     */
    populateForm(data) {
        this.config.fields.forEach(field => {
            const element = document.getElementById(field.name);
            if (element && data[field.name] !== undefined) {
                if (field.type === 'image') {
                    // Handle image field
                    if (data[field.name]) {
                        const preview = document.getElementById(`${field.name}Preview`);
                        const placeholder = element.parentElement.querySelector('.image-placeholder');
                        const previewContainer = element.parentElement.querySelector('.image-preview-container');
                        
                        if (preview) {
                            preview.src = data[field.name];
                            placeholder.style.display = 'none';
                            previewContainer.style.display = 'block';
                        }
                    }
                } else if (field.type === 'textarea' && (field.name === 'ingredients' || field.name === 'steps')) {
                    // Handle JSONB array fields - convert to text
                    element.value = this.jsonbArrayToText(data[field.name]);
                } else {
                    element.value = data[field.name];
                }
            }
        });
    }

    /**
     * Haal data uit het formulier
     * @returns {Object} Form data
     */
    getFormData() {
        const formData = {};
        
        this.config.fields.forEach(field => {
            const element = document.getElementById(field.name);
            if (element) {
                if (field.type === 'image') {
                    // Handle image file
                    const file = element.files[0];
                    if (file) {
                        formData[field.name] = file;
                    }
                } else if (field.type === 'textarea' && (field.name === 'ingredients' || field.name === 'steps')) {
                    // Handle JSONB array fields - convert text to array
                    formData[field.name] = this.textToJsonbArray(element.value);
                } else {
                    formData[field.name] = element.value;
                }
            }
        });

        return formData;
    }

    /**
     * Valideer form data
     * @param {Object} data - Data om te valideren
     * @returns {Object} Validatie resultaat
     */
    validateFormData(data) {
        const errors = [];

        this.config.fields.forEach(field => {
            if (field.required) {
                if (!data[field.name] || data[field.name] === '') {
                    errors.push(`${field.label} is verplicht`);
                }
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Sla data op in database
     * @param {Object} data - Data om op te slaan
     * @returns {Object} Result van de operatie
     */
    async saveData(data) {
        try {
            const validation = this.validateFormData(data);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Process image uploads eerst
            const processedData = await this.processImageUploads(data);

            let result;
            if (this.currentMode === 'edit' && this.currentItemId) {
                result = await this.updateData(processedData);
            } else {
                result = await this.createData(processedData);
            }

            return result;
        } catch (error) {
            console.error('Error saving data:', error);
            return {
                success: false,
                errors: ['Er is een fout opgetreden bij het opslaan']
            };
        }
    }

    /**
     * Maak nieuwe data aan
     */
    async createData(data) {
        const tableName = this.config.table || this.config.category.toLowerCase();
        
        const { data: result, error } = await this.supabase
            .from(tableName)
            .insert([data])
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return {
                success: false,
                errors: ['Database fout: ' + error.message]
            };
        }

        return {
            success: true,
            data: result[0]
        };
    }

    /**
     * Update bestaande data
     */
    async updateData(data) {
        const tableName = this.config.table || this.config.category.toLowerCase();
        
        const { data: result, error } = await this.supabase
            .from(tableName)
            .update(data)
            .eq('id', this.currentItemId)
            .select();

        if (error) {
            console.error('Supabase error:', error);
            return {
                success: false,
                errors: ['Database fout: ' + error.message]
            };
        }

        return {
            success: true,
            data: result[0]
        };
    }

    /**
     * Process image uploads
     */
    async processImageUploads(data) {
        const processedData = { ...data };
        
        for (const field of this.config.fields) {
            if (field.type === 'image' && data[field.name] instanceof File) {
                try {
                    const imageUrl = await this.uploadImage(data[field.name], field.name);
                    processedData[field.name] = imageUrl;
                } catch (error) {
                    console.error(`Error uploading image for ${field.name}:`, error);
                    // Continue without the image
                    delete processedData[field.name];
                }
            }
        }

        return processedData;
    }

    /**
     * Upload image naar Supabase storage
     */
    async uploadImage(file, fieldName) {
        const fileName = `${Date.now()}_${file.name}`;
        const bucketName = this.config['storage-bucket'] || this.config.category.toLowerCase();
        
        // Try to upload to bucket
        const { data, error } = await this.supabase.storage
            .from(bucketName)
            .upload(fileName, file);

        if (error) {
            // If bucket doesn't exist, try to create it first
            if (error.message.includes('Bucket not found')) {
                console.log(`Creating storage bucket: ${bucketName}`);
                // For now, just throw the error - bucket creation might need admin privileges
            }
            throw error;
        }

        const { data: urlData } = this.supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return urlData.publicUrl;
    }

    /**
     * Haal data op uit database
     * @param {string} id - ID van het item (optioneel)
     * @returns {Object} Data
     */
    async fetchData(id = null) {
        try {
            const tableName = this.config.table || this.config.category.toLowerCase();
            
            let query = this.supabase.from(tableName).select('*');
            
            if (id) {
                query = query.eq('id', id).single();
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }

    /**
     * Verwijder data uit database
     */
    async deleteData(id) {
        try {
            const tableName = this.config.table || this.config.category.toLowerCase();
            
            const { error } = await this.supabase
                .from(tableName)
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Supabase error:', error);
                return {
                    success: false,
                    errors: ['Database fout: ' + error.message]
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting data:', error);
            return {
                success: false,
                errors: ['Er is een fout opgetreden bij het verwijderen']
            };
        }
    }

    /**
     * Set callback functie
     * @param {string} event - Event naam
     * @param {Function} callback - Callback functie
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }

    /**
     * Trigger callback
     * @param {string} event - Event naam
     * @param {*} data - Data om door te geven
     */
    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event](data);
        }
    }

    /**
     * Set edit mode
     * @param {string} itemId - ID van item om te bewerken
     */
    setEditMode(itemId) {
        this.currentMode = 'edit';
        this.currentItemId = itemId;
    }

    /**
     * Get theme color from config
     */
    getThemeColor() {
        return this.config['theme-color'] || '#7EB5D4';
    }

    /**
     * Get category name
     */
    getCategory() {
        return this.config.category;
    }

    /**
     * Convert text to JSONB array (for ingredients and steps)
     */
    textToJsonbArray(text) {
        if (!text || text.trim() === '') return [];
        return text.split('\n').filter(line => line.trim() !== '').map(line => line.trim());
    }

    /**
     * Convert JSONB array to text (for displaying in textarea)
     */
    jsonbArrayToText(jsonbArray) {
        if (!jsonbArray || !Array.isArray(jsonbArray)) return '';
        return jsonbArray.join('\n');
    }
}

// Export voor gebruik in andere bestanden
window.ModuleFramework = ModuleFramework;
