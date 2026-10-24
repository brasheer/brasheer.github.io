/**
 * ConGen 7.7.0 Master - UI Bindings
 * This file contains NO layout logic. It only wires DOM events to the API.
 */

// Keep your standard icons
const ICONS = {
    DRAG: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
    SETTINGS: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    REMOVE: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
    TEXT: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
    IMAGE: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    SPACER: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14" opacity="0.4"/><path d="M12 2v20"/><path d="M5 22h14" opacity="0.4"/></svg>`,
    ROW: `<div style="font-family: monospace; font-weight: 900; letter-spacing: 1px; font-size: 10px; border: 1px solid currentColor; padding: 2px 4px; border-radius: 3px;">ROW</div>`,
    BUTTON: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="12" x="4" y="6" rx="2"/><path d="M12 12h.01"/></svg>`,
    SLIDESHOW: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2" ry="2"/><path d="M8 21h8"/><path d="M12 19v2"/></svg>`,
    ASSETS: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
    THEMES: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.838-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.648-1.688h1.816A4.944 4.944 0 0 0 22 11c0-4.962-4.48-9-10-9z"/></svg>`,
    UP: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`,
    DOWN: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
    LEFT: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    RIGHT: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    EMAIL: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`
};
window.ICONS = ICONS;

// --- Global Drawer Control ---
window.closeAllDrawers = function () {
    const drawers = ['#settingsDrawer', '#assetDrawer', '#editorThemeDrawer', '#outputThemeDrawer', '#emailTemplateDrawer', '#historyDrawer', '#clipboardDrawer'];
    const overlays = ['#settingsOverlay', '#assetOverlay', '#editorThemeOverlay', '#outputThemeOverlay', '#emailTemplateOverlay', '#historyOverlay', '#clipboardOverlay'];

    drawers.forEach(id => {
        const el = document.querySelector(id);
        if (el) el.classList.remove('open');
    });

    overlays.forEach(id => {
        const el = document.querySelector(id);
        if (el) el.classList.remove('active');
    });

    // Auto-collapse sidebar to icons when opening a drawer
    const layout = document.querySelector('.app-layout');
    const toggleIcon = document.getElementById('sidebarToggle');
    if (layout && layout.classList.contains('sidebar-expanded')) {
        layout.classList.remove('sidebar-expanded');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';
    }
};

window.ModalManager = {
    open: function (omniElement) {
        if (!omniElement) return;
        const blockId = omniElement.dataset.blockId || omniElement.closest('.block')?.id;
        const rowId = omniElement.dataset.rowId || omniElement.closest('.block-row-wrapper')?.id;
        const pageId = omniElement.dataset.pageId || omniElement.closest('.page-editor')?.id;
        if (pageId && rowId && blockId) {
            this.openById(pageId, rowId, blockId);
        }
    },

    deleteCurrentBlock: function (pageId, rowId, blockId) {
        if (confirm("Are you sure you want to completely remove this block's content?")) {
            const row = window.ConGenAPI._findRow(pageId, rowId);
            if (row) {
                const blockIndex = row.blocks.findIndex(b => b.id === blockId);
                if (blockIndex > -1) {
                    window.ConGenAPI.setBlockType(pageId, rowId, blockIndex, 'empty');
                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    if (window.ConGenRenderer) window.ConGenRenderer.renderRow(rowId);
                }
            }
            const dialogBox = document.getElementById('global-edit-modal');
            if (dialogBox && typeof dialogBox.close === 'function') dialogBox.close();
            if (typeof window.updatePreview === 'function') window.updatePreview();
        }
    },

    openById: function (pageId, rowId, blockId) {
        // 0. Flush any live inline Omni-Block state (especially inline .rte-editor) so both modals start 100% in sync
        const workspaceBlockShell = document.getElementById(blockId);
        const omniComponent = workspaceBlockShell ? workspaceBlockShell.querySelector('omni-block') : null;
        if (omniComponent && omniComponent.shadowRoot) {
            const inlineEditor = omniComponent.shadowRoot.querySelector('.rte-editor');
            const bubbleToolbar = omniComponent.shadowRoot.querySelector('.bubble-toolbar');
            if (bubbleToolbar) bubbleToolbar.style.display = 'none';
            if (inlineEditor) {
                const currentData = omniComponent.getData();
                currentData.content = inlineEditor.innerHTML;
                window.ConGenAPI.updateBlockData(pageId, rowId, blockId, currentData);
            }
        }

        // 1. Get the current truth from the State API
        const blockState = window.ConGenAPI._findBlock(pageId, rowId, blockId);
        if (!blockState) return;

        // Snapshot initial block data so Restore / Cancel can revert cleanly even with live sync
        const initialSnapshot = JSON.parse(JSON.stringify(blockState.data || {}));
        const context = { pageId, rowId, blockId, initialSnapshot };

        // 2. Find the plugin for this block type
        const plugin = customElements.get('omni-block').registry.get(blockState.type);
        if (!plugin || !plugin.getEditorTemplate) {
            console.warn('No advanced settings available for this block type.');
            return;
        }

        // 3. Ensure the HTML <dialog> element exists
        let modal = document.getElementById('global-edit-modal');
        if (!modal) {
            modal = document.createElement('dialog');
            modal.id = 'global-edit-modal';
            document.body.appendChild(modal);

            // Backdrop click to close (only when clicking the dialog backdrop itself, never child selects/inputs)
            modal.addEventListener('click', function (event) {
                if (event.target === modal) {
                    modal.close();
                }
            });
        }

        // 4. Inject the plugin's specific editor HTML
        const isRow = blockState.type === 'row';
        const deleteAction = isRow
            ? `if(confirm('Are you sure you want to delete this entire row?')){ window.ConGenAPI.deleteRow('${pageId}', '${rowId}'); document.getElementById('global-edit-modal').close(); if (typeof window.updatePreview === 'function') window.updatePreview(); }`
            : `window.ModalManager.deleteCurrentBlock('${pageId}', '${rowId}', '${blockId}')`;

        modal.innerHTML = `
            <div class="modal-header">
                <h3>Edit ${blockState.type.toUpperCase()}</h3>
                <button class="btn-close" id="btn-close-modal-x" title="Close">×</button>
            </div>
            <div class="modal-body">
                ${plugin.getEditorTemplate(blockState.data, context)}
            </div>
            <div class="modal-footer" style="display: flex; gap: 10px; width: 100%; align-items: center;">
                <button class="btn" style="background: var(--danger, #e74c3c); color: white; margin-right: auto;" onclick="${deleteAction}">${isRow ? 'Delete Row' : 'Delete Block'}</button>
                <button class="btn btn-secondary" id="btn-restore-modal" title="Restore block to state when modal opened">↺ Restore Original</button>
                <button class="btn btn-secondary" id="btn-cancel-modal">Cancel</button>
                <button class="btn btn-primary" id="btn-save-modal">Save Changes</button>
            </div>
        `;

        const modalBody = modal.querySelector('.modal-body');

        const syncToWorkspace = (dataToApply) => {
            window.ConGenAPI.updateBlockData(pageId, rowId, blockId, dataToApply);
            const shell = document.getElementById(blockState.id);
            if (shell) {
                const omni = shell.querySelector('omni-block');
                if (omni && typeof omni.setData === 'function') {
                    omni.setData(blockState.data, 'view');
                }
            }
            if (typeof window.updatePreview === 'function') window.updatePreview();
        };

        context.syncLive = () => {
            if (plugin.getEditorData) {
                const liveData = plugin.getEditorData(modalBody);
                syncToWorkspace(liveData);
            }
        };

        // 5. Let the plugin wire up its sliders/listeners
        if (plugin.onEditorRender) {
            plugin.onEditorRender(modalBody, blockState.data, context);
        }

        // 6. Wire up Restore Original, Cancel, Close (X), and Save Buttons
        modal.querySelector('#btn-restore-modal').onclick = () => {
            const restored = JSON.parse(JSON.stringify(initialSnapshot));
            syncToWorkspace(restored);
            modalBody.innerHTML = plugin.getEditorTemplate(blockState.data, context);
            if (plugin.onEditorRender) {
                plugin.onEditorRender(modalBody, blockState.data, context);
            }
        };

        modal.querySelector('#btn-cancel-modal').onclick = () => {
            const restored = JSON.parse(JSON.stringify(initialSnapshot));
            syncToWorkspace(restored);
            modal.close();
        };

        modal.querySelector('#btn-close-modal-x').onclick = () => {
            if (plugin.getEditorData) {
                const newData = plugin.getEditorData(modalBody);
                syncToWorkspace(newData);
            }
            modal.close();
        };

        modal.querySelector('#btn-save-modal').onclick = () => {
            if (plugin.getEditorData) {
                const newData = plugin.getEditorData(modalBody);
                syncToWorkspace(newData);
            }
            modal.close();
        };

        // 7. Show it
        modal.showModal();

        // Ensure the modal is fully visible in the viewport
        setTimeout(() => {
            const rect = modal.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            if (rect.bottom > viewportHeight) {
                window.scrollBy({
                    top: rect.bottom - viewportHeight + 20,
                    behavior: 'smooth'
                });
            }
        }, 10);
    }
};

window.ConGenUI = {
    // --- Drag and Drop Logic ---
    startDrag: function (event, blockType) {
        event.dataTransfer.setData('text/plain', blockType);
        event.dataTransfer.effectAllowed = 'copy';
    },

    initGlobalDropzones: function () {
        // Use event delegation on the main container to catch all drops
        const canvas = document.querySelector('.main-canvas');

        canvas.addEventListener('dragover', (e) => {
            // Only trigger the blue outline for block drags — ignore row drags and sidebar tools
            if (!e.dataTransfer.types.includes('docbuilder/block')) return;

            const col = e.target.closest('.layout-column');
            if (col) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                // Remove outline from previous targets to prevent trailing highlights
                document.querySelectorAll('.global-drag-active').forEach(el => {
                    if (el !== col) el.classList.remove('global-drag-active');
                });

                col.classList.add('global-drag-active');
            }
        });

        canvas.addEventListener('dragleave', (e) => {
            if (e.target.closest('.layout-column')) {
                e.target.closest('.layout-column').classList.remove('global-drag-active');
            }
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const col = e.target.closest('.layout-column');
            if (!col) return;
            col.classList.remove('global-drag-active');

            const payload = e.dataTransfer.getData('text/plain');
            const dropHint = col.querySelector('.drop-hint');
            if (!payload || !dropHint) return;

            const pageId = dropHint.dataset.page;
            const rowId = dropHint.dataset.row;
            const index = parseInt(dropHint.dataset.index);

            // 1. DUAL-MODE DETECTION: Is this a tool from the sidebar or an existing block?
            try {
                const data = JSON.parse(payload);
                if (data.action === 'move_block') {
                    // It's an internal move!
                    window.ConGenAPI.relocateBlock(pageId, data.rowId, data.blockId, rowId, index);
                    return; // Stop here
                }
                if (data.action === 'restore_block') {
                    // It's coming from the Clipboard!
                    window.ConGenAPI.restoreFromClipboard(data.clipboardIndex, pageId, rowId, index);
                    if (document.getElementById('clipboardDrawer').classList.contains('open')) {
                        window.ClipboardUI.render();
                    }
                    return;
                }
            } catch (err) {
                // Not JSON? Then it's a raw string from the sidebar (e.g. "text", "image")
                window.ConGenAPI.setBlockType(pageId, rowId, index, payload);
            }
        });
    },

    initEventDispatcher: function () {
        // 0. Global Click handlers
        window.addEventListener('click', (e) => {
            // Close File Menu if clicked outside
            const menu = document.getElementById('file-menu-dropdown');
            const dropdown = document.getElementById('file-dropdown-content');
            if (menu && dropdown && !menu.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });

        // 1. Centralized Click Dispatcher (Event Delegation)
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;
            const ds = target.dataset;

            switch (action) {
                case 'move-row':
                    if (ds.pageId && ds.rowId && ds.direction) {
                        window.ConGenAPI.moveRow(ds.pageId, ds.rowId, ds.direction);
                    }
                    break;
                case 'move-block':
                    if (ds.pageId && ds.rowId && ds.blockId && ds.direction) {
                        window.ConGenAPI.moveBlock(ds.pageId, ds.rowId, ds.blockId, ds.direction);
                    }
                    break;
                case 'edit-block':
                    if (ds.pageId && ds.rowId && ds.blockId) {
                        window.ModalManager.openById(ds.pageId, ds.rowId, ds.blockId);
                    }
                    break;
                case 'delete-block':
                    if (ds.pageId && ds.rowId && ds.blockIndex !== undefined) {
                        window.ConGenAPI.setBlockType(ds.pageId, ds.rowId, parseInt(ds.blockIndex), 'empty');
                    }
                    break;
                case 'delete-row':
                    if (ds.pageId && ds.rowId) {
                        window.ConGenAPI.deleteRow(ds.pageId, ds.rowId);
                    }
                    break;
                case 'copy-row':
                    if (ds.pageId && ds.rowId) {
                        window.ConGenAPI.copyRowToClipboard(ds.pageId, ds.rowId);
                    }
                    break;
                case 'paste-row':
                    if (ds.pageId && ds.rowId) {
                        window.ConGenAPI.pasteRowFromClipboard(ds.pageId, ds.rowId);
                    }
                    break;
                case 'open-row-settings':
                    if (ds.pageId && ds.rowId) {
                        window.openFloatingGridMenu(ds.pageId, ds.rowId, target);
                    }
                    break;
            }
        });

        // 2. Custom Event Listener (Shadow DOM Bridge)
        window.addEventListener('congen-action', (e) => {
            const detail = e.detail;
            if (!detail || !detail.action) return;

            switch (detail.action) {
                case 'move-row':
                    window.ConGenAPI.moveRow(detail.pageId, detail.rowId, detail.direction);
                    break;
                case 'move-block':
                    window.ConGenAPI.moveBlock(detail.pageId, detail.rowId, detail.blockId, detail.direction);
                    break;
                case 'edit-block':
                    window.ModalManager.openById(detail.pageId, detail.rowId, detail.blockId);
                    break;
                case 'delete-block':
                    window.ConGenAPI.setBlockType(detail.pageId, detail.rowId, parseInt(detail.blockIndex), 'empty');
                    break;
                case 'delete-row':
                    window.ConGenAPI.deleteRow(detail.pageId, detail.rowId);
                    break;
                case 'open-row-settings':
                    window.openFloatingGridMenu(detail.pageId, detail.rowId, document.getElementById(detail.rowId));
                    break;
            }
        });
    }
};

// --- Floating Menu Logic ---
window.openFloatingGridMenu = function (pageId, rowId, btnElement) {
    // 1. Kill Event Bubbling so it opens on the FIRST click
    if (window.event) {
        window.event.stopPropagation();
    }

    const menu = document.querySelector('.floating-properties-menu');
    if (!menu) return;

    // 2. Clean slate: remove any dynamically added delete buttons from previous clicks
    const existingDeleteBtns = menu.querySelectorAll('.btn-delete-entire-row');
    existingDeleteBtns.forEach(btn => btn.remove());

    // 3. Force display and set data attributes
    menu.style.display = 'block';
    menu.dataset.activePage = pageId;
    menu.dataset.activeRow = rowId;

    const row = window.ConGenAPI._findRow(pageId, rowId);
    if (row) {
        let activeId = null;
        if (row.preset === '1-col' || row.preset === '12' || row.preset === 'presentation-cards' || row.preset === 'presentation-media') activeId = '12';
        else if (row.preset === '2-col' || row.preset === '6') activeId = '6';
        else if (row.preset === '3-col' || row.preset === '4') activeId = '4';
        else if (row.preset === '3') activeId = '3';
        else if (row.preset === '4-8' || row.preset === 'process-step') activeId = '4-8';
        else if (row.preset === '8-4') activeId = '8-4';

        menu.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        if (activeId) {
            const activeBtn = menu.querySelector('.preset-btn[data-preset="' + activeId + '"]');
            if (activeBtn) activeBtn.classList.add('active');
        const spacingSlider = menu.querySelector('.vertical-spacing-slider');
        if (spacingSlider) {
            spacingSlider.value = row.verticalSpacing !== undefined ? row.verticalSpacing : 20;
            spacingSlider.oninput = (ev) => {
                const val = parseInt(ev.target.value, 10);
                window.ConGenAPI.updateRowSettings(pageId, rowId, { verticalSpacing: val }, true);
                const rowEl = document.getElementById(rowId);
                if (rowEl) rowEl.style.marginBottom = val + 'px';
                if (typeof window.updatePreview === 'function') window.updatePreview();
            };
        }
        }
    }
    // 4. Position the menu next to the gear icon
    const rect = btnElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;

    // Prevent horizontal overflow
    if (rect.right - 200 < 0) {
        menu.style.left = '10px';
    } else {
        menu.style.left = `${rect.right - 250}px`; // Approximate menu width
    }

    // 5. Fix the Footer: Exactly ONE functional "Delete Row" button
    const footer = menu.querySelector('.floating-menu-footer');
    if (footer) {
        footer.innerHTML = `
            <button class="btn-delete-entire-row" style="background-color: var(--danger, #e74c3c); color: white; width: 100%; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-weight: bold; margin-top: 10px;">
                <span class="icon">🗑</span> DELETE ROW
            </button>
        `;

        footer.querySelector('.btn-delete-entire-row').onclick = (e) => {
            e.stopPropagation();
            window.ConGenAPI.deleteRow(pageId, rowId);
            menu.style.display = 'none';
        };
    }

    // 6. Viewport Auto-Scroll
    setTimeout(() => {
        const menuRect = menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // If the bottom of the menu is below the visible screen...
        if (menuRect.bottom > viewportHeight) {
            window.scrollBy({
                top: menuRect.bottom - viewportHeight + 20,
                behavior: 'smooth'
            });
        }
    }, 10);

    // 7. Bulletproof Click-Away & Close Button Logic
    const closeBtn = menu.querySelector('.btn-close-floating');
    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            menu.style.display = 'none';
        };
    }

    const closeMenuOnClickOutside = (e) => {
        if (!menu.contains(e.target) && !btnElement.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenuOnClickOutside);
        }
    };

    // Slight delay prevents any remaining click artifacts from instantly closing the menu
    setTimeout(() => {
        document.addEventListener('click', closeMenuOnClickOutside);
    }, 10);
};

// --- Asset Manager UI ---
window.clearAssetLibrary = async function() {
    if (confirm("Are you sure you want to delete ALL assets from the library? Any blocks currently using these images will appear broken.")) {
        window.ConGenState.assets = {};
        
        // Clear background if it was using a library asset
        if (window.ConGenState.settings.outputTheme?.backgroundImageId) {
            window.ConGenState.settings.outputTheme.backgroundImageId = null;
            window.applyCurrentThemes();
        }

        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        
        // Instantly refresh the UI if the drawer is open
        const drawerBody = document.querySelector('#assetDrawer .drawer-body');
        if (window.AssetManagerUI && drawerBody) {
            window.AssetManagerUI.renderGallery(drawerBody);
        }
        
        // Re-render the workspace so deleted images visibly break
        if (window.ConGenRenderer) window.ConGenRenderer.renderFullWorkspace();
    }
};


window.AssetManagerUI = {
    _initDrawer: function () {
        let drawer = document.getElementById('assetDrawer');
        let overlay = document.getElementById('assetOverlay');

        if (!drawer) {
            overlay = document.createElement('div');
            overlay.id = 'assetOverlay';
            overlay.className = 'settings-overlay';

            drawer = document.createElement('div');
            drawer.id = 'assetDrawer';
            drawer.className = 'settings-drawer';

            drawer.innerHTML = `
                <div class="drawer-header">
                    <span class="drawer-title">Asset Library</span>
                    <button class="drawer-close" id="asset-close-btn">×</button>
                </div>
                <div class="drawer-body">
                    </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(drawer);

            const closeDrawer = () => {
                drawer.classList.remove('open');
                overlay.classList.remove('active');
            };

            overlay.addEventListener('click', closeDrawer);
            document.getElementById('asset-close-btn').addEventListener('click', closeDrawer);
        }
        return { drawer, overlay };
    },

    open: function () {
        window.closeAllDrawers();
        const { drawer, overlay } = this._initDrawer();
        const drawerBody = drawer.querySelector('.drawer-body');

        // Build the gallery before sliding out
        this.renderGallery(drawerBody);

        drawer.classList.add('open');
        overlay.classList.add('active');
    },

    toggle: function () {
        const drawer = document.getElementById('assetDrawer');
        if (drawer && drawer.classList.contains('open')) {
            const overlay = document.getElementById('assetOverlay');
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        } else {
            this.open();
        }
    },

    renderGallery: function (container) {
        window.ConGenState.assets = window.ConGenState.assets || {};
        const assets = window.ConGenState.assets;

        // Self-healing sweep: Prune any keys lacking valid base64 image data
        Object.keys(assets).forEach(key => {
            const imgData = assets[key];
            if (!imgData || typeof imgData !== 'string' || !imgData.startsWith('data:image')) {
                delete assets[key];
            }
        });

        const assetKeys = Object.keys(assets);

        // 1. Add a Global Upload Input
        let html = `
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <label style="font-weight:bold; color:var(--text-secondary); font-size:0.75rem;">UPLOAD NEW ASSET</label>
                    <button onclick="window.clearAssetLibrary()" style="background: transparent; color: #ef4444; border: 1px solid #fca5a5; padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; cursor: pointer; font-weight: bold; transition: all 0.2s;" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Nuke Library</button>
                </div>
                <input type="file" accept="image/*" id="global-asset-upload" style="width: 100%; padding: 10px; border: 1px dashed var(--border-color); border-radius: 4px; background: var(--bg); font-size: 0.8rem;">
            </div>
        `;

        // 2. Render the Grid or Empty State
        if (assetKeys.length === 0) {
            html += `<div style="text-align:center; padding: 40px 20px; color:var(--text-secondary); border: 2px dashed var(--border-color); border-radius: 8px; font-size: 0.9rem;">Your library is empty. Upload an image above to get started.</div>`;
        } else {
            html += `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">`;
            assetKeys.forEach(id => {
                html += `
                    <div class="asset-card" style="position:relative; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
                        <img src="${assets[id]}" style="width: 100%; height: 90px; object-fit: cover; display: block; background: #f0f0f0;">
                        <div style="padding: 6px; font-size: 0.65rem; color: var(--text-secondary); word-break: break-all; text-align: center; background: #fafafa; border-top: 1px solid var(--border-color);">
                            ${id.substring(0, 12)}...
                        </div>
                        <button class="btn-delete-asset" data-id="${id}" style="position: absolute; top: 4px; right: 4px; background: rgba(231, 76, 60, 0.9); color: white; border: none; border-radius: 4px; width: 22px; height: 22px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" title="Delete Asset">×</button>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;

        // 3. Bind Global Upload Event
        const uploadInput = container.querySelector('#global-asset-upload');
        if (uploadInput && window.ConGenAPI && window.ConGenAPI.processImageFile) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                window.ConGenAPI.processImageFile(file).then(() => {
                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    this.renderGallery(container);
                });
            });
        } else if (uploadInput) {
            uploadInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (window.ConGenAPI && window.ConGenAPI.registerAsset) {
                        window.ConGenAPI.registerAsset(event.target.result);
                        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                        this.renderGallery(container); // Instantly refresh the UI
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        // 4. Bind Delete Event (Memory Management via Event Delegation!)
        if (!container._hasBoundDelete) {
            container._hasBoundDelete = true;
            container.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn-delete-asset');
                if (btn) {
                    const id = btn.dataset.id;
                    // Add a warning so the user knows this breaks active blocks using this ID
                    if (confirm("Are you sure you want to delete this asset? Any blocks or themes currently using it will appear blank.")) {
                        delete window.ConGenState.assets[id];

                        // If this was the output background, clear it
                        if (window.ConGenState.settings.outputTheme?.backgroundImageId === id) {
                            window.ConGenState.settings.outputTheme.backgroundImageId = null;
                            window.applyCurrentThemes();
                        }

                        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                        this.renderGallery(container); // Instantly refresh the UI
                    }
                }
            });
        }
    }
};
// --- Editor Theme Manager UI ---
window.EditorThemeManagerUI = {
    _initDrawer: function () {
        let drawer = document.getElementById('editorThemeDrawer');
        let overlay = document.getElementById('editorThemeOverlay');

        if (!drawer) {
            overlay = document.createElement('div');
            overlay.id = 'editorThemeOverlay';
            overlay.className = 'settings-overlay';

            drawer = document.createElement('div');
            drawer.id = 'editorThemeDrawer';
            drawer.className = 'settings-drawer';

            drawer.innerHTML = `
                <div class="drawer-header">
                    <span class="drawer-title">Editor Theme Editor</span>
                    <button class="drawer-close" id="editor-theme-close-btn">×</button>
                </div>
                <div class="drawer-body">
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(drawer);

            const closeDrawer = () => {
                drawer.classList.remove('open');
                overlay.classList.remove('active');
            };

            overlay.addEventListener('click', closeDrawer);
            document.getElementById('editor-theme-close-btn').addEventListener('click', closeDrawer);
        }
        return { drawer, overlay };
    },

    toggle: function () {
        const drawer = document.getElementById('editorThemeDrawer');
        if (drawer && drawer.classList.contains('open')) {
            const overlay = document.getElementById('editorThemeOverlay');
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        } else {
            this.open();
        }
    },

    open: function () {
        window.closeAllDrawers();
        const { drawer, overlay } = this._initDrawer();

        let theme = { brand: '#4f46e5', bg: '#e2e8f0', fontHeading: 'Manrope', fontBody: 'Inter', fontBase: 16 };
        try {
            const saved = localStorage.getItem('docbuilder_editor_theme');
            if (saved) theme = { ...theme, ...JSON.parse(saved) };
        } catch (e) {}

        const drawerBody = drawer.querySelector('.drawer-body');

        drawerBody.innerHTML = `
            <div class="accordion-container">
                <button class="accordion-header active">Colors</button>
                <div class="accordion-section" style="max-height: 500px;">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Primary Accent Color <button class="btn btn-micro theme-reset-btn" style="float:right; padding: 0 4px;" data-target="brand" data-default="#4338ca" title="Reset to Default">↺</button></label>
                            <input type="color" id="editor-theme-color-brand" value="${theme.brand}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Main Canvas/Surface Color <button class="btn btn-micro theme-reset-btn" style="float:right; padding: 0 4px;" data-target="bg" data-default="#fcf8ff" title="Reset to Default">↺</button></label>
                            <input type="color" id="editor-theme-color-bg" value="${theme.bg}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Typography</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Heading Font Family</label>
                            <select id="editor-theme-font-heading" style="width: 100%; padding: 8px;">
                                <option value="Manrope" ${theme.fontHeading === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                <option value="Inter" ${theme.fontHeading === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Arial" ${theme.fontHeading === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Georgia" ${theme.fontHeading === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Body Font Family</label>
                            <select id="editor-theme-font-body" style="width: 100%; padding: 8px;">
                                <option value="Manrope" ${theme.fontBody === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                <option value="Inter" ${theme.fontBody === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Arial" ${theme.fontBody === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Georgia" ${theme.fontBody === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Base Font Size: <span id="editor-theme-font-size-label">${theme.fontBase}px</span></label>
                            <input type="range" id="editor-theme-font-base" min="12" max="24" value="${theme.fontBase}" style="width: 100%;" />
                        </div>
                    </div>
                </div>
            </div>
        `;

        const bindControl = (id, key, eventType) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(eventType, (e) => {
                    const val = e.target.value;
                    theme[key] = val; // Update local variable
                    localStorage.setItem('docbuilder_editor_theme', JSON.stringify(theme)); // Save to storage

                    window.applyCurrentThemes();

                    if (id === 'editor-theme-font-base') {
                        document.getElementById('editor-theme-font-size-label').textContent = val + 'px';
                    }
                });
            }
        };

        bindControl('editor-theme-color-brand', 'brand', 'input');
        bindControl('editor-theme-color-bg', 'bg', 'input');
        bindControl('editor-theme-font-heading', 'fontHeading', 'change');
        bindControl('editor-theme-font-body', 'fontBody', 'change');
        bindControl('editor-theme-font-base', 'fontBase', 'input');

        drawerBody.querySelectorAll('.theme-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.dataset.target;
                const defaultVal = e.currentTarget.dataset.default;
                
                theme[key] = defaultVal;
                localStorage.setItem('docbuilder_editor_theme', JSON.stringify(theme));

                const inputEl = document.getElementById(`editor-theme-color-${key}`);
                if (inputEl) inputEl.value = defaultVal;

                window.applyCurrentThemes();
            });
        });

        window.bindAccordions(drawerBody.querySelector('.accordion-container'));
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
};

// --- Output Theme Manager UI ---
window.OutputThemeManagerUI = {

    // ── Theme Library Helpers ─────────────────────────────────────────────────
    _getThemes: function () {
        try {
            return JSON.parse(localStorage.getItem('docbuilder_custom_themes') || '[]');
        } catch (e) { return []; }
    },

    _saveThemes: function (themes) {
        localStorage.setItem('docbuilder_custom_themes', JSON.stringify(themes));
    },

    _saveCurrentTheme: function () {
        const name = prompt('Enter a name for this theme:');
        if (!name || !name.trim()) return;
        const themes = this._getThemes();
        const snapshot = { ...window.ConGenState.settings.outputTheme, name: name.trim(), id: Date.now().toString() };
        themes.push(snapshot);
        this._saveThemes(themes);
        this._renderSavedThemes();
    },

    _renderSavedThemes: function () {
        const container = document.getElementById('out-theme-saved-list');
        if (!container) return;
        const themes = this._getThemes();
        if (themes.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-secondary); border:2px dashed var(--border-color); border-radius:8px; font-size:0.85rem;">No saved themes yet.<br>Customize your theme and click <strong>Save Current Theme</strong>.</div>`;
            return;
        }
        let html = '';
        themes.forEach((t, idx) => {
            html += `
                <div style="display:flex; align-items:center; gap:8px; background:#fff; border:1px solid var(--border-color); border-radius:6px; padding:10px 12px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                    <button class="out-theme-load-btn" data-idx="${idx}" style="flex:1; text-align:left; background:transparent; border:none; cursor:pointer; font-size:0.9rem; font-weight:600; color:var(--text-primary); padding:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Load '${t.name}'">${t.name}</button>
                    <button class="out-theme-delete-btn" data-idx="${idx}" style="background:rgba(231,76,60,0.1); border:1px solid rgba(231,76,60,0.3); color:#e74c3c; cursor:pointer; border-radius:4px; width:24px; height:24px; font-size:0.9rem; flex-shrink:0; display:flex; align-items:center; justify-content:center;" title="Delete theme">×</button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.out-theme-load-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                const t = this._getThemes()[idx];
                if (!t) return;
                const { name: _n, id: _id, ...themeData } = t;
                window.ConGenState.settings.outputTheme = { ...window.ConGenState.settings.outputTheme, ...themeData };
                window.applyCurrentThemes();
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                this.open(); // Re-render drawer to sync controls
            });
        });

        container.querySelectorAll('.out-theme-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx);
                const themes = this._getThemes();
                themes.splice(idx, 1);
                this._saveThemes(themes);
                this._renderSavedThemes();
            });
        });
    },

    _exportThemes: function () {
        const themes = this._getThemes();
        const blob = new Blob([JSON.stringify(themes, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'docbuilder_themes.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    },

    _importThemes: function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const imported = JSON.parse(ev.target.result);
                    if (!Array.isArray(imported)) { alert('Invalid file: expected a JSON array of themes.'); return; }
                    const existing = this._getThemes();
                    const merged = [...existing, ...imported];
                    this._saveThemes(merged);
                    this._renderSavedThemes();
                } catch (err) {
                    alert('Could not parse JSON file: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    _downloadAISchema: function () {
        const schema = {
            description: "Schema for a DocBuilder outputTheme object. Pass this to an LLM to generate theme presets.",
            fields: {
                brand:      { type: 'string', format: 'hex color', description: 'Primary accent color (e.g. headers, links, borders).' },
                secondary:  { type: 'string', format: 'hex color', description: 'Secondary accent / text color.' },
                bg:         { type: 'string', format: 'hex color', description: 'Main slide/document background color.' },
                fontHeading:{ type: 'string', description: 'CSS font-family for heading elements.' },
                fontBody:   { type: 'string', description: 'CSS font-family for body text.' },
                fontBase:   { type: 'number', description: 'Base font size in pixels (12–24).' },
                layoutMode: { type: 'string', enum: ['document', 'presentation'], description: 'Output layout mode.' },
                navPosition:{ type: 'string', enum: ['left', 'bottom'], description: 'Navigation bar position in document mode (left sidebar or bottom floating dock).' },
                glassUI:    { type: 'boolean', description: 'Enable frosted-glass effect (requires background image).' },
                h1Color:    { type: 'string', format: 'hex color' },
                h1Font:     { type: 'string' },
                h2Color:    { type: 'string', format: 'hex color' },
                h2Font:     { type: 'string' },
                h3Color:    { type: 'string', format: 'hex color' },
                h3Font:     { type: 'string' },
                h4Color:    { type: 'string', format: 'hex color' },
                h4Font:     { type: 'string' }
            },
            example: {
                brand: '#2a14b4', secondary: '#111111', bg: '#ffffff',
                fontHeading: 'Manrope', fontBody: 'Inter', fontBase: 16,
                layoutMode: 'document',
            navPosition: 'left', glassUI: false,
                h1Color: '#111111', h1Font: 'Arial',
                h2Color: '#333333', h2Font: 'Arial',
                h3Color: '#1e293b', h3Font: 'Arial',
                h4Color: '#1e293b', h4Font: 'Arial'
            },
            instructions: "Return a JSON array of objects matching this schema. Each object should also have a 'name' field (string) for the theme label."
        };
        const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'docbuilder_theme_schema.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    },

    // ── Drawer Initializer ────────────────────────────────────────────────────
    _initDrawer: function () {
        let drawer = document.getElementById('outputThemeDrawer');
        let overlay = document.getElementById('outputThemeOverlay');

        if (!drawer) {
            overlay = document.createElement('div');
            overlay.id = 'outputThemeOverlay';
            overlay.className = 'settings-overlay';

            drawer = document.createElement('div');
            drawer.id = 'outputThemeDrawer';
            drawer.className = 'settings-drawer';

            drawer.innerHTML = `
                <div class="drawer-header">
                    <span class="drawer-title">Document Design</span>
                    <button class="drawer-close" id="output-theme-close-btn">×</button>
                </div>
                <div class="drawer-body">
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(drawer);

            const closeDrawer = () => {
                drawer.classList.remove('open');
                overlay.classList.remove('active');
            };

            overlay.addEventListener('click', closeDrawer);
            document.getElementById('output-theme-close-btn').addEventListener('click', closeDrawer);
        }
        return { drawer, overlay };
    },

    toggle: function () {
        const drawer = document.getElementById('outputThemeDrawer');
        if (drawer && drawer.classList.contains('open')) {
            const overlay = document.getElementById('outputThemeOverlay');
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        } else {
            this.open();
        }
    },

    open: function () {
        window.closeAllDrawers();
        const { drawer, overlay } = this._initDrawer();

        window.ConGenState = window.ConGenState || {};
        window.ConGenState.settings = window.ConGenState.settings || {};
        
        const defaultOutputTheme = {
            brand: '#2a14b4',
            bg: '#ffffff',
            fontHeading: 'Manrope',
            fontBody: 'Inter',
            fontBase: 16,
            backgroundImageId: '',
            backgroundImageName: '',
            bgSize: 'cover',
            bgPosition: 'center',
            secondary: '#111111',
            layoutMode: 'document',
            navPosition: 'left',
            glassUI: false,
            globalLogoPos: 'top-left',
            h1Color: '#111111', h1Font: 'Arial',
            h2Color: '#333333', h2Font: 'Arial',
            h3Color: '#1e293b', h3Font: 'Arial',
            h4Color: '#1e293b', h4Font: 'Arial'
        };

        // Deep merge to ensure no properties are left undefined
        window.ConGenState.settings.outputTheme = { ...defaultOutputTheme, ...(window.ConGenState.settings.outputTheme || {}) };
        const theme = window.ConGenState.settings.outputTheme;
        const drawerBody = drawer.querySelector('.drawer-body');
        const currentCss = window.ConGenState.settings.css || '';

        drawerBody.innerHTML = `
            <div class="accordion-container">
                <button class="accordion-header active">Layout &amp; Navigation</button>
                <div class="accordion-section" style="max-height: 500px;">
                    <div class="theme-group" style="margin-bottom: 16px;">
                        <div class="drawer-group">
                            <label style="margin-bottom: 5px;">Document Layout Mode</label>
                            <select id="out-theme-layout-mode" style="width: 100%; padding: 8px;">
                                <option value="document" ${theme.layoutMode === 'document' ? 'selected' : ''}>Standard Document</option>
                                <option value="presentation" ${theme.layoutMode === 'presentation' ? 'selected' : ''}>16:9 Presentation Deck</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="margin-top: 14px;">
                            <label style="margin-bottom: 5px;">Navigation Bar Position</label>
                            <select id="out-theme-nav-position" style="width: 100%; padding: 8px;">
                                <option value="left" ${(theme.navPosition || 'left') === 'left' ? 'selected' : ''}>Left Sidebar (Slide-out Menu)</option>
                                <option value="bottom" ${theme.navPosition === 'bottom' ? 'selected' : ''}>Bottom Navigation Bar (Floating Dock)</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="display: flex; align-items: center; gap: 10px; margin-top: 16px; padding: 10px 12px; background: var(--bg); border-radius: 6px; border: 1px solid var(--border-color);">
                            <input type="checkbox" id="out-theme-glass-ui" ${theme.glassUI ? 'checked' : ''} style="width: auto; margin: 0; cursor: pointer;"/>
                            <label for="out-theme-glass-ui" style="margin: 0; font-weight: 600; font-size: 0.82rem; cursor: pointer;">Enable Glass UI (Frosted Cards &amp; Dock)</label>
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Branding &amp; Logo</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group">
                            <label>Global Logo Position</label>
                            <select id="out-theme-logo-pos" style="width: 100%; padding: 8px;">
                                <option value="top-left"     ${theme.globalLogoPos === 'top-left'     ? 'selected' : ''}>Top Left</option>
                                <option value="top-center"   ${theme.globalLogoPos === 'top-center'   ? 'selected' : ''}>Top Center</option>
                                <option value="top-right"    ${theme.globalLogoPos === 'top-right'    ? 'selected' : ''}>Top Right</option>
                                <option value="bottom-left"  ${theme.globalLogoPos === 'bottom-left'  ? 'selected' : ''}>Bottom Left</option>
                                <option value="bottom-center" ${theme.globalLogoPos === 'bottom-center' ? 'selected' : ''}>Bottom Center</option>
                                <option value="bottom-right" ${theme.globalLogoPos === 'bottom-right' ? 'selected' : ''}>Bottom Right</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="padding-top: 15px;">
                            <label style="display: flex; justify-content: space-between; align-items: center;">
                                Upload Brand Logo
                                ${window.ConGenState.settings.logoData ? '<button type="button" id="out-logo-clear-btn" class="btn btn-micro btn-danger" style="text-transform:none; font-weight:bold;">Clear Logo</button>' : ''}
                            </label>
                            <input type="file" accept="image/*" onchange="window.encodeLogo(this)" style="padding: 10px; background: var(--bg); border-radius: 4px; font-size: 0.8rem; width: 100%; box-sizing: border-box;">
                            <span id="logoFilenameDisplay" style="font-size: 0.75rem; color: var(--text-secondary); font-weight: bold; display: block; margin-top: 5px;">${window.ConGenState.settings.logoData ? 'Loaded: [Active Brand Logo]' : ''}</span>
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Colors &amp; Surface</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Primary Brand / Accent Color <button class="btn btn-micro theme-reset-btn" style="float:right; padding: 0 4px;" data-target="brand" data-default="#4338ca" title="Reset to Default">↺</button></label>
                            <input type="color" id="out-theme-color-brand" value="${theme.brand}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Secondary Accent Color <button class="btn btn-micro theme-reset-btn" style="float:right; padding: 0 4px;" data-target="secondary" data-default="#111111" title="Reset to Default">↺</button></label>
                            <input type="color" id="out-theme-color-secondary" value="${theme.secondary || '#111111'}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px;">Page Background Color <button class="btn btn-micro theme-reset-btn" style="float:right; padding: 0 4px;" data-target="bg" data-default="#fcf8ff" title="Reset to Default">↺</button></label>
                            <input type="color" id="out-theme-color-bg" value="${theme.bg}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Typography &amp; Headers</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px; padding-top: 10px;">
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Base Font Size: <span id="out-theme-font-size-label">${theme.fontBase}px</span></label>
                            <input type="range" id="out-theme-font-base" min="12" max="24" value="${theme.fontBase}" style="width: 100%;" />
                        </div>
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Body Font Family</label>
                            <select id="out-theme-font-body" style="width: 100%; padding: 8px;">
                                <option value="Inter" ${theme.fontBody === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Manrope" ${theme.fontBody === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                <option value="Arial" ${theme.fontBody === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Verdana" ${theme.fontBody === 'Verdana' ? 'selected' : ''}>Verdana</option>
                                <option value="Trebuchet MS" ${theme.fontBody === 'Trebuchet MS' ? 'selected' : ''}>Trebuchet MS</option>
                                <option value="Georgia" ${theme.fontBody === 'Georgia' ? 'selected' : ''}>Georgia</option>
                                <option value="Times New Roman" ${theme.fontBody === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                                <option value="Courier New" ${theme.fontBody === 'Courier New' ? 'selected' : ''}>Courier New</option>
                                <option value="Impact" ${theme.fontBody === 'Impact' ? 'selected' : ''}>Impact</option>
                            </select>
                        </div>
                        
                        ${[1, 2, 3, 4].map(num => `
                        <details style="margin-bottom: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: #fafafa;">
                            <summary style="padding: 10px; font-weight: bold; font-size: 0.8rem; cursor: pointer; outline: none; color: var(--text-primary);">H${num} Settings</summary>
                            <div style="padding: 10px; border-top: 1px solid var(--border-color); background: #fff;">
                                <label style="font-size: 0.7rem; color: var(--text-secondary);">Font Family</label>
                                <select id="out-theme-h${num}-font" style="width: 100%; padding: 6px; margin-bottom: 10px; font-size: 0.85rem;">
                                    <option value="Manrope" ${theme[`h${num}Font`] === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                    <option value="Inter" ${theme[`h${num}Font`] === 'Inter' ? 'selected' : ''}>Inter</option>
                                    <option value="Arial" ${theme[`h${num}Font`] === 'Arial' ? 'selected' : ''}>Arial</option>
                                    <option value="Verdana" ${theme[`h${num}Font`] === 'Verdana' ? 'selected' : ''}>Verdana</option>
                                    <option value="Trebuchet MS" ${theme[`h${num}Font`] === 'Trebuchet MS' ? 'selected' : ''}>Trebuchet MS</option>
                                    <option value="Georgia" ${theme[`h${num}Font`] === 'Georgia' ? 'selected' : ''}>Georgia</option>
                                    <option value="Times New Roman" ${theme[`h${num}Font`] === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                                    <option value="Courier New" ${theme[`h${num}Font`] === 'Courier New' ? 'selected' : ''}>Courier New</option>
                                    <option value="Impact" ${theme[`h${num}Font`] === 'Impact' ? 'selected' : ''}>Impact</option>
                                </select>
                                <label style="font-size: 0.7rem; color: var(--text-secondary);">Color</label>
                                <input type="color" id="out-theme-h${num}-color" value="${theme[`h${num}Color`]}" style="width: 100%; height: 36px; padding: 2px; border: 1px solid #ccc; border-radius: 4px;">
                            </div>
                        </details>
                        `).join('')}
                    </div>
                </div>

                <button class="accordion-header">Background Wallpaper</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group">

                            ${theme.backgroundImageId ? `
                                <div style="margin-bottom: 20px; padding: 12px; border: 2px solid var(--brand, #635bff); border-radius: 8px; background: #f4f6ff; display: flex; align-items: center; gap: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                                    <img src="${window.ConGenAPI && window.ConGenAPI.getAsset ? window.ConGenAPI.getAsset(theme.backgroundImageId) : ''}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px; border: 1px solid rgba(0,0,0,0.1); flex-shrink: 0;">
                                    <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 0.7rem; font-weight: bold; color: var(--brand, #635bff); text-transform: uppercase; margin-bottom: 2px;">Active Background</div>
                                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85rem; color: #333;" title="${theme.backgroundImageName}">
                                            ${theme.backgroundImageName || 'Library Asset'}
                                        </div>
                                    </div>
                                    <button id="out-bg-remove-btn" style="background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.2); color: #e74c3c; cursor: pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; transition: all 0.2s;" title="Remove Background" onmouseover="this.style.background='rgba(231, 76, 60, 0.2)'" onmouseout="this.style.background='rgba(231, 76, 60, 0.1)'">×</button>
                                </div>
                            ` : ''}

                            <label style="display: block; margin-bottom: 5px; font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); text-transform: uppercase;">Upload New Background</label>
                            <input type="file" accept="image/*" class="out-bg-upload" style="width: 100%; font-size: 0.8rem; padding: 8px; border: 1px dashed var(--border-color); border-radius: 4px; background: var(--bg);"/>

                            <div style="margin-top: 20px; border-top: 1px solid var(--border-color); padding-top: 15px;">
                                <label style="display: block; margin-bottom: 10px; font-size: 0.75rem; font-weight: bold; color: var(--text-secondary); text-transform: uppercase;">Or Select From Library</label>
                                <div id="out-theme-asset-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 120px; overflow-y: auto; padding-right: 5px;"></div>
                            </div>

                            <div style="margin-top: 20px; display: flex; gap: 10px; background: #fafafa; padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);">
                                <div style="flex: 1;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 0.7rem; font-weight: bold; color: var(--text-secondary); text-transform: uppercase;">Fit</label>
                                    <select id="out-theme-bg-size" style="width: 100%; padding: 6px; font-size: 0.85rem; border: 1px solid #ccc; border-radius: 4px;">
                                        <option value="cover" ${theme.bgSize === 'cover' ? 'selected' : ''}>Cover</option>
                                        <option value="contain" ${theme.bgSize === 'contain' ? 'selected' : ''}>Contain</option>
                                        <option value="100% 100%" ${theme.bgSize === '100% 100%' ? 'selected' : ''}>Stretch (100%)</option>
                                    </select>
                                </div>
                                <div style="flex: 1;">
                                    <label style="display: block; margin-bottom: 5px; font-size: 0.7rem; font-weight: bold; color: var(--text-secondary); text-transform: uppercase;">Position</label>
                                    <select id="out-theme-bg-position" style="width: 100%; padding: 6px; font-size: 0.85rem; border: 1px solid #ccc; border-radius: 4px;">
                                        <option value="center" ${theme.bgPosition === 'center' ? 'selected' : ''}>Center</option>
                                        <option value="top left" ${theme.bgPosition === 'top left' ? 'selected' : ''}>Top Left</option>
                                        <option value="top right" ${theme.bgPosition === 'top right' ? 'selected' : ''}>Top Right</option>
                                        <option value="bottom left" ${theme.bgPosition === 'bottom left' ? 'selected' : ''}>Bottom Left</option>
                                        <option value="bottom right" ${theme.bgPosition === 'bottom right' ? 'selected' : ''}>Bottom Right</option>
                                        <option value="left" ${theme.bgPosition === 'left' ? 'selected' : ''}>Left</option>
                                        <option value="right" ${theme.bgPosition === 'right' ? 'selected' : ''}>Right</option>
                                    </select>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <button class="accordion-header">Advanced Custom CSS</button>
                <div class="accordion-section">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group">
                            <label style="display: flex; justify-content: space-between; align-items: center;">
                                Custom Stylesheet
                                <button type="button" class="btn btn-micro btn-danger" onclick="window.clearCustomCSS()"
                                    style="text-transform: none; font-weight: bold;">Clear CSS</button>
                            </label>
                            <div style="margin-top: 8px;">
                                <input type="file" id="cssFileInput" accept=".css" onchange="window.encodeCSS(this)"
                                    style="padding: 10px; background: var(--bg); border-radius: 4px; font-size: 0.8rem; width: 100%; box-sizing: border-box;">
                                <input type="hidden" id="cssFilename">
                                <span id="cssFilenameDisplay"
                                    style="font-size: 0.75rem; color: var(--text-secondary); font-weight: bold; display: block; margin-top: 5px;"></span>
                            </div>
                            <textarea id="liveCssEditor" placeholder="/* Enter custom CSS for exported documents... */" style="margin-top: 8px; min-height: 150px; font-family: monospace; font-size: 0.82rem;"></textarea>
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Saved Theme Presets</button>
                <div class="accordion-section">
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
                        <button id="out-theme-save-btn" class="btn btn-primary" style="flex: 1; min-width: 140px; font-weight: bold;">💾 Save Current Theme</button>
                        <button id="out-theme-import-btn" class="btn btn-secondary" style="flex: 1; min-width: 80px;">📥 Import</button>
                        <button id="out-theme-export-btn" class="btn btn-secondary" style="flex: 1; min-width: 80px;">📤 Export</button>
                        <button id="out-theme-schema-btn" class="btn btn-secondary" style="flex: 1; min-width: 100px;">🤖 AI Schema</button>
                    </div>
                    <div id="out-theme-saved-list" style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;"></div>
                </div>
            </div>
        `;

        // Sync live CSS editor value cleanly
        const liveCssEl = drawerBody.querySelector('#liveCssEditor');
        if (liveCssEl) {
            liveCssEl.value = currentCss;
            liveCssEl.addEventListener('input', (e) => {
                window.ConGenState.settings.css = e.target.value;
                window.applyCurrentThemes();
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                if (typeof window.updatePreview === 'function') window.updatePreview();
            });
        }

        const clearLogoBtn = drawerBody.querySelector('#out-logo-clear-btn');
        if (clearLogoBtn) {
            clearLogoBtn.addEventListener('click', () => {
                window.ConGenState.settings.logoData = '';
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                if (typeof window.updatePreview === 'function') window.updatePreview();
                this.open();
            });
        }

        // --- THEME LIBRARY UTILITY BUTTONS ---
        const saveBtn = document.getElementById('out-theme-save-btn');
        if (saveBtn) saveBtn.addEventListener('click', () => this._saveCurrentTheme());

        const importBtn = document.getElementById('out-theme-import-btn');
        if (importBtn) importBtn.addEventListener('click', () => this._importThemes());

        const exportBtn = document.getElementById('out-theme-export-btn');
        if (exportBtn) exportBtn.addEventListener('click', () => this._exportThemes());

        const schemaBtn = document.getElementById('out-theme-schema-btn');
        if (schemaBtn) schemaBtn.addEventListener('click', () => this._downloadAISchema());

        const bindControl = (id, key, cssVar, eventType, unit = '') => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(eventType, (e) => {
                    const val = e.target.value;
                    window.ConGenState.settings.outputTheme[key] = val;
                    if (cssVar) { document.documentElement.style.setProperty(cssVar, val + unit); }

                    if (id === 'out-theme-font-base') {
                        document.getElementById('out-theme-font-size-label').textContent = val + 'px';
                    }

                    if (window.HistoryManager) window.HistoryManager.pushStateDebounced('Updated Document Design');
                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    if (typeof window.updatePreview === 'function') window.updatePreview();
                });
            }
        };

        bindControl('out-theme-color-brand', 'brand', '--out-brand', 'input');
        bindControl('out-theme-color-bg', 'bg', '--out-bg', 'input');
        bindControl('out-theme-font-heading', 'fontHeading', '--out-font-heading', 'change');
        bindControl('out-theme-font-body', 'fontBody', '--out-font-body', 'change');
        bindControl('out-theme-font-base', 'fontBase', '--out-font-base', 'input', 'px');
        bindControl('out-theme-color-secondary', 'secondary', '--out-secondary', 'input');
        bindControl('out-theme-layout-mode', 'layoutMode', null, 'change');
        bindControl('out-theme-nav-position', 'navPosition', null, 'change');
        bindControl('out-theme-logo-pos', 'globalLogoPos', null, 'change');
        bindControl('out-theme-bg-size', 'bgSize', '--out-bg-size', 'change');
        bindControl('out-theme-bg-position', 'bgPosition', '--out-bg-position', 'change');
        [1, 2, 3, 4].forEach(num => {
            bindControl(`out-theme-h${num}-color`, `h${num}Color`, `--h${num}-color`, 'input');
            bindControl(`out-theme-h${num}-font`, `h${num}Font`, `--h${num}-font`, 'change');
        });

        const glassToggle = document.getElementById('out-theme-glass-ui');
        if (glassToggle) {
            glassToggle.addEventListener('change', (e) => {
                window.ConGenState.settings.outputTheme.glassUI = e.target.checked;
                window.applyCurrentThemes();
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                if (typeof window.updatePreview === 'function') window.updatePreview();
            });
        }

        const fileInput = drawerBody.querySelector('.out-bg-upload');
        if (fileInput && window.ConGenAPI && window.ConGenAPI.processImageFile) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                window.ConGenAPI.processImageFile(file, 1920).then(({ assetId }) => {
                    window.ConGenState.settings.outputTheme.backgroundImageId = assetId;
                    window.ConGenState.settings.outputTheme.backgroundImageName = file.name;
                    window.applyCurrentThemes();
                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    if (typeof window.updatePreview === 'function') window.updatePreview();
                    this.open();
                });
            });
        } else if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target.result;
                    if (window.ConGenAPI && window.ConGenAPI.registerAsset) {
                        const assetId = window.ConGenAPI.registerAsset(base64);
                        window.ConGenState.settings.outputTheme.backgroundImageId = assetId;
                        window.ConGenState.settings.outputTheme.backgroundImageName = file.name;
                        window.applyCurrentThemes();
                        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                        this.open();
                    }
                };
                reader.readAsDataURL(file);
            });
        }

        const removeBtn = drawerBody.querySelector('#out-bg-remove-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                window.ConGenState.settings.outputTheme.backgroundImageId = '';
                window.ConGenState.settings.outputTheme.backgroundImageName = '';
                window.applyCurrentThemes();
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                if (typeof window.updatePreview === 'function') window.updatePreview();
                this.open();
            });
        }

        const assetGrid = drawerBody.querySelector('#out-theme-asset-grid');
        if (assetGrid) {
            const assets = window.ConGenState?.assets || {};
            const assetKeys = Object.keys(assets);
            if (assetKeys.length === 0) {
                assetGrid.innerHTML = '<div style="grid-column: span 4; font-size: 0.75rem; color: #999;">Library is empty.</div>';
            } else {
                let gridHtml = '';
                assetKeys.forEach(id => {
                    const isSelected = window.ConGenState.settings.outputTheme.backgroundImageId === id;
                    const borderStyle = isSelected ? 'border: 2px solid var(--brand);' : 'border: 1px solid var(--border-color);';
                    gridHtml += `<img src="${assets[id]}" class="mini-asset-thumb" data-id="${id}" style="width: 100%; height: 45px; object-fit: cover; border-radius: 4px; cursor: pointer; ${borderStyle}" title="Select Image">`;
                });
                assetGrid.innerHTML = gridHtml;

                assetGrid.querySelectorAll('.mini-asset-thumb').forEach(thumb => {
                    thumb.addEventListener('click', (e) => {
                        window.ConGenState.settings.outputTheme.backgroundImageId = e.target.dataset.id;
                        window.ConGenState.settings.outputTheme.backgroundImageName = 'Library Asset';
                        window.applyCurrentThemes();
                        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                        if (typeof window.updatePreview === 'function') window.updatePreview();
                        this.open();
                    });
                });
            }
        }

        drawerBody.querySelectorAll('.theme-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.dataset.target;
                const defaultVal = e.currentTarget.dataset.default;
                window.ConGenState.settings.outputTheme[key] = defaultVal;

                const inputEl = document.getElementById(`out-theme-color-${key}`);
                if (inputEl) {
                    inputEl.value = defaultVal;
                    document.documentElement.style.setProperty(`--out-${key}`, defaultVal);
                }

                window.applyCurrentThemes();
                if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                if (typeof window.updatePreview === 'function') window.updatePreview();
            });
        });

        window.bindAccordions(drawerBody.querySelector('.accordion-container'));
        this._renderSavedThemes();
        drawer.classList.add('open');
        overlay.classList.add('active');
    }
};

// --- Email Template Manager UI ---
window.EmailTemplateManagerUI = {
    _initDrawer: function () {
        let drawer = document.getElementById('emailTemplateDrawer');
        let overlay = document.getElementById('emailTemplateOverlay');

        if (!drawer) {
            overlay = document.createElement('div');
            overlay.id = 'emailTemplateOverlay';
            overlay.className = 'settings-overlay';

            drawer = document.createElement('div');
            drawer.id = 'emailTemplateDrawer';
            drawer.className = 'settings-drawer';

            drawer.innerHTML = `
                <div class="drawer-header">
                    <span class="drawer-title">Email Templates</span>
                    <button class="drawer-close" id="email-template-close-btn">×</button>
                </div>
                <div class="drawer-body" id="email-template-drawer-body"></div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(drawer);

            overlay.addEventListener('click', () => window.closeAllDrawers());
            document.getElementById('email-template-close-btn').addEventListener('click', () => window.closeAllDrawers());
        }
        return { drawer, overlay };
    },

    // ── helpers ──────────────────────────────────────────────────────────────
    _templates: function () {
        if (!Array.isArray(window.ConGenState?.settings?.emailTemplates)) {
            window.ConGenState.settings.emailTemplates = [];
        }
        return window.ConGenState.settings.emailTemplates;
    },

    _generateId: function (title) {
        const base = (title || 'template')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 40);
        const suffix = Date.now().toString(36);
        return base ? `${base}-${suffix}` : `template-${suffix}`;
    },

    _triggerDownload: function (filename, mimeType, content) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    },

    // ── public API ───────────────────────────────────────────────────────────
    toggle: function () {
        const drawer = document.getElementById('emailTemplateDrawer');
        if (drawer && drawer.classList.contains('open')) {
            const overlay = document.getElementById('emailTemplateOverlay');
            drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
        } else {
            this.open();
        }
    },

    open: function () {
        window.closeAllDrawers();
        const { drawer, overlay } = this._initDrawer();
        this._renderRoster();
        drawer.classList.add('open');
        overlay.classList.add('active');
    },

    // ── ROSTER VIEW ──────────────────────────────────────────────────────────
    _renderRoster: function () {
        const body = document.getElementById('email-template-drawer-body');
        if (!body) return;
        const templates = this._templates();

        // Top action bar
        let html = `
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:18px;">
                <button class="btn btn-primary" id="etm-btn-add" style="flex:1; min-width:120px;">
                    <span style="margin-right:4px;">+</span> New Template
                </button>
                <button class="btn btn-secondary" id="etm-btn-import" style="flex:1; min-width:100px;">📥 Import JSON</button>
                <button class="btn btn-secondary" id="etm-btn-export" style="flex:1; min-width:100px;">📤 Export JSON</button>
                <button class="btn btn-secondary" id="etm-btn-schema" style="flex:1; min-width:130px;">🤖 AI Schema</button>
            </div>
        `;

        // Template list
        if (templates.length === 0) {
            html += `<div style="text-align:center; padding:40px 20px; color:var(--text-secondary); border:2px dashed var(--border-color); border-radius:8px; font-size:0.9rem;">No email templates yet.<br><br>Click <strong>+ New Template</strong> to create your first one.</div>`;
        } else {
            html += `<div style="display:flex; flex-direction:column; gap:10px;">`;
            templates.forEach((tpl, idx) => {
                html += `
                    <div class="etm-card" data-idx="${idx}" style="background:#fff; border:1px solid var(--border-color); border-radius:8px; padding:14px 16px; box-shadow:0 1px 4px rgba(0,0,0,0.05); transition:box-shadow 0.2s;">
                        <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
                            <div style="flex:1; min-width:0;">
                                <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${this._esc(tpl.title || 'Untitled')}</div>
                                <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">ID: ${this._esc(tpl.id)} &nbsp;|&nbsp; ${this._esc((tpl.subject || '').slice(0, 60))}</div>
                            </div>
                            <div style="display:flex; gap:6px; flex-shrink:0;">
                                <button class="btn btn-secondary etm-btn-edit" data-idx="${idx}" style="padding:5px 12px; font-size:0.8rem;">Edit</button>
                                <button class="btn etm-btn-delete" data-idx="${idx}" style="padding:5px 10px; font-size:0.8rem; background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5;">Delete</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        body.innerHTML = html;

        // Bind top buttons
        document.getElementById('etm-btn-add').addEventListener('click', () => this._renderForm(null));
        document.getElementById('etm-btn-import').addEventListener('click', () => this._importJSON());
        document.getElementById('etm-btn-export').addEventListener('click', () => this._exportJSON());
        document.getElementById('etm-btn-schema').addEventListener('click', () => this._downloadAISchema());

        // Bind card buttons
        body.querySelectorAll('.etm-btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx, 10);
                this._renderForm(idx);
            });
        });
        body.querySelectorAll('.etm-btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.idx, 10);
                if (confirm(`Delete "${this._templates()[idx]?.title}"? This cannot be undone.`)) {
                    this._templates().splice(idx, 1);
                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    this._renderRoster();
                }
            });
        });
    },

    // ── FORM VIEW ────────────────────────────────────────────────────────────
    _renderForm: function (editIdx) {
        const body = document.getElementById('email-template-drawer-body');
        if (!body) return;
        const templates = this._templates();
        const isNew = editIdx === null;
        const tpl = isNew ? { id: '', title: '', to: '', subject: '', body: '' } : { ...templates[editIdx] };

        body.innerHTML = `
            <div style="margin-bottom:14px;">
                <button class="btn btn-secondary" id="etm-btn-back" style="padding:6px 12px; font-size:0.85rem;">← Back to List</button>
            </div>
            <div style="background:#fff; border:1px solid var(--border-color); border-radius:10px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
                <h3 style="margin:0 0 18px; font-size:1rem; color:var(--text-primary);">${isNew ? 'New Email Template' : 'Edit Template'}</h3>

                <div class="drawer-group" style="margin-bottom:14px;">
                    <label style="display:block; margin-bottom:5px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Title <span style="color:#e74c3c;">*</span></label>
                    <input type="text" id="etm-input-title" value="${this._esc(tpl.title)}" placeholder="e.g. Welcome Email" style="width:100%; padding:9px 12px; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem; box-sizing:border-box;">
                </div>

                <div class="drawer-group" style="margin-bottom:14px;">
                    <label style="display:block; margin-bottom:5px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Template ID <span style="font-weight:400; font-style:italic; text-transform:none;">(URL-safe, auto-generated)</span></label>
                    <input type="text" id="etm-input-id" value="${this._esc(tpl.id)}" placeholder="auto" style="width:100%; padding:9px 12px; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem; font-family:monospace; box-sizing:border-box;">
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:4px;">Must be unique. Leave blank to auto-generate from Title on save.</div>
                </div>

                <div class="drawer-group" style="margin-bottom:14px;">
                    <label style="display:block; margin-bottom:5px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">To <span style="font-weight:400; font-style:italic; text-transform:none;">(Recipient)</span></label>
                    <input type="text" id="etm-input-to" value="${this._esc(tpl.to)}" placeholder="e.g. recipient@example.com" style="width:100%; padding:9px 12px; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem; box-sizing:border-box;">
                    <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:4px;">Optional. Pre-fills the To address in the generated mailto: link.</div>
                </div>

                <div class="drawer-group" style="margin-bottom:14px;">
                    <label style="display:block; margin-bottom:5px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Subject</label>
                    <input type="text" id="etm-input-subject" value="${this._esc(tpl.subject)}" placeholder="e.g. Welcome to {{company}}" style="width:100%; padding:9px 12px; border:1px solid var(--border-color); border-radius:6px; font-size:0.9rem; box-sizing:border-box;">
                </div>

                <div class="drawer-group" style="margin-bottom:18px;">
                    <label style="display:block; margin-bottom:5px; font-size:0.8rem; font-weight:700; text-transform:uppercase; color:var(--text-secondary);">Body</label>
                    <textarea id="etm-input-body" rows="10" placeholder="Email body content. Use {{placeholder}} syntax for merge fields." style="width:100%; padding:9px 12px; border:1px solid var(--border-color); border-radius:6px; font-size:0.875rem; font-family:monospace; resize:vertical; box-sizing:border-box; line-height:1.5;">${this._esc(tpl.body)}</textarea>
                </div>

                <div id="etm-form-error" style="color:#e74c3c; font-size:0.82rem; margin-bottom:10px; display:none;"></div>

                <div style="display:flex; gap:10px; justify-content:flex-end;">
                    <button class="btn btn-secondary" id="etm-btn-cancel-form">Cancel</button>
                    <button class="btn btn-primary" id="etm-btn-save-form">Save Template</button>
                </div>
            </div>
        `;

        document.getElementById('etm-btn-back').addEventListener('click', () => this._renderRoster());
        document.getElementById('etm-btn-cancel-form').addEventListener('click', () => this._renderRoster());
        document.getElementById('etm-btn-save-form').addEventListener('click', () => this._saveForm(editIdx));
    },

    _saveForm: function (editIdx) {
        const titleEl = document.getElementById('etm-input-title');
        const idEl = document.getElementById('etm-input-id');
        const toEl = document.getElementById('etm-input-to');
        const subjectEl = document.getElementById('etm-input-subject');
        const bodyEl = document.getElementById('etm-input-body');
        const errorEl = document.getElementById('etm-form-error');

        const title = titleEl.value.trim();
        let id = idEl.value.trim();
        const to = toEl.value.trim();
        const subject = subjectEl.value.trim();
        const bodyText = bodyEl.value;

        if (!title) {
            errorEl.textContent = 'Title is required.';
            errorEl.style.display = 'block';
            titleEl.focus();
            return;
        }

        // Auto-generate ID if blank
        if (!id) {
            id = this._generateId(title);
        }

        // Validate ID is URL-safe
        if (!/^[a-z0-9][a-z0-9\-_]*$/i.test(id)) {
            errorEl.textContent = 'ID must be URL-safe (letters, numbers, hyphens, underscores only) and start with a letter or number.';
            errorEl.style.display = 'block';
            idEl.focus();
            return;
        }

        const templates = this._templates();
        const isNew = editIdx === null;

        // Check uniqueness (ignore current record when editing)
        const conflict = templates.find((t, i) => t.id === id && i !== editIdx);
        if (conflict) {
            errorEl.textContent = `ID "${id}" is already used by "${conflict.title}". Please choose a different ID.`;
            errorEl.style.display = 'block';
            idEl.focus();
            return;
        }

        const record = { id, title, to, subject, body: bodyText };

        if (isNew) {
            templates.push(record);
        } else {
            templates[editIdx] = record;
        }

        if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
        this._renderRoster();
    },

    // ── JSON I/O ─────────────────────────────────────────────────────────────
    _importJSON: function () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let incoming = JSON.parse(ev.target.result);
                    // Accept both a bare array and the AI schema wrapper format
                    if (incoming && incoming.emailTemplates && Array.isArray(incoming.emailTemplates)) {
                        incoming = incoming.emailTemplates;
                    }
                    if (!Array.isArray(incoming)) throw new Error('Expected a JSON array of templates.');

                    const templates = this._templates();
                    let added = 0, updated = 0, skipped = 0;

                    incoming.forEach(tpl => {
                        if (!tpl || typeof tpl.id !== 'string' || !tpl.id) { skipped++; return; }
                        const idx = templates.findIndex(t => t.id === tpl.id);
                        const record = {
                            id: tpl.id,
                            title: tpl.title || 'Untitled',
                            to: tpl.to || '',
                            subject: tpl.subject || '',
                            body: tpl.body || ''
                        };
                        if (idx > -1) {
                            templates[idx] = record;
                            updated++;
                        } else {
                            templates.push(record);
                            added++;
                        }
                    });

                    if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
                    this._renderRoster();
                    alert(`Import complete: ${added} added, ${updated} updated, ${skipped} skipped.`);
                } catch (err) {
                    alert('Import failed: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    _exportJSON: function () {
        const templates = this._templates();
        if (templates.length === 0) {
            alert('No templates to export.');
            return;
        }
        const content = JSON.stringify(templates, null, 2);
        const docTitle = (window.ConGenState?.settings?.docTitle || 'docbuilder').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        this._triggerDownload(`${docTitle}_email_templates.json`, 'application/json', content);
    },

    _downloadAISchema: function () {
        const schema = {
            _instructions: [
                "This file defines the schema for ConGen Email Templates.",
                "Each object in 'emailTemplates' must conform to the schema below.",
                "All fields except 'body' are required. 'id' must be URL-safe (letters, numbers, hyphens, underscores).",
                "Use {{placeholder}} syntax inside subject/body for runtime merge fields.",
                "When producing output, return ONLY the 'emailTemplates' array (or the entire object) as valid JSON."
            ],
            _schema: {
                id: "string — URL-safe unique identifier, e.g. 'welcome-new-user'",
                title: "string — Human-readable display name shown in the UI",
                subject: "string — Email subject line, supports {{merge_fields}}",
                body: "string — Full email body content, supports {{merge_fields}} and HTML"
            },
            emailTemplates: [
                {
                    id: "welcome-new-user",
                    title: "Welcome — New User",
                    subject: "Welcome to {{company_name}}, {{first_name}}!",
                    body: "Hi {{first_name}},\n\nWelcome aboard! We're thrilled to have you.\n\nBest,\nThe {{company_name}} Team"
                }
            ]
        };
        this._triggerDownload('congen_email_template_ai_schema.json', 'application/json', JSON.stringify(schema, null, 2));
    },

    // ── util ─────────────────────────────────────────────────────────────────
    _esc: function (str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
};

// --- Global Theme Bootloader ---
window.getContrastColor = function(hexColor) {
    if (!hexColor) return '#111111';
    const hex = String(hexColor).replace('#', '');
    if (hex.length !== 6 && hex.length !== 3) return '#111111';
    const fullHex = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex;
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#111111' : '#ffffff';
};

window.applyCurrentThemes = function () {
    window.ConGenState = window.ConGenState || {};
    window.ConGenState.settings = window.ConGenState.settings || {};
    const outputTheme = window.ConGenState.settings.outputTheme || {};
    const root = document.documentElement;

    // 1. Fetch Global Editor Theme from LocalStorage
    let editorTheme = { brand: '#4f46e5', bg: '#e2e8f0', fontHeading: 'Manrope', fontBody: 'Inter', fontBase: 16 };
    try {
        const saved = localStorage.getItem('docbuilder_editor_theme');
        if (saved) editorTheme = { ...editorTheme, ...JSON.parse(saved) };
    } catch (e) { console.warn("Could not load editor theme", e); }

    // Map Editor Themes
    if (editorTheme.brand) {
        root.style.setProperty('--brand', editorTheme.brand);
        root.style.setProperty('--accent', editorTheme.brand);
        root.style.setProperty('--brand-contrast-text', window.getContrastColor(editorTheme.brand));
    }
    if (editorTheme.bg) {
        root.style.setProperty('--bg', editorTheme.bg);
        root.style.setProperty('--bg-contrast-text', window.getContrastColor(editorTheme.bg));
    }
    if (editorTheme.fontHeading) root.style.setProperty('--font-heading', editorTheme.fontHeading);
    if (editorTheme.fontBody) root.style.setProperty('--font-body', editorTheme.fontBody);
    if (editorTheme.fontBase) root.style.setProperty('--font-base-size', editorTheme.fontBase + 'px');

    // 2. Map Output Themes (For live iframe preview alignment)
    if (outputTheme.brand) root.style.setProperty('--out-brand', outputTheme.brand);
    if (outputTheme.bg) root.style.setProperty('--out-bg', outputTheme.bg);
    if (outputTheme.fontHeading) root.style.setProperty('--out-font-heading', outputTheme.fontHeading);
    if (outputTheme.fontBody) root.style.setProperty('--out-font-body', outputTheme.fontBody);
    if (outputTheme.fontBase) root.style.setProperty('--out-font-base', outputTheme.fontBase + 'px');
    if (outputTheme.secondary) root.style.setProperty('--out-secondary', outputTheme.secondary);
    if (outputTheme.bgSize) root.style.setProperty('--out-bg-size', outputTheme.bgSize);
    if (outputTheme.bgPosition) root.style.setProperty('--out-bg-position', outputTheme.bgPosition);

    [1, 2, 3, 4].forEach(num => {
        if (outputTheme[`h${num}Color`]) root.style.setProperty(`--h${num}-color`, outputTheme[`h${num}Color`]);
        if (outputTheme[`h${num}Font`]) root.style.setProperty(`--h${num}-font`, outputTheme[`h${num}Font`]);
    });

    // 3. Mount Background Image via Asset Library
    if (outputTheme.backgroundImageId && window.ConGenAPI) {
        const bgData = window.ConGenAPI.getAsset(outputTheme.backgroundImageId);
        if (bgData) {
            root.style.setProperty('--out-bg-image', `url(${bgData})`);
        }
    } else {
        root.style.removeProperty('--out-bg-image');
    }

    // 4. Mount Glass UI State
    if (outputTheme.glassUI) {
        root.classList.add('glass-enabled');
    } else {
        root.classList.remove('glass-enabled');
    }

    // 5. NEW: Mount Custom CSS to the Editor Workspace
    let customStyleTag = document.getElementById('congen-custom-css-node');
    if (!customStyleTag) {
        customStyleTag = document.createElement('style');
        customStyleTag.id = 'congen-custom-css-node';
        document.head.appendChild(customStyleTag);
    }
    // Safely inject the user's custom CSS into the live document head
    customStyleTag.innerHTML = window.ConGenState.settings?.css || '';

    // 6. Mount Background Layer
    let bgLayer = document.getElementById('congen-bg-layer-node');
    if (!bgLayer) {
        bgLayer = document.createElement('div');
        bgLayer.id = 'congen-bg-layer-node';
        bgLayer.className = 'congen-bg-layer';
        document.body.insertBefore(bgLayer, document.body.firstChild);
    }
};

// --- Boot Sequence ---
document.addEventListener('DOMContentLoaded', () => {
    // Bind Collapsible Load Panel
    const loadToggle = document.querySelector('.load-panel-toggle');
    const loadContent = document.querySelector('.load-panel-content');
    if (loadToggle && loadContent) {
        loadToggle.addEventListener('click', () => {
            const isHidden = loadContent.style.display === 'none';
            loadContent.style.display = isHidden ? 'block' : 'none';
            loadToggle.style.borderRadius = isHidden ? '8px 8px 0 0' : '8px';
            loadToggle.querySelector('.toggle-icon').style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
        });
    }
    // Legacy UI Cleanup
    const oldAccentColor = document.getElementById('accentColor');
    if (oldAccentColor) {
        const drawerGroup = oldAccentColor.closest('.drawer-group');
        if (drawerGroup) drawerGroup.remove();
    }

    const oldThemeMode = document.getElementById('themeModeSelect');
    if (oldThemeMode) {
        const drawerGroup = oldThemeMode.closest('.drawer-group');
        if (drawerGroup) drawerGroup.remove();
    }

    // 1. Initialize empty state (later this will load from IndexedDB)
    // 1. Themes are applied on boot; workspace state is hydrated by congen.js from IndexedDB
    window.applyCurrentThemes();
    window.applyCurrentThemes();

    // 2. Initial Render
    // Global Keyboard Shortcuts (Undo / Redo / Save)
    document.addEventListener('keydown', (e) => {
        if (!(e.ctrlKey || e.metaKey)) return;
        const key = e.key.toLowerCase();
        if (key === 's') {
            e.preventDefault();
            if (typeof window.saveProgress === 'function') window.saveProgress(false);
            return;
        }
        const activeEl = document.activeElement;
        const isEditable = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable || activeEl.tagName === 'CONGEN-OMNI-BLOCK');
        if (isEditable) return;
        if (key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (window.HistoryManager) window.HistoryManager.undo();
        } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
            e.preventDefault();
            if (window.HistoryManager) window.HistoryManager.redo();
        }
    });

    // 3. Bind Drag and Drop
    window.ConGenUI.initGlobalDropzones();

    // 4. Initialize Global Event Dispatcher (v6.7.1)
    window.ConGenUI.initEventDispatcher();

    // 4. Bind Floating Menu Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const menu = e.target.closest('.floating-properties-menu');
            const preset = e.currentTarget.dataset.preset;
            if (menu.dataset.activePage && menu.dataset.activeRow) {
                window.ConGenAPI.applyRowPreset(menu.dataset.activePage, menu.dataset.activeRow, preset);
                menu.style.display = 'none'; // Close menu after selection
            }
        });
    });

    // Bind Advanced Grid Toggle
    const advancedToggle = document.querySelector('.advanced-grid-toggle');
    const advancedContent = document.querySelector('.advanced-grid-content');
    if (advancedToggle && advancedContent) {
        advancedToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = advancedContent.style.display === 'none';
            advancedContent.style.display = isHidden ? 'block' : 'none';
            advancedToggle.querySelector('.toggle-icon').innerText = isHidden ? '▲' : '▼';
        });
    }

    // Bind Custom Grid Apply Button
    const applyCustomBtn = document.querySelector('.btn-apply-custom-grid');
    const customInput = document.querySelector('.custom-grid-input');
    if (applyCustomBtn && customInput) {
        applyCustomBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = e.target.closest('.floating-properties-menu');
            const inputVal = customInput.value.trim();

            if (menu && menu.dataset.activePage && menu.dataset.activeRow && inputVal !== '') {
                window.ConGenAPI.applyCustomRowLayout(menu.dataset.activePage, menu.dataset.activeRow, inputVal);
                menu.style.display = 'none'; // Close menu after applying
                customInput.value = ''; // Clear input for next time
            }
        });
    }

    // Close floating menu
    document.querySelector('.btn-close-floating')?.addEventListener('click', () => {
        document.querySelector('.floating-properties-menu').style.display = 'none';
    });
    // 5. Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('master-nav-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const layout = document.querySelector('.app-layout');
            const toggleIcon = document.getElementById('sidebarToggle');
            layout.classList.toggle('sidebar-expanded');
            if (layout.classList.contains('sidebar-expanded')) {
                toggleIcon.style.transform = 'rotate(180deg)';
            } else {
                toggleIcon.style.transform = 'rotate(0deg)';
            }
        });
    }

    // Ensure Sidebar Boots Collapsed
    const layout = document.querySelector('.app-layout');
    const toggleIcon = document.getElementById('sidebarToggle');
    if (layout) layout.classList.remove('sidebar-expanded');
    if (toggleIcon) toggleIcon.style.transform = 'rotate(0deg)';

});

// --- Accordion Logic ---
window.bindAccordions = function (container) {
    if (!container) return;
    const headers = container.querySelectorAll('.accordion-header');

    headers.forEach(header => {
        if (header.dataset.bound === "true") return;
        header.dataset.bound = "true";

        header.addEventListener('click', function (e) {
            e.stopPropagation();

            const isActive = this.classList.contains('active');

            headers.forEach(h => {
                h.classList.remove('active');
                const content = h.nextElementSibling;
                if (content && content.classList.contains('accordion-section')) {
                    content.style.maxHeight = null;
                }
            });

            if (!isActive) {
                this.classList.add('active');
                const content = this.nextElementSibling;
                if (content && content.classList.contains('accordion-section')) {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            }
        });
    });
};

// --- Unified Workspace Settings Drawer Controller ---
window.toggleSettingsDrawer = function () {
    const drawer = document.getElementById('settingsDrawer');
    const overlay = document.getElementById('settingsOverlay');
    if (!drawer || !overlay) return;

    if (drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        overlay.classList.remove('active');
        return;
    }

    window.closeAllDrawers();

    let theme = { brand: '#4f46e5', bg: '#e2e8f0', fontHeading: 'Manrope', fontBody: 'Inter', fontBase: 16 };
    try {
        const saved = localStorage.getItem('docbuilder_editor_theme');
        if (saved) theme = { ...theme, ...JSON.parse(saved) };
    } catch (e) {}

    const drawerBody = drawer.querySelector('.drawer-body');
    if (drawerBody) {
        drawerBody.innerHTML = `
            <div class="accordion-container">
                <button class="accordion-header active">Editor Appearance (Theme)</button>
                <div class="accordion-section" style="max-height: 550px;">
                    <div class="theme-group" style="margin-bottom: 20px;">
                        <div class="drawer-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 5px;">Editor Accent Color <button class="btn btn-micro ws-theme-reset-btn" style="float:right; padding: 0 4px;" data-target="brand" data-default="#4338ca" title="Reset to Default">↺</button></label>
                            <input type="color" id="editor-theme-color-brand" value="${theme.brand}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 14px;">
                            <label style="display: block; margin-bottom: 5px;">Workspace Canvas / Surface Color <button class="btn btn-micro ws-theme-reset-btn" style="float:right; padding: 0 4px;" data-target="bg" data-default="#fcf8ff" title="Reset to Default">↺</button></label>
                            <input type="color" id="editor-theme-color-bg" value="${theme.bg}" style="width: 100%; height: 40px; border: none; padding: 0; cursor: pointer;"/>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 5px;">Editor Heading Font</label>
                            <select id="editor-theme-font-heading" style="width: 100%; padding: 8px;">
                                <option value="Manrope" ${theme.fontHeading === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                <option value="Inter" ${theme.fontHeading === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Arial" ${theme.fontHeading === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Georgia" ${theme.fontHeading === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 12px;">
                            <label style="display: block; margin-bottom: 5px;">Editor Body Font</label>
                            <select id="editor-theme-font-body" style="width: 100%; padding: 8px;">
                                <option value="Manrope" ${theme.fontBody === 'Manrope' ? 'selected' : ''}>Manrope</option>
                                <option value="Inter" ${theme.fontBody === 'Inter' ? 'selected' : ''}>Inter</option>
                                <option value="Arial" ${theme.fontBody === 'Arial' ? 'selected' : ''}>Arial</option>
                                <option value="Georgia" ${theme.fontBody === 'Georgia' ? 'selected' : ''}>Georgia</option>
                            </select>
                        </div>
                        <div class="drawer-group" style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">UI Base Font Size: <span id="editor-theme-font-size-label">${theme.fontBase}px</span></label>
                            <input type="range" id="editor-theme-font-base" min="12" max="24" value="${theme.fontBase}" style="width: 100%;" />
                        </div>
                    </div>
                </div>

                <button class="accordion-header">Storage &amp; Maintenance</button>
                <div class="accordion-section">
                    <div class="theme-group" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 4px 0; line-height: 1.4;">
                            Manage local IndexedDB version snapshots and cached image assets.
                        </p>
                        <button type="button" id="btn-ws-run-gc" class="btn btn-secondary" style="width: 100%; justify-content: flex-start; padding: 10px 14px; font-weight: 600;">
                            🧹 Clean Up Old History Snapshots
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="window.AssetManagerUI.open()" style="width: 100%; justify-content: flex-start; padding: 10px 14px; font-weight: 600;">
                            🖼️ Open Asset Library
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="window.clearAssetLibrary()" style="width: 100%; justify-content: flex-start; padding: 10px 14px; color: #ef4444; border-color: #fca5a5; font-weight: 600;">
                            🗑️ Clear All Library Assets
                        </button>
                    </div>
                </div>

                <button class="accordion-header">Developer &amp; Diagnostics</button>
                <div class="accordion-section">
                    <div class="theme-group" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
                        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0 0 4px 0; line-height: 1.4;">
                            Load sample diagnostic layouts or generate a telemetry bug report.
                        </p>
                        <button type="button" class="btn btn-secondary" onclick="if(confirm('Load the Master Test Document? This will replace the active canvas view.')) { window.loadTestData(); window.closeAllDrawers(); }" style="width: 100%; justify-content: flex-start; padding: 10px 14px; font-weight: 600;">
                            🧪 Load Master Test Document
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="window.closeAllDrawers(); openBugModal();" style="width: 100%; justify-content: flex-start; padding: 10px 14px; font-weight: 600;">
                            🐞 Report a Bug
                        </button>
                    </div>
                </div>
            </div>
        `;

        const bindControl = (id, key, eventType) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener(eventType, (e) => {
                    const val = e.target.value;
                    theme[key] = val;
                    localStorage.setItem('docbuilder_editor_theme', JSON.stringify(theme));
                    window.applyCurrentThemes();
                    if (id === 'editor-theme-font-base') {
                        document.getElementById('editor-theme-font-size-label').textContent = val + 'px';
                    }
                });
            }
        };

        bindControl('editor-theme-color-brand', 'brand', 'input');
        bindControl('editor-theme-color-bg', 'bg', 'input');
        bindControl('editor-theme-font-heading', 'fontHeading', 'change');
        bindControl('editor-theme-font-body', 'fontBody', 'change');
        bindControl('editor-theme-font-base', 'fontBase', 'input');

        drawerBody.querySelectorAll('.ws-theme-reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.currentTarget.dataset.target;
                const defaultVal = e.currentTarget.dataset.default;
                theme[key] = defaultVal;
                localStorage.setItem('docbuilder_editor_theme', JSON.stringify(theme));
                const inputEl = document.getElementById(`editor-theme-color-${key}`);
                if (inputEl) inputEl.value = defaultVal;
                window.applyCurrentThemes();
            });
        });

        const gcBtn = document.getElementById('btn-ws-run-gc');
        if (gcBtn) {
            gcBtn.addEventListener('click', async () => {
                if (typeof storage !== 'undefined' && storage.runGC) {
                    await storage.runGC(20, 5);
                    gcBtn.textContent = '✅ History Snapshots Cleaned!';
                    setTimeout(() => { gcBtn.textContent = '🧹 Clean Up Old History Snapshots'; }, 2000);
                }
            });
        }

        window.bindAccordions(drawerBody.querySelector('.accordion-container'));
    }

    drawer.classList.add('open');
    overlay.classList.add('active');
};

window.openHelpModal = function () {
    window.closeAllDrawers(); // Ensure drawers close first
    const modal = document.getElementById('helpModal');
    if (modal) modal.style.display = 'flex';
};

window.closeHelpModal = function () {
    const modal = document.getElementById('helpModal');
    if (modal) modal.style.display = 'none';
};

window.HistoryUI = {
    activeTab: 'session', // 'session' | 'vault'
    activeFilter: 'all',  // 'all' | 'block' | 'row' | 'page' | 'design'
    searchQuery: '',

    formatTime: function (ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    },

    formatRelative: function (ts) {
        if (!ts) return '';
        const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
        if (diffSec < 10) return 'Just now';
        if (diffSec < 60) return `${diffSec}s ago`;
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin}m ago`;
        const diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `${diffHr}h ago`;
        const diffDay = Math.floor(diffHr / 24);
        return `${diffDay}d ago`;
    },

    getCategoryMeta: function (cat) {
        switch (cat) {
            case 'block':  return { icon: '📝', label: 'BLOCK',  cls: 'cat-block' };
            case 'row':    return { icon: '▤',  label: 'ROW',    cls: 'cat-row' };
            case 'page':   return { icon: '📄', label: 'PAGE',   cls: 'cat-page' };
            case 'design': return { icon: '🎨', label: 'DESIGN', cls: 'cat-design' };
            default:       return { icon: '⚡', label: 'SYSTEM', cls: 'cat-system' };
        }
    },

    toggle: function () {
        const drawer = document.getElementById('historyDrawer');
        const overlay = document.getElementById('historyOverlay');
        if (!drawer || !overlay) return;

        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            window.closeAllDrawers();
            drawer.classList.add('open');
            overlay.classList.add('active');
            this.renderList();
        }
    },

    saveManualCheckpoint: async function () {
        if (typeof storage === 'undefined' || !storage.archiveVersion) return;
        const stateStr = JSON.stringify(window.ConGenState);
        await storage.archiveVersion(stateStr, true);
        this.renderList();
    },

    renderList: async function () {
        const container = document.getElementById('history-drawer-body');
        if (!container) return;

        const stack = window.HistoryManager.stack || [];
        const currentIndex = window.HistoryManager.currentIndex;
        const canUndo = currentIndex > 0;
        const canRedo = currentIndex < stack.length - 1;

        const shellHtml = `
            <div class="history-controls-shell">
                <div class="history-mode-tabs">
                    <button type="button" class="history-mode-tab ${this.activeTab === 'session' ? 'active' : ''}" data-tab="session">
                        ⚡ Session Timeline <span class="history-tab-count">${stack.length}</span>
                    </button>
                    <button type="button" class="history-mode-tab ${this.activeTab === 'vault' ? 'active' : ''}" data-tab="vault">
                        💾 Saved Checkpoints
                    </button>
                </div>

                ${this.activeTab === 'session' ? `
                    <div class="history-quick-nav">
                        <button type="button" class="history-step-btn" id="hist-btn-undo" ${!canUndo ? 'disabled' : ''}>
                            ↩ Undo Step
                        </button>
                        <span class="history-step-counter">
                            Step <strong>${Math.max(0, currentIndex + 1)}</strong> of <strong>${stack.length}</strong>
                        </span>
                        <button type="button" class="history-step-btn" id="hist-btn-redo" ${!canRedo ? 'disabled' : ''}>
                            Redo Step ↪
                        </button>
                    </div>
                    <div class="history-search-row">
                        <input type="text" id="history-search-input" class="history-search-input" placeholder="Search changes, pages, sections..." value="${window.escapeHTML ? window.escapeHTML(this.searchQuery) : this.searchQuery}">
                    </div>
                    <div class="history-filter-pills">
                        <button type="button" class="history-filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                        <button type="button" class="history-filter-pill ${this.activeFilter === 'block' ? 'active' : ''}" data-filter="block">📝 Blocks</button>
                        <button type="button" class="history-filter-pill ${this.activeFilter === 'row' ? 'active' : ''}" data-filter="row">▤ Rows</button>
                        <button type="button" class="history-filter-pill ${this.activeFilter === 'page' ? 'active' : ''}" data-filter="page">📄 Pages</button>
                        <button type="button" class="history-filter-pill ${this.activeFilter === 'design' ? 'active' : ''}" data-filter="design">🎨 Design</button>
                    </div>
                ` : `
                    <div class="history-vault-bar">
                        <button type="button" class="btn btn-primary" id="btn-create-checkpoint" style="width:100%; padding:9px 12px; font-size:0.82rem; border-radius:6px; cursor:pointer;">
                            📌 Save Milestone Checkpoint Now
                        </button>
                    </div>
                `}
            </div>
            <div id="history-cards-list" class="history-cards-list"></div>
        `;

        container.innerHTML = shellHtml;

        // Wire mode tabs
        container.querySelectorAll('.history-mode-tab').forEach(btn => {
            btn.onclick = () => {
                this.activeTab = btn.dataset.tab;
                this.renderList();
            };
        });

        const listEl = container.querySelector('#history-cards-list');

        if (this.activeTab === 'session') {
            const btnUndo = container.querySelector('#hist-btn-undo');
            const btnRedo = container.querySelector('#hist-btn-redo');
            if (btnUndo) btnUndo.onclick = () => window.HistoryManager.undo();
            if (btnRedo) btnRedo.onclick = () => window.HistoryManager.redo();

            const searchInput = container.querySelector('#history-search-input');
            if (searchInput) {
                searchInput.oninput = (e) => {
                    this.searchQuery = e.target.value;
                    this._renderSessionCards(listEl);
                };
            }

            container.querySelectorAll('.history-filter-pill').forEach(pill => {
                pill.onclick = () => {
                    this.activeFilter = pill.dataset.filter;
                    container.querySelectorAll('.history-filter-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this._renderSessionCards(listEl);
                };
            });

            this._renderSessionCards(listEl);
        } else {
            const btnCreate = container.querySelector('#btn-create-checkpoint');
            if (btnCreate) {
                btnCreate.onclick = () => this.saveManualCheckpoint();
            }
            await this._renderVaultCards(listEl);
        }
    },

    _renderSessionCards: function (listEl) {
        if (!listEl) return;
        listEl.innerHTML = '';

        const stack = window.HistoryManager.stack || [];
        const currentIndex = window.HistoryManager.currentIndex;
        const q = (this.searchQuery || '').trim().toLowerCase();

        let matchedCount = 0;

        for (let i = stack.length - 1; i >= 0; i--) {
            const entry = stack[i];
            const cat = entry.category || 'system';
            if (this.activeFilter !== 'all' && cat !== this.activeFilter) continue;

            if (q) {
                const haystack = [
                    entry.name,
                    entry.how,
                    entry.pageTitle,
                    entry.sectionLabel,
                    entry.blockLabel,
                    entry.snippet
                ].filter(Boolean).join(' ').toLowerCase();
                if (!haystack.includes(q)) continue;
            }

            matchedCount++;
            const isCurrent = (i === currentIndex);
            const isFuture = (i > currentIndex);
            const catMeta = this.getCategoryMeta(cat);

            const card = document.createElement('div');
            card.className = `history-card ${isCurrent ? 'current' : ''} ${isFuture ? 'future-redo' : ''}`;

            const safe = (s) => window.escapeHTML ? window.escapeHTML(String(s || '')) : String(s || '');

            const crumbs = [];
            if (entry.pageTitle) crumbs.push(`<span class="hc-crumb hc-crumb-page">📄 ${safe(entry.pageTitle)}</span>`);
            if (entry.sectionLabel) crumbs.push(`<span class="hc-crumb hc-crumb-section">▤ ${safe(entry.sectionLabel)}</span>`);
            if (entry.blockLabel) crumbs.push(`<span class="hc-crumb hc-crumb-block">${safe(entry.blockLabel)}</span>`);

            const statusBadge = isCurrent
                ? '<span class="hc-status-pill hc-status-current">● CURRENT</span>'
                : (isFuture
                    ? `<span class="hc-status-pill hc-status-redo">↪ Redo #${i + 1}</span>`
                    : `<span class="hc-status-pill hc-status-past">#${i + 1}</span>`);

            card.innerHTML = `
                <div class="hc-header">
                    <span class="hc-cat-badge ${catMeta.cls}">${catMeta.icon} ${catMeta.label}</span>
                    ${statusBadge}
                </div>
                <div class="hc-title">${safe(entry.name || 'Updated Workspace')}</div>
                ${crumbs.length > 0 ? `<div class="hc-breadcrumbs">${crumbs.join('<span class="hc-crumb-sep">›</span>')}</div>` : ''}
                ${entry.how ? `<div class="hc-how">${safe(entry.how)}</div>` : ''}
                ${entry.snippet ? `<div class="hc-snippet">"${safe(entry.snippet)}"</div>` : ''}
                <div class="hc-footer">
                    <span class="hc-time-rel">🕒 ${this.formatRelative(entry.timestamp)}</span>
                    <span class="hc-time-abs">${this.formatTime(entry.timestamp)}</span>
                </div>
            `;

            card.onclick = () => {
                window.HistoryManager.currentIndex = i;
                window.HistoryManager.restoreState(entry.pageId);
                window.HistoryManager.updateButtonStates();
                this.renderList();
            };

            listEl.appendChild(card);
        }

        if (matchedCount === 0) {
            listEl.innerHTML = `<div style="text-align:center; padding:30px 15px; color:var(--text-secondary); font-size:0.85rem;">No matching history entries found.</div>`;
        }
    },

    _renderVaultCards: async function (listEl) {
        if (!listEl) return;
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.85rem;">Loading saved checkpoints...</div>';

        if (typeof storage === 'undefined' || !storage.getHistory) {
            listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-secondary); font-size:0.85rem;">Storage vault unavailable.</div>';
            return;
        }

        try {
            const records = await storage.getHistory();
            const snapshots = (records || []).filter(r => !String(r.id).startsWith('active_'));
            listEl.innerHTML = '';

            if (snapshots.length === 0) {
                listEl.innerHTML = '<div style="text-align:center; padding:30px 15px; color:var(--text-secondary); font-size:0.85rem;">No saved checkpoints yet.<br><br>Click <strong>Save Milestone Checkpoint Now</strong> above or use <strong>File → Save</strong> to create one.</div>';
                return;
            }

            snapshots.slice(0, 25).forEach((rec, idx) => {
                const card = document.createElement('div');
                card.className = 'history-card';
                const dateStr = new Date(rec.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                const badge = rec.isMilestone
                    ? '<span class="hc-cat-badge cat-design">📌 MILESTONE</span>'
                    : '<span class="hc-cat-badge cat-system">💾 AUTO-ARCHIVE</span>';

                card.innerHTML = `
                    <div class="hc-header">
                        ${badge}
                        <span class="hc-status-pill hc-status-past">Vault #${snapshots.length - idx}</span>
                    </div>
                    <div class="hc-title">${rec.isMilestone ? 'Saved Milestone Checkpoint' : 'Archived Workspace Snapshot'}</div>
                    <div class="hc-how">Click to restore this saved version into the active workspace.</div>
                    <div class="hc-footer">
                        <span class="hc-time-rel">🕒 ${this.formatRelative(rec.timestamp)}</span>
                        <span class="hc-time-abs">${dateStr} · ${this.formatTime(rec.timestamp)}</span>
                    </div>
                `;

                card.onclick = async () => {
                    if (!confirm('Restore this saved checkpoint from the vault? (You can still Undo back if needed.)')) return;
                    const versionData = await storage.getVersion(rec.id);
                    if (versionData) {
                        window.ConGenAPI.loadState(typeof versionData === 'string' ? versionData : JSON.stringify(versionData));
                        if (typeof window.updatePreview === 'function') window.updatePreview();
                        this.activeTab = 'session';
                        this.renderList();
                    }
                };
                listEl.appendChild(card);
            });
        } catch (err) {
            console.error('[HistoryUI] Error loading vault checkpoints:', err);
            listEl.innerHTML = '<div style="text-align:center; padding:20px; color:var(--danger); font-size:0.85rem;">Failed to load saved checkpoints.</div>';
        }
    }
};

window.ClipboardUI = {
    updateBadge: function () {
        const badge = document.getElementById('clipboard-badge');
        if (!badge) return;
        const count = (window.ConGenState.clipboard || []).length;
        if (count > 0) {
            badge.innerText = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    },

    toggle: function () {
        const drawer = document.getElementById('clipboardDrawer');
        const overlay = document.getElementById('clipboardOverlay');
        if (!drawer || !overlay) return;

        if (drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            overlay.classList.remove('active');
        } else {
            window.closeAllDrawers();
            drawer.classList.add('open');
            overlay.classList.add('active');
            this.render();
        }
    },

    render: function () {
        const container = document.getElementById('clipboard-drawer-body');
        if (!container) return;
        container.innerHTML = '';

        const clipboard = window.ConGenState.clipboard || [];
        if (clipboard.length === 0) {
            container.innerHTML = '<div style="color:#64748b; text-align:center; padding:40px 20px; font-size:0.9rem;">Your docking tray is empty.<br><br><span style="font-size:0.8rem; opacity:0.7;">Blocks removed during layout changes will appear here automatically.</span></div>';
            return;
        }

        clipboard.forEach((item, index) => {
            if (item.clipboardType === 'row') {
                const rowEl = document.createElement('div');
                rowEl.className = 'clipboard-item block';
                rowEl.style.position = 'relative';
                rowEl.style.padding = '15px';
                rowEl.style.marginBottom = '10px';
                rowEl.style.background = '#f4f6ff';
                rowEl.style.border = '1px dashed var(--brand)';
                rowEl.style.borderRadius = '4px';
                rowEl.style.textAlign = 'center';
                
                rowEl.innerHTML = `
                    <button class="btn-delete-clipboard-item" onclick="window.ConGenState.clipboard.splice(${index}, 1); if (window.ClipboardUI.updateBadge) window.ClipboardUI.updateBadge(); window.ClipboardUI.render();" style="position: absolute; top: 4px; right: 4px; background: rgba(231, 76, 60, 0.9); color: white; border: none; border-radius: 4px; width: 22px; height: 22px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" title="Remove from Clipboard">×</button>
                    <div style="font-weight: bold; color: var(--brand); margin-bottom: 5px; margin-top: 5px;">📋 Copied Row</div>
                    <div style="font-size: 0.8rem; color: #666;">
                        Paste this row from any empty row layout selector.
                    </div>
                `;
                container.appendChild(rowEl);
                return;
            }

            const block = item; // Legacy or block item
            // 1. Generate the standard block shell from the renderer
            const shell = window.ConGenRenderer._createBlockShell(block, null, null, index);
            shell.classList.add('clipboard-item');

            // 2. Overwrite the dragstart to pass the restore payload
            shell.setAttribute('draggable', 'true');
            shell.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    action: 'restore_block',
                    clipboardIndex: index
                }));
                shell.classList.add('dragging');
            };

            // 3. Mount the omni-block inside the shell
            const omni = document.createElement('omni-block');
            omni.setAttribute('type', block.type);
            
            // Sync data to the ghost block
            setTimeout(() => {
                if (omni.setData) omni.setData(block.data, 'view');
            }, 0);

            const placeholder = shell.querySelector('.omni-placeholder');
            if (placeholder) placeholder.replaceWith(omni);

            container.appendChild(shell);
        });
    }
};
