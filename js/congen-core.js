/**
 * ConGen 7.7.0 Master - Core Engine
 * The Single Source of Truth for the workspace.
 */

// Define the allowed layouts (moved here from UI to govern state logic)
const GRID_LAYOUTS = {
    '12': [12],
    '6': [6, 6],
    '4': [4, 4, 4],
    '3': [3, 3, 3, 3],
    '4-8': [4, 8],
    '8-4': [8, 4]
};

// 1. THE STATE (The Brain)
window.activeFileHandle = null;
window.ConGenState = {
    docId: null,
    settings: {
        themeColor: '#d0e1fd',
        logoData: '',
        logoAlignment: 'center',
        css: '',
        docTitle: 'Bananagram Process Documentation'
    },
    activePageId: null,
    pages: [],
    assets: {},  // Global Asset Library: { [assetId]: base64String }
    clipboard: []
};

// 2. THE API (The Nervous System - Mutators)
// You NEVER touch ConGenState directly. You only use these functions.
window.ConGenAPI = {

    // --- Initializers ---
    assignDocumentId: function() {
        if (!window.ConGenState.docId) {
            window.ConGenState.docId = crypto.randomUUID();
            localStorage.setItem('docbuilder_last_doc_id', window.ConGenState.docId);
            console.log(`[Core] Assigned New UUID: ${window.ConGenState.docId}`);
        }
    },

    initBlankWorkspace: function () {
        // 1. Preserve existing assets
        const preservedAssets = (window.ConGenState && window.ConGenState.assets) ? window.ConGenState.assets : {};

        // 2. Full Wipe (but inject the preserved assets)
        window.ConGenState = {
            docId: crypto.randomUUID(),
            settings: {
                themeColor: '#d0e1fd',
                logoData: '',
                logoAlignment: 'center',
                css: '',
                docTitle: 'Process Documentation',
                emailTemplates: []
            },
            activePageId: null,
            pages: [],
            assets: preservedAssets,
            clipboard: []
        };
        
        // 2. Clear History
        window.HistoryManager.clear();
        
        // 3. Update pointer
        localStorage.setItem('docbuilder_last_doc_id', window.ConGenState.docId);
        
        // 4. Build default content
        this.addPage("Overview");
        window.HistoryManager.pushState("Created Blank Workspace");
        
        console.log(`[Core] Initialized Blank Workspace with ID: ${window.ConGenState.docId}`);
    },

    loadState: function (savedStateJSON) {
        try {
            window.HistoryManager.clear();
            let parsed = typeof savedStateJSON === 'string' ? JSON.parse(savedStateJSON) : savedStateJSON;
            if (parsed && parsed.v6State) { parsed = parsed.v6State; }

            // --- V5 to V6 MIGRATION ADAPTER ---
            let legacyPages = null;
            // Check if it's the old raw array OR the v5 export wrapper
            if (Array.isArray(parsed)) {
                legacyPages = parsed; 
            } else if (parsed && parsed.state && Array.isArray(parsed.state) && !parsed.pages) {
                legacyPages = parsed.state; 
            }

            if (legacyPages) {
                console.log("[Core] Legacy v5 save detected. Migrating to v6.0.0 schema...");
                
                const spanMap = { 'w-100': 12, 'w-75': 9, 'w-66': 8, 'w-50': 6, 'w-33': 4, 'w-25': 3, 'w-auto': 12 };
                
                const migratedState = {
                    settings: {
                        themeColor: parsed.color || '#635bff',
                        logoData: parsed.logo || '',
                        logoAlignment: parsed.logoAlignment || 'center',
                        css: parsed.css || '',
                        docTitle: parsed.docTitle || 'Migrated Documentation'
                    },
                    activePageId: null,
                    pages: [],
                    assets: {}  // Initialize empty asset library for migrated saves
                };

                legacyPages.forEach((oldPage, pIndex) => {
                    const newPageId = `page_${Date.now()}_${Math.random().toString(16).slice(2)}_${pIndex}`;
                    if (pIndex === 0) migratedState.activePageId = newPageId;

                    const newPage = {
                        id: newPageId,
                        title: oldPage.title || `Page ${pIndex + 1}`,
                        pageLogo: oldPage.pageLogo || '',
                        rows: []
                    };

                    if (oldPage.blocks && Array.isArray(oldPage.blocks)) {
                        oldPage.blocks.forEach((oldRow, rIndex) => {
                            const innerBlocks = oldRow.innerBlocks || (oldRow.type !== 'row' ? [oldRow] : []);
                            
                            const newRow = {
                                id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}_${rIndex}`,
                                valign: oldRow.valign || 'stretch',
                                preset: oldRow.preset || 'custom',
                                blocks: []
                            };

                            innerBlocks.forEach((oldBlock, bIndex) => {
                                const layoutStr = oldBlock.layout || oldBlock.widthPreset || 'w-100';
                                const span = oldBlock.span || spanMap[layoutStr] || 12;
                                
                                // Extract pure data by omitting structural keys
                                const { type, layout, widthPreset, ...blockData } = oldBlock;

                                newRow.blocks.push({
                                    id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}_${bIndex}`,
                                    type: oldBlock.type || 'text',
                                    span: span,
                                    data: blockData
                                });
                            });
                            
                            newPage.rows.push(newRow);
                        });
                    }
                    migratedState.pages.push(newPage);
                });

                // Swap the old parsed object with our newly formatted v6 brain
                parsed = migratedState;
            }
            // --- END MIGRATION ADAPTER ---

            // Ensure settings exist to prevent UI sync crashes
            if (!parsed || !parsed.pages) {
                console.warn("[Core] Legacy or corrupted save detected. Booting blank workspace instead.");
                this.initBlankWorkspace();
                if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
                return;
            }

            // New Code: Preserves existing data if it exists, otherwise falls back to defaults
            parsed.settings = {
                themeColor: parsed.settings?.themeColor || '#d0e1fd',
                logoData: parsed.settings?.logoData || '',
                logoAlignment: parsed.settings?.logoAlignment || 'center',
                css: parsed.settings?.css || '',
                docTitle: parsed.settings?.docTitle || 'Process Documentation',
                outputTheme: parsed.settings?.outputTheme || {},
                emailTemplates: Array.isArray(parsed.settings?.emailTemplates) ? parsed.settings.emailTemplates : []
            };

            // Migration Adapter: ensure older saves without the assets dict don't crash
            if (!parsed.assets || typeof parsed.assets !== 'object' || Array.isArray(parsed.assets)) {
                parsed.assets = {};
            }

            if (!Array.isArray(parsed.clipboard)) { parsed.clipboard = []; }

            // Overwrite the brain with the valid save data
            window.ConGenState = parsed;
            this.assignDocumentId();

            // --- RETROACTIVE ASSET HYDRATION ---
            // For saves that pre-date the asset library, scan all known image
            // locations and feed them into the dictionary so the Mini Asset
            // Gallery immediately shows all previously uploaded images.
            try {
                const _reg = (s) => { if (typeof s === 'string' && s.startsWith('data:image')) this.registerAsset(s); };

                // 1. Global logo
                _reg(window.ConGenState.settings?.logoData);

                // 2. Per-page logos + all block images
                (window.ConGenState.pages || []).forEach(page => {
                    _reg(page.pageLogo);
                    (page.rows || []).forEach(row => {
                        (row.blocks || []).forEach(block => {
                            if (block.type === 'image') {
                                _reg(block.data?.content);
                            } else if (block.type === 'slideshow') {
                                (block.data?.slides || []).forEach(slide => _reg(slide));
                            }
                        });
                    });
                });

                console.log(`[Core] Asset hydration complete. ${Object.keys(window.ConGenState.assets).length} asset(s) in library.`);
            } catch (hydrationError) {
                console.warn('[Core] Asset hydration encountered an error (non-fatal):', hydrationError);
            }
            // --- END RETROACTIVE ASSET HYDRATION ---

            // Draw the UI
            if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
            if (window.ClipboardUI && window.ClipboardUI.updateBadge) window.ClipboardUI.updateBadge();

            window.HistoryManager.pushState("Loaded Document");
        } catch (e) {
            console.error("[Core] Failed to load state", e);
            this.initBlankWorkspace();
            if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
        }
    },

    // --- Page Level ---
    addPage: function (title = "New Page") {
        const newPage = {
            id: `page_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            title: title,
            pageLogo: '',
            titleAlign: 'left',
            titleBgColor: '',
            titleColor: '',
            titleFont: '',
            titleStyle: 'standard',
            rows: []
        };
        window.ConGenState.pages.push(newPage);
        window.ConGenState.activePageId = newPage.id;

        // Give them a default empty row to start
        this.addRow(newPage.id);

        window.HistoryManager.pushState("Added Page: " + title);

        // FIX: Explicitly tell the UI to draw the new page and tab
        return newPage.id;
    },

    deletePage: function (pageId) {
        if (!confirm("Are you sure you want to delete this entire page and all its content?")) return;
        
        const index = window.ConGenState.pages.findIndex(p => p.id === pageId);
        if (index < 0) return;

        window.ConGenState.pages.splice(index, 1);

        // If we deleted the active page, pick another one
        if (window.ConGenState.activePageId === pageId) {
            if (window.ConGenState.pages.length > 0) {
                window.ConGenState.activePageId = window.ConGenState.pages[0].id;
            } else {
                window.ConGenState.activePageId = null;
                this.initBlankWorkspace(); // Always keep at least one page
            }
        }

        window.HistoryManager.pushState("Deleted Page");
        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    // --- Row Level ---
    addRow: function(pageId) {
        const page = this._findPage(pageId);
        if (!page) return;

        const newRow = {
            id: `row_${Date.now()}_${Math.random().toString(16).slice(2)}`,
            valign: 'stretch',
            header: '',
            headerAlign: 'left',
            blocks: [] // Strictly empty for new rows
        };

        page.rows.push(newRow);
        window.HistoryManager.pushState("Added New Row");
        
        // FIX: Force the UI to paint the new row instantly, THEN save.
        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        
        return newRow.id;
    },

    deleteRow: function(pageId, rowId) {
        if (!confirm("Are you sure you want to delete this entire row and all its contents?")) return;
        
        const page = this._findPage(pageId);
        if (!page) return;
        
        // Filter out the deleted row
        page.rows = page.rows.filter(r => r.id !== rowId);
        
        window.HistoryManager.pushState("Deleted Row");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        
        // Force UI redraw
        if (window.ConGenRenderer) window.ConGenRenderer.renderPage(pageId);
        
        // NEW: Force instant preview update
        if (typeof window.updatePreview === 'function') window.updatePreview();
    },

    applyTemplate: function (pageId, rowId, templateKey) {
        // Consolidated: All templates and grid layouts now flow through applyRowPreset
        this.applyRowPreset(pageId, rowId, templateKey);
    },

    applyRowPreset: function (pageId, rowId, preset) {
        const row = this._findRow(pageId, rowId);
        if (!row) return;

        let targetSpans = [];

        switch (preset) {
            case '1-col': targetSpans = [12]; break;
            case '2-col': targetSpans = [6, 6]; break;
            case '3-col': targetSpans = [4, 4, 4]; break;
            case 'process-step': targetSpans = [4, 8]; break;
            case 'split-view': targetSpans = [3, 9]; break;
            case 'presentation-cards': targetSpans = [12]; break;
            case 'presentation-media': targetSpans = [12]; break;
            default:
                if (GRID_LAYOUTS[preset]) {
                    targetSpans = [...GRID_LAYOUTS[preset]];
                }
                break;
        }

        if (targetSpans.length === 0) return;

        // 4. Non-destructive logic: Capture blocks being truncated
        if (row.blocks.length > targetSpans.length) {
            const excess = row.blocks.slice(targetSpans.length);
            excess.forEach(b => {
                if (b.type !== 'empty') {
                    window.ConGenState.clipboard.push(JSON.parse(JSON.stringify(b)));
                }
            });
            if (window.ClipboardUI && window.ClipboardUI.updateBadge) {
                window.ClipboardUI.updateBadge();
            }
        }

        // 5. Truncate row
        row.blocks = row.blocks.slice(0, targetSpans.length);
        row.preset = preset;

        // 6. Pad with empty blocks if needed
        while (row.blocks.length < targetSpans.length) {
            row.blocks.push({
                id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                type: 'empty',
                span: 12,
                data: {}
            });
        }

        // 7. Assign final spans
        row.blocks.forEach((block, index) => {
            block.span = targetSpans[index];
        });

        window.HistoryManager.pushState("Applied " + preset + " Layout");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderRow(rowId);
        
        // Ensure preview reflects structural changes
        if (typeof window.updatePreview === 'function') window.updatePreview();
    },

    applyCustomRowLayout: function (pageId, rowId, inputString) {
        const row = this._findRow(pageId, rowId);
        if (!row) return;

        // 1. Sanitize and parse: strip everything except numbers and commas
        let rawVals = inputString.replace(/[^0-9,]/g, '')
            .split(',')
            .map(n => parseInt(n, 10))
            .filter(n => !isNaN(n) && n > 0);
            
        if (rawVals.length === 0) rawVals = [12]; // Fallback if input is completely invalid

        // 2. Proportional Distribution (Largest Remainder Method)
        let finalSpans = [];
        let rawTotal = rawVals.reduce((sum, val) => sum + val, 0);

        if (rawTotal <= 12) {
            // Standard padding if under 12
            finalSpans = [...rawVals];
            if (rawTotal < 12) finalSpans.push(12 - rawTotal);
        } else {
            // Proportional shrink if over 12
            let exactSpans = rawVals.map(val => (val / rawTotal) * 12);
            finalSpans = exactSpans.map(Math.floor); // Start with safe base integers
            
            let currentSum = finalSpans.reduce((sum, val) => sum + val, 0);
            
            // Map the exact decimal remainders lost during the floor()
            let remainders = exactSpans.map((val, i) => ({ 
                index: i, 
                rem: val - finalSpans[i] 
            }));
            
            // Sort by the largest leftover fraction
            remainders.sort((a, b) => b.rem - a.rem);
            
            // Distribute the missing integers to hit exactly 12
            let diff = 12 - currentSum;
            for (let i = 0; i < diff; i++) {
                finalSpans[remainders[i].index]++;
            }
        }

        // 4. Non-destructive capture
        if (row.blocks.length > finalSpans.length) {
            const excess = row.blocks.slice(finalSpans.length);
            excess.forEach(b => {
                if (b.type !== 'empty') {
                    window.ConGenState.clipboard.push(JSON.parse(JSON.stringify(b)));
                }
            });
            if (window.ClipboardUI && window.ClipboardUI.updateBadge) {
                window.ClipboardUI.updateBadge();
            }
        }

        // 5. Strictly truncate excess blocks
        row.blocks = row.blocks.slice(0, finalSpans.length);
        row.preset = 'custom';
        
        // 6. Add empty blocks if we need more columns
        while (row.blocks.length < finalSpans.length) {
            row.blocks.push({
                id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                type: 'empty',
                span: 12,
                data: {}
            });
        }

        // 7. Assign final spans
        row.blocks.forEach((block, index) => {
            block.span = finalSpans[index];
        });

        window.HistoryManager.pushState("Applied Custom Layout");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderRow(rowId);
    },

    updateSettings: function (updates, debounceHistory = true) {
        if (!window.ConGenState.settings) window.ConGenState.settings = {};
        Object.assign(window.ConGenState.settings, updates);
        if (debounceHistory) {
            window.HistoryManager.pushStateDebounced("Updated Document Design");
        } else {
            window.HistoryManager.pushState("Updated Document Design");
        }
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    updatePageSettings: function (pageId, updates, debounceHistory = false) {
        const page = this._findPage(pageId);
        if (!page) return;
        Object.assign(page, updates);
        if (debounceHistory) {
            window.HistoryManager.pushStateDebounced("Updated Page Settings");
        } else {
            window.HistoryManager.pushState("Updated Page Settings");
        }
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    updateRowSettings: function (pageId, rowId, updates, debounceHistory = false) {
        const row = this._findRow(pageId, rowId);
        if (!row) return;
        Object.assign(row, updates);
        if (debounceHistory) {
            window.HistoryManager.pushStateDebounced("Updated Row Settings");
        } else {
            window.HistoryManager.pushState("Updated Row Settings");
        }
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    // --- Block Level ---
    updateBlockData: function (pageId, rowId, blockId, newData) {
        const block = this._findBlock(pageId, rowId, blockId);
        if (block) {
            block.data = { ...block.data, ...newData };
            // Note: If you only changed internal omni-block data (like text), 
            // you might not need a full row re-render. But for now, we keep it simple.
            window.HistoryManager.pushStateDebounced("Edited Block Content");
            if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        }
    },

    setBlockType: function (pageId, rowId, blockIndex, newType) {
        const row = this._findRow(pageId, rowId);
        if (row && row.blocks[blockIndex]) {
            row.blocks[blockIndex].type = newType;
            row.blocks[blockIndex].data = {}; // Reset data on type change

            window.HistoryManager.pushState("Changed Block Type");
            if (window.ConGenRenderer) window.ConGenRenderer.renderRow(rowId);
            
            // NEW: Force sync and preview on quick-delete
            if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
            if (typeof window.updatePreview === 'function') window.updatePreview();
        }
    },
    
    moveRow: function(pageId, rowId, direction) {
        const page = this._findPage(pageId);
        if (!page) return;
        const index = page.rows.findIndex(r => r.id === rowId);
        if (index < 0) return;
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= page.rows.length) return; 
        const temp = page.rows[index];
        page.rows[index] = page.rows[newIndex];
        page.rows[newIndex] = temp;

        // Native DOM Swap to prevent flicker
        const rowEl = document.getElementById(rowId);
        if (rowEl && rowEl.parentNode) {
            const sibling = direction === 'up' ? rowEl.previousElementSibling : rowEl.nextElementSibling;
            if (sibling) {
                if (direction === 'up') {
                    rowEl.parentNode.insertBefore(rowEl, sibling);
                } else {
                    rowEl.parentNode.insertBefore(sibling, rowEl);
                }
            }
        }

        window.HistoryManager.pushState("Moved Row " + direction);
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    moveBlock: function(pageId, rowId, blockId, direction) {
        const row = this._findRow(pageId, rowId);
        if (!row) return;
        const index = row.blocks.findIndex(b => b.id === blockId);
        if (index < 0) return;
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= row.blocks.length) return; 
        const temp = row.blocks[index];
        row.blocks[index] = row.blocks[newIndex];
        row.blocks[newIndex] = temp;

        // Native DOM Swap for the column wrapper to prevent flicker
        const blockEl = document.getElementById(blockId);
        if (blockEl) {
            const colEl = blockEl.closest('.layout-column');
            if (colEl && colEl.parentNode) {
                const sibling = direction === 'left' ? colEl.previousElementSibling : colEl.nextElementSibling;
                if (sibling) {
                    if (direction === 'left') {
                        colEl.parentNode.insertBefore(colEl, sibling);
                    } else {
                        colEl.parentNode.insertBefore(sibling, colEl);
                    }
                }
            }
        }

        window.HistoryManager.pushState("Moved Block " + direction);
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
    },

    relocateBlock: function (pageId, srcRowId, srcBlockId, destRowId, destIndex) {
        const srcRow = this._findRow(pageId, srcRowId);
        const destRow = this._findRow(pageId, destRowId);
        if (!srcRow || !destRow) return;

        const srcBlock = srcRow.blocks.find(b => b.id === srcBlockId);
        const destBlock = destRow.blocks[destIndex];
        if (!srcBlock || !destBlock) return;

        // Copy source into destination, preserving destination's grid span
        const savedSpan = destBlock.span;
        const savedId = destBlock.id; // Keep the destination ID for the slot

        // Effectively move the content data
        destBlock.type = srcBlock.type;
        destBlock.data = JSON.parse(JSON.stringify(srcBlock.data));
        
        // Kill the source
        srcBlock.type = 'empty';
        srcBlock.data = {};

        window.HistoryManager.pushState("Relocated Block");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
    },

    swapBlocks: function (pageId, srcRowId, srcBlockId, destRowId, destBlockId) {
        const srcRow = this._findRow(pageId, srcRowId);
        const destRow = this._findRow(pageId, destRowId);
        if (!srcRow || !destRow) return;

        const srcBlock = srcRow.blocks.find(b => b.id === srcBlockId);
        const destBlock = destRow.blocks.find(b => b.id === destBlockId);
        if (!srcBlock || !destBlock) return;

        // Swap type and data, preserve current spans
        const tempType = srcBlock.type;
        const tempData = srcBlock.data;

        srcBlock.type = destBlock.type;
        srcBlock.data = destBlock.data;

        destBlock.type = tempType;
        destBlock.data = tempData;

        window.HistoryManager.pushState("Swapped Blocks");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) {
            window.ConGenRenderer.renderRow(srcRowId);
            if (srcRowId !== destRowId) window.ConGenRenderer.renderRow(destRowId);
        }
    },

    relocateRow: function (pageId, srcRowId, destRowId) {
        const page = this._findPage(pageId);
        if (!page) return;

        const srcIndex = page.rows.findIndex(r => r.id === srcRowId);
        const destIndex = page.rows.findIndex(r => r.id === destRowId);
        if (srcIndex < 0 || destIndex < 0) return;

        const [row] = page.rows.splice(srcIndex, 1);
        page.rows.splice(destIndex, 0, row);

        window.HistoryManager.pushState("Relocated Row");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderPage(pageId);
    },

    copyRowToClipboard: function(pageId, rowId) {
        const row = this._findRow(pageId, rowId);
        if (!row) return;

        const clonedRow = JSON.parse(JSON.stringify(row));
        clonedRow.id = `row_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        clonedRow.blocks.forEach(block => {
            block.id = `block_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        });

        window.ConGenState.clipboard.push({ clipboardType: 'row', payload: clonedRow });

        if (window.ClipboardUI && window.ClipboardUI.updateBadge) window.ClipboardUI.updateBadge();
    },

    pasteRowFromClipboard: function(pageId, destRowId) {
        if (!window.ConGenState.clipboard || window.ConGenState.clipboard.length === 0) return;
        const lastItem = window.ConGenState.clipboard[window.ConGenState.clipboard.length - 1];
        if (lastItem.clipboardType !== 'row') return;

        const destRow = this._findRow(pageId, destRowId);
        if (!destRow) return;

        const clonedPayload = JSON.parse(JSON.stringify(lastItem.payload));
        
        // Guarantee fresh block IDs on paste as well to prevent duplicates if pasted multiple times
        clonedPayload.blocks.forEach(block => {
            block.id = `block_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        });

        destRow.valign = clonedPayload.valign;
        destRow.header = clonedPayload.header;
        destRow.headerAlign = clonedPayload.headerAlign;
        destRow.headerStyle = clonedPayload.headerStyle;
        destRow.preset = clonedPayload.preset;
        destRow.blocks = clonedPayload.blocks;

        window.HistoryManager.pushState("Pasted Row");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
    },

    // --- Global Asset Library ---

    /**
     * registerAsset(base64)
     * Stores a base64 image string in the central asset dictionary and returns
     * a stable, content-derived ID. Identical images are automatically deduplicated.
     * @param {string} base64 - The raw base64 data string (with or without data-URI prefix).
     * @returns {string} assetId - The key to store on the block's data object.
     */
    registerAsset: function (base64) {
        if (!base64) return '';

        // Ensure the assets dict exists (defensive guard for very old in-memory states)
        if (!window.ConGenState.assets || typeof window.ConGenState.assets !== 'object') {
            window.ConGenState.assets = {};
        }

        // Build a short, stable hash from the content so identical images share one ID.
        // We use a simple FNV-1a-style 32-bit hash over the first 2 KB of the string
        // (sampling keeps this fast even for multi-MB data-URIs).
        if (typeof base64 === 'string' && base64.startsWith('asset_')) return base64;
        const len = base64.length;
        const mid = Math.floor(len / 2);
        const sample = `${len}:${base64.slice(0, 1024)}${base64.slice(mid, mid + 1024)}${base64.slice(Math.max(0, len - 1024))}`;
        let hash = 0x811c9dc5; // FNV offset basis
        for (let i = 0; i < sample.length; i++) {
            hash ^= sample.charCodeAt(i);
            hash = (hash * 0x01000193) >>> 0; // FNV prime, keep as unsigned 32-bit
        }
        const assetId = `asset_${hash.toString(16).padStart(8, '0')}`;

        // Only write if not already present (idempotent)
        if (!window.ConGenState.assets[assetId]) {
            window.ConGenState.assets[assetId] = base64;
        }

        return assetId;
    },

    /**
     * getAsset(assetId)
     * Retrieves the base64 string for a given asset ID.
     * Returns an empty string if the ID is not found (safe fallback for rendering).
     * @param {string} assetId
     * @returns {string}
     */
    getAsset: function (assetId) {
        if (!assetId || !window.ConGenState.assets) return '';
        return window.ConGenState.assets[assetId] || '';
    },

    /**
     * processImageFile(file, maxSize = 1200)
     * Reads an uploaded image File/Blob, resizes raster images exceeding maxSize,
     * registers the resulting Data URI in ConGenState.assets, and resolves to { assetId, dataUrl }.
     */
    processImageFile: function (file, maxSize = 1200) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('No file provided'));
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error || new Error('FileReader failed'));
            reader.onload = (ev) => {
                const rawDataUrl = ev.target.result;
                if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
                    const assetId = this.registerAsset(rawDataUrl);
                    return resolve({ assetId, dataUrl: rawDataUrl });
                }
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width <= maxSize && height <= maxSize) {
                        const assetId = this.registerAsset(rawDataUrl);
                        return resolve({ assetId, dataUrl: rawDataUrl });
                    }
                    if (width > height) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    } else {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const outType = (file.type === 'image/png' || file.type === 'image/webp') ? file.type : 'image/jpeg';
                    const resizedDataUrl = canvas.toDataURL(outType, 0.88);
                    const assetId = this.registerAsset(resizedDataUrl);
                    resolve({ assetId, dataUrl: resizedDataUrl });
                };
                img.onerror = () => {
                    const assetId = this.registerAsset(rawDataUrl);
                    resolve({ assetId, dataUrl: rawDataUrl });
                };
                img.src = rawDataUrl;
            };
            reader.readAsDataURL(file);
        });
    },

    restoreFromClipboard: function (clipboardIndex, pageId, rowId, blockIndex) {
        const row = this._findRow(pageId, rowId);
        if (!row || !row.blocks[blockIndex]) return;

        const clipboardBlock = window.ConGenState.clipboard[clipboardIndex];
        if (!clipboardBlock) return;

        // Clone the content into the slot
        const destBlock = row.blocks[blockIndex];
        destBlock.type = clipboardBlock.type;
        destBlock.data = JSON.parse(JSON.stringify(clipboardBlock.data));

        window.HistoryManager.pushState("Restored Block from Tray");
        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        if (window.ConGenRenderer) window.ConGenRenderer.renderRow(rowId);
        if (typeof window.updatePreview === 'function') window.updatePreview();
    },

    // --- Internal Data Managers (Do not call directly from UI) ---
    _syncRowBlocksToPreset: function (row) {
        const layoutSpans = GRID_LAYOUTS[row.preset];

        // Non-destructive capture
        if (row.blocks.length > layoutSpans.length) {
            const excess = row.blocks.slice(layoutSpans.length);
            excess.forEach(b => {
                if (b.type !== 'empty') {
                    window.ConGenState.clipboard.push(JSON.parse(JSON.stringify(b)));
                }
            });
            if (window.ClipboardUI && window.ClipboardUI.updateBadge) {
                window.ClipboardUI.updateBadge();
            }
        }

        // 1. Strictly truncate excess blocks
        row.blocks = row.blocks.slice(0, layoutSpans.length);

        // 2. Add empty blocks if we need more columns
        while (row.blocks.length < layoutSpans.length) {
            row.blocks.push({
                id: `block_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                type: 'empty',
                span: 12,
                data: {}
            });
        }

        // 3. Update spans to match the preset map
        row.blocks.forEach((block, index) => {
            block.span = layoutSpans[index];
        });

        return true;
    },

    _findPage: function (pageId) {
        return window.ConGenState.pages.find(p => p.id === pageId);
    },
    _findRow: function (pageId, rowId) {
        const page = this._findPage(pageId);
        return page ? page.rows.find(r => r.id === rowId) : null;
    },
    _findBlock: function (pageId, rowId, blockId) {
        const row = this._findRow(pageId, rowId);
        return row ? row.blocks.find(b => b.id === blockId) : null;
    }
};

// 3. THE HISTORY MANAGER (Rich Activity Log, Smart Diffing & Timestamps)
window.HistoryManager = {
    stack: [],
    currentIndex: -1,
    _isRestoring: false,
    _debounceTimer: null,

    _stripHtml: function (html) {
        if (!html) return '';
        return String(html)
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    },

    _cap: function (str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    _formatPresetLabel: function (preset, blocks) {
        const spans = (blocks || []).map(b => b.span).join('/');
        if (preset === '12' || preset === '1-col' || spans === '12') return '1 Column (Full Width 12)';
        if (preset === '6' || preset === '2-col' || spans === '6/6') return '2 Columns (50% / 50%)';
        if (preset === '4' || preset === '3-col' || spans === '4/4/4') return '3 Columns (Thirds 4/4/4)';
        if (preset === '3' || spans === '3/3/3/3') return '4 Columns (Quarters 3/3/3/3)';
        if (preset === '4-8' || spans === '4/8') return '2 Columns (33% / 67%)';
        if (preset === '8-4' || spans === '8/4') return '2 Columns (67% / 33%)';
        return spans ? `Custom Grid (${spans})` : (preset || 'Grid');
    },

    _analyzeDiff: function (actionInput, prev, curr) {
        const rawTitle = typeof actionInput === 'string' ? actionInput : (actionInput?.title || 'Updated Workspace');
        const explicit = (typeof actionInput === 'object' && actionInput !== null) ? actionInput : {};

        const meta = {
            title: rawTitle,
            category: explicit.category || 'system',
            how: explicit.how || '',
            pageId: explicit.pageId || curr.activePageId || null,
            pageTitle: explicit.pageTitle || '',
            sectionLabel: explicit.sectionLabel || '',
            blockLabel: explicit.blockLabel || '',
            snippet: explicit.snippet || ''
        };

        const resolvePageLabel = (stateObj, targetPageId) => {
            if (!stateObj || !Array.isArray(stateObj.pages)) return '';
            const idx = stateObj.pages.findIndex(p => p.id === targetPageId);
            if (idx === -1) return '';
            const p = stateObj.pages[idx];
            return `Page ${idx + 1}: ${p.title || 'Untitled'}`;
        };

        if (!prev || !Array.isArray(prev.pages)) {
            meta.category = 'system';
            const firstPage = curr.pages?.[0];
            meta.pageId = curr.activePageId || firstPage?.id || null;
            meta.pageTitle = resolvePageLabel(curr, meta.pageId) || 'Workspace';
            const totalRows = (curr.pages || []).reduce((acc, p) => acc + (p.rows?.length || 0), 0);
            meta.sectionLabel = `${(curr.pages || []).length} Page(s) · ${totalRows} Row(s)`;
            meta.how = rawTitle === 'Loaded Document'
                ? `Loaded "${curr.settings?.docTitle || 'Untitled'}" into workspace`
                : `Initialized workspace "${curr.settings?.docTitle || 'Process Documentation'}"`;
            return meta;
        }

        // 1. Check Document-Level Settings & Theme Changes
        const pSet = prev.settings || {};
        const cSet = curr.settings || {};
        if (JSON.stringify(pSet) !== JSON.stringify(cSet)) {
            meta.category = 'design';
            meta.pageTitle = 'Global Document';
            meta.sectionLabel = 'Document Design';

            const pOut = pSet.outputTheme || {};
            const cOut = cSet.outputTheme || {};

            if (pSet.docTitle !== cSet.docTitle) {
                meta.title = 'Renamed Document Title';
                meta.how = `Changed title from "${pSet.docTitle || 'Untitled'}" to "${cSet.docTitle || 'Untitled'}"`;
                meta.snippet = cSet.docTitle || '';
                return meta;
            }
            if (pOut.layoutMode !== cOut.layoutMode) {
                meta.title = 'Changed Document Layout Mode';
                meta.sectionLabel = 'Layout & Navigation';
                meta.how = `Switched layout mode to ${cOut.layoutMode === 'presentation' ? '16:9 Presentation Deck' : 'Standard Document'}`;
                return meta;
            }
            if (pOut.navPosition !== cOut.navPosition) {
                meta.title = 'Changed Navigation Bar Position';
                meta.sectionLabel = 'Layout & Navigation';
                meta.how = `Switched exported navigation to ${cOut.navPosition === 'bottom' ? 'Bottom Floating Dock' : 'Left Sidebar'}`;
                return meta;
            }
            if (pOut.preset !== cOut.preset) {
                meta.title = `Applied "${this._cap(cOut.preset || 'Custom')}" Theme Preset`;
                meta.sectionLabel = 'Theme Preset & Colors';
                meta.how = `Changed output theme preset from "${pOut.preset || 'default'}" to "${cOut.preset || 'custom'}"`;
                return meta;
            }
            if (pSet.logoData !== cSet.logoData || pSet.logoAlignment !== cSet.logoAlignment) {
                meta.title = 'Updated Brand Logo';
                meta.sectionLabel = 'Header & Branding';
                meta.how = !cSet.logoData
                    ? 'Removed header brand logo'
                    : (pSet.logoData !== cSet.logoData ? 'Uploaded new brand logo image' : `Aligned brand logo to ${cSet.logoAlignment}`);
                return meta;
            }
            if (pSet.css !== cSet.css) {
                meta.title = 'Updated Custom CSS';
                meta.sectionLabel = 'Advanced Custom CSS';
                meta.how = cSet.css ? `Modified custom stylesheet (${cSet.css.length} chars)` : 'Cleared custom CSS overrides';
                return meta;
            }
            if (JSON.stringify(pSet.emailTemplates) !== JSON.stringify(cSet.emailTemplates)) {
                meta.title = 'Updated Email Templates';
                meta.sectionLabel = 'Email Templates Library';
                meta.how = `Library now contains ${(cSet.emailTemplates || []).length} email template(s)`;
                return meta;
            }
            // Detailed theme property check
            const changedProps = [];
            if (pOut.brand !== cOut.brand) changedProps.push(`Brand Color (${cOut.brand})`);
            if (pOut.bg !== cOut.bg) changedProps.push(`Sidebar Bg (${cOut.bg})`);
            if (pOut.secondary !== cOut.secondary) changedProps.push(`Secondary Accent (${cOut.secondary})`);
            if (pOut.fontHeading !== cOut.fontHeading) changedProps.push(`Heading Font (${cOut.fontHeading})`);
            if (pOut.fontBody !== cOut.fontBody) changedProps.push(`Body Font (${cOut.fontBody})`);
            if (pOut.fontBase !== cOut.fontBase) changedProps.push(`Base Size (${cOut.fontBase}px)`);
            if (pOut.glassUI !== cOut.glassUI) changedProps.push(`Glass UI (${cOut.glassUI ? 'On' : 'Off'})`);

            meta.title = 'Updated Document Design';
            meta.how = changedProps.length > 0 ? `Changed ${changedProps.join(', ')}` : 'Updated output theme settings';
            return meta;
        }

        // 2. Check Page Additions / Deletions
        if (curr.pages.length > prev.pages.length) {
            const addedPage = curr.pages.find(cp => !prev.pages.some(pp => pp.id === cp.id)) || curr.pages[curr.pages.length - 1];
            const pIdx = curr.pages.indexOf(addedPage);
            meta.category = 'page';
            meta.pageId = addedPage.id;
            meta.title = `Added Page "${addedPage.title || 'New Page'}"`;
            meta.pageTitle = `Page ${pIdx + 1}: ${addedPage.title || 'New Page'}`;
            meta.sectionLabel = 'Page Structure';
            meta.how = `Created new page at tab #${pIdx + 1} with 1 starter row`;
            return meta;
        }

        if (curr.pages.length < prev.pages.length) {
            const removedPage = prev.pages.find(pp => !curr.pages.some(cp => cp.id === pp.id)) || prev.pages[prev.pages.length - 1];
            const pIdx = prev.pages.indexOf(removedPage);
            meta.category = 'page';
            meta.pageId = curr.activePageId;
            meta.title = `Deleted Page "${removedPage.title || 'Untitled'}"`;
            meta.pageTitle = `Page ${pIdx + 1}: ${removedPage.title || 'Untitled'}`;
            meta.sectionLabel = 'Page Structure';
            meta.how = `Removed page tab #${pIdx + 1} and its ${(removedPage.rows || []).length} row(s)`;
            return meta;
        }

        // 3. Compare Pages for Page-Level, Row-Level, or Block-Level Changes
        for (let pIdx = 0; pIdx < curr.pages.length; pIdx++) {
            const cPage = curr.pages[pIdx];
            const pPage = prev.pages.find(p => p.id === cPage.id) || prev.pages[pIdx];
            if (!pPage) continue;
            if (JSON.stringify(pPage) === JSON.stringify(cPage)) continue;

            meta.pageId = cPage.id;
            meta.pageTitle = `Page ${pIdx + 1}: ${cPage.title || 'Untitled'}`;

            // 3A. Page Header / Settings Changed
            if (
                pPage.title !== cPage.title ||
                pPage.titleAlign !== cPage.titleAlign ||
                pPage.titleBgColor !== cPage.titleBgColor ||
                pPage.titleColor !== cPage.titleColor ||
                pPage.titleFont !== cPage.titleFont ||
                pPage.titleStyle !== cPage.titleStyle
            ) {
                meta.category = 'page';
                meta.sectionLabel = 'Page Header';
                if (pPage.title !== cPage.title) {
                    meta.title = 'Renamed Page Title';
                    meta.how = `Changed page title from "${pPage.title || 'Untitled'}" to "${cPage.title || 'Untitled'}"`;
                    meta.snippet = cPage.title || '';
                } else if (pPage.titleStyle !== cPage.titleStyle) {
                    meta.title = 'Changed Page Title Style';
                    meta.how = `Set page header style to "${cPage.titleStyle || 'standard'}"`;
                } else if (pPage.titleAlign !== cPage.titleAlign) {
                    meta.title = 'Changed Page Title Alignment';
                    meta.how = `Aligned page header to ${cPage.titleAlign}`;
                } else {
                    meta.title = 'Updated Page Header Styling';
                    meta.how = `Modified header colors or font (${cPage.titleFont || 'Default'})`;
                }
                return meta;
            }

            const pRows = pPage.rows || [];
            const cRows = cPage.rows || [];

            // 3B. Row Added
            if (cRows.length > pRows.length) {
                const addedRow = cRows.find(cr => !pRows.some(pr => pr.id === cr.id)) || cRows[cRows.length - 1];
                const rIdx = cRows.indexOf(addedRow);
                meta.category = 'row';
                meta.title = 'Added Row Container';
                meta.sectionLabel = `Row ${rIdx + 1}${addedRow.header ? ': "' + addedRow.header + '"' : ''}`;
                meta.how = `Inserted new row container at position #${rIdx + 1} on "${cPage.title}"`;
                return meta;
            }

            // 3C. Row Deleted
            if (cRows.length < pRows.length) {
                const removedRow = pRows.find(pr => !cRows.some(cr => cr.id === pr.id)) || pRows[pRows.length - 1];
                const rIdx = pRows.indexOf(removedRow);
                const populatedCount = (removedRow.blocks || []).filter(b => b.type !== 'empty').length;
                meta.category = 'row';
                meta.title = 'Deleted Row Container';
                meta.sectionLabel = `Row ${rIdx + 1}${removedRow.header ? ': "' + removedRow.header + '"' : ''}`;
                meta.how = `Removed Row ${rIdx + 1} (${populatedCount} populated block${populatedCount === 1 ? '' : 's'})`;
                return meta;
            }

            // 3D. Row Reordered (same row IDs, different index)
            const pRowIds = pRows.map(r => r.id).join(',');
            const cRowIds = cRows.map(r => r.id).join(',');
            if (pRowIds !== cRowIds && pRows.length === cRows.length) {
                let movedRow = null, fromIdx = -1, toIdx = -1;
                for (let i = 0; i < cRows.length; i++) {
                    const oldI = pRows.findIndex(r => r.id === cRows[i].id);
                    if (oldI !== -1 && oldI !== i) {
                        movedRow = cRows[i];
                        fromIdx = oldI;
                        toIdx = i;
                        break;
                    }
                }
                meta.category = 'row';
                meta.title = 'Reordered Row Container';
                meta.sectionLabel = movedRow
                    ? `Row ${toIdx + 1}${movedRow.header ? ': "' + movedRow.header + '"' : ''}`
                    : 'Row Order';
                meta.how = movedRow
                    ? `Moved row from position #${fromIdx + 1} to #${toIdx + 1}`
                    : 'Reordered rows on page';
                return meta;
            }

            // 3E. Inspect Individual Row / Block Differences
            const changedRows = [];
            for (let rIdx = 0; rIdx < cRows.length; rIdx++) {
                if (JSON.stringify(pRows[rIdx]) !== JSON.stringify(cRows[rIdx])) {
                    changedRows.push({ rIdx, pRow: pRows[rIdx], cRow: cRows[rIdx] });
                }
            }

            // Cross-row block move or swap
            if (changedRows.length === 2) {
                const [first, second] = changedRows;
                meta.category = 'block';
                meta.title = rawTitle.includes('Swap') ? 'Swapped Blocks Across Rows' : 'Relocated Block Across Rows';
                meta.sectionLabel = `Row ${first.rIdx + 1} ↔ Row ${second.rIdx + 1}`;
                meta.how = `Moved or swapped block content between Row ${first.rIdx + 1} and Row ${second.rIdx + 1}`;
                return meta;
            }

            if (changedRows.length >= 1) {
                const { rIdx, pRow, cRow } = changedRows[0];
                const rowHeaderSuffix = cRow.header ? `: "${cRow.header}"` : '';
                meta.sectionLabel = `Row ${rIdx + 1}${rowHeaderSuffix}`;

                // Check Row-level properties (header, headerAlign, headerStyle, verticalSpacing, preset/spans)
                if (pRow.header !== cRow.header) {
                    meta.category = 'row';
                    meta.title = cRow.header ? 'Updated Row Section Header' : 'Cleared Row Section Header';
                    meta.how = cRow.header
                        ? `Set Row ${rIdx + 1} header to "${cRow.header}"`
                        : `Removed header "${pRow.header}" from Row ${rIdx + 1}`;
                    meta.snippet = cRow.header || '';
                    return meta;
                }
                if (pRow.headerAlign !== cRow.headerAlign || pRow.headerStyle !== cRow.headerStyle) {
                    meta.category = 'row';
                    meta.title = 'Updated Row Header Style';
                    meta.how = pRow.headerStyle !== cRow.headerStyle
                        ? `Changed Row ${rIdx + 1} header style to "${cRow.headerStyle || 'standard'}"`
                        : `Aligned Row ${rIdx + 1} header to ${cRow.headerAlign || 'left'}`;
                    return meta;
                }
                if (pRow.verticalSpacing !== cRow.verticalSpacing) {
                    meta.category = 'row';
                    meta.title = 'Adjusted Row Vertical Spacing';
                    meta.how = `Changed Row ${rIdx + 1} bottom spacing from ${pRow.verticalSpacing ?? 20}px to ${cRow.verticalSpacing}px`;
                    return meta;
                }

                const pSpans = (pRow.blocks || []).map(b => b.span).join(',');
                const cSpans = (cRow.blocks || []).map(b => b.span).join(',');
                if (pSpans !== cSpans || (pRow.blocks || []).length !== (cRow.blocks || []).length) {
                    meta.category = 'row';
                    const isPasted = rawTitle.toLowerCase().includes('paste');
                    meta.title = isPasted ? 'Pasted Row from Tray' : 'Changed Row Column Layout';
                    meta.how = `Configured Row ${rIdx + 1} as ${this._formatPresetLabel(cRow.preset, cRow.blocks)}`;
                    return meta;
                }

                // Check Block-level changes inside this row
                const pBlocks = pRow.blocks || [];
                const cBlocks = cRow.blocks || [];
                const diffBlockIndices = [];
                for (let bIdx = 0; bIdx < cBlocks.length; bIdx++) {
                    if (JSON.stringify(pBlocks[bIdx]) !== JSON.stringify(cBlocks[bIdx])) {
                        diffBlockIndices.push(bIdx);
                    }
                }

                if (diffBlockIndices.length === 2) {
                    const [b1, b2] = diffBlockIndices;
                    meta.category = 'block';
                    meta.title = rawTitle.includes('Swap') ? 'Swapped Blocks in Row' : 'Moved Block in Row';
                    meta.blockLabel = `Col ${b1 + 1} ↔ Col ${b2 + 1} (of ${cBlocks.length})`;
                    meta.how = `Swapped ${this._cap(cBlocks[b2].type)} and ${this._cap(cBlocks[b1].type)} between Columns ${b1 + 1} and ${b2 + 1}`;
                    return meta;
                }

                if (diffBlockIndices.length === 1) {
                    const bIdx = diffBlockIndices[0];
                    const pBlock = pBlocks[bIdx];
                    const cBlock = cBlocks[bIdx];
                    const colPosition = `Col ${bIdx + 1} of ${cBlocks.length}`;
                    meta.category = 'block';

                    // Type changed (Added, Removed, or Converted block)
                    if (pBlock.type !== cBlock.type) {
                        if (cBlock.type === 'empty') {
                            meta.title = `Removed ${this._cap(pBlock.type)} Block`;
                            meta.blockLabel = `${this._cap(pBlock.type)} · ${colPosition}`;
                            meta.how = `Cleared ${pBlock.type} block from ${colPosition} in Row ${rIdx + 1}`;
                            const oldText = this._stripHtml(pBlock.data?.content);
                            if (pBlock.type === 'text' && oldText) {
                                meta.snippet = oldText.slice(0, 80) + (oldText.length > 80 ? '…' : '');
                            }
                            return meta;
                        }
                        if (pBlock.type === 'empty') {
                            const fromTray = rawTitle.toLowerCase().includes('tray') || rawTitle.toLowerCase().includes('restore');
                            meta.title = fromTray
                                ? `Restored ${this._cap(cBlock.type)} Block from Tray`
                                : `Added ${this._cap(cBlock.type)} Block`;
                            meta.blockLabel = `${this._cap(cBlock.type)} · ${colPosition}`;
                            meta.how = `${fromTray ? 'Restored' : 'Inserted'} ${cBlock.type} block into ${colPosition} (span ${cBlock.span}/12)`;
                            return meta;
                        }
                        meta.title = `Converted Block to ${this._cap(cBlock.type)}`;
                        meta.blockLabel = `${this._cap(cBlock.type)} · ${colPosition}`;
                        meta.how = `Changed slot from ${pBlock.type} to ${cBlock.type} in ${colPosition}`;
                        return meta;
                    }

                    // Same block type — inspect block.data changes!
                    meta.blockLabel = `${this._cap(cBlock.type)} · ${colPosition}`;
                    const pData = pBlock.data || {};
                    const cData = cBlock.data || {};

                    if (cBlock.type === 'text') {
                        const oldHtml = pData.content || '';
                        const newHtml = cData.content || '';
                        const oldText = this._stripHtml(oldHtml);
                        const newText = this._stripHtml(newHtml);

                        const details = [];
                        if (pData.halign !== cData.halign) details.push(`horizontal align → ${cData.halign}`);
                        if (pData.valign !== cData.valign) details.push(`vertical align → ${(cData.valign || '').replace('valign-', '')}`);

                        if (oldHtml !== newHtml) {
                            const oldHi = (oldHtml.match(/background-color/gi) || []).length;
                            const newHi = (newHtml.match(/background-color/gi) || []).length;
                            const oldColor = (oldHtml.match(/<font[^>]*color|style="[^"]*\bcolor:/gi) || []).length;
                            const newColor = (newHtml.match(/<font[^>]*color|style="[^"]*\bcolor:/gi) || []).length;
                            const oldLinks = (oldHtml.match(/<a\b|slide-sync-link/gi) || []).length;
                            const newLinks = (newHtml.match(/<a\b|slide-sync-link/gi) || []).length;
                            const oldHeads = (oldHtml.match(/<h[1-6]\b/gi) || []).length;
                            const newHeads = (newHtml.match(/<h[1-6]\b/gi) || []).length;

                            if (oldText === newText) {
                                // Pure formatting change on existing text!
                                if (newHi > oldHi) details.push('applied text highlight');
                                else if (newHi < oldHi) details.push('cleared text highlight');
                                if (newColor > oldColor) details.push('applied custom text color');
                                else if (newColor < oldColor) details.push('reset text color');
                                if (newLinks !== oldLinks) details.push('updated link / slide trigger');
                                if (newHeads !== oldHeads) details.push('changed heading format');
                                if (details.length === 0) details.push('updated text styling / formatting');
                                meta.title = 'Formatted Text Block';
                            } else {
                                meta.title = 'Edited Text Block';
                                const charDelta = newText.length - oldText.length;
                                const deltaLabel = charDelta > 0 ? `+${charDelta} chars` : (charDelta < 0 ? `${charDelta} chars` : 'modified text');
                                details.unshift(`updated content (${deltaLabel})`);
                                if (newHi > oldHi) details.push('highlighted text');
                            }
                        } else {
                            meta.title = 'Aligned Text Block';
                        }

                        meta.how = details.length > 0
                            ? this._cap(details.join(', '))
                            : 'Modified text block content';
                        if (newText) {
                            meta.snippet = newText.slice(0, 85) + (newText.length > 85 ? '…' : '');
                        }
                        return meta;
                    }

                    if (cBlock.type === 'image') {
                        const changes = [];
                        if (pData.content !== cData.content) {
                            changes.push(`loaded image "${cData.filename || cData.content || 'Asset'}"`);
                        }
                        if (pData.captionText !== cData.captionText || pData.captionEnabled !== cData.captionEnabled) {
                            changes.push(cData.captionEnabled ? `caption "${cData.captionText || ''}"` : 'disabled caption');
                        }
                        if (pData.captionStyle !== cData.captionStyle) {
                            changes.push(`caption style → ${cData.captionStyle}`);
                        }
                        if (pData.imgFrame !== cData.imgFrame) {
                            changes.push(`frame → ${cData.imgFrame}`);
                        }
                        if (pData.objectFit !== cData.objectFit) {
                            changes.push(`fit → ${cData.objectFit}`);
                        }
                        if (pData.imgZoom !== cData.imgZoom || pData.imgFocalX !== cData.imgFocalX || pData.imgFocalY !== cData.imgFocalY) {
                            changes.push(`zoom/focal (${cData.imgZoom || 1}x)`);
                        }
                        if (pData.imgBorder !== cData.imgBorder || pData.imgRadius !== cData.imgRadius || pData.imgShadow !== cData.imgShadow) {
                            changes.push('border/radius/shadow');
                        }
                        meta.title = pData.content !== cData.content ? 'Updated Image Block Asset' : 'Styled Image Block';
                        meta.how = changes.length > 0 ? this._cap(changes.join(', ')) : 'Updated image block properties';
                        if (cData.filename) meta.snippet = cData.filename;
                        return meta;
                    }

                    if (cBlock.type === 'slideshow') {
                        const pCount = (pData.slides || []).length;
                        const cCount = (cData.slides || []).length;
                        meta.title = 'Updated Slideshow Gallery';
                        if (cCount > pCount) meta.how = `Added slide (${cCount} total slides in gallery)`;
                        else if (cCount < pCount) meta.how = `Removed slide (${cCount} remaining in gallery)`;
                        else meta.how = `Updated slideshow settings (${cCount} slides)`;
                        return meta;
                    }

                    if (cBlock.type === 'button') {
                        meta.title = 'Updated Button Link Block';
                        meta.how = `Label: "${cData.label || 'Button'}" → Target: ${cData.target || 'None'}`;
                        meta.snippet = cData.label || '';
                        return meta;
                    }

                    if (cBlock.type === 'spacer') {
                        meta.title = 'Updated Spacer / Divider Block';
                        meta.how = `${this._cap(cData.orientation || 'vertical')} ${cData.style || 'solid'} (${cData.size || 50}px)`;
                        return meta;
                    }
                }
            }
        }

        // Fallback if no specific diff branch returned early
        meta.pageTitle = resolvePageLabel(curr, meta.pageId) || 'Workspace';
        if (!meta.how) meta.how = rawTitle;
        return meta;
    },

    pushStateDebounced: function (actionInput = "Updated Workspace", delay = 350) {
        if (this._isRestoring) return;
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
            this.pushState(actionInput);
        }, delay);
    },

    clear: function () {
        this.stack = [];
        this.currentIndex = -1;
        this.updateButtonStates();
        if (window.HistoryUI && document.getElementById('historyDrawer')?.classList.contains('open')) {
            window.HistoryUI.renderList();
        }
    },

    updateButtonStates: function () {
        const btnUndo = document.getElementById('btn-undo');
        const btnRedo = document.getElementById('btn-redo');
        if (!btnUndo || !btnRedo) return;

        if (this.currentIndex <= 0) {
            btnUndo.style.opacity = '0.5';
            btnUndo.style.pointerEvents = 'none';
            btnUndo.title = 'Nothing to Undo (Ctrl+Z)';
        } else {
            btnUndo.style.opacity = '';
            btnUndo.style.pointerEvents = '';
            const currEntry = this.stack[this.currentIndex];
            const loc = [currEntry.pageTitle, currEntry.sectionLabel].filter(Boolean).join(' › ');
            btnUndo.title = `Undo: ${currEntry.name}${loc ? ' (' + loc + ')' : ''} [Ctrl+Z]`;
        }

        if (this.currentIndex >= this.stack.length - 1) {
            btnRedo.style.opacity = '0.5';
            btnRedo.style.pointerEvents = 'none';
            btnRedo.title = 'Nothing to Redo (Ctrl+Y)';
        } else {
            btnRedo.style.opacity = '';
            btnRedo.style.pointerEvents = '';
            const nextEntry = this.stack[this.currentIndex + 1];
            const loc = [nextEntry.pageTitle, nextEntry.sectionLabel].filter(Boolean).join(' › ');
            btnRedo.title = `Redo: ${nextEntry.name}${loc ? ' (' + loc + ')' : ''} [Ctrl+Y]`;
        }
    },

    pushState: function (actionInput = "Updated Workspace") {
        if (this._isRestoring) return;

        clearTimeout(this._debounceTimer);
        const { assets, ...historySnapshot } = window.ConGenState;
        const stateStr = JSON.stringify(historySnapshot);

        if (this.currentIndex >= 0 && this.stack[this.currentIndex].data === stateStr) return;

        let prevStateObj = null;
        if (this.currentIndex >= 0 && this.stack[this.currentIndex]?.data) {
            try {
                prevStateObj = JSON.parse(this.stack[this.currentIndex].data);
            } catch (e) { }
        }

        if (this.currentIndex < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.currentIndex + 1);
        }

        const richMeta = this._analyzeDiff(actionInput, prevStateObj, historySnapshot);

        this.stack.push({
            id: `hist_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
            data: stateStr,
            timestamp: Date.now(),
            name: richMeta.title,
            category: richMeta.category,
            how: richMeta.how,
            pageId: richMeta.pageId,
            pageTitle: richMeta.pageTitle,
            sectionLabel: richMeta.sectionLabel,
            blockLabel: richMeta.blockLabel,
            snippet: richMeta.snippet
        });
        this.currentIndex++;

        if (this.stack.length > 40) {
            this.stack.shift();
            this.currentIndex--;
        }
        this.updateButtonStates();

        if (window.HistoryUI && document.getElementById('historyDrawer')?.classList.contains('open')) {
            window.HistoryUI.renderList();
        }
    },

    undo: function () {
        if (this.currentIndex > 0) {
            const undoneEntry = this.stack[this.currentIndex];
            this.currentIndex--;
            this.restoreState(undoneEntry?.pageId);
            this.updateButtonStates();
            if (window.HistoryUI && document.getElementById('historyDrawer')?.classList.contains('open')) {
                window.HistoryUI.renderList();
            }
        }
    },

    redo: function () {
        if (this.currentIndex < this.stack.length - 1) {
            this.currentIndex++;
            const redoneEntry = this.stack[this.currentIndex];
            this.restoreState(redoneEntry?.pageId);
            this.updateButtonStates();
            if (window.HistoryUI && document.getElementById('historyDrawer')?.classList.contains('open')) {
                window.HistoryUI.renderList();
            }
        }
    },

    restoreState: function (preferredPageId = null) {
        const entry = this.stack[this.currentIndex];
        if (!entry || !entry.data) return;

        const stateStr = entry.data;

        this._isRestoring = true;
        try {
            clearTimeout(this._debounceTimer);
            const preservedAssets = window.ConGenState?.assets || {};
            const restored = JSON.parse(stateStr);
            restored.assets = preservedAssets;

            // If the restored action targeted a specific page that exists in the restored state, focus that page
            const targetPageId = preferredPageId || entry.pageId;
            if (targetPageId && Array.isArray(restored.pages) && restored.pages.some(p => p.id === targetPageId)) {
                restored.activePageId = targetPageId;
            }

            window.ConGenState = restored;
            if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
            if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
            if (typeof window.updatePreview === 'function') window.updatePreview();
        } catch (e) {
            console.error("Undo Restore failed", e);
        }
        setTimeout(() => { this._isRestoring = false; }, 50);
    }
};
