class LanguageSwitcher extends HTMLElement {
    
    renderType = "list";

    constructor() {
        super();
    }

    connectedCallback() {
        this.#setLanguages();

        if (!Array.isArray(this.languages) || this.languages.length === 0) {
            console.error('Invalid languages attribute. It should be a non-empty array of language codes.');
            return;
        }

        if(this.renderType === "list"){
            this.renderBaseList();
            this.renderListEntries();
        }else {
            this.renderBaseSelect();
            this.renderSelectEntries();
        }

    }

    #setLanguages() {
        this.languages = JSON.parse(this.getAttribute('languages'));
        this.defaultLanguage = this.getAttribute('default-language') || 'de';
        // [{ code, label, url|null }] — url is null when the page has no version in that language
        try {
            this.alternates = JSON.parse(this.getAttribute('alternates') || '[]');
        } catch (e) {
            this.alternates = [];
        }
        this.lang = this.getLanguageFromPage() != null ? this.getLanguageFromPage() : this.getValidLocaleFromUrl(window.location.href, this.languages);
    }

    renderSelectEntries() {
        const languageSelector = this.querySelector('#languageSelector');
        this.languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = this.labelFor(lang);
            if (this.isUntranslated(lang.code)) {
                option.textContent += ` (${this.untranslatedText()})`;
            }
            if (lang.code === this.lang) {
                option.selected = true;
            }
            languageSelector.appendChild(option);
        });

        languageSelector.addEventListener('change', () => {
            this.setAttribute('language', languageSelector.value);
            this.updateLocationWithLocale(languageSelector.value);            
            this.dispatchEvent(new CustomEvent('language-changed', {
                detail: { language: languageSelector.value },
                bubbles: true,
                composed: true
            }));
        });
    }

    renderListEntries() {
        const languageSelector = this.querySelector('#languageSelector');
        this.languages.forEach(lang => {
            const option = document.createElement('li');
            option.dataset.language = lang.code;
            
            option.tabIndex = 0;
            
            //option["aria-label"] = "Switch to ${lang.name}";
            option.classList.add("lang-list-entry");
            const btn = document.createElement('span');
            btn.textContent = this.labelFor(lang);
            btn.role = "button";
            if (this.isUntranslated(lang.code)) {
                option.classList.add("is-untranslated");
                btn.title = this.untranslatedText();
            }
            if (lang.code === this.lang ) {
                option.classList.add("selected");
            }
            languageSelector.appendChild(option);
            option.appendChild(btn);
            btn.addEventListener('click', () => {
                this.updateLocationWithLocale(lang.code);
            });
            btn.addEventListener('keydown', (e) => {
                if ( e.key === "Enter") {
                    this.updateLocationWithLocale(lang.code);
                }
            });
        });
    }

    renderBaseSelect() {
        this.innerHTML = `
            <style>
                select {
                    padding: 8px;
                    font-size: 16px;
                }
            </style>
            <select class="form-select" id="languageSelector"></select>
        `;
    }

    renderBaseList() {
        this.innerHTML = `
            <style>
                .lang-list{
                    list-style-type: none
                }
                .lang-list-entry {
                    padding-right: 8px;
                    color: black;
                    display:inline-block;
                }
                .selected {
                    text-decoration: underline;
                }
                .is-untranslated {
                    opacity: 0.6;
                }
            </style>
            <nav aria-label="Language Selector">
                <ul class="lang-list" id="languageSelector"></ul>
            </nav>
        `;
    }

    getLanguageFromPage() {
        const page = document.querySelector('html');
        const lang = page.getAttribute('lang');        
        return lang;
    }

    getValidLocaleFromUrl(url, allowedLocales) {
        // Create a URL object from the input URL
        let currentUrl = new URL(url);

        // Extract the path from the current URL
        const path = currentUrl.pathname;
        
        // Check each allowed locale to see if it matches the start of the path
        for (const locale of allowedLocales) {
            if (path.startsWith(`/${locale.code}`)) {
                return locale.code; // Return the matching locale
            }
        }
        
        return this.defaultLanguage; // No valid locale found
    }

    labelFor(lang) {
        return lang.label || lang.name || lang.code;
    }

    alternateFor(code) {
        return (this.alternates || []).find((alt) => alt.code === code);
    }

    isUntranslated(code) {
        const alt = this.alternateFor(code);
        return Boolean(alt) && !alt.url;
    }

    untranslatedText() {
        return String(this.lang || '').toLowerCase().startsWith('de') ? 'nicht übersetzt' : 'not translated';
    }

    removeLocaleFormUrl(path, prefixToRemove){
        // only strip a whole path segment: "/de/…" or "/de", never "/design/"
        if (path === prefixToRemove) return '/';
        if (path.startsWith(prefixToRemove + '/')) return path.slice(prefixToRemove.length);
        return path;
    }

    updateLocationWithLocale(prefix) {
            const alt = this.alternateFor(prefix);
            if (alt) {
                // known language version, or the start page of the target language when untranslated
                window.location.href = alt.url || (prefix === this.defaultLanguage ? '/' : `/${prefix}/`);
                return;
            }

            // no build-time data: swap the language prefix of the current path
            let currentUrl = new URL(window.location.href);
            var path = currentUrl.pathname;

            if(this.lang != null ){
                path= this.removeLocaleFormUrl(path, "/" + this.lang);
            }

            window.location.href = this.getPathWithLocale(path, prefix );
    }

    
    getPathWithLocale(path, newLocale) {
        // Create a URL object from the input URL
        
        if(newLocale == this.defaultLanguage){
            newLocale = "";
        }
        if ( newLocale != "") {
            // Add or change the locale prefix
            const newPath = `/${newLocale}${path}`;

            
            // Update the window location to the new URL
            return newPath;
        }
        return path;
    }
    
}

customElements.define('language-switcher', LanguageSwitcher);