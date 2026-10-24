/**
 * ConGen 6.9.0 Master - The Dumb Renderer
 * Reads JSON State and builds the DOM. Never stores data itself.
 */

window.ConGenTemplates = {
    getEmptyStateChooser: function(pageId, rowId) {
        let pasteHtml = '';
        if (window.ConGenState && window.ConGenState.clipboard && window.ConGenState.clipboard.length > 0) {
            const lastItem = window.ConGenState.clipboard[window.ConGenState.clipboard.length - 1];
            if (lastItem.clipboardType === 'row') {
                pasteHtml = `
                    <div style="margin-bottom: 30px;">
                        <button data-action="paste-row" data-page-id="${pageId}" data-row-id="${rowId}" style="padding: 12px 24px; background: var(--brand, #635bff); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold; font-family: 'Inter', sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            📋 Paste Row from Clipboard
                        </button>
                    </div>
                `;
            }
        }

        return `
                <div class="empty-state-chooser" data-page="${pageId}" data-row="${rowId}" style="grid-column: span 12; padding: 40px 20px; text-align: center; background: #fff; border: 2px dashed var(--border-color, #e0e0e0); border-radius: 8px;">
                    ${pasteHtml}
                    <h3 style="margin-top: 0; color: #333; font-weight: 600; font-family: 'Inter', sans-serif;">Select Layout</h3>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Standard Grids</div>
                        <div style="display: flex; justify-content: center; gap: 10px;">
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', '1-col')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px; cursor: pointer; color: #555; font-weight: 500; font-family: 'Inter', sans-serif;">1-Col</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', '2-col')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px; cursor: pointer; color: #555; font-weight: 500; font-family: 'Inter', sans-serif;">2-Col</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', '3-col')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px; cursor: pointer; color: #555; font-weight: 500; font-family: 'Inter', sans-serif;">3-Col</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', '3')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f9f9f9; border-radius: 4px; cursor: pointer; color: #555; font-weight: 500; font-family: 'Inter', sans-serif;">4-Col</button>
                        </div>
                    </div>
                    
                    <div>
                        <div style="font-size: 0.8rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Presentation Cards</div>
                        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', 'process-step')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f4f6ff; border-radius: 4px; cursor: pointer; color: var(--brand, #635bff); font-weight: 500; border-color: rgba(99,91,255,0.2); font-family: 'Inter', sans-serif;">Process Step</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', 'split-view')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f4f6ff; border-radius: 4px; cursor: pointer; color: var(--brand, #635bff); font-weight: 500; border-color: rgba(99,91,255,0.2); font-family: 'Inter', sans-serif;">Split View</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', 'presentation-cards')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f4f6ff; border-radius: 4px; cursor: pointer; color: var(--brand, #635bff); font-weight: 500; border-color: rgba(99,91,255,0.2); font-family: 'Inter', sans-serif;">Text Card</button>
                            <button onclick="window.ConGenAPI.applyTemplate('${pageId}', '${rowId}', 'presentation-media')" style="padding: 8px 16px; border: 1px solid #ddd; background: #f4f6ff; border-radius: 4px; cursor: pointer; color: var(--brand, #635bff); font-weight: 500; border-color: rgba(99,91,255,0.2); font-family: 'Inter', sans-serif;">Media Card</button>
                        </div>
                    </div>
                </div>`;
    }
};

window.ConGenRenderer = {

    // --- Drag Skeleton Utility ---
    _removeSkeleton: function () {
        const s1 = document.getElementById('drag-skeleton');
        if (s1) s1.remove();
        const s2 = document.getElementById('drag-skeleton-row');
        if (s2) s2.remove();
        document.querySelectorAll('.global-drag-active').forEach(el => el.classList.remove('global-drag-active'));
    },

    // 1. Master Boot Sequence
    renderFullWorkspace: function () {
        const docTitleEl = document.getElementById('docTitle');
        if (docTitleEl && window.ConGenState?.settings?.docTitle !== undefined) {
            docTitleEl.value = window.ConGenState.settings.docTitle;
        }
        this.renderTabs();
        if (typeof window.updatePreview === 'function') window.updatePreview();

        if (window.ConGenState.activePageId) {
            this.renderPage(window.ConGenState.activePageId);
        } else {
            document.getElementById('pages-container').innerHTML = `
                <div style="text-align:center; padding: 50px; color: #999;">
                    No pages active. Create a new page to begin.
                </div>
            `;
        }
    },

    // 2. Render Navigation Tabs
    renderTabs: function () {
        const tabsHeader = document.getElementById('tabs-header');
        if (!tabsHeader) return;

        tabsHeader.innerHTML = '';
        tabsHeader.style.padding = '10px 0';

        window.ConGenState.pages.forEach(page => {
            const isActive = page.id === window.ConGenState.activePageId;

            const tabWrapper = document.createElement('div');
            tabWrapper.className = `page-tab ${isActive ? 'active' : ''}`;
            tabWrapper.style.display = 'flex';
            tabWrapper.style.alignItems = 'center';
            tabWrapper.style.gap = '8px';
            tabWrapper.style.cursor = 'pointer';

            const tabText = document.createElement('span');
            tabText.innerText = page.title || 'Untitled';
            tabText.onclick = () => {
                if (window.ConGenState.activePageId !== page.id) {
                    window.ConGenState.activePageId = page.id;
                    this.renderFullWorkspace();
                    window.dispatchEvent(new CustomEvent('congen-nav-sync', {
                        detail: { pageId: page.id, source: 'editor' }
                    }));
                }
            };
            tabWrapper.appendChild(tabText);

            const delBtn = document.createElement('div');
            delBtn.title = "Delete Page";

            // Pure SVG for the 'X' only
            delBtn.innerHTML = `<svg viewBox="0 0 24 24" width="12" height="12" stroke="#e74c3c" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                <line x1="5" y1="5" x2="19" y2="19" />
                <line x1="19" y1="5" x2="5" y2="19" />
            </svg>`;

            // Always keep it in the DOM to prevent width jitter
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.style.width = '20px';
            delBtn.style.height = '20px';
            delBtn.style.borderRadius = '10%';
            delBtn.style.cursor = 'pointer';
            delBtn.style.marginLeft = '8px';
            delBtn.style.flexShrink = '0';
            delBtn.style.transition = 'all 0.2s ease';

            const svg = delBtn.querySelector('svg');

            // Set initial state based on whether the tab is active
            if (isActive) {
                delBtn.style.background = 'white';
                delBtn.style.border = '1px solid #e74c3c';
                delBtn.style.opacity = '0.7';
                svg.style.stroke = '#e74c3c';
            } else {
                delBtn.style.background = 'transparent';
                delBtn.style.border = '1px solid transparent';
                delBtn.style.opacity = '0.3';
                svg.style.stroke = '#999'; // Gray placeholder
            }

            // Hover effects
            delBtn.onmouseenter = () => { delBtn.style.opacity = '1'; };
            delBtn.onmouseleave = () => { delBtn.style.opacity = isActive ? '0.7' : '0.3'; };

            delBtn.onclick = (e) => {
                e.stopPropagation();
                window.ConGenAPI.deletePage(page.id);
            };

            if (!isActive) {
                tabWrapper.onmouseenter = () => {
                    delBtn.style.background = 'white';
                    delBtn.style.border = '1px solid #e74c3c';
                    svg.style.stroke = '#e74c3c';
                    delBtn.style.opacity = '0.7';
                };
                tabWrapper.onmouseleave = () => {
                    delBtn.style.background = 'transparent';
                    delBtn.style.border = '1px solid transparent';
                    svg.style.stroke = '#999';
                    delBtn.style.opacity = '0.3';
                };
            }

            tabWrapper.appendChild(delBtn);
            tabsHeader.appendChild(tabWrapper);
        });

        const addPageBtn = document.createElement('button');
        addPageBtn.className = 'btn-ghost';
        addPageBtn.style.color = '#635bff';
        addPageBtn.style.fontWeight = 'bold';
        addPageBtn.style.border = '1px dashed #635bff';
        addPageBtn.style.padding = '5px 10px';
        addPageBtn.style.borderRadius = '4px';
        addPageBtn.style.flexShrink = '0';
        addPageBtn.innerHTML = '+ New Page';
        addPageBtn.onclick = () => window.ConGenAPI.addPage();

        tabsHeader.appendChild(addPageBtn);
    },

    // 3. Render the Active Page
    renderPage: function (pageId) {
        const pageState = window.ConGenState.pages.find(p => p.id === pageId);
        if (!pageState) return;

        const container = document.getElementById('pages-container');
        container.innerHTML = ''; // Wipe old page

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page-editor active';
        pageWrapper.id = pageId;

        // Simplified Page Header (Title input directly updates State)
        pageWrapper.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: flex-start; margin: 20px;">
                <div style="flex: 1;">
                    <label>Page Navigation Title</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="text" class="p-title" style="flex: 1;" value="${pageState.title}" 
                               oninput="window.ConGenAPI.updatePageSettings('${pageId}', { title: this.value }, true); window.ConGenRenderer.renderTabs();">
                        <button class="btn-ghost" onclick="document.getElementById('page_settings_${pageId}').style.display = document.getElementById('page_settings_${pageId}').style.display === 'none' ? 'flex' : 'none';" style="padding: 10px; cursor: pointer; border: 1px solid #ddd; border-radius: 4px;">⚙️ Settings</button>
                    </div>
                    <div id="page_settings_${pageId}" style="display: none; gap: 15px; margin-top: 10px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 150px;">
                            <label style="margin-top: 0;">Title Align</label>
                            <select onchange="window.ConGenAPI.updatePageSettings('${pageId}', { titleAlign: this.value });">
                                <option value="left" ${pageState.titleAlign === 'left' ? 'selected' : ''}>Left</option>
                                <option value="center" ${pageState.titleAlign === 'center' ? 'selected' : ''}>Center</option>
                                <option value="right" ${pageState.titleAlign === 'right' ? 'selected' : ''}>Right</option>
                            </select>
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label style="margin-top: 0;">Bg Color (Hex)</label>
                            <input type="text" placeholder="#ffffff" value="${pageState.titleBgColor || ''}" onchange="window.ConGenAPI.updatePageSettings('${pageId}', { titleBgColor: this.value });">
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label style="margin-top: 0;">Text Color (Hex)</label>
                            <input type="text" placeholder="#000000" value="${pageState.titleColor || ''}" onchange="window.ConGenAPI.updatePageSettings('${pageId}', { titleColor: this.value });">
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label style="margin-top: 0;">Font Family</label>
                            <input type="text" placeholder="Arial, sans-serif" value="${pageState.titleFont || ''}" onchange="window.ConGenAPI.updatePageSettings('${pageId}', { titleFont: this.value });">
                        </div>
                        <div style="flex: 1; min-width: 150px;">
                            <label style="margin-top: 0;">Title Style</label>
                            <select onchange="window.ConGenAPI.updatePageSettings('${pageId}', { titleStyle: this.value });">
                                <option value="standard" ${(pageState.titleStyle || 'standard') === 'standard' ? 'selected' : ''}>Standard</option>
                                <option value="slanted" ${pageState.titleStyle === 'slanted' ? 'selected' : ''}>Slanted</option>
                                <option value="pill" ${pageState.titleStyle === 'pill' ? 'selected' : ''}>Pill</option>
                                <option value="synthwave" ${pageState.titleStyle === 'synthwave' ? 'selected' : ''}>90s Synthwave</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="blocks-container" id="blocks_${pageId}"></div>
        `;

        container.appendChild(pageWrapper);

        // Render each row into the blocks container
        const blocksContainer = pageWrapper.querySelector('.blocks-container');
        pageState.rows.forEach(rowState => {
            blocksContainer.appendChild(this.buildRowDOM(rowState, pageId));
        });

        // ---- Decoupled Drag Skeleton (Light DOM, no Shadow boundary issues) ----
        blocksContainer.addEventListener('dragover', (e) => {
            // 1. STRICT GATE: Only handle row drags here — ignore sidebar tools and block swaps
            if (!e.dataTransfer.types.includes('docbuilder/row')) return;
            e.preventDefault();

            // 2. Find target row, skip if it's the row being dragged
            const targetRow = e.target.closest('.block-row-wrapper');
            if (!targetRow || targetRow.id === window.__draggedRowId) return;

            // 3. Calculate midpoint to determine insert position
            const rect = targetRow.getBoundingClientRect();
            const isTopHalf = e.clientY < rect.top + rect.height / 2;

            // 4. Create skeleton if it doesn't exist yet
            let skeleton = document.getElementById('drag-skeleton-row');
            if (!skeleton) {
                skeleton = document.createElement('div');
                skeleton.id = 'drag-skeleton-row';
                skeleton.className = 'drag-skeleton-row';
                skeleton.style.height = `${window.__draggedRowHeight || 100}px`;
            }

            const nextNode = isTopHalf ? targetRow : targetRow.nextSibling;

            // 5. THE FLICKER KILLER: Only touch the DOM if position actually changed
            if (skeleton.nextSibling !== nextNode) {
                blocksContainer.insertBefore(skeleton, nextNode);
            }

            // 6. Record exactly where the skeleton sits so drop() can honour it
            //    nextNode is the row the dragged row should land BEFORE (or null = end)
            window.__dropBeforeRowId = (nextNode && nextNode.id && nextNode.classList.contains('block-row-wrapper'))
                ? nextNode.id
                : null;
            window.__dropPageId = pageId;
        });

        // THE AUTHORITATIVE DROP HANDLER: uses the skeleton's stored position
        blocksContainer.addEventListener('drop', (e) => {
            this._removeSkeleton();

            if (!e.dataTransfer.types.includes('docbuilder/row')) return;
            e.preventDefault();
            e.stopPropagation();

            const srcRowId = window.__draggedRowId;
            const targetPageId = window.__dropPageId;
            if (!srcRowId || !targetPageId) return;

            const page = window.ConGenAPI._findPage(targetPageId);
            if (!page) return;

            const srcIndex = page.rows.findIndex(r => r.id === srcRowId);
            if (srcIndex < 0) return;

            // Remove the source row from the array first
            const [row] = page.rows.splice(srcIndex, 1);

            // Re-find the destination index AFTER removal (indices shift)
            let destIndex;
            if (window.__dropBeforeRowId) {
                destIndex = page.rows.findIndex(r => r.id === window.__dropBeforeRowId);
                if (destIndex < 0) destIndex = page.rows.length; // fallback to end
            } else {
                destIndex = page.rows.length; // drop at end
            }

            page.rows.splice(destIndex, 0, row);

            window.__draggedRowId = null;
            window.__dropBeforeRowId = null;

            window.HistoryManager.pushState('Relocated Row');
            if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
            if (window.ConGenRenderer) window.ConGenRenderer.renderPage(targetPageId);
            if (typeof window.updatePreview === 'function') window.updatePreview();
        });

        blocksContainer.addEventListener('dragleave', (e) => {
            if (!blocksContainer.contains(e.relatedTarget)) {
                this._removeSkeleton();
            }
        });
    },

    // 4. Render a Single Row (This is the magic Grid logic)
    renderRow: function (rowId) {
        // Find the active page and target the specific row DOM
        const pageId = window.ConGenState.activePageId;
        const rowState = window.ConGenAPI._findRow(pageId, rowId);
        const rowDOM = document.getElementById(rowId);

        if (!rowDOM || !rowState) return;

        // Wipe the row contents, but keep the outer wrapper
        const container = rowDOM.querySelector('.row-container');
        container.innerHTML = '';

        // 1. STRICT NEW ROW CHECK: If absolutely no blocks, show the Chooser UI
        if (rowState.blocks.length === 0) {
            container.innerHTML = window.ConGenTemplates.getEmptyStateChooser(pageId, rowState.id);
            return;
        }

        // 2. CONFIGURED ROW: Stamp out columns based strictly on JSON state
        rowState.blocks.forEach((blockState, index) => {
            const col = document.createElement('div');
            // State dictates the CSS Grid constraints!
            col.className = `layout-column col-span-${blockState.span}`;

            if (blockState.type === 'empty') {
                // Render an empty dropzone for configured layouts
                col.innerHTML = `
                    <div class="drop-hint" data-page="${pageId}" data-row="${rowState.id}" data-index="${index}" onclick="if(window.pendingClipboardIndex !== undefined) { window.ConGenAPI.restoreFromClipboard(window.pendingClipboardIndex, '${pageId}', '${rowState.id}', ${index}); window.pendingClipboardIndex = undefined; window.ConGenRenderer.renderRow('${rowState.id}'); }">
                        Drop Block Here
                    </div>`;
            } else {
                // Render populated content
                col.classList.add('has-content');

                try {
                    const blockShell = this._createBlockShell(blockState, pageId, rowState.id, index);

                    // Mount the Omni-Block
                    const omni = document.createElement('omni-block');

                    // FIX: Inject IDs into the dataset before setting the type to catch the initial render cycle
                    omni.dataset.pageId = pageId;
                    omni.dataset.rowId = rowState.id;
                    omni.dataset.blockId = blockState.id;

                    omni.setAttribute('type', blockState.type);
                    omni.setData(blockState.data, 'view');

                    // When Omni-block changes, sync it quietly to JSON State
                    omni.addEventListener('omni-data-change', () => {
                        window.ConGenAPI.updateBlockData(pageId, rowState.id, blockState.id, omni.getData());
                    });

                    blockShell.querySelector('.omni-placeholder').replaceWith(omni);
                    col.appendChild(blockShell);
                } catch (e) {
                    console.error(`[Renderer] Failed to render block ${blockState.id}:`, e);
                    col.innerHTML = `<div style="padding: 10px; color: #e74c3c; font-size: 0.8rem; border: 1px dashed #e74c3c; border-radius: 4px;">Render Error</div>`;
                }
            }
            container.appendChild(col);
        });
    },

    // --- Helpers ---

    buildRowDOM: function (rowState, pageId) {
        const rowWrapper = document.createElement('div');
        rowWrapper.className = 'block block-row-wrapper';
        rowWrapper.id = rowState.id;
        if (rowState.verticalSpacing !== undefined) rowWrapper.style.marginBottom = rowState.verticalSpacing + 'px';

        // Native Drag-and-Drop for Rows
        rowWrapper.setAttribute('draggable', 'false'); // Default to false
        rowWrapper.ondragstart = (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ action: 'move_row', pageId, rowId: rowState.id }));
            e.dataTransfer.setData('docbuilder/row', 'true'); // Type discriminator flag
            window.__draggedRowId = rowState.id;
            window.__draggedRowHeight = rowWrapper.offsetHeight;
            rowWrapper.classList.add('dragging');
        };
        rowWrapper.ondragend = () => {
            rowWrapper.classList.remove('dragging');
            rowWrapper.setAttribute('draggable', 'false'); // Safety reset
            this._removeSkeleton();
        };
        rowWrapper.ondragover = (e) => e.preventDefault();
        rowWrapper.ondrop = (e) => {
            e.preventDefault();
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.action === 'move_row' && data.rowId !== rowState.id) {
                    // Handled by authoritative blocksContainer drop listener (lines 290-328)
                }
            } catch (err) { }
        };

        // Outer Row Shell
        rowWrapper.innerHTML = `
            <div class="block-controls-row" style="background: #f9f9f9; border-bottom: 1px dashed #eee; padding: 8px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                    <div class="drag-handle">${ICONS.DRAG}</div>
                    <span class="row-container-label" style="font-weight: bold; color: #555;">ROW CONTAINER</span>
                    <input type="text" placeholder="Optional Row Header" value="${rowState.header || ''}" 
                           style="margin: 0; padding: 4px 8px; font-size: 0.85rem; max-width: 200px; border-radius: 4px; border: 1px solid #ccc; height: 32px;"
                           onchange="window.ConGenAPI.updateRowSettings('${pageId}', '${rowState.id}', { header: this.value });">
                    <select style="margin: 0; padding: 4px 8px; font-size: 0.85rem; border-radius: 4px; border: 1px solid #ccc; width: auto; height: 32px;"
                            onchange="window.ConGenAPI.updateRowSettings('${pageId}', '${rowState.id}', { headerAlign: this.value });">
                        <option value="left" ${rowState.headerAlign === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${rowState.headerAlign === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${rowState.headerAlign === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                    <select style="margin: 0; padding: 4px 8px; font-size: 0.85rem; border-radius: 4px; border: 1px solid #ccc; width: auto; height: 32px;"
                            onchange="window.ConGenAPI.updateRowSettings('${pageId}', '${rowState.id}', { headerStyle: this.value });">
                        <option value="standard" ${(rowState.headerStyle || 'standard') === 'standard' ? 'selected' : ''}>Standard</option>
                        <option value="slanted" ${rowState.headerStyle === 'slanted' ? 'selected' : ''}>Slanted</option>
                        <option value="pill" ${rowState.headerStyle === 'pill' ? 'selected' : ''}>Pill</option>
                        <option value="synthwave" ${rowState.headerStyle === 'synthwave' ? 'selected' : ''}>90s Synthwave</option>
                    </select>
                </div>
                <div class="move-controls" style="margin-left: auto; display: flex; gap: 2px;">
                    <button class="btn-move icon-btn btn-ghost" data-action="move-row" data-direction="up" data-page-id="${pageId}" data-row-id="${rowState.id}" title="Move Row Up">
                        ${ICONS.UP}
                    </button>
                    <button class="btn-move icon-btn btn-ghost" data-action="move-row" data-direction="down" data-page-id="${pageId}" data-row-id="${rowState.id}" title="Move Row Down">
                        ${ICONS.DOWN}
                    </button>
                    <button class="btn-copy icon-btn btn-ghost" data-action="copy-row" data-page-id="${pageId}" data-row-id="${rowState.id}" title="Copy Entire Row">📋</button>
                    <button class="btn-settings icon-btn btn-ghost" data-action="open-row-settings" data-page-id="${pageId}" data-row-id="${rowState.id}" title="Row Layout Settings">
                        ${ICONS.SETTINGS}
                    </button>
                </div>
            </div>
            <div class="row-container"></div>
        `;

        const dragHandle = rowWrapper.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.onmousedown = () => rowWrapper.setAttribute('draggable', 'true');
            dragHandle.onmouseup = () => rowWrapper.setAttribute('draggable', 'false');
            dragHandle.onmouseleave = () => rowWrapper.setAttribute('draggable', 'false');
        }

        // Append it to DOM unrendered, then trigger the render loop to fill it
        setTimeout(() => this.renderRow(rowState.id), 0);
        return rowWrapper;
    },

    _createBlockShell: function (blockState, pageId, rowId, index) {
        const shell = document.createElement('div');
        shell.className = 'block';
        shell.id = blockState.id;

        shell.setAttribute('draggable', 'false'); // Default to false
        shell.ondragstart = (e) => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', JSON.stringify({ action: 'move_block', pageId, rowId, blockId: blockState.id }));
            e.dataTransfer.setData('docbuilder/block', 'true'); // Type discriminator flag
            e.dataTransfer.setDragImage(shell, 20, 20);
            shell.classList.add('dragging');
            // Capture the height of the block being lifted for dynamic skeleton sizing
            const omniEl = shell.querySelector('omni-block');
            window.__draggedBlockHeight = omniEl ? omniEl.offsetHeight : shell.offsetHeight;
        };
        shell.ondragend = () => {
            shell.classList.remove('dragging');
            shell.setAttribute('draggable', 'false'); // Safety reset
            this._removeSkeleton();
        };

        // Native Drag-and-Drop for Blocks (Drop Target Only)
        shell.ondragover = (e) => e.preventDefault();
        shell.ondrop = (e) => {
            e.preventDefault();
            e.stopPropagation();
            try {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.action === 'move_block' && data.blockId !== blockState.id) {
                    window.ConGenAPI.swapBlocks(pageId, data.rowId, data.blockId, rowId, blockState.id);
                }
            } catch (err) { }
        };

        // The visual wrapper for an Omni-Block
        shell.innerHTML = `
            <div class="block-controls-row" style="justify-content: center;">
                <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; min-width: 0;">
                    <div class="drag-handle" style="padding: 0;">${ICONS.DRAG}</div>
                    <div style="color: var(--brand); display: flex; align-items: center;">
                        ${ICONS[blockState.type.toUpperCase()] || ''}
                    </div>
                    <div style="font-size: 0.7rem; color: #999; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px; text-align: center; word-break: break-word;">
                        ${blockState.type}
                    </div>
                </div>
                <div class="move-controls" style="display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; margin-top: 4px; min-width: 0;">
                    <button class="btn-move icon-btn btn-ghost" data-action="move-block" data-direction="left" data-page-id="${pageId}" data-row-id="${rowId}" data-block-id="${blockState.id}" title="Move Left">
                        ${ICONS.LEFT}
                    </button>
                    <button class="btn-move icon-btn btn-ghost" data-action="move-block" data-direction="right" data-page-id="${pageId}" data-row-id="${rowId}" data-block-id="${blockState.id}" title="Move Right">
                        ${ICONS.RIGHT}
                    </button>
                    <button class="btn-edit icon-btn btn-ghost" data-action="edit-block" data-page-id="${pageId}" data-row-id="${rowId}" data-block-id="${blockState.id}" title="Edit Block" onclick="if(window.pendingClipboardIndex !== undefined) { window.ConGenAPI.restoreFromClipboard(window.pendingClipboardIndex, '${pageId}', '${rowId}', ${index}); window.pendingClipboardIndex = undefined; window.ConGenRenderer.renderRow('${rowId}'); return false; }">${ICONS.SETTINGS}</button>
                    <button class="icon-btn btn-ghost" style="color: var(--danger);" data-action="delete-block" data-page-id="${pageId}" data-row-id="${rowId}" data-block-index="${index}" title="Remove">${ICONS.REMOVE}</button>
                </div>
            </div>
            <div class="omni-placeholder"></div>
        `;
        // Isolate dragging to the handle to restore text selection
        const dragHandle = shell.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.onmousedown = () => shell.setAttribute('draggable', 'true');
            dragHandle.onmouseup = () => shell.setAttribute('draggable', 'false');
            dragHandle.onmouseleave = () => shell.setAttribute('draggable', 'false');
        }


        return shell;
    }
};
