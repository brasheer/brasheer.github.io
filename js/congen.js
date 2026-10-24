/**
 * ConGen 7.7.0 - App Controller & Storage Bridge
 */
console.log("[Boot] congen.js script loaded successfully.");

const storage = new StorageManager();



window.encodeLogo = function (input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        window.ConGenState.settings.logoData = e.target.result;
        const display = document.getElementById('logoFilenameDisplay');
        if (display) display.innerText = `Loaded: ${file.name}`;
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    };
    reader.readAsDataURL(file);
};

window.encodeCSS = function (input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        window.ConGenState.settings.css = e.target.result;
        document.getElementById('cssFilenameDisplay').innerText = `Loaded: ${file.name}`;
        
        // Sync with live editor
        const liveEditor = document.getElementById('liveCssEditor');
        if (liveEditor) liveEditor.value = e.target.result;

        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (typeof window.updatePreview === 'function') window.updatePreview();
    };
    reader.readAsText(file);
};

window.clearCustomCSS = function () {
    if (confirm("Clear all custom CSS?")) {
        window.ConGenState.settings.css = "";
        
        const liveEditor = document.getElementById('liveCssEditor');
        if (liveEditor) liveEditor.value = "";
        
        const fileInput = document.getElementById('cssFileInput');
        if (fileInput) fileInput.value = "";
        
        const display = document.getElementById('cssFilenameDisplay');
        if (display) display.innerText = "";

        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (typeof window.updatePreview === 'function') window.updatePreview();
    }
};

// --- Save & Load System (Instrumented) ---
window.saveProgress = async function (isAutoSave = false) {
    console.log(`\n[Save System] Initiating ${isAutoSave ? 'Auto-Save' : 'Manual Save'}...`);

    if (!window.ConGenState) {
        console.error("[Save System] FATAL: window.ConGenState is missing!");
        return;
    }

    try {
        console.log("[Save System] Step 1: Syncing global inputs...");
        const docTitleInput = document.getElementById('docTitle');
        if (docTitleInput) window.ConGenState.settings.docTitle = docTitleInput.value;

        const alignInput = document.getElementById('logoAlignment');
        if (alignInput) window.ConGenState.settings.logoAlignment = alignInput.value;

        console.log("[Save System] Step 2: Stringifying state JSON...");
        const stateString = JSON.stringify(window.ConGenState);

        console.log("[Save System] Step 3: Writing to IndexedDB...");
        await storage.saveActive(window.ConGenState.docId, stateString);

        console.log("[Save System] Step 4: Archiving version...");
        storage.archiveVersion(stateString, !isAutoSave).catch(e => console.error("[Save System] Archive error:", e));

        console.log("[Save System] Step 5: Updating UI...");
        if (!isAutoSave) {
            const saveBtn = document.querySelector('.btn-save');
            if (saveBtn) {
                const origText = saveBtn.innerText;
                saveBtn.innerText = "✅ Saved!";
                setTimeout(() => saveBtn.innerText = origText, 2000);
            }
        }

        // FIX: Automate the preview pane!
        if (typeof window.updatePreview === 'function') {
            window.updatePreview();
        }
    } catch (e) {
        console.error("[Save System] FATAL ERROR during save:", e);
    }
};

let autoSaveTimeout = null;
window.requestAutoSave = function () {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
        window.saveProgress(true);
    }, 1000);
};

window.clearProgress = async function () {
    if (confirm("New Workspace: This will wipe all current pages and blocks.\n\nUnsaved progress will be permanently lost.\n\nAre you sure you want to continue?")) {
        await storage.wipe();
        localStorage.removeItem('docbuilder_last_doc_id');
        
        window.ConGenAPI.initBlankWorkspace();
        window.ConGenRenderer.renderFullWorkspace();
        
        if (typeof window.updatePreview === 'function') window.updatePreview();
        
        window.saveProgress(true);
    }
};
window.openAndImportFile = async function () {
    if ('showOpenFilePicker' in window) {
        try {
            const [fileHandle] = await window.showOpenFilePicker({
                types: [
                    { description: 'DocBuilder Files', accept: { 'text/html': ['.html'], 'application/json': ['.json'] } }
                ]
            });
            window.activeFileHandle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (file.name.toLowerCase().endsWith('.json')) {
                _processImportedJSON(text);
            } else {
                processImportedHTML(text);
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error("File picking failed:", err);
        }
    } else {
        // Fallback: manually trigger a hidden input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.html,.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (file.name.toLowerCase().endsWith('.json')) {
                    _processImportedJSON(ev.target.result);
                } else {
                    processImportedHTML(ev.target.result);
                }
            };
            reader.readAsText(file);
            input.value = '';
        };
        input.click();
    }
};

function _processImportedJSON(jsonText) {
    try {
        const parsed = JSON.parse(jsonText);
        window.ConGenAPI.loadState(typeof parsed === 'string' ? parsed : JSON.stringify(parsed));
        if (typeof window.saveProgress === 'function') window.saveProgress(false);
    } catch (err) {
        console.error("[Import System] Failed to parse JSON backup:", err);
        alert("Error parsing the JSON backup file. Check the console for details.");
    }
}

window.loadImportedFile = function (input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
        processImportedHTML(e.target.result);
        input.value = '';
    };
    reader.readAsText(file);
};

function processImportedHTML(htmlContent) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const dataScript = doc.getElementById('congen-data');

        if (dataScript && dataScript.textContent) {
            const jsonData = dataScript.textContent;
            let parsed = JSON.parse(jsonData);
            if (parsed.v6State) parsed = parsed.v6State;

            // Extract and Restore UUID
            const metaId = doc.querySelector('meta[name="congen-doc-id"]')?.content;
            if (metaId) {
                parsed.docId = metaId;
                localStorage.setItem('docbuilder_last_doc_id', metaId);
            }

            // Feed the extracted JSON to the core state manager
            window.ConGenAPI.loadState(JSON.stringify(parsed));

            // Force a manual save to IndexedDB so the imported state persists
            if (typeof window.saveProgress === 'function') {
                window.saveProgress(false);
            }
        } else {
            alert("Error: Could not find ConGen save data. Is this a valid exported document?");
        }
    } catch (err) {
        console.error("[Import System] Failed to parse imported file:", err);
        alert("Error parsing the file. Check the console for details.");
    }
}



// --- Global Link Modal Controller ---
const LinkModalManager = {
    overlay: null,
    txtInput: null,
    urlInput: null,
    pageSelect: null,
    internalGroup: null,
    externalGroup: null,
    emailGroup: null,
    emailSelect: null,
    typeRadios: null,
    btnInsert: null,
    btnCancel: null,

    cachedRange: null,
    activeEditor: null,
    activeAnchorNode: null,

    init: function () {
        this.overlay = document.getElementById('congen-link-modal-overlay');
        if (!this.overlay) return;
        this.txtInput = document.getElementById('link-modal-text');
        this.urlInput = document.getElementById('link-modal-url');
        this.pageSelect = document.getElementById('link-modal-page-select');
        this.internalGroup = document.getElementById('link-modal-internal-group');
        this.externalGroup = document.getElementById('link-modal-external-group');
        this.emailGroup = document.getElementById('link-modal-email-group');
        this.emailSelect = document.getElementById('link-modal-email-select');
        this.typeRadios = document.querySelectorAll('input[name="link_modal_type"]');

        this.btnInsert = document.getElementById('btn-insert-link');
        this.btnCancel = document.getElementById('btn-cancel-link');

        this.btnCancel.addEventListener('click', () => this.close());
        this.btnInsert.addEventListener('click', () => this.insertLink());

        this.typeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const val = e.target.value;
                this.internalGroup.style.display = val === 'internal' ? 'block' : 'none';
                this.externalGroup.style.display = val === 'external' ? 'block' : 'none';
                if (this.emailGroup) this.emailGroup.style.display = val === 'email-template' ? 'block' : 'none';
                if (val === 'external') this.urlInput.focus();
            });
        });
    },

    open: function (editorElement) {
        this.activeEditor = editorElement;
        this.activeAnchorNode = null;

        const shadowRoot = editorElement.getRootNode();
        const selection = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();

        if (!selection || selection.rangeCount === 0) return;

        this.cachedRange = selection.getRangeAt(0);

        // Dynamically build the page dropdown from the current state
        if (this.pageSelect && window.ConGenState && window.ConGenState.pages) {
            this.pageSelect.innerHTML = '';
            window.ConGenState.pages.forEach((page, index) => {
                const opt = document.createElement('option');
                opt.value = `#sec_${index}`;
                opt.textContent = page.title || `Page ${index + 1}`;
                this.pageSelect.appendChild(opt);
            });
        }

        // Dynamically populate the email template dropdown
        if (this.emailSelect) {
            this.emailSelect.innerHTML = '';
            const templates = window.ConGenState?.settings?.emailTemplates || [];
            if (templates.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = '— No templates yet (create one in Email Templates hub) —';
                this.emailSelect.appendChild(opt);
            } else {
                templates.forEach(tpl => {
                    const opt = document.createElement('option');
                    opt.value = tpl.id;
                    opt.textContent = tpl.title || tpl.id;
                    this.emailSelect.appendChild(opt);
                });
            }
        }

        // ── Detect if cursor/selection is inside an existing <a> tag ──────────
        const anchorNode = selection.anchorNode;
        const existingAnchor = anchorNode
            ? (anchorNode.nodeType === Node.TEXT_NODE
                ? anchorNode.parentNode.closest('a')
                : anchorNode.closest('a'))
            : null;

        if (existingAnchor) {
            // EDIT MODE: expand selection to cover the whole anchor
            this.activeAnchorNode = existingAnchor;

            const newRange = document.createRange();
            newRange.selectNode(existingAnchor);
            selection.removeAllRanges();
            selection.addRange(newRange);
            this.cachedRange = newRange;

            // Pre-fill display text
            this.txtInput.value = existingAnchor.textContent || '';
            this.urlInput.value = '';

            // Determine link type and pre-fill the relevant control
            if (existingAnchor.classList.contains('compile-email-template')) {
                // Email Template
                const emailRadio = document.querySelector('input[name="link_modal_type"][value="email-template"]');
                if (emailRadio) emailRadio.checked = true;
                if (this.internalGroup) this.internalGroup.style.display = 'none';
                if (this.externalGroup) this.externalGroup.style.display = 'none';
                if (this.emailGroup) this.emailGroup.style.display = 'block';
                if (this.emailSelect) this.emailSelect.value = existingAnchor.dataset.templateId || '';
            } else {
                const href = existingAnchor.getAttribute('href') || '';
                if (href.startsWith('#sec_')) {
                    // Internal page
                    const internalRadio = document.querySelector('input[name="link_modal_type"][value="internal"]');
                    if (internalRadio) internalRadio.checked = true;
                    if (this.internalGroup) this.internalGroup.style.display = 'block';
                    if (this.externalGroup) this.externalGroup.style.display = 'none';
                    if (this.emailGroup) this.emailGroup.style.display = 'none';
                    if (this.pageSelect) this.pageSelect.value = href;
                } else {
                    // External URL
                    const externalRadio = document.querySelector('input[name="link_modal_type"][value="external"]');
                    if (externalRadio) externalRadio.checked = true;
                    if (this.internalGroup) this.internalGroup.style.display = 'none';
                    if (this.externalGroup) this.externalGroup.style.display = 'block';
                    if (this.emailGroup) this.emailGroup.style.display = 'none';
                    this.urlInput.value = href;
                }
            }
        } else {
            // INSERT MODE: default state
            const selectedText = this.cachedRange.toString().trim();
            this.txtInput.value = selectedText;
            this.urlInput.value = '';

            if (this.typeRadios && this.typeRadios[0]) this.typeRadios[0].checked = true;
            if (this.internalGroup) this.internalGroup.style.display = 'block';
            if (this.externalGroup) this.externalGroup.style.display = 'none';
            if (this.emailGroup) this.emailGroup.style.display = 'none';
        }

        if (!this.overlay.open) {
            this.overlay.showModal();
        }
        this.overlay.style.display = 'flex';

        // Focus the text field only when nothing is pre-filled
        if (!this.txtInput.value) {
            this.txtInput.focus();
        }
    },

    close: function () {
        this.overlay.close();
        this.overlay.style.display = 'none';
        this.cachedRange = null;
        this.activeEditor = null;
        this.activeAnchorNode = null;
    },

    insertLink: function () {
        const text = this.txtInput.value.trim();
        const selectedType = document.querySelector('input[name="link_modal_type"]:checked').value;

        // ── UPDATE existing anchor (in-place mutation, no DOM wrapping) ───────
        if (this.activeAnchorNode) {
            const anchor = this.activeAnchorNode;

            if (selectedType === 'email-template') {
                const templateId = this.emailSelect ? this.emailSelect.value : '';
                if (!templateId) return;

                anchor.textContent = text || templateId;
                anchor.className = 'compile-email-template';
                anchor.dataset.templateId = templateId;
                anchor.removeAttribute('href');
                anchor.removeAttribute('target');
                anchor.removeAttribute('rel');
                anchor.style.cssText = 'cursor:pointer; text-decoration:underline;';
            } else {
                const isInternal = selectedType === 'internal';
                let url = isInternal ? this.pageSelect.value : this.urlInput.value.trim();
                if (!url) return;

                if (!isInternal && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
                    url = 'https://' + url;
                }

                anchor.textContent = text || url;
                anchor.classList.remove('compile-email-template');
                delete anchor.dataset.templateId;
                anchor.style.cssText = '';
                anchor.href = url;

                if (!isInternal) {
                    anchor.target = '_blank';
                    anchor.rel = 'noopener noreferrer';
                } else {
                    anchor.removeAttribute('target');
                    anchor.removeAttribute('rel');
                }
            }

            if (this.activeEditor) {
                this.activeEditor.dispatchEvent(new Event('input', { bubbles: true }));
            }
            this.close();
            return;
        }

        // ── INSERT new anchor ─────────────────────────────────────────────────
        if (!this.cachedRange) return;

        if (selectedType === 'email-template') {
            const templateId = this.emailSelect ? this.emailSelect.value : '';
            if (!templateId) return;

            const a = document.createElement('a');
            a.className = 'compile-email-template';
            a.dataset.templateId = templateId;
            a.style.cursor = 'pointer';
            a.style.textDecoration = 'underline';
            a.textContent = text || templateId;

            const shadowRoot = this.activeEditor.getRootNode();
            const selection = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            selection.removeAllRanges();
            selection.addRange(this.cachedRange);
            this.cachedRange.deleteContents();
            this.cachedRange.insertNode(a);

            const newRange = document.createRange();
            newRange.setStartAfter(a);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);

            if (this.activeEditor) {
                this.activeEditor.dispatchEvent(new Event('input', { bubbles: true }));
            }
            this.close();
            return;
        }

        // Internal / External
        const isInternal = selectedType === 'internal';
        let url = isInternal ? this.pageSelect.value : this.urlInput.value.trim();
        if (!url) return;

        if (!isInternal && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
            url = 'https://' + url;
        }

        const a = document.createElement('a');
        a.href = url;
        a.textContent = text || url;

        if (!isInternal) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
        }

        const shadowRoot = this.activeEditor.getRootNode();
        const selection = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();

        selection.removeAllRanges();
        selection.addRange(this.cachedRange);
        this.cachedRange.deleteContents();
        this.cachedRange.insertNode(a);

        const newRange = document.createRange();
        newRange.setStartAfter(a);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        if (this.activeEditor) {
            this.activeEditor.dispatchEvent(new Event('input', { bubbles: true }));
        }
        this.close();
    }
};
window.LinkModalManager = LinkModalManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log("[Boot] DOM Loaded. Initializing Storage...");
    LinkModalManager.init();
    storage.init().then(async () => {
        console.log("[Boot] Storage initialized. Checking session pointer...");
        
        let savedString = null;
        const backup = localStorage.getItem('docbuilder_emergency_backup');
        
        if (backup) {
            console.log("[Boot] Emergency backup found. Recovering...");
            savedString = backup;
            localStorage.removeItem('docbuilder_emergency_backup');
        } else {
            const lastDocId = localStorage.getItem('docbuilder_last_doc_id');
            
            if (lastDocId) {
                console.log(`[Boot] Found last active Doc ID: ${lastDocId}. Loading...`);
                savedString = await storage.loadActive(lastDocId);
            }

            if (!savedString) {
                console.log(`[Boot] No active doc ID found. Searching IndexedDB for recent saves...`);
                const history = await storage.getHistory();
                if (history && history.length > 0) {
                    const activeRecord = history.find(r => r.id.startsWith('active_')) || history[0];
                    savedString = await storage.getVersion(activeRecord.id);
                    if (activeRecord.id.startsWith('active_')) {
                        localStorage.setItem('docbuilder_last_doc_id', activeRecord.id.replace('active_', ''));
                    }
                }
            }
        }

        if (savedString) {
            console.log("[Boot] Segregated save found. Hydrating state...");
            window.ConGenAPI.loadState(savedString);
            if (window.applyCurrentThemes) window.applyCurrentThemes();
            if (typeof window.updatePreview === 'function') window.updatePreview();
        } else {
            console.log("[Boot] No segregated save found. Building blank workspace...");
            window.ConGenAPI.initBlankWorkspace();
            window.ConGenRenderer.renderFullWorkspace();
        }
    }).catch(e => {
        console.error("[Boot] Storage Init Error", e);
        window.ConGenAPI.initBlankWorkspace();
        window.ConGenRenderer.renderFullWorkspace();
    });

    document.addEventListener('input', (e) => {
        if (e.target.matches('input, textarea, select')) window.requestAutoSave();

        if (e.target.id === 'docTitle') {
            window.ConGenAPI.updateSettings({ docTitle: e.target.value }, true);
        }
        
        // Live CSS Editor specific logic
        if (e.target.id === 'liveCssEditor') {
            window.ConGenAPI.updateSettings({ css: e.target.value }, true);
            if (typeof window.updatePreview === 'function') window.updatePreview();
        }
    });

    // Global Undo / Redo Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+Shift+Z)
    document.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        const active = document.activeElement;
        const isNativeInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
        if (isNativeInput) return;

        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (window.HistoryManager) window.HistoryManager.undo();
        } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
            e.preventDefault();
            if (window.HistoryManager) window.HistoryManager.redo();
        }
    });
    document.addEventListener('change', (e) => {
        if (e.target.matches('input, textarea, select')) window.requestAutoSave();
    });

    // --- Bi-Directional Nav Sync Listener ---
    window.addEventListener('congen-nav-sync', (e) => {
        if (!e.detail) return;

        const syncToggle = document.getElementById('navSyncToggle');
        if (syncToggle && !syncToggle.checked) return;
        
        // 1. Preview -> Editor
        if (e.detail.source === 'preview' && e.detail.targetId) {
            const indexStr = e.detail.targetId.split('_')[1];
            if (indexStr !== undefined) {
                const index = parseInt(indexStr, 10);
                if (!isNaN(index) && window.ConGenState && window.ConGenState.pages[index]) {
                    const mappedPageId = window.ConGenState.pages[index].id;
                    if (window.ConGenState.activePageId !== mappedPageId) {
                        window.ConGenState.activePageId = mappedPageId;
                        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
                    }
                }
            }
        }
        
        // 2. Editor -> Preview
        if (e.detail.source === 'editor' && e.detail.pageId) {
            const index = window.ConGenState.pages.findIndex(p => p.id === e.detail.pageId);
            if (index > -1) {
                const frame = document.getElementById('previewFrame');
                if (frame && frame.contentDocument) {
                    const radio = frame.contentDocument.getElementById(`nav_sec_${index}`);
                    if (radio) radio.checked = true;
                }
                if (window.popoutWindow && !window.popoutWindow.closed && window.popoutWindow.document) {
                    const radio = window.popoutWindow.document.getElementById(`nav_sec_${index}`);
                    if (radio) radio.checked = true;
                }
            }
        }
    });

    // Sync Live CSS Editor when drawer opens
    const originalToggleSettingsDrawer = window.toggleSettingsDrawer;
    window.toggleSettingsDrawer = function () {
        if (typeof originalToggleSettingsDrawer === 'function') originalToggleSettingsDrawer();
        const drawer = document.getElementById('settingsDrawer');
        if (drawer && drawer.classList.contains('open')) {
            const editor = document.getElementById('liveCssEditor');
            if (editor) {
                editor.value = window.ConGenState.settings.css || "";
            }
        }
    };

    window.addEventListener('beforeunload', () => {
        if (window.ConGenState && window.ConGenState.pages && window.ConGenState.pages.length > 0) {
            localStorage.setItem('docbuilder_emergency_backup', JSON.stringify(window.ConGenState));
        }
    });
});

window.loadTestData = function() {
    const testData = {
        settings: {
            themeColor: '#635bff',
            logoData: '',
            logoAlignment: 'center',
            css: '',
            docTitle: 'ConGen Master Test Document',
            outputTheme: {
                preset: 'architect',
                brand: '#4f46e5',
                bg: '#0a192f',
                secondary: '#818cf8',
                fontHeading: 'Inter',
                fontBody: 'Roboto',
                fontBase: '16',
                glassUI: true
            }
        },
        activePageId: 'page_1',
        pages: [
            {
                id: 'page_1',
                title: 'Overview',
                pageLogo: '',
                rows: [
                    {
                        id: 'row_1_1',
                        valign: 'stretch',
                        preset: '1-col',
                        bgColor: '#0a192f',
                        blocks: [
                            {
                                id: 'block_1_1_1',
                                type: 'text',
                                span: 12,
                                data: {
                                    content: '<h1>Master System Architecture</h1><p><b>Executive Summary:</b> Preparing the state for a future YIQ contrast update. This text may render black over the dark background during this test phase.</p>',
                                    halign: 'center'
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_1_2',
                        valign: 'stretch',
                        preset: '2-col',
                        blocks: [
                            {
                                id: 'block_1_2_1',
                                type: 'text',
                                span: 6,
                                data: {
                                    content: '<h3>Primary Engine</h3><p>Testing dense paragraph rendering and vertical alignment in a two-column layout. The accompanying image should be constrained perfectly.</p><p>Multiple paragraphs to ensure the column stretches appropriately and triggers the flex layout calculations.</p>',
                                    halign: 'left'
                                }
                            },
                            {
                                id: 'block_1_2_2',
                                type: 'image',
                                span: 6,
                                data: {
                                    content: 'https://placehold.co/600x400/0f172a/4f46e5?text=System+Core',
                                    halign: 'center',
                                    objectFit: 'contain',
                                    imgFrame: 'browser',
                                    imgRadius: 10,
                                    imgShadow: 'medium',
                                    captionEnabled: true,
                                    captionStyle: 'standard',
                                    captionText: 'Fig 1: Constrained Browser Frame'
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_1_3',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_1_3_1',
                                type: 'spacer',
                                span: 12,
                                data: { size: 30, thickness: 2, orientation: 'horizontal', style: 'solid', color: '#4f46e5' }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'page_2',
                title: 'Synchronized Media',
                pageLogo: '',
                rows: [
                    {
                        id: 'row_2_1',
                        valign: 'center',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_2_1_1',
                                type: 'text',
                                span: 12,
                                data: {
                                    content: '<h2>Synchronized Slideshows</h2><p>Demonstrating the linked carousel functionality. Clicking the navigation links should update both slideshows simultaneously.</p>',
                                    halign: 'center'
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_2_2',
                        valign: 'stretch',
                        preset: '3-col',
                        blocks: [
                            {
                                id: 'block_2_2_1',
                                type: 'slideshow',
                                span: 5,
                                data: {
                                    syncNavigation: true,
                                    slides: [
                                        'https://placehold.co/800x600/0f172a/cbd5e1?text=Slide+1A',
                                        'https://placehold.co/800x600/1e293b/cbd5e1?text=Slide+2A',
                                        'https://placehold.co/800x600/334155/cbd5e1?text=Slide+3A'
                                    ]
                                }
                            },
                            {
                                id: 'block_2_2_2',
                                type: 'text',
                                span: 2,
                                data: {
                                    content: '<div style="text-align: center; margin-top: 50px;"><p><a href="#" class="slide-sync-link" data-slide="0"><b>[ View Slide 1 ]</b></a></p><p><a href="#" class="slide-sync-link" data-slide="1"><b>[ View Slide 2 ]</b></a></p><p><a href="#" class="slide-sync-link" data-slide="2"><b>[ View Slide 3 ]</b></a></p></div>',
                                    halign: 'center'
                                }
                            },
                            {
                                id: 'block_2_2_3',
                                type: 'slideshow',
                                span: 5,
                                data: {
                                    syncNavigation: true,
                                    slides: [
                                        'https://placehold.co/800x600/581c87/cbd5e1?text=Slide+1B',
                                        'https://placehold.co/800x600/4c1d95/cbd5e1?text=Slide+2B',
                                        'https://placehold.co/800x600/3b0764/cbd5e1?text=Slide+3B'
                                    ]
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_2_3',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_2_3_1',
                                type: 'spacer',
                                span: 12,
                                data: { size: 20, style: 'whitespace', orientation: 'vertical' }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'page_3',
                title: 'Data Densities',
                pageLogo: '',
                rows: [
                    {
                        id: 'row_3_1',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_3_1_1',
                                type: 'text',
                                span: 12,
                                data: {
                                    content: '<h2>Complex Densities</h2><p>Ensuring the rendering engine can handle high asset volumes.</p>',
                                    halign: 'left'
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_3_2',
                        valign: 'stretch',
                        preset: '3-col',
                        blocks: [
                            {
                                id: 'block_3_2_1',
                                type: 'image',
                                span: 4,
                                data: {
                                    content: 'https://placehold.co/400x400/222222/ffffff?text=Data+A',
                                    halign: 'center',
                                    objectFit: 'contain',
                                    imgRadius: 8
                                }
                            },
                            {
                                id: 'block_3_2_2',
                                type: 'image',
                                span: 4,
                                data: {
                                    content: 'https://placehold.co/400x400/333333/ffffff?text=Data+B',
                                    halign: 'center',
                                    objectFit: 'contain',
                                    imgRadius: 8
                                }
                            },
                            {
                                id: 'block_3_2_3',
                                type: 'image',
                                span: 4,
                                data: {
                                    content: 'https://placehold.co/400x400/444444/ffffff?text=Data+C',
                                    halign: 'center',
                                    objectFit: 'contain',
                                    imgRadius: 8
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_3_3',
                        valign: 'stretch',
                        preset: 'split-view',
                        blocks: [
                            {
                                id: 'block_3_3_1',
                                type: 'spacer',
                                span: 3,
                                data: { thickness: 4, orientation: 'vertical', style: 'dashed', color: '#818cf8' }
                            },
                            {
                                id: 'block_3_3_2',
                                type: 'text',
                                span: 9,
                                data: {
                                    content: '<p>Voluminous text testing. This text should correctly wrap and display aligned next to the spacer line. The grid must handle asymmetric presets without overflowing.</p>',
                                    halign: 'left'
                                }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'page_4',
                title: 'Media Controls',
                pageLogo: '',
                rows: [
                    {
                        id: 'row_4_1',
                        valign: 'center',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_4_1_1',
                                type: 'text',
                                span: 12,
                                data: { content: '<h2>Image Constraint Tests</h2>', halign: 'center' }
                            }
                        ]
                    },
                    {
                        id: 'row_4_2',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_4_2_1',
                                type: 'image',
                                span: 12,
                                data: {
                                    content: 'https://placehold.co/1200x300/1e293b/38bdf8?text=Ultra+Wide+Constraint+Test',
                                    halign: 'center',
                                    objectFit: 'contain',
                                    imgFrame: 'none',
                                    imgRadius: 20,
                                    imgShadow: 'deep',
                                    captionEnabled: true,
                                    captionStyle: 'uno-card',
                                    captionText: 'Wide images must not overflow the container bounds.'
                                }
                            }
                        ]
                    },
                    {
                        id: 'row_4_3',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_4_3_1',
                                type: 'button',
                                span: 12,
                                data: { text: 'Back to Overview', target: 'sec_0' }
                            }
                        ]
                    }
                ]
            },
            {
                id: 'page_5',
                title: 'Conclusion',
                pageLogo: '',
                rows: [
                    {
                        id: 'row_5_1',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_5_1_1',
                                type: 'text',
                                span: 12,
                                data: { content: '<h1>Final Checks</h1><p>Confirming that all 5 pages render efficiently.</p>', halign: 'left' }
                            }
                        ]
                    },
                    {
                        id: 'row_5_2',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_5_2_1',
                                type: 'spacer',
                                span: 12,
                                data: { size: 40, style: 'whitespace', orientation: 'vertical' }
                            }
                        ]
                    },
                    {
                        id: 'row_5_3',
                        valign: 'stretch',
                        preset: '1-col',
                        blocks: [
                            {
                                id: 'block_5_3_1',
                                type: 'text',
                                span: 12,
                                data: { content: '<p>End of Master Test Document.</p>', halign: 'center' }
                            }
                        ]
                    }
                ]
            }
        ],
        assets: {}
    };
    if (window.ConGenAPI) {
        window.ConGenAPI.loadState(JSON.stringify(testData));
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    } else {
        console.error("ConGen API not found");
    }
};
