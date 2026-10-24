/**
 * ConGen Omni-Block Controller
 * A Web Components-based modular block system.
 * v7.17.1
 */

// --- Core Stylesheet & YIQ Utility ---
window.conGenTelemetry = window.conGenTelemetry || [];
const coreBlockSheet = new CSSStyleSheet();
coreBlockSheet.replaceSync(`
    :host { display: flex; flex-direction: column; flex-grow: 1; width: 100%; max-width: 100%; overflow: hidden; box-sizing: border-box; }
    .omni-container { flex-grow: 1; display: flex; flex-direction: column; padding: 0; margin: 0; width: 100%; max-width: 100%; overflow: hidden; position: relative; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
`);

function tintHex(hex, factor) {
    if (!hex) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return hex;
    let r = parseInt(h.substring(0, 2), 16);
    let g = parseInt(h.substring(2, 4), 16);
    let b = parseInt(h.substring(4, 6), 16);
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function shadeHex(hex, factor) {
    if (!hex) return hex;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return hex;
    let r = parseInt(h.substring(0, 2), 16);
    let g = parseInt(h.substring(2, 4), 16);
    let b = parseInt(h.substring(4, 6), 16);
    r = Math.round(r * (1 - factor));
    g = Math.round(g * (1 - factor));
    b = Math.round(b * (1 - factor));
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function getContrastYIQ(bgColor) {
    if (!bgColor || bgColor === 'transparent' || bgColor === 'rgba(0, 0, 0, 0)') return null;
    let r = 0, g = 0, b = 0;
    if (bgColor.startsWith('rgb')) {
        const match = bgColor.match(/\d+/g);
        if (match && match.length >= 3) {
            r = parseInt(match[0], 10);
            g = parseInt(match[1], 10);
            b = parseInt(match[2], 10);
        } else return null;
    } else if (bgColor.startsWith('#')) {
        let hex = bgColor.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length >= 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        } else return null;
    } else {
        return null;
    }
    
    const hexColor = '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    return (yiq >= 128) ? shadeHex(hexColor, 0.85) : tintHex(hexColor, 0.85);
}

class OmniBlock extends HTMLElement {
    static registry = new Map();

    /**
     * Register a new content type plugin.
     * @param {Object} plugin - { type, getTemplate, getData, styles, onRender }
     */
    static register(plugin) {
        if (!plugin.type) throw new Error('Plugin must have a type.');
        const pluginCss = plugin.viewStyles || plugin.styles || '';
        if (pluginCss) {
            plugin.styleSheet = new CSSStyleSheet();
            plugin.styleSheet.replaceSync(pluginCss);
        }
        this.registry.set(plugin.type, plugin);
        console.log(`[OmniBlock] Registered type: ${plugin.type}`);
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._type = this.getAttribute('type') || 'text';
        this._data = {};
    }

    static get observedAttributes() {
        return ['type'];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === 'type' && oldVal !== newVal) {
            this._type = newVal;
            this._data = {};
            this.render();
            // UI ARCHITECTURE FIX v5.6.4: Lifecycle Initialization
            this.setData(this.getData());
            if (window.bindOmniEvents) window.bindOmniEvents(this);
        }
    }

    connectedCallback() {
        if (!this.shadowRoot.querySelector('.omni-container')) {
            setTimeout(() => {
                if (!this.shadowRoot.querySelector('.omni-container')) {
                    this.render();
                }
            }, 0);
        }
    }

    get type() {
        return this._type;
    }

    set type(val) {
        this.setAttribute('type', val);
    }

    /**
     * Helper to find the nearest .block in Light DOM
     */
    get blockWrapper() {
        return this.closest('.block');
    }

    /**
     * Render the block view (Workspace-only).
     */
    render() {
        const plugin = OmniBlock.registry.get(this._type);
        if (!plugin) {
            const errorMsg = `Error: Block type "${this._type}" not registered.`;
            window.conGenTelemetry.push({
                timestamp: new Date().toISOString(),
                component: this._type,
                error: errorMsg
            });
            this.shadowRoot.innerHTML = `<div style="padding: 10px; color: red;">${errorMsg}</div>`;
            return;
        }

        // Add context and type classes for workspace-only CSS targeting
        this.className = `omni-block-editor-mode omni-block-type-${this._type}`;

        // FIX: Prioritize dataset variables, fall back to DOM traversal
        const blockId = this.dataset.blockId || this.blockWrapper?.id || '';
        const rowId = this.dataset.rowId || this.closest('.block-row-wrapper')?.id || '';
        const pageId = this.dataset.pageId || this.closest('.page-editor')?.id || '';

        // YIQ Contrast Calculation for Header blocks
        let computedContrastColor = '';
        if (this._type === 'text' && this._data && this._data.content && /<h[1-6]/i.test(this._data.content)) {
            let el = this;
            let bgColor = this._data.bgColor || '';

            // Fallback 1: Check Row State (solves initial load retroactive bug for older documents)
            if (!bgColor && window.ConGenAPI && pageId && rowId) {
                const rowState = window.ConGenAPI._findRow(pageId, rowId);
                if (rowState && rowState.bgColor) {
                    bgColor = rowState.bgColor;
                }
            }

            // Fallback 2: DOM Traversal (for dynamic changes or parent wrappers)
            if (!bgColor) {
                while (el) {
                    if (el.nodeType !== Node.ELEMENT_NODE) {
                        el = el.host || null;
                        continue;
                    }
                    const inlineBg = el.style?.backgroundColor;
                    const computedStyle = window.getComputedStyle(el);
                    const compBg = computedStyle?.backgroundColor;
                    const bg = inlineBg || compBg;
                    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
                        bgColor = bg;
                        break;
                    }
                    el = el.parentElement || el.getRootNode()?.host;
                }
            }

            if (bgColor) {
                computedContrastColor = getContrastYIQ(bgColor);
            }
        }

        const sheets = [coreBlockSheet];
        if (plugin.styleSheet) sheets.push(plugin.styleSheet);
        this.shadowRoot.adoptedStyleSheets = sheets;

        try {
            this.shadowRoot.innerHTML = `
                <div class="omni-container">
                    ${plugin.getViewTemplate ? plugin.getViewTemplate(this._data, { blockId, rowId, pageId }) : (plugin.getTemplate ? plugin.getTemplate(this._data) : '')}
                </div>
            `;
        } catch (err) {
            window.conGenTelemetry.push({
                timestamp: new Date().toISOString(),
                component: this._type,
                error: err.message || String(err),
                stack: err.stack
            });
            this.shadowRoot.innerHTML = `<div style="padding: 10px; color: red;">Error rendering block "${this._type}": ${err.message}</div>`;
            return;
        }

        if (computedContrastColor && (this._data?.bgColor || (window.ConGenAPI && pageId && rowId && window.ConGenAPI._findRow(pageId, rowId)?.bgColor))) {
            const rte = this.shadowRoot.querySelector('.rte-editor');
            if (rte) {
                rte.style.color = computedContrastColor;
            }
        }

        // 1. Centralized Event Translator (Shadow DOM Bridge) — bound once per element instance
        if (!this._hasBoundCoreEvents) {
            this._hasBoundCoreEvents = true;
        this.shadowRoot.addEventListener('click', (e) => {
            const target = e.target.closest('[data-global-action]');
            if (!target) return;

            e.preventDefault();
            this.dispatchEvent(new CustomEvent('congen-action', {
                detail: { action: target.dataset.globalAction, ...target.dataset },
                bubbles: true,
                composed: true
            }));
        });

        // Listen for external edit trigger
        this.addEventListener('trigger-edit', () => {
            if (window.ModalManager) window.ModalManager.open(this);
        });

        }

        if (plugin.onViewRender) {
            plugin.onViewRender(this.shadowRoot, this._data);
        }
        if (window.bindOmniEvents) window.bindOmniEvents(this);
    }

    /**
     * Standardized memory-based data extraction.
     */
    getData() {
        const cloned = this._data ? JSON.parse(JSON.stringify(this._data)) : {};
        return {
            type: this._type,
            ...cloned
        };
    }

    /**
     * Standardized memory-based data population.
     */
    setData(data, mode = 'view') {
        if (!data) return;
        this._mode = mode;

        if (this._type === 'setup' && data.type && data.type !== 'setup') {
            this.type = data.type;
        } else if (data.type && data.type !== this._type) {
            this.type = data.type;
        }

        this._data = JSON.parse(JSON.stringify(data));

        const block = this.closest('.block');
        if (block) {
            // Apply vertical alignment class
            if (this._data.valign) {
                block.classList.forEach(cls => { if (cls.startsWith('valign-')) block.classList.remove(cls); });
                block.classList.add(this._data.valign);
            }
            // Apply immediate horizontal text alignment
            if (this._data.halign) {
                block.style.textAlign = this._data.halign;
                const container = this.shadowRoot.querySelector('.omni-container');
                if (container) container.style.textAlign = this._data.halign;
            }
        }
        this.render();
    }
}

// Register the custom element
customElements.define('omni-block', OmniBlock);

// --- Global Helpers ---
window.escapeHTML = function (str) {
    if (!str) return '';
    return str.replace(/[<>"']/g, function (m) {
        return {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m];
    });
};

// --- Slide Link Modal Manager (Top-Layer <dialog> compatible with both inline & pop-out modals) ---
window.SlideLinkModalManager = {
    init: function () {
        if (document.getElementById('congen-slide-modal')) return;
        const html = `
            <dialog id="congen-slide-modal" style="border:none; border-radius:12px; padding:0; background:transparent; box-shadow:none; max-width:360px; width:90%; z-index:10050;">
                <div style="background:#ffffff; padding:24px; border-radius:12px; width:100%; box-sizing:border-box; box-shadow:0 20px 40px rgba(0,0,0,0.25); font-family:sans-serif; border:1px solid #e2e8f0;">
                    <h3 style="margin:0 0 16px 0; color:#1e293b; font-size:1.15rem;">Slide Link Settings</h3>
                    <label style="display:block; margin-bottom:6px; font-size:0.82rem; color:#64748b; font-weight:700; text-transform:uppercase;">Target Slide Number (e.g., 1, 2)</label>
                    <input type="number" id="slide-link-target-input" min="1" style="width:100%; padding:10px; border:1px solid #cbd5e1; border-radius:6px; margin-bottom:20px; box-sizing:border-box; font-size:1rem; outline:none;" onfocus="this.style.borderColor='#6366f1';" onblur="this.style.borderColor='#cbd5e1';">
                    
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                        <button type="button" id="slide-link-btn-remove" style="padding:8px 12px; background:#fee2e2; color:#ef4444; border:1px solid #fca5a5; border-radius:6px; cursor:pointer; font-size:0.82rem; font-weight:600; transition:0.2s; display:none;">Remove Link</button>
                        <div style="display:flex; gap:8px; margin-left:auto;">
                            <button type="button" id="slide-link-btn-cancel" style="padding:8px 14px; background:#f1f5f9; color:#475569; border:none; border-radius:6px; cursor:pointer; font-size:0.88rem; font-weight:600; transition:0.2s;">Cancel</button>
                            <button type="button" id="slide-link-btn-save" style="padding:8px 14px; background:#4f46e5; color:#ffffff; border:none; border-radius:6px; cursor:pointer; font-size:0.88rem; font-weight:600; transition:0.2s;">Save</button>
                        </div>
                    </div>
                </div>
            </dialog>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this.modal = document.getElementById('congen-slide-modal');
        this.input = document.getElementById('slide-link-target-input');
        this.btnSave = document.getElementById('slide-link-btn-save');
        this.btnCancel = document.getElementById('slide-link-btn-cancel');
        this.btnRemove = document.getElementById('slide-link-btn-remove');

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        this.btnCancel.addEventListener('click', () => this.close());
        this.btnSave.addEventListener('click', () => this.save());
        this.btnRemove.addEventListener('click', () => this.remove());
    },
    open: function (editor, existingLink = null, savedRangeOverride = null) {
        this.init();
        this.editor = editor;
        this.existingLink = existingLink;

        const shadowRoot = editor.getRootNode();
        const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
        if (savedRangeOverride) {
            this.savedRange = savedRangeOverride.cloneRange();
        } else if (sel && sel.rangeCount > 0) {
            this.savedRange = sel.getRangeAt(0).cloneRange();
        }

        if (existingLink) {
            this.input.value = parseInt(existingLink.dataset.slide, 10) + 1;
            this.btnRemove.style.display = 'block';
        } else {
            this.input.value = '';
            this.btnRemove.style.display = 'none';
        }

        if (!this.modal.open) {
            this.modal.showModal();
        }
        setTimeout(() => this.input.focus(), 50);
    },
    close: function () {
        if (this.modal && this.modal.open) {
            this.modal.close();
        }
        if (this.savedRange && this.editor) {
            const shadowRoot = this.editor.getRootNode();
            const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(this.savedRange);
            }
        }
        if (this.editor) this.editor.focus();
    },
    save: function () {
        const val = this.input.value;
        if (!val || isNaN(val)) return this.close();
        const targetIndex = Math.max(0, parseInt(val, 10) - 1);

        if (this.existingLink) {
            this.existingLink.dataset.slide = targetIndex;
        } else if (this.savedRange) {
            const span = document.createElement('span');
            span.className = 'slide-sync-link slide-link';
            span.dataset.slide = targetIndex;
            span.style.cssText = 'cursor: pointer;';
            span.textContent = this.savedRange.toString() || 'Slide Link';

            this.savedRange.deleteContents();
            this.savedRange.insertNode(span);

            const space = document.createTextNode('\u200B');
            span.parentNode.insertBefore(space, span.nextSibling);

            this.savedRange.setStartAfter(space);
            this.savedRange.collapse(true);
            const shadowRoot = this.editor.getRootNode();
            const sel = shadowRoot.getSelection ? shadowRoot.getSelection() : window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(this.savedRange);
            }
        }

        if (this.editor) {
            this.editor.dispatchEvent(new Event('input', { bubbles: true }));
            const host = this.editor.getRootNode().host;
            if (host && host.getData) {
                const data = host.getData();
                data.content = this.editor.innerHTML;
                host.setData(data, 'view');
                host.dispatchEvent(new CustomEvent('omni-data-change', { bubbles: true, composed: true }));
            }
        }
        this.close();
    },
    remove: function () {
        if (this.existingLink) {
            const textNode = document.createTextNode(this.existingLink.innerText);
            this.existingLink.parentNode.replaceChild(textNode, this.existingLink);
            if (this.editor) this.editor.dispatchEvent(new Event('input', { bubbles: true }));
        }
        this.close();
    }
};

// --- Unified Rich Text Editor Controller (Shared by Mini-Modal & Pop-out Modal) ---
window.ConGenRTE = {
    HIGHLIGHT_PRESETS: [
        { name: 'Yellow Highlight', color: '#fef08a' },
        { name: 'Green Highlight', color: '#bbf7d0' },
        { name: 'Blue Highlight', color: '#bae6fd' },
        { name: 'Pink Highlight', color: '#fbcfe8' }
    ],

    getSelection: function (editor) {
        const root = editor.getRootNode();
        return (root && typeof root.getSelection === 'function') ? root.getSelection() : window.getSelection();
    },

    captureRange: function (editor) {
        const sel = this.getSelection(editor);
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (editor.contains(range.commonAncestorContainer)) {
                return range.cloneRange();
            }
        }
        return null;
    },

    restoreRange: function (editor, savedRange) {
        if (!savedRange) return false;
        const sel = this.getSelection(editor);
        if (!sel) return false;
        try {
            sel.removeAllRanges();
            sel.addRange(savedRange);
            return true;
        } catch (e) {
            return false;
        }
    },

    hasRowSlideshow: function (rowId, fallbackHost) {
        let rowEl = rowId ? document.getElementById(rowId) : null;
        if (!rowEl && fallbackHost) {
            rowEl = fallbackHost.closest ? fallbackHost.closest('.block-row-wrapper') : null;
        }
        if (rowEl && rowEl.querySelector('.omni-block-type-slideshow')) return true;
        if (rowId && window.ConGenState && window.ConGenState.pages) {
            for (const p of window.ConGenState.pages) {
                const r = (p.rows || []).find(row => row.id === rowId);
                if (r && (r.blocks || []).some(b => b.type === 'slideshow')) return true;
            }
        }
        return false;
    },

    unwrapIfEmptyAttrs: function (el) {
        if (!el || !el.parentNode) return;
        const styleAttr = (el.getAttribute('style') || '').trim();
        if (!styleAttr) el.removeAttribute('style');
        if (el.tagName === 'FONT' && !el.hasAttributes()) {
            const parent = el.parentNode;
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
        } else if (el.tagName === 'SPAN' && !el.hasAttributes()) {
            const parent = el.parentNode;
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
        }
    },

    applyHighlight: function (editor, colorVal, savedRange) {
        this.restoreRange(editor, savedRange);
        const sel = this.getSelection(editor);
        const cmd = document.queryCommandSupported('hiliteColor') ? 'hiliteColor' : 'backColor';

        if (!colorVal || colorVal === 'transparent' || colorVal === 'reset') {
            // If cursor is collapsed inside a highlighted element, clear its ancestor highlight directly
            if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                let node = sel.anchorNode;
                let el = node && node.nodeType === 3 ? node.parentElement : node;
                while (el && el !== editor && editor.contains(el)) {
                    if (el.style && el.style.backgroundColor) {
                        el.style.backgroundColor = '';
                        const next = el.parentElement;
                        this.unwrapIfEmptyAttrs(el);
                        el = next;
                    } else {
                        el = el.parentElement;
                    }
                }
            } else {
                // Clear highlight across selection and strip transparent background-color styles
                document.execCommand(cmd, false, 'transparent');
                editor.querySelectorAll('[style*="background-color"]').forEach(el => {
                    const bg = (el.style.backgroundColor || '').replace(/\s+/g, '').toLowerCase();
                    if (bg === 'transparent' || bg === 'rgba(0,0,0,0)' || bg === 'initial' || bg === 'inherit') {
                        el.style.backgroundColor = '';
                        this.unwrapIfEmptyAttrs(el);
                    }
                });
            }
        } else {
            document.execCommand(cmd, false, colorVal);
        }
    },

    applyForeColor: function (editor, colorVal, savedRange) {
        this.restoreRange(editor, savedRange);
        const sel = this.getSelection(editor);

        if (!colorVal || colorVal === 'reset' || colorVal === 'inherit') {
            if (sel && sel.rangeCount > 0 && sel.isCollapsed) {
                let node = sel.anchorNode;
                let el = node && node.nodeType === 3 ? node.parentElement : node;
                while (el && el !== editor && editor.contains(el)) {
                    const next = el.parentElement;
                    if (el.tagName === 'FONT' && el.hasAttribute('color')) {
                        el.removeAttribute('color');
                        this.unwrapIfEmptyAttrs(el);
                    } else if (el.style && el.style.color) {
                        el.style.color = '';
                        this.unwrapIfEmptyAttrs(el);
                    }
                    el = next;
                }
            } else {
                // Use sentinel color #000001 then strip it so text cleanly inherits theme/heading color
                document.execCommand('foreColor', false, '#000001');
                editor.querySelectorAll('font[color="#000001"], [style*="color"]').forEach(el => {
                    if (el.tagName === 'FONT' && (el.getAttribute('color') || '').toLowerCase() === '#000001') {
                        el.removeAttribute('color');
                        this.unwrapIfEmptyAttrs(el);
                    } else if (el.style && el.style.color) {
                        const c = el.style.color.replace(/\s+/g, '').toLowerCase();
                        if (c === 'rgb(0,0,1)' || c === '#000001') {
                            el.style.color = '';
                            this.unwrapIfEmptyAttrs(el);
                        }
                    }
                });
            }
        } else {
            document.execCommand('foreColor', false, colorVal);
        }
    },

    applyFontName: function (editor, fontVal, savedRange) {
        this.restoreRange(editor, savedRange);
        const sel = this.getSelection(editor);
        if (!fontVal || fontVal === 'reset' || fontVal === 'default') {
            if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
                document.execCommand('fontName', false, 'ConGenResetFont');
                editor.querySelectorAll('font[face="ConGenResetFont"], [style*="ConGenResetFont"]').forEach(el => {
                    if (el.tagName === 'FONT') el.removeAttribute('face');
                    if (el.style && el.style.fontFamily) el.style.fontFamily = '';
                    this.unwrapIfEmptyAttrs(el);
                });
            }
        } else {
            document.execCommand('fontName', false, fontVal);
        }
    },

    applyFormatBlock: function (editor, tagVal, savedRange) {
        this.restoreRange(editor, savedRange);
        const tag = (tagVal || 'P').toUpperCase();
        document.execCommand('formatBlock', false, `<${tag}>`);
    },

    clearAllFormatting: function (editor, savedRange) {
        this.restoreRange(editor, savedRange);
        document.execCommand('removeFormat', false, null);
        this.applyHighlight(editor, 'transparent', this.captureRange(editor));
        this.applyForeColor(editor, 'reset', this.captureRange(editor));
    },

    openSlideLinkForEditor: function (editor, savedRange) {
        this.restoreRange(editor, savedRange);
        const sel = this.getSelection(editor);
        if (!sel || !sel.rangeCount) return;

        const anchor = sel.anchorNode;
        const parentEl = anchor ? (anchor.nodeType === 3 ? anchor.parentElement : anchor) : null;
        let existingLink = parentEl && parentEl.closest ? parentEl.closest('.slide-sync-link') : null;

        if (!existingLink) {
            const range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.nodeType === 1) {
                const innerLink = range.commonAncestorContainer.querySelector('.slide-sync-link');
                if (innerLink && range.intersectsNode(innerLink)) existingLink = innerLink;
            }
        }

        if (window.SlideLinkModalManager) {
            window.SlideLinkModalManager.open(editor, existingLink, savedRange);
        }
    },

    bindToolbar: function (toolbar, editor, options = {}) {
        let savedRange = null;

        const updateSavedRange = () => {
            const captured = this.captureRange(editor);
            if (captured) savedRange = captured;
        };

        editor.addEventListener('mouseup', updateSavedRange);
        editor.addEventListener('keyup', updateSavedRange);
        editor.addEventListener('focusout', updateSavedRange);

        const notifyChange = () => {
            updateSavedRange();
            if (typeof options.onChange === 'function') {
                options.onChange(editor.innerHTML);
            }
        };

        // Prevent toolbar buttons and swatches from stealing selection focus
        toolbar.addEventListener('mousedown', (e) => {
            updateSavedRange();
            if (e.target.closest('[data-cmd]') && !e.target.matches('select, input[type="color"]')) {
                e.preventDefault();
            }
        });

        toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-cmd], button[data-global-action]');
            if (!btn) return;

            // If clicking Expand to Pop-out Modal, flush inline state first and let global action proceed
            if (btn.dataset.globalAction) {
                notifyChange();
                if (options.isBubble) {
                    toolbar.style.display = 'none';
                }
                return;
            }

            const cmd = btn.dataset.cmd;
            const val = btn.dataset.val || null;
            if (!cmd) return;

            this.restoreRange(editor, savedRange);

            if (cmd === 'link') {
                if (window.LinkModalManager) {
                    window.LinkModalManager.open(editor);
                }
                return;
            }

            if (cmd === 'slideLink') {
                this.openSlideLinkForEditor(editor, savedRange);
                return;
            }

            if (cmd === 'hiliteColor') {
                this.applyHighlight(editor, val, savedRange);
                const picker = toolbar.querySelector('input.rte-color-picker[data-cmd="hiliteColor"], input.bubble-color-picker[data-cmd="hiliteColor"]');
                if (picker && val && val.startsWith('#')) picker.value = val;
                editor.focus();
                notifyChange();
                return;
            }

            if (cmd === 'foreColor') {
                this.applyForeColor(editor, val, savedRange);
                editor.focus();
                notifyChange();
                return;
            }

            if (cmd === 'removeFormat') {
                this.clearAllFormatting(editor, savedRange);
                editor.focus();
                notifyChange();
                return;
            }

            document.execCommand(cmd, false, val);
            editor.focus();
            notifyChange();
        });

        // Live color preview while dragging native color picker
        toolbar.addEventListener('input', (e) => {
            const target = e.target;
            if (!target.matches('input[type="color"][data-cmd]')) return;
            const cmd = target.dataset.cmd;
            const val = target.value;
            if (cmd === 'hiliteColor') {
                this.applyHighlight(editor, val, savedRange);
            } else if (cmd === 'foreColor') {
                this.applyForeColor(editor, val, savedRange);
            }
            if (typeof options.onChange === 'function') {
                options.onChange(editor.innerHTML);
            }
        });

        // Dropdowns (formatBlock, fontName) and final color picker commit
        toolbar.addEventListener('change', (e) => {
            const target = e.target;
            const cmd = target.dataset.cmd;
            if (!cmd) return;
            const val = target.value;

            if (cmd === 'formatBlock') {
                this.applyFormatBlock(editor, val, savedRange);
                target.value = 'P';
            } else if (cmd === 'fontName') {
                this.applyFontName(editor, val, savedRange);
                target.value = 'default';
            } else if (cmd === 'hiliteColor') {
                this.applyHighlight(editor, val, savedRange);
            } else if (cmd === 'foreColor') {
                this.applyForeColor(editor, val, savedRange);
            } else {
                this.restoreRange(editor, savedRange);
                document.execCommand(cmd, false, val);
            }

            editor.focus();
            notifyChange();
        });
    }
};

// --- Base Plugins ---

// 1. TEXT PLUGIN
OmniBlock.register({
    type: 'text',
    styles: `
        .bubble-toolbar { position: absolute; z-index: 1000; display: none; flex-direction: column; gap: 5px; min-width: 340px; max-width: 480px; background: rgba(15, 23, 42, 0.92); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); padding: 7px 9px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 12px 36px rgba(0,0,0,0.28); transition: opacity 0.2s ease-in-out; }
        .bubble-row { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
        .bubble-btn { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); padding: 4px 8px; cursor: pointer; border-radius: 5px; font-weight: 600; font-size: 0.78rem; color: #f8fafc; transition: all 0.15s ease; display: inline-flex; align-items: center; justify-content: center; line-height: 1.2; }
        .bubble-btn:hover { background: rgba(255,255,255,0.2); color: #ffffff; border-color: rgba(255,255,255,0.3); }
        .bubble-btn-reset { padding: 3px 6px; font-size: 0.74rem; color: #cbd5e1; }
        .bubble-btn-reset:hover { background: rgba(239, 68, 68, 0.25); color: #fecaca; border-color: rgba(248, 113, 113, 0.5); }
        .bubble-divider { width: 1px; height: 18px; background: rgba(255,255,255,0.2); margin: 0 3px; }
        .bubble-select { padding: 3px 6px; border: 1px solid rgba(255,255,255,0.25); border-radius: 5px; font-size: 0.75rem; background: rgba(15, 23, 42, 0.8); color: #f8fafc; outline: none; cursor: pointer; height: 24px; }
        .bubble-color-picker { width: 22px; height: 22px; padding: 0; border: 1px solid rgba(255,255,255,0.35); border-radius: 4px; cursor: pointer; background: transparent; }
        .bubble-swatch-btn { width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.45); cursor: pointer; padding: 0; transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .bubble-swatch-btn:hover { transform: scale(1.2); box-shadow: 0 0 8px rgba(255,255,255,0.4); }
        .bubble-group-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.04em; margin-right: 2px; user-select: none; }
        .rte-editor { flex-grow: 1; display: flex; flex-direction: column; min-height: 100px; padding: 10px; border: 1px dashed transparent; border-radius: 6px; outline: none; transition: border 0.2s; line-height: 1.6; }
        .rte-editor:empty::before { content: "Write your content here..."; color: #94a3b8; pointer-events: none; }
        .rte-editor:focus { border-color: var(--brand); background: transparent; box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.1); }
        :host { overflow: visible !important; }
        .omni-container { overflow: visible !important; }
        .rte-editor h1 { font-family: var(--h1-font, 'Arial'), sans-serif !important; color: var(--h1-color, var(--out-secondary, #111111)) !important; }
        .rte-editor h2 { font-family: var(--h2-font, 'Arial'), sans-serif !important; color: var(--h2-color, var(--out-secondary, #333333)) !important; }
        .rte-editor h3 { font-family: var(--h3-font, 'Arial'), sans-serif !important; color: var(--h3-color, var(--exp-text, #1e293b)) !important; }
        .rte-editor h4 { font-family: var(--h4-font, 'Arial'), sans-serif !important; color: var(--h4-color, var(--exp-text, #1e293b)) !important; }
    `,
    getViewTemplate: (data, context) => {
        const content = data?.content || '';
        const halign = data?.halign || 'left';
        const swatchesHtml = window.ConGenRTE.HIGHLIGHT_PRESETS.map(s =>
            `<button type="button" class="bubble-swatch-btn" data-cmd="hiliteColor" data-val="${s.color}" title="${s.name}" style="background:${s.color};"></button>`
        ).join('');

        return `
            <div class="bubble-toolbar">
                <div class="bubble-row">
                    <button type="button" class="bubble-btn" data-cmd="bold" title="Bold"><b>B</b></button>
                    <button type="button" class="bubble-btn" data-cmd="italic" title="Italic"><i>I</i></button>
                    <button type="button" class="bubble-btn" data-cmd="underline" title="Underline"><u>U</u></button>
                    <div class="bubble-divider"></div>
                    <button type="button" class="bubble-btn" data-cmd="insertUnorderedList" title="Bullet List">• List</button>
                    <button type="button" class="bubble-btn" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
                    <div class="bubble-divider"></div>
                    <button type="button" class="bubble-btn" data-cmd="link" title="Insert or Edit Link">🔗 Link</button>
                    <button type="button" class="bubble-btn" data-cmd="slideLink" title="Link to Slide">▤ Slide</button>
                    <div class="bubble-divider"></div>
                    <select class="bubble-select" data-cmd="formatBlock" title="Block Format">
                        <option value="P">Paragraph</option>
                        <option value="H1">Heading 1</option>
                        <option value="H2">Heading 2</option>
                        <option value="H3">Heading 3</option>
                        <option value="H4">Heading 4</option>
                    </select>
                    <select class="bubble-select" data-cmd="fontName" title="Font Family">
                        <option value="default">Font</option>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Trebuchet MS">Trebuchet</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times</option>
                        <option value="Courier New">Courier</option>
                        <option value="Impact">Impact</option>
                        <option value="reset">↺ Default Font</option>
                    </select>
                    <button type="button" class="bubble-btn" data-global-action="edit-block" data-page-id="${context.pageId}" data-row-id="${context.rowId}" data-block-id="${context.blockId}" title="Open Full Pop-out Editor" style="color: #a5b4fc; margin-left: auto;">⤢ Expand</button>
                </div>
                <div class="bubble-row" style="border-top: 1px solid rgba(255,255,255,0.12); padding-top: 5px;">
                    <span class="bubble-group-label" title="Text Color">Text</span>
                    <input type="color" class="bubble-color-picker" data-cmd="foreColor" title="Custom Text Color" value="#1e293b">
                    <button type="button" class="bubble-btn bubble-btn-reset" data-cmd="foreColor" data-val="reset" title="Reset Text Color">↺</button>
                    <div class="bubble-divider"></div>
                    <span class="bubble-group-label" title="Text Highlight">Highlight</span>
                    ${swatchesHtml}
                    <input type="color" class="bubble-color-picker" data-cmd="hiliteColor" title="Custom Highlight Color" value="#fef08a">
                    <button type="button" class="bubble-btn bubble-btn-reset" data-cmd="hiliteColor" data-val="transparent" title="Remove / Clear Highlight">↺</button>
                    <div class="bubble-divider"></div>
                    <button type="button" class="bubble-btn bubble-btn-reset" data-cmd="removeFormat" title="Clear All Formatting on Selection" style="margin-left: auto;">Tx Clear</button>
                </div>
            </div>
            <div class="ghost-highlight" style="position: absolute; z-index: 0; background: rgba(255, 235, 59, 0.4); border-radius: 8px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events: none; left: 5px; right: 5px; opacity: 0; top: 0; height: 0;"></div>
            <div class="rte-editor b-text-content" contenteditable="true" style="text-align: ${halign}; position: relative; z-index: 1;">${content}</div>
        `;
    },
    onViewRender: function (shadow, data) {
        const editor = shadow.querySelector('.rte-editor');
        const bubble = shadow.querySelector('.bubble-toolbar');

        // Dynamically migrate legacy style attributes to modern Unified Action Pill classes
        editor.querySelectorAll('.slide-sync-link').forEach(link => {
            link.classList.add('slide-link');
            link.style.color = '';
            link.style.borderBottom = '';
            link.style.paddingBottom = '';
            link.style.transition = '';
            link.style.background = '';
        });

        const syncInlineToState = () => {
            data.content = editor.innerHTML;
            shadow.host.dispatchEvent(new CustomEvent('omni-data-change', { bubbles: true, composed: true }));
            if (typeof window.requestAutoSave === 'function') window.requestAutoSave();
            if (typeof window.updatePreview === 'function') window.updatePreview();
        };

        window.ConGenRTE.bindToolbar(bubble, editor, {
            isBubble: true,
            onChange: () => {
                syncInlineToState();
                checkSelection();
            }
        });

        const checkSelection = () => {
            // Do not show bubble toolbar while user is interacting with a color picker inside the bubble
            if (bubble.contains(shadow.activeElement) && shadow.activeElement && shadow.activeElement.matches('input[type="color"], select')) {
                return;
            }

            const selection = window.ConGenRTE.getSelection(editor);

            // Show/hide the Slide button only when a slideshow lives in the same row
            const slideLinkBtn = bubble.querySelector('[data-cmd="slideLink"]');
            if (slideLinkBtn) {
                const rowId = shadow.host.dataset.rowId || shadow.host.closest('.block-row-wrapper')?.id;
                const hasSlideshow = window.ConGenRTE.hasRowSlideshow(rowId, shadow.host);
                slideLinkBtn.style.display = hasSlideshow ? '' : 'none';
            }

            if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
                const range = selection.getRangeAt(0);
                if (editor.contains(range.commonAncestorContainer)) {
                    const rect = range.getBoundingClientRect();
                    const hostRect = shadow.host.getBoundingClientRect();

                    bubble.style.display = 'flex';

                    const bubbleHeight = bubble.offsetHeight || 72;
                    const bubbleWidth = bubble.offsetWidth || 380;

                    let top = (rect.top - hostRect.top) - bubbleHeight - 8;
                    let left = (rect.left - hostRect.left) + (rect.width / 2) - (bubbleWidth / 2);

                    // Clamp horizontally so the mini-modal stays within the block/viewport bounds
                    if (left + bubbleWidth > hostRect.width - 4) {
                        left = hostRect.width - bubbleWidth - 4;
                    }
                    if (left < 4) {
                        left = 4;
                    }

                    if (top < -20) top = rect.bottom - hostRect.top + 8;

                    bubble.style.top = top + 'px';
                    bubble.style.left = left + 'px';
                    return;
                }
            }
            bubble.style.display = 'none';
        };

        editor.addEventListener('mouseup', checkSelection);
        editor.addEventListener('keyup', checkSelection);

        const rootNode = editor.getRootNode();
        if (editor._boundCheckSelection) {
            if (rootNode.removeEventListener) {
                rootNode.removeEventListener('selectionchange', editor._boundCheckSelection);
            } else {
                document.removeEventListener('selectionchange', editor._boundCheckSelection);
            }
        }
        editor._boundCheckSelection = checkSelection;

        if (rootNode.addEventListener) {
            rootNode.addEventListener('selectionchange', editor._boundCheckSelection);
        } else {
            document.addEventListener('selectionchange', editor._boundCheckSelection);
        }

        editor.addEventListener('input', () => {
            syncInlineToState();
            checkSelection();
        });

        // Setup Slide Sync Listeners
        const getRow = () => shadow.host.closest('.block-row-wrapper') || shadow.host.parentElement?.closest('.block-row-wrapper');

        editor.addEventListener('click', (e) => {
            const targetEl = e.target.nodeType === 3 ? e.target.parentNode : e.target;
            const link = targetEl.closest ? targetEl.closest('.slide-sync-link') : null;

            if (link) {
                const idx = parseInt(link.dataset.slide, 10);
                const activeRow = getRow();
                if (activeRow) {
                    activeRow.dispatchEvent(new CustomEvent('request-slide-change', { detail: { index: idx } }));
                }
            }
        });

        const bindSlideListener = () => {
            const activeRow = getRow();
            if (activeRow) {
                const ghost = shadow.querySelector('.ghost-highlight');
                if (shadow.host._onRowSlideChanged) activeRow.removeEventListener('slide-changed', shadow.host._onRowSlideChanged);
                activeRow.addEventListener('slide-changed', shadow.host._onRowSlideChanged = (e) => {
                    const currentIdx = e.detail.index;
                    let foundActive = false;

                    editor.querySelectorAll('.slide-sync-link').forEach(link => {
                        link.classList.remove('active');
                        if (parseInt(link.dataset.slide, 10) === currentIdx) {
                            foundActive = true;
                            link.classList.add('active');
                            const nextLink = editor.querySelector(`.slide-sync-link[data-slide="${currentIdx + 1}"]`);

                            let startY = editor.offsetTop + link.offsetTop - 10;
                            let actualBottom = link.offsetTop + link.offsetHeight;
                            if (editor.lastElementChild) {
                                actualBottom = editor.lastElementChild.offsetTop + editor.lastElementChild.offsetHeight;
                            }
                            let endY = nextLink ? (editor.offsetTop + nextLink.offsetTop - 10) : (editor.offsetTop + actualBottom + 10);

                            if (ghost) {
                                ghost.style.top = startY + 'px';
                                ghost.style.height = (endY - startY) + 'px';
                                ghost.style.opacity = '1';
                            }
                            if (!e.detail.isAutoInit) {
                                link.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        }
                    });

                    if (!foundActive && ghost) {
                        ghost.style.opacity = '0';
                    }
                });
            } else {
                setTimeout(bindSlideListener, 50);
            }
        };
        bindSlideListener();
    },
    getEditorTemplate: (data, context = {}) => {
        const halign = data?.halign || 'left';
        const hasSlideshow = window.ConGenRTE.hasRowSlideshow(context.rowId, null);
        const swatchesHtml = window.ConGenRTE.HIGHLIGHT_PRESETS.map(s =>
            `<button type="button" class="rte-swatch-btn" data-cmd="hiliteColor" data-val="${s.color}" title="${s.name}" style="background:${s.color};"></button>`
        ).join('');

        return `
        <div class="grid">
            <div>
               <label>Vertical Align</label>
               <select class="edit-valign">
                   <option value="valign-top" ${!data?.valign || data.valign === 'valign-top' ? 'selected' : ''}>Top</option>
                   <option value="valign-center" ${data?.valign === 'valign-center' ? 'selected' : ''}>Center</option>
                   <option value="valign-bottom" ${data?.valign === 'valign-bottom' ? 'selected' : ''}>Bottom</option>
               </select>
            </div>
            <div>
               <label>Horizontal Align</label>
               <select class="edit-halign">
                   <option value="left" ${halign === 'left' ? 'selected' : ''}>Left</option>
                   <option value="center" ${halign === 'center' ? 'selected' : ''}>Center</option>
                   <option value="right" ${halign === 'right' ? 'selected' : ''}>Right</option>
               </select>
            </div>
        </div>
        <div style="margin-top: 14px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 12px; text-transform: none; font-size: 0.85rem; color: #334155;">
                <input type="checkbox" class="edit-adv-html" ${data?.advancedHtml ? 'checked' : ''} style="margin: 0; cursor: pointer;">
                <strong>Allow Advanced HTML (Bypass Sanitization)</strong>
            </label>
            <label style="margin-bottom: 6px;">Pop-out Rich Text Editor</label>
            <div class="modal-rte-toolbar">
                <div class="modal-rte-row">
                    <button type="button" class="rte-btn" data-cmd="bold" title="Bold"><b>B</b></button>
                    <button type="button" class="rte-btn" data-cmd="italic" title="Italic"><i>I</i></button>
                    <button type="button" class="rte-btn" data-cmd="underline" title="Underline"><u>U</u></button>
                    <div class="toolbar-divider"></div>
                    <button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="Bullet List">• List</button>
                    <button type="button" class="rte-btn" data-cmd="insertOrderedList" title="Numbered List">1. List</button>
                    <div class="toolbar-divider"></div>
                    <button type="button" class="rte-btn" data-cmd="link" title="Insert or Edit Link">🔗 Link</button>
                    <button type="button" class="rte-btn" data-cmd="slideLink" title="Link to Slide" style="${hasSlideshow ? '' : 'display:none;'}">▤ Slide</button>
                    <div class="toolbar-divider"></div>
                    <select class="rte-select" data-cmd="formatBlock" title="Block Format">
                        <option value="P">Paragraph</option>
                        <option value="H1">Heading 1</option>
                        <option value="H2">Heading 2</option>
                        <option value="H3">Heading 3</option>
                        <option value="H4">Heading 4</option>
                    </select>
                    <select class="rte-select" data-cmd="fontName" title="Font Family">
                        <option value="default">Font Family</option>
                        <option value="Arial">Arial</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Trebuchet MS">Trebuchet MS</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Impact">Impact</option>
                        <option value="reset">↺ Default Font</option>
                    </select>
                </div>
                <div class="modal-rte-row" style="border-top: 1px solid #e2e8f0; padding-top: 6px;">
                    <span class="rte-group-label">Text Color</span>
                    <input type="color" class="rte-color-picker" data-cmd="foreColor" title="Custom Text Color" value="#1e293b">
                    <button type="button" class="rte-btn rte-btn-reset" data-cmd="foreColor" data-val="reset" title="Reset Text Color">↺ Reset</button>
                    <div class="toolbar-divider"></div>
                    <span class="rte-group-label">Highlight</span>
                    ${swatchesHtml}
                    <input type="color" class="rte-color-picker" data-cmd="hiliteColor" title="Custom Highlight Color" value="#fef08a">
                    <button type="button" class="rte-btn rte-btn-reset" data-cmd="hiliteColor" data-val="transparent" title="Remove / Clear Highlight">↺ Clear</button>
                    <div class="toolbar-divider"></div>
                    <button type="button" class="rte-btn rte-btn-reset" data-cmd="removeFormat" title="Clear All Formatting on Selection" style="margin-left: auto;">Tx Clear Format</button>
                </div>
            </div>
            <div class="modal-rte-editor" contenteditable="true" style="min-height: 260px; padding: 15px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; outline: none; line-height: 1.6; text-align: ${halign};">${data?.content || ''}</div>
        </div>
        <p style="margin-top: 12px; color: #64748b; font-size: 0.8rem;">
            <em>Tip: Changes in this pop-out editor stay synchronized with the inline workspace block. Use <strong>↺ Restore Original</strong> below to revert to the state before opening this modal.</em>
        </p>
        `;
    },
    onEditorRender: function (modalBody, data, context = {}) {
        const editor = modalBody.querySelector('.modal-rte-editor');
        const toolbar = modalBody.querySelector('.modal-rte-toolbar');
        const halignSelect = modalBody.querySelector('.edit-halign');
        const valignSelect = modalBody.querySelector('.edit-valign');
        const advHtmlCheck = modalBody.querySelector('.edit-adv-html');

        const triggerLiveSync = () => {
            if (context && typeof context.syncLive === 'function') {
                context.syncLive();
            }
        };

        window.ConGenRTE.bindToolbar(toolbar, editor, {
            isBubble: false,
            onChange: () => {
                triggerLiveSync();
            }
        });

        editor.addEventListener('input', () => {
            triggerLiveSync();
        });

        if (halignSelect) {
            halignSelect.addEventListener('change', (e) => {
                editor.style.textAlign = e.target.value;
                triggerLiveSync();
            });
        }
        if (valignSelect) {
            valignSelect.addEventListener('change', () => {
                triggerLiveSync();
            });
        }
        if (advHtmlCheck) {
            advHtmlCheck.addEventListener('change', () => {
                triggerLiveSync();
            });
        }
    },
    getEditorData: (modalBody) => ({
        valign: modalBody.querySelector('.edit-valign').value,
        halign: modalBody.querySelector('.edit-halign').value,
        content: modalBody.querySelector('.modal-rte-editor').innerHTML,
        advancedHtml: modalBody.querySelector('.edit-adv-html').checked
    })
});

// 2. IMAGE PLUGIN
OmniBlock.register({
    type: 'image',
    styles: `
        .img-wrapper { margin-top: 15px; margin-bottom: 20px; border: 1px dashed #ddd; border-radius: 8px; overflow: hidden; background: #fafafa; transition: all 0.2s; max-width: 100%; }
        .img-preview { max-width: 100%; display: block; object-fit: cover; background: #fff; }
        .img-settings { background: #fdfdfd; padding: 12px; border: 1px solid #eee; border-radius: 6px; margin-top: 10px; }
        .filename-display { font-size: 0.8rem; color: #3498db; font-weight: bold; margin-top: 5px; }
        
        /* Editor Constraints (Replaces index.html hacks) */
        :host(.omni-block-editor-mode) .img-wrapper { max-height: 400px; }
        :host(.omni-block-editor-mode) .img-preview { max-height: 400px; }
        
        /* Device Frames */
        .img-wrapper.frame-mobile { width: fit-content !important; margin: 0 auto !important; border-width: 12px 6px 40px 6px !important; border-color: #222 !important; border-style: solid !important; border-radius: 20px !important; background: #111 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important; }
        .img-wrapper.frame-mobile img { border-radius: 2px !important; object-fit: cover !important; }
        .img-wrapper.frame-tablet { width: fit-content !important; margin: 0 auto !important; border-width: 20px !important; border-color: #222 !important; border-style: solid !important; border-radius: 12px !important; background: #111 !important; box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important; }
        .img-wrapper.frame-tablet img { border-radius: 2px !important; object-fit: cover !important; }
        .img-wrapper.frame-browser { border-top: 24px solid #eaeaea !important; border-left: 1px solid #ddd !important; border-right: 1px solid #ddd !important; border-bottom: 1px solid #ddd !important; border-radius: 6px 6px 0 0 !important; background: #fff !important; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important; }
        .img-wrapper.frame-browser::before { content: '● ● ●'; position: absolute; top: -19px; left: 10px; color: #bbb; font-size: 10px; letter-spacing: 2px; }
        .img-caption { text-align: center; font-size: 0.9rem; color: #555; margin-top: 8px; padding: 5px; font-style: italic; }
    `,
    applyImageStyles: (wrapper, img, data, mode = 'view') => {
        if (!wrapper || !img) return;
        const objectFit = data?.objectFit || 'natural';
        const frame = data?.imgFrame || 'none';
        const zoom = data?.imgZoom || 1;
        const fX = data?.imgFocalX || 50;
        const fY = data?.imgFocalY || 50;
        const border = data?.imgBorder || 0;
        const color = data?.imgBorderColor || '#cccccc';
        const radius = data?.imgRadius || 6;
        let shadowVal = 'none';
        if (data?.imgShadow === 'subtle') shadowVal = '0 2px 10px rgba(0,0,0,0.1)';
        if (data?.imgShadow === 'medium') shadowVal = '0 5px 20px rgba(0,0,0,0.15)';
        if (data?.imgShadow === 'deep') shadowVal = '0 10px 40px rgba(0,0,0,0.2)';

        img.style.transform = `scale(${zoom})`;
        img.style.transformOrigin = `${fX}% ${fY}%`;
        img.style.objectPosition = `${fX}% ${fY}%`;

        if (mode === 'edit') {
            // UI BUG FIX: Force rigid constraints for modal preview
            img.style.objectFit = 'contain';
            wrapper.style.height = '40vh';
            wrapper.style.overflow = 'hidden';
            img.style.width = '100%';
            img.style.height = '100%';
        } else {
            // 1. Establish the bounding box for the grid column
            wrapper.style.width = '100%';
            wrapper.style.maxWidth = '100%';
            wrapper.style.maxHeight = '800px';
            wrapper.style.overflow = 'hidden';
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';

            // 2. Scale the image to fit the box proportionally
            img.style.display = 'block';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '800px';

            // Use 'auto' to allow the image to shrink proportionally
            // if either the width or the 800px height limit is hit.
            img.style.width = 'auto';
            img.style.height = '100%';
            img.style.margin = '0 auto';

            // 3. Ensure the full image is always visible
            img.style.objectFit = 'contain';

            const objectFitData = data?.objectFit || 'natural';
            // Maintain 'contain' logic unless 'cover' is explicitly requested
            if (objectFitData === 'cover') {
                img.style.objectFit = 'cover';
                img.style.width = '100%';
            } else {
                img.style.objectFit = 'contain';
            }

            if (frame !== 'none') {
                img.style.height = '100%';
                img.style.objectFit = 'cover';
            }
        }

        wrapper.className = 'img-wrapper';
        if (frame !== 'none') wrapper.classList.add(`frame-${frame}`);

        // Apply horizontal alignment via flexbox if needed
        const halign = data?.halign || 'left';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = halign === 'center' ? 'center' : (halign === 'right' ? 'flex-end' : 'flex-start');

        if (frame === 'none') {
            wrapper.style.border = border > 0 ? `${border}px solid ${color}` : '1px dashed #ddd';
            wrapper.style.borderRadius = `${radius}px`;
            wrapper.style.boxShadow = shadowVal;
        } else {
            wrapper.style.border = '';
            wrapper.style.borderRadius = '';
            wrapper.style.boxShadow = '';
        }
    },
    getViewTemplate: (data) => {
        let captionHtml = '';
        if (data?.captionEnabled && data?.captionText) {
            const safeText = window.escapeHTML ? window.escapeHTML(data.captionText) : data.captionText;
            if (data?.captionStyle === 'uno-card') {
                // The Layered Card Look
                return `
                    <div style="position: relative; padding-bottom: 60px; margin-top: 15px; display: inline-block; width: fit-content; max-width: 100%;">
                        <div class="img-wrapper uno-card-img" style="position: relative; z-index: 2; margin: 0; border-radius: 24px 24px 24px 0; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                            <img class="img-preview" src="${window.ConGenAPI.getAsset(data.content) || data.content || ''}" style="width: 100%; display: ${data.content ? 'block' : 'none'};">
                        </div>
                        <div class="uno-card-caption" style="position: absolute; bottom: 0; left: 0; right: 0; background: #a5a5a5; color: #111; padding: 30px 20px 15px 20px; border-radius: 0 0 24px 24px; z-index: 1; font-weight: 500; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                            ${safeText}
                        </div>
                    </div>
                `;
            } else {
                captionHtml = `<div class="img-caption" style="text-align: center; font-size: 0.9rem; color: #555; margin-top: 8px; padding: 5px; font-style: italic;">${safeText}</div>`;
            }
        }

        // Return standard wrapper if no Uno-Card (formerly Bananagram) style
        return `
            <div class="img-wrapper" part="img-wrapper" style="${data?.content ? '' : 'display: none; min-height: 100px;'}">
                 ${data?.linkEnabled && data?.target ? `<a href="#${data.target}" style="display: block; width: 100%; height: 100%;"><img class="img-preview" part="img"></a>` : `<img class="img-preview" part="img">`}
            </div>
            ${!data?.content ? '<input type="file" accept="image/*" class="inline-file-input" style="display: block; width: 100%; padding: 20px; text-align: center; color: #999; border: 1px dashed #ccc; border-radius: 8px; cursor: pointer; background: #fafafa; font-family: inherit;">' : ''}
            ${captionHtml}
        `;
    },
    onViewRender: function (shadow, data) {
        const preview = shadow.querySelector('.img-preview');
        if (!preview) return;
        const wrapper = shadow.querySelector('.img-wrapper');
        const fileInput = shadow.querySelector('.inline-file-input');

        if (data?.content) {
            preview.src = window.ConGenAPI.getAsset(data.content) || data.content;
            preview.style.display = 'block';
        }
        this.applyImageStyles(wrapper, preview, data, 'view');

        if (fileInput) {
            fileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (re) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width, height = img.height;
                        const MAX_SIZE = 1200;
                        if (width > height && width > MAX_SIZE) {
                            height = Math.round(height * (MAX_SIZE / width)); width = MAX_SIZE;
                        } else if (height > MAX_SIZE) {
                            width = Math.round(width * (MAX_SIZE / height)); height = MAX_SIZE;
                        }
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                        const quality = mimeType === 'image/jpeg' ? 0.7 : undefined;
                        const base64 = canvas.toDataURL(mimeType, quality);
                        data.content = window.ConGenAPI.registerAsset(base64);
                        data.filename = file.name;
                        data.imgOrigW = width;
                        data.imgOrigH = height;

                        // 1. Instantly update the UI locally
                        shadow.host.setData(data, 'view');
                        // 2. Silently dispatch the save event to the Core State
                        shadow.host.dispatchEvent(new CustomEvent('omni-data-change', { bubbles: true, composed: true }));
                    };
                    img.src = re.target.result;
                };
                reader.readAsDataURL(file);
            };
        }
    },
    getEditorTemplate: function (data) {
        // Build the Mini Asset Gallery HTML (only when assets exist)
        const assets = window.ConGenState?.assets || {};
        const assetKeys = Object.keys(assets);
        const galleryHtml = assetKeys.length > 0 ? `
            <div class="mini-asset-gallery-section" style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.8rem; color:#555;">&#128193; Asset Library &mdash; click to use</label>
                <div class="mini-asset-gallery" style="display:flex; flex-direction:row; gap:8px; overflow-x:auto; padding:6px 0; scrollbar-width:thin;">
                    ${assetKeys.map(id => `<img
                        class="mini-asset-thumb"
                        data-asset-id="${id}"
                        src="${assets[id]}"
                        title="${id}"
                        style="width:72px; height:52px; object-fit:cover; border-radius:6px; border:2px solid #e2e8f0; cursor:pointer; flex-shrink:0; transition:border-color 0.2s, transform 0.15s;"
                        onmouseover="this.style.borderColor='#6366f1';this.style.transform='scale(1.07)';"
                        onmouseout="this.style.borderColor='#e2e8f0';this.style.transform='scale(1)';"
                    >`).join('')}
                </div>
            </div>
        ` : '';

        return `
        <style>
            ${this.styles}
        </style>
        <div style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" class="b-img-asset-library-toggle">
                <strong>Asset Library</strong>
            </label>
            <div class="asset-library-wrapper" style="display: none; margin-top: 10px;">
                ${galleryHtml}
                <input type="file" accept="image/*" class="b-file-input">
                <div class="filename-display">${data?.filename ? 'Loaded: ' + data.filename : ''}</div>
            </div>
        </div>
        <input type="hidden" class="b-base64">
        <input type="hidden" class="b-filename" value="${data?.filename || ''}">
        <input type="hidden" class="b-img-orig-w" value="${data?.imgOrigW || ''}">
        <input type="hidden" class="b-img-orig-h" value="${data?.imgOrigH || ''}">
        
        <div class="img-main-layout" style="${data?.content ? 'display: flex;' : 'display: none;'} flex-direction: row; gap: 24px; align-items: flex-start; flex-wrap: wrap; margin-bottom: 20px;">
            <div class="img-wrapper" part="img-wrapper" style="flex: 1 1 50%; min-width: 300px;">
                 <img class="img-preview" part="img" src="${window.ConGenAPI.getAsset(data.content) || data.content || ''}">
            </div>

            <div class="img-settings" style="display: flex; flex-direction: column; gap: 16px; flex: 0 0 250px;">
                <div>
                   <label>Vertical Alignment</label>
                   <select class="edit-valign">
                       <option value="valign-top" ${!data?.valign || data.valign === 'valign-top' ? 'selected' : ''}>Top</option>
                       <option value="valign-center" ${data?.valign === 'valign-center' ? 'selected' : ''}>Center</option>
                       <option value="valign-bottom" ${data?.valign === 'valign-bottom' ? 'selected' : ''}>Bottom</option>
                   </select>
                </div>
                <div>
                   <label>Horizontal Align</label>
                   <select class="edit-halign">
                       <option value="left" ${data?.halign === 'left' || !data?.halign ? 'selected' : ''}>Left</option>
                       <option value="center" ${data?.halign === 'center' ? 'selected' : ''}>Center</option>
                       <option value="right" ${data?.halign === 'right' ? 'selected' : ''}>Right</option>
                   </select>
                </div>
                <div>
                   <label>Object Fit</label>
                   <select class="b-img-fit">
                       <option value="natural" ${data?.objectFit === 'natural' || !data?.objectFit ? 'selected' : ''}>Natural</option>
                       <option value="contain" ${data?.objectFit === 'contain' ? 'selected' : ''}>Contain</option>
                       <option value="cover" ${data?.objectFit === 'cover' ? 'selected' : ''}>Cover</option>
                   </select>
                </div>
            </div>
        </div>

        <div class="img-advanced-sections" style="${data?.content ? 'display: block;' : 'display: none;'}">

            <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
                <div style="display: flex; gap: 2rem; margin-bottom: 8px; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="b-img-fine-tune-toggle">
                        <strong>Fine-Tuning</strong>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="b-img-border-toggle">
                        <strong>Border Settings</strong>
                    </label>
                </div>

                <div class="fine-tune-wrapper" style="display: none; margin-top: 10px;">
                    <div class="grid">
                        <div class="focal-controls">
                            <label>Focal X <button class="btn reset-btn" style="float:right; padding: 0 4px;" title="Reset Focal X" data-reset="focal-x">↺</button></label>
                            <input type="range" class="b-img-focal-x" min="0" max="100" value="${data?.imgFocalX || 50}">
                        </div>
                        <div class="focal-controls">
                            <label>Focal Y <button class="btn reset-btn" style="float:right; padding: 0 4px;" title="Reset Focal Y" data-reset="focal-y">↺</button></label>
                            <input type="range" class="b-img-focal-y" min="0" max="100" value="${data?.imgFocalY || 50}">
                        </div>
                        <div>
                            <label>Zoom <button class="btn reset-btn" style="float:right; padding: 0 4px;" title="Reset Zoom" data-reset="zoom">↺</button></label>
                            <input type="range" class="b-img-zoom" min="1" max="3" step="0.1" value="${data?.imgZoom || 1}">
                        </div>
                    </div>
                </div>

                <div class="border-settings-wrapper" style="display: none; margin-top: 10px;">
                    <div class="grid">
                        <div>
                            <label>Device Frame</label>
                            <select class="b-img-frame">
                                <option value="none" ${data?.imgFrame === 'none' ? 'selected' : ''}>None</option>
                                <option value="mobile" ${data?.imgFrame === 'mobile' ? 'selected' : ''}>📱 Mobile</option>
                                <option value="tablet" ${data?.imgFrame === 'tablet' ? 'selected' : ''}>💻 Tablet</option>
                                <option value="browser" ${data?.imgFrame === 'browser' ? 'selected' : ''}>🌐 Browser</option>
                            </select>
                        </div>
                        <div>
                            <label>Border (px)</label>
                            <input type="number" class="b-img-border" value="${data?.imgBorder || 0}" min="0">
                        </div>
                        <div>
                            <label>Border Color</label>
                            <input type="color" class="b-img-border-color" value="${data?.imgBorderColor || '#cccccc'}">
                        </div>
                        <div>
                            <label>Radius</label>
                            <input type="number" class="b-img-radius" value="${data?.imgRadius || 6}" min="0">
                        </div>
                        <div>
                            <label>Shadow</label>
                            <select class="b-img-shadow">
                                <option value="none" ${data?.imgShadow === 'none' ? 'selected' : ''}>None</option>
                                <option value="subtle" ${data?.imgShadow === 'subtle' ? 'selected' : ''}>Subtle</option>
                                <option value="medium" ${data?.imgShadow === 'medium' ? 'selected' : ''}>Medium</option>
                                <option value="deep" ${data?.imgShadow === 'deep' ? 'selected' : ''}>Deep</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" class="b-img-caption-toggle" ${data?.captionEnabled ? 'checked' : ''}>
                <strong>Enable Caption</strong>
            </label>
            <div class="caption-input-wrapper" style="display: ${data?.captionEnabled ? 'block' : 'none'}; margin-top: 10px;">
                <label>Caption Text</label>
                <textarea class="b-img-caption-text" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px;">${data?.captionText || ''}</textarea>
            </div>
            <div class="caption-style-wrapper" style="display: ${data?.captionEnabled ? 'block' : 'none'}; margin-top: 10px;">
                <label>Caption Style</label>
                <select class="b-img-caption-style">
                    <option value="standard" ${data?.captionStyle === 'standard' || !data?.captionStyle ? 'selected' : ''}>Standard (Centered Text)</option>
                    <option value="uno-card" ${data?.captionStyle === 'uno-card' ? 'selected' : ''}>Uno Card (Layered Style)</option>
                </select>
            </div>
        </div>
        <div style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" class="b-img-link-toggle" ${data?.linkEnabled ? 'checked' : ''}>
                <strong>Make Image Clickable (Link)</strong>
            </label>
            <div class="img-link-wrapper" style="display: ${data?.linkEnabled ? 'block' : 'none'}; margin-top: 10px;">
                <label>Target Page</label>
                <select class="b-img-target">
                    <option value="">-- Select Target --</option>
                    ${window.ConGenState && window.ConGenState.pages ? window.ConGenState.pages.map((p, i) => `<option value="sec_${i}" ${data?.target === 'sec_' + i ? 'selected' : ''}>${p.title}</option>`).join('') : ''}
                </select>
            </div>
        </div>
        </div>
        </div>
    `;
    },
    getEditorData: (modalBody) => {
        const getVal = (sel) => modalBody.querySelector(sel)?.value;
        const getCheck = (sel) => modalBody.querySelector(sel)?.checked;

        let imgOrigW = getVal('.b-img-orig-w');
        let imgOrigH = getVal('.b-img-orig-h');

        return {
            content: getVal('.b-base64'),
            filename: getVal('.b-filename'),
            valign: getVal('.edit-valign'),
            halign: getVal('.edit-halign'),
            objectFit: getVal('.b-img-fit'),
            imgFrame: getVal('.b-img-frame'),
            imgOrigW: imgOrigW,
            imgOrigH: imgOrigH,
            imgFocalX: getVal('.b-img-focal-x'),
            imgFocalY: getVal('.b-img-focal-y'),
            imgBorder: getVal('.b-img-border'),
            imgBorderColor: getVal('.b-img-border-color'),
            imgRadius: getVal('.b-img-radius'),
            imgShadow: getVal('.b-img-shadow'),
            imgZoom: getVal('.b-img-zoom'),
            captionEnabled: getCheck('.b-img-caption-toggle'),
            captionText: getVal('.b-img-caption-text'),
            captionStyle: modalBody.querySelector('.b-img-caption-style')?.value || 'standard',
            linkEnabled: getCheck('.b-img-link-toggle'),
            target: getVal('.b-img-target')
        };
    },
    onEditorRender: function (modalBody, data) {
        const fileInput = modalBody.querySelector('.b-file-input');
        const img = modalBody.querySelector('.img-preview');
        const settings = modalBody.querySelector('.img-settings');
        const wrapper = modalBody.querySelector('.img-wrapper');
        const mainLayout = modalBody.querySelector('.img-main-layout');
        const advSections = modalBody.querySelector('.img-advanced-sections');
        const base64Input = modalBody.querySelector('.b-base64');

        if (data?.content) {
            base64Input.value = data.content;
            img.src = window.ConGenAPI.getAsset(data.content) || data.content;
        }

        // Mini Asset Gallery — deferred so updateStyle() is in scope
        const _bindGallery = () => {
            modalBody.querySelectorAll('.mini-asset-thumb').forEach(thumb => {
                thumb.addEventListener('click', () => {
                    const assetId = thumb.dataset.assetId;
                    const base64 = window.ConGenState?.assets?.[assetId];
                    if (!base64) return;
                    base64Input.value = assetId;
                    modalBody.querySelector('.b-filename').value = assetId;
                    modalBody.querySelector('.filename-display').innerText = 'Loaded: ' + assetId;
                    img.src = base64;
                    if (mainLayout) mainLayout.style.display = 'flex';
                    if (advSections) advSections.style.display = 'block';
                    updateStyle();
                });
            });
        };

        const valignSelect = modalBody.querySelector('.edit-valign');
        const halignSelect = modalBody.querySelector('.edit-halign');
        const fitSelect = modalBody.querySelector('.b-img-fit');
        const frameSelect = modalBody.querySelector('.b-img-frame');
        const origWInput = modalBody.querySelector('.b-img-orig-w');
        const origHInput = modalBody.querySelector('.b-img-orig-h');
        const focalXInput = modalBody.querySelector('.b-img-focal-x');
        const focalYInput = modalBody.querySelector('.b-img-focal-y');
        const zoomInput = modalBody.querySelector('.b-img-zoom');
        const borderInput = modalBody.querySelector('.b-img-border');
        const borderColorInput = modalBody.querySelector('.b-img-border-color');
        const radiusInput = modalBody.querySelector('.b-img-radius');
        const shadowSelect = modalBody.querySelector('.b-img-shadow');

        const updateStyle = () => {
            const currentData = this.getEditorData(modalBody);
            this.applyImageStyles(wrapper, img, currentData, 'edit');
        };

        // Bind gallery now that updateStyle is in scope
        _bindGallery();

        modalBody.querySelectorAll('.reset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.reset;
                if (type === 'focal-x') {
                    focalXInput.value = 50;
                    updateStyle();
                } else if (type === 'focal-y') {
                    focalYInput.value = 50;
                    updateStyle();
                } else if (type === 'zoom') {
                    zoomInput.value = 1;
                    updateStyle();
                }
            });
        });

        const selectInputs = [frameSelect, shadowSelect, fitSelect, valignSelect, halignSelect];

        const fastUpdateInputs = [focalXInput, focalYInput, borderInput, borderColorInput, radiusInput, zoomInput];
        fastUpdateInputs.forEach(i => i.addEventListener('input', updateStyle));

        selectInputs.forEach(s => s.addEventListener('change', updateStyle));

        if (data?.content) updateStyle();

        fileInput.addEventListener('change', (e) => {
            if (window.ConGenAPI && window.ConGenAPI.processImageFile) {
                const file = e.target.files[0];
                if (!file) return;
                window.ConGenAPI.processImageFile(file).then(({ assetId, dataUrl }) => {
                    modalBody.querySelector('.b-base64').value = assetId;
                    modalBody.querySelector('.b-filename').value = file.name;
                    modalBody.querySelector('.filename-display').innerText = 'Loaded: ' + file.name;
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        origWInput.value = tempImg.naturalWidth;
                        origHInput.value = tempImg.naturalHeight;
                        img.src = dataUrl;
                        const mainLayout = modalBody.querySelector('.img-main-layout');
                        const advSections = modalBody.querySelector('.img-advanced-sections');
                        if (mainLayout) mainLayout.style.display = 'flex';
                        if (advSections) advSections.style.display = 'block';
                        updateStyle();
                    };
                    tempImg.src = dataUrl;
                });
                return;
            }
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (re) => {
                const base64 = re.target.result;
                modalBody.querySelector('.b-base64').value = window.ConGenAPI.registerAsset(base64);
                modalBody.querySelector('.b-filename').value = file.name;
                modalBody.querySelector('.filename-display').innerText = 'Loaded: ' + file.name;

                const tempImg = new Image();
                tempImg.onload = () => {
                    const w = tempImg.naturalWidth;
                    const h = tempImg.naturalHeight;
                    origWInput.value = w;
                    origHInput.value = h;
                    // widthInput.value = w; // These variables are not defined in the original code
                    // heightInput.value = h; // These variables are not defined in the original code

                    img.src = base64;
                    const mainLayout = modalBody.querySelector('.img-main-layout');
                    const advSections = modalBody.querySelector('.img-advanced-sections');
                    if (mainLayout) mainLayout.style.display = 'flex';
                    if (advSections) advSections.style.display = 'block';
                    updateStyle();
                };
                tempImg.src = base64;
            };
            reader.readAsDataURL(file);
        });

        const captionToggle = modalBody.querySelector('.b-img-caption-toggle');
        const captionWrapper = modalBody.querySelector('.caption-input-wrapper');
        const captionStyleWrapper = modalBody.querySelector('.caption-style-wrapper');
        if (captionToggle) {
            captionToggle.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                if (captionWrapper) captionWrapper.style.display = isChecked ? 'block' : 'none';
                if (captionStyleWrapper) captionStyleWrapper.style.display = isChecked ? 'block' : 'none';
                updateStyle();
            });
        }

        const assetLibraryToggle = modalBody.querySelector('.b-img-asset-library-toggle');
        const assetLibraryWrapper = modalBody.querySelector('.asset-library-wrapper');
        if (assetLibraryToggle) {
            assetLibraryToggle.addEventListener('change', (e) => {
                assetLibraryWrapper.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        const fineTuneToggle = modalBody.querySelector('.b-img-fine-tune-toggle');
        const fineTuneWrapper = modalBody.querySelector('.fine-tune-wrapper');
        if (fineTuneToggle) {
            fineTuneToggle.addEventListener('change', (e) => {
                fineTuneWrapper.style.display = e.target.checked ? 'block' : 'none';
            });
        }

        const borderToggle = modalBody.querySelector('.b-img-border-toggle');
        const borderWrapper = modalBody.querySelector('.border-settings-wrapper');
        if (borderToggle) {
            borderToggle.addEventListener('change', (e) => {
                borderWrapper.style.display = e.target.checked ? 'block' : 'none';
            });
        }
        modalBody.querySelector('.b-img-caption-style')?.addEventListener('change', updateStyle);
        modalBody.querySelector('.b-img-caption-text').addEventListener('input', updateStyle);

        const linkToggle = modalBody.querySelector('.b-img-link-toggle');
        const linkWrapper = modalBody.querySelector('.img-link-wrapper');
        if (linkToggle) {
            linkToggle.addEventListener('change', (e) => {
                if (linkWrapper) linkWrapper.style.display = e.target.checked ? 'block' : 'none';
                updateStyle();
            });
        }
    }
});

// 3. SPACER PLUGIN
OmniBlock.register({
    type: 'spacer',
    styles: `
        .spacer-preview { width: 100%; display: flex; align-items: center; justify-content: center; min-height: 50px; }
    `,
    getViewTemplate: (data) => {
        const size = data?.size || 50;
        const thickness = data?.thickness || 2;
        const orientation = data?.orientation || 'vertical';
        const style = data?.style || 'solid';
        const color = data?.color || '#000000';

        if (style === 'whitespace') {
            const icon = orientation === 'horizontal' ? '↕' : '↔';
            return `<div class="spacer-preview" style="background: #f9f9f9; border: 1px dashed #ccc; height: ${orientation === 'horizontal' ? size + 'px' : '100%'}; width: ${orientation === 'vertical' ? size + 'px' : '100%'}; margin: 0 auto; color: #999; font-size: 0.85rem; white-space: nowrap; overflow: hidden; display: flex; align-items: center; justify-content: center;">${icon} ${size}px</div>`;
        }

        if (orientation === 'horizontal') {
            return `<div class="spacer-preview" style="padding: 10px 0;"><div style="width: 100%; border-top: ${thickness}px ${style} ${color};"></div></div>`;
        } else {
            return `<div class="spacer-preview" style="height: 100%; min-height: 150px;"><div style="height: 100%; border-left: ${thickness}px ${style} ${color}; margin: 0 auto;"></div></div>`;
        }
    },
    getEditorTemplate: (data) => {
        const size = data?.size || 50;
        const thickness = data?.thickness || 2;
        const orientation = data?.orientation || 'vertical';
        const style = data?.style || 'solid';
        const color = data?.color || '#000000';
        return `
            <div class="grid">
                <div>
                    <label>Whitespace Size (px)</label>
                    <input type="number" class="b-spacer-size" value="${size}" title="Used only for Invisible Whitespace">
                </div>
                <div>
                    <label>Line Thickness (px)</label>
                    <input type="number" class="b-spacer-thickness" value="${thickness}" title="Used only for visible lines">
                </div>
                <div>
                    <label>Orientation</label>
                    <select class="b-spacer-orientation">
                        <option value="horizontal" ${orientation === 'horizontal' ? 'selected' : ''}>Horizontal</option>
                        <option value="vertical" ${orientation === 'vertical' ? 'selected' : ''}>Vertical</option>
                    </select>
                </div>
                <div>
                    <label>Line Style</label>
                    <select class="b-spacer-style">
                        <option value="whitespace" ${style === 'whitespace' ? 'selected' : ''}>Invisible Whitespace</option>
                        <option value="solid" ${style === 'solid' ? 'selected' : ''}>Solid Line</option>
                        <option value="dashed" ${style === 'dashed' ? 'selected' : ''}>Dashed Line</option>
                        <option value="dotted" ${style === 'dotted' ? 'selected' : ''}>Dotted Line</option>
                    </select>
                </div>
                <div>
                    <label>Line Color</label>
                    <input type="color" class="b-spacer-color" value="${color}">
                </div>
            </div>
        `;
    },
    getEditorData: (modalBody) => ({
        size: modalBody.querySelector('.b-spacer-size').value,
        thickness: modalBody.querySelector('.b-spacer-thickness').value,
        orientation: modalBody.querySelector('.b-spacer-orientation').value,
        style: modalBody.querySelector('.b-spacer-style').value,
        color: modalBody.querySelector('.b-spacer-color').value
    })
});

// 4. SETUP PLUGIN
OmniBlock.register({
    type: 'setup',
    styles: `
        .setup-container { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; border: 1px dashed #ccc; border-radius: 8px; background: #fafafa; }
        .setup-container p { color: #666; margin-bottom: 15px; font-weight: bold; }
        .setup-select { padding: 10px 15px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem; cursor: pointer; min-width: 200px; }
    `,
    getViewTemplate: () => `
        <div class="setup-container">
            <p>Select Block Type</p>
            <select class="setup-select">
                <option value="" disabled selected>-- Choose Content Type --</option>
                <option value="text">Text Article</option>
                <option value="image">Image Block</option>
                <option value="spacer">Whitespace Spacer</option>
            </select>
        </div>
    `,
    onViewRender: function (shadow, data) {
        const preview = shadow.querySelector('.img-preview');
        if (!preview) return;
        const wrapper = shadow.querySelector('.img-wrapper');
        const fileInput = shadow.querySelector('.inline-file-input');

        if (data?.content) {
            preview.src = data.content;
            preview.style.display = 'block'; // Ensure it becomes visible
        }
        this.applyImageStyles(wrapper, preview, data, 'view');

        // NEW: Self-contained event listener for file uploads
        if (fileInput) {
            fileInput.onchange = function (e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (re) => {
                    const base64 = re.target.result;
                    let assetId = base64;
                    if (window.ConGenAPI && window.ConGenAPI.registerAsset) {
                        assetId = window.ConGenAPI.registerAsset(base64);
                    }
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        // Update the data object directly
                        data.content = assetId;
                        data.filename = file.name;
                        data.imgOrigW = tempImg.naturalWidth;
                        data.imgOrigH = tempImg.naturalHeight;
                        data.imgWidth = tempImg.naturalWidth;
                        data.imgHeight = tempImg.naturalHeight;

                        // Tell the ConGen 6.0 Renderer that this block's data changed
                        shadow.host.dispatchEvent(new CustomEvent('omni-data-change', { bubbles: true, composed: true }));
                    };
                    tempImg.src = base64;
                };
                reader.readAsDataURL(file);
            };
        }
    },
});

// 5. BUTTON PLUGIN
OmniBlock.register({
    type: 'button',
    styles: `
        .btn-preview { display: inline-block; padding: 10px 20px; background: var(--accent); color: white; border-radius: 6px; text-decoration: none; font-weight: bold; text-align: center; font-family: sans-serif; }
    `,
    getViewTemplate: (data) => {
        const text = data?.text || 'Click Here';
        const target = data?.target || 'sec_1';
        return `<div style="text-align: center; padding: 20px;"><span class="btn-preview">${text}</span><div style="font-size: 0.8rem; color: #666; margin-top: 8px;">Links to Section: ${target}</div></div>`;
    },
    getEditorTemplate: (data) => `
        <div class="grid">
            <div>
                <label>Button Text</label>
                <input type="text" class="b-btn-text" value="${data?.text || 'Click Here'}">
            </div>
            <div>
                <label>Target Page</label>
                <select class="b-btn-target">
                    <option value="">-- Select Target --</option>
                    ${window.ConGenState && window.ConGenState.pages ? window.ConGenState.pages.map((p, i) => `<option value="sec_${i}" ${data?.target === 'sec_' + i ? 'selected' : ''}>${p.title}</option>`).join('') : ''}
                </select>
            </div>
        </div>
    `,
    getEditorData: (modalBody) => ({
        text: modalBody.querySelector('.b-btn-text').value,
        target: modalBody.querySelector('.b-btn-target').value
    })
});


// 6. SLIDESHOW PLUGIN
OmniBlock.register({
    type: 'slideshow',
    styles: `
        .slide-container { position: relative; width: 100%; height: 400px; background: #000; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 0.5s ease-in-out; display: flex; align-items: center; justify-content: center; }
        .slide.active { opacity: 1; z-index: 1; }
        .slide img { width: 100%; height: 100%; object-fit: cover; }
        
        /* Editor Overrides */
        :host(.omni-block-editor-mode) .slide-container { background: #334155; }
        :host(.omni-block-editor-mode) .slide img { background: #334155 !important; }
        
        .slide-btn { position: absolute; top: 0; height: 100%; width: 15%; background: transparent; color: white; border: none; cursor: pointer; z-index: 10; font-size: 2rem; opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; }
        .slide-container:hover .slide-btn { opacity: 0.3; }
        .slide-btn:hover { opacity: 1 !important; }
        .slide-prev { left: 0; background: linear-gradient(to right, rgba(0,0,0,0.6), transparent); justify-content: flex-start; padding-left: 20px; }
        .slide-next { right: 0; background: linear-gradient(to left, rgba(0,0,0,0.6), transparent); justify-content: flex-end; padding-right: 20px; }
        .slide-editor-list { display: flex; flex-direction: column; gap: 10px; margin-top: 15px; max-height: 300px; overflow-y: auto; }
        .slide-editor-item { display: flex; align-items: center; gap: 10px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
        .slide-editor-item img { width: 60px; height: 40px; object-fit: cover; border-radius: 4px; }
    `,
    getViewTemplate: (data, context) => {
        const slides = data?.slides || [];
        if (slides.length === 0) {
            return `
                <div class="slideshow-empty-state" style="padding: 60px 20px; text-align: center; border: 2px dashed #cbd5e1; border-radius: 12px; background: #f8fafc; cursor: pointer; transition: all 0.2s;" 
                     onmouseover="this.style.borderColor='#635bff'; this.style.background='#f1f5f9';" 
                     onmouseout="this.style.borderColor='#cbd5e1'; this.style.background='#f8fafc';">
                    <div style="font-size: 2.5rem; margin-bottom: 15px;">📸</div>
                    <div style="font-weight: 600; color: #475569; margin-bottom: 5px;">Empty Slideshow</div>
                    <div style="font-size: 0.85rem; color: #64748b; margin-bottom: 20px;">Click to add images and build your slide deck</div>
                    <button class="btn btn-primary" data-global-action="edit-block" data-page-id="${context.pageId}" data-row-id="${context.rowId}" data-block-id="${context.blockId}" style="display: flex; align-items: center; gap: 8px;">📸 Add Images</button>
                </div>
            `;
        }
        const slideHtml = slides.map((s, i) => `
            <div class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">
                <img src="${window.ConGenAPI.getAsset(s) || s}" style="width: 100%; height: 400px; object-fit: contain; background: #000; border-radius: 4px;">
            </div>
        `).join('');
        return `
            <div class="slide-container">
                ${slideHtml}
                <button class="slide-btn slide-prev">❮</button>
                <button class="slide-btn slide-next">❯</button>
            </div>
        `;
    },
    onViewRender: function (shadow, data) {
        const slides = shadow.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        let current = 0;




        const showSlide = (index, isAutoInit = false) => {
            slides.forEach(s => s.classList.remove('active'));
            slides[index].classList.add('active');
            const currentRow = shadow.host.closest('.block-row-wrapper') || shadow.host.parentElement?.closest('.block-row-wrapper');
            if (currentRow) {
                currentRow.dispatchEvent(new CustomEvent('slide-changed', { detail: { index: index, isAutoInit: isAutoInit } }));
            }
        };

        // Listen for requests from text links in the same row
        const bindRowListener = () => {
            const activeRow = shadow.host.closest('.block-row-wrapper') || shadow.host.parentElement?.closest('.block-row-wrapper');
            if (activeRow) {
                if (shadow.host._onRowRequestSlide) activeRow.removeEventListener('request-slide-change', shadow.host._onRowRequestSlide);
                shadow.host._onRowRequestSlide = (e) => {
                    const reqIndex = e.detail.index;
                    if (reqIndex >= 0 && reqIndex < slides.length) {
                        current = reqIndex;
                        showSlide(current);
                    }
                };
                activeRow.addEventListener('request-slide-change', shadow.host._onRowRequestSlide);
                if (false) activeRow.addEventListener('request-slide-change', (e) => {
                    const reqIndex = e.detail.index;
                    console.log(`[ConGen] Slideshow received request for slide index: ${reqIndex}`);
                    if (reqIndex >= 0 && reqIndex < slides.length) {
                        current = reqIndex;
                        showSlide(current);
                    }
                });
                setTimeout(() => showSlide(current, true), 100);
            } else {
                // If DOM is still mounting, try again in 50ms
                setTimeout(bindRowListener, 50);
            }
        };
        bindRowListener();


        shadow.querySelector('.slide-next')?.addEventListener('click', () => {
            current = (current + 1) % slides.length;
            showSlide(current);
        });
        shadow.querySelector('.slide-prev')?.addEventListener('click', () => {
            current = (current - 1 + slides.length) % slides.length;
            showSlide(current);
        });
    },
    getEditorTemplate: function (data) {
        // Build the Mini Asset Gallery HTML (only when assets exist)
        const assets = window.ConGenState?.assets || {};
        const assetKeys = Object.keys(assets);
        const galleryHtml = assetKeys.length > 0 ? `
            <div class="mini-asset-gallery-section" style="margin-bottom:12px;">
                <label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.8rem; color:#555;">&#128193; Asset Library &mdash; click to add slide</label>
                <div class="mini-asset-gallery" style="display:flex; flex-direction:row; gap:8px; overflow-x:auto; padding:6px 0; scrollbar-width:thin;">
                    ${assetKeys.map(id => `<img
                        class="mini-asset-thumb"
                        data-asset-id="${id}"
                        src="${assets[id]}"
                        title="${id}"
                        style="width:72px; height:52px; object-fit:cover; border-radius:6px; border:2px solid #e2e8f0; cursor:pointer; flex-shrink:0; transition:border-color 0.2s, transform 0.15s;"
                        onmouseover="this.style.borderColor='#6366f1';this.style.transform='scale(1.07)';"
                        onmouseout="this.style.borderColor='#e2e8f0';this.style.transform='scale(1)';"
                    >`).join('')}
                </div>
            </div>
        ` : '';

        return `
        <div>
            <label>Add Slide</label>
            <input type="file" accept="image/*" class="b-slide-upload" style="margin-bottom: 15px;">
            <input type="hidden" class="b-slides-data" value='${JSON.stringify(data?.slides || [])}'>
            ${galleryHtml}
            <label>Current Slides</label>
            <div class="slide-editor-list"></div>
        </div>
    `;
    },
    getEditorData: (modalBody) => {
        const raw = modalBody.querySelector('.b-slides-data').value;
        return { slides: raw ? JSON.parse(raw) : [] };
    },
    onEditorRender: function (modalBody, data) {
        let slides = data?.slides ? [...data.slides] : [];
        const listWrapper = modalBody.querySelector('.slide-editor-list');
        const dataInput = modalBody.querySelector('.b-slides-data');

        const renderList = () => {
            dataInput.value = JSON.stringify(slides);
            listWrapper.innerHTML = slides.map((s, i) => `
                <div class="slide-editor-item">
                    <img src="${window.ConGenAPI.getAsset(s) || s}" style="width: 60px; height: 40px; object-fit: cover; border-radius: 4px;">
                    <span style="flex:1; font-size:0.8rem; color:#666;">Slide ${i + 1}</span>
                    <div style="display: flex; gap: 4px;">
                        <button type="button" class="btn btn-sm b-move-up" data-index="${i}" ${i === 0 ? 'disabled style="opacity: 0.5;"' : ''}>▲</button>
                        <button type="button" class="btn btn-sm b-move-down" data-index="${i}" ${i === slides.length - 1 ? 'disabled style="opacity: 0.5;"' : ''}>▼</button>
                        <button type="button" class="btn btn-danger btn-sm b-remove-slide" data-index="${i}">Remove</button>
                    </div>
                </div>
            `).join('');

            listWrapper.querySelectorAll('.b-move-up').forEach(btn => btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                if (idx > 0) {
                    [slides[idx - 1], slides[idx]] = [slides[idx], slides[idx - 1]];
                    renderList();
                }
            }));

            listWrapper.querySelectorAll('.b-move-down').forEach(btn => btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.dataset.index);
                if (idx < slides.length - 1) {
                    [slides[idx], slides[idx + 1]] = [slides[idx + 1], slides[idx]];
                    renderList();
                }
            }));


            listWrapper.querySelectorAll('.b-remove-slide').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Using currentTarget ensures we get the button's dataset even if a child element is clicked
                    const idx = parseInt(e.currentTarget.dataset.index);
                    slides.splice(idx, 1);
                    renderList();
                });
            });
        };

        renderList();

        // Mini Asset Gallery — click to add a slide from the asset library
        modalBody.querySelectorAll('.mini-asset-thumb').forEach(thumb => {
            thumb.addEventListener('click', () => {
                const assetId = thumb.dataset.assetId;
                const base64 = window.ConGenState?.assets?.[assetId];
                if (!base64) return;
                slides.push(assetId);
                renderList();
            });
        });

        modalBody.querySelector('.b-slide-upload').addEventListener('change', (e) => {
            if (window.ConGenAPI && window.ConGenAPI.processImageFile) {
                const file = e.target.files[0];
                if (!file) return;
                window.ConGenAPI.processImageFile(file).then(({ assetId }) => {
                    slides.push(assetId);
                    renderList();
                    e.target.value = '';
                });
                return;
            }
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                const base64 = re.target.result;
                slides.push(window.ConGenAPI.registerAsset(base64));
                renderList();
                e.target.value = ''; // Reset input
            };
            reader.readAsDataURL(file);
        });
    }
});
