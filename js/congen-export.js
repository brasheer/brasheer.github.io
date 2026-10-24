/**
 * ConGen 6.9.0 - Export Engine
 * Translates the new JSON State into a static, self-contained HTML document.
 */
/**
 * ConGen 6.9.0 - Export State Adapter
 * Translates the new JSON State into the legacy format expected by the exporter.
 */
function getEditorState() {
    if (!window.ConGenState) return [];

    return window.ConGenState.pages.map(page => {
        return {
            title: page.title,
            titleAlign: page.titleAlign,
            titleBgColor: page.titleBgColor,
            titleColor: page.titleColor,
            titleFont: page.titleFont,
            titleStyle: page.titleStyle,
            pageLogo: page.pageLogo || window.ConGenState.settings.logoData,
            bgColor: page.bgColor,
            blocks: page.rows.map(row => {
                return {
                    type: 'row',
                    valign: row.valign || 'stretch',
                    bgColor: row.bgColor,
                    header: row.header,
                    headerAlign: row.headerAlign,
                    headerStyle: row.headerStyle,
                    verticalSpacing: row.verticalSpacing,
                    // Keep empty blocks for structural integrity
                    innerBlocks: row.blocks.map(b => {
                        return {
                            type: b.type,
                            span: b.span || 12,
                            ...b.data
                        };
                    })
                };
            })
        };
    });
}


function tintHex(hex, factor) {
    if (!hex) return hex;
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return hex;
    let r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
    r = Math.round(r + (255 - r) * factor);
    g = Math.round(g + (255 - g) * factor);
    b = Math.round(b + (255 - b) * factor);
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

function shadeHex(hex, factor) {
    if (!hex) return hex;
    let h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    if (h.length !== 6) return hex;
    let r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
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
        if (match && match.length >= 3) { r = parseInt(match[0], 10); g = parseInt(match[1], 10); b = parseInt(match[2], 10); } else return null;
    } else if (bgColor.startsWith('#')) {
        let hex = bgColor.replace('#', '');
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        if (hex.length >= 6) { r = parseInt(hex.substring(0, 2), 16); g = parseInt(hex.substring(2, 4), 16); b = parseInt(hex.substring(4, 6), 16); } else return null;
    } else return null;
    const hexColor = '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? shadeHex(hexColor, 0.85) : tintHex(hexColor, 0.85);
}

function generateHTMLString(silent = false) {
    const getContrast = (hex) => { if (!hex) return '#111111'; let h = String(hex).replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return ((r * 299) + (g * 587) + (b * 114)) / 1000 >= 128 ? '#111111' : '#ffffff'; };
    if (!window.ConGenState) return null;

    // Pull settings from the new Brain, fallback to DOM if needed during transition
    const settings = window.ConGenState.settings;
    const chosenColor = document.getElementById('accentColor')?.value || settings.themeColor || '#635bff';
    const logoData = document.getElementById('logoBase64')?.value || settings.logoData || '';
    const customCSSVal = typeof customCSS !== 'undefined' ? customCSS : (settings.css || "");
    const logoAlignment = document.getElementById('logoAlignment')?.value || settings.logoAlignment || 'center';
    const docTitle = document.getElementById('docTitle')?.value || settings.docTitle || "Process Documentation";
    const themeMode = settings.themeMode || 'system';

    const exportData = {
        state: getEditorState(),
        v6State: window.ConGenState,
        color: chosenColor,
        logoAlignment: logoAlignment,
        logo: logoData,
        css: customCSSVal,
        docTitle: docTitle,
        themeMode: themeMode
    };

    if (!exportData.state || exportData.state.length === 0) return null;

    let navHtml = '';
    let contentHtml = '';
    let validPageCount = 0;

    const outTheme = settings.outputTheme || {};
    const mainContrastText = getContrast(outTheme.bg || '#ffffff');
    const logoPos = outTheme.globalLogoPos || 'top-left';
    const navPos = outTheme.navPosition || 'left';
    const validPageIndices = [];

    // Resolve the background image from the Asset Library
    let bgImageCSS = '';
    let mainTransparentCSS = '';
    if (outTheme.backgroundImageId && window.ConGenAPI) {
        const bgData = window.ConGenAPI.getAsset(outTheme.backgroundImageId);
        if (bgData) {
            bgImageCSS = `background-image: url(${bgData}); background-size: ${outTheme.bgSize || 'cover'}; background-position: ${outTheme.bgPosition || 'center'}; background-attachment: fixed;`;
            mainTransparentCSS = 'main { background: transparent !important; }';
        }
    }

    let glassCSS = '';
    if (outTheme.glassUI) {
        glassCSS = `
        .glass-enabled main { 
            background: transparent !important; 
            box-shadow: none !important; 
        }
        /* Target the actual exported grid containers */
        .glass-enabled article[class*="col-span-"] {
            background: rgba(255, 255, 255, 0.08) !important;
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            border-radius: 12px !important;
            padding: 24px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
        }
        /* Ensure spacer blocks don't get awkward padding boxes */
        .glass-enabled article[class*="col-span-"]:has(.spacer-preview),
        .glass-enabled article[class*="col-span-"]:empty {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
        }
        .glass-enabled article[class*="col-span-"] h1,
        .glass-enabled article[class*="col-span-"] h2,
        .glass-enabled article[class*="col-span-"] p,
        .glass-enabled article[class*="col-span-"] div.text-body {
            text-shadow: 0px 1px 3px rgba(255, 255, 255, 0.4);
        }
        .glass-enabled a[href^="#"] {
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            color: var(--exp-head) !important;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05) !important;
        }
        .glass-enabled a[href^="#"]:hover {
            background: rgba(255, 255, 255, 0.25) !important;
        }
        /* Tinted Glass Sidebar */
        .glass-enabled nav {
            background: color-mix(in srgb, var(--exp-nav) 75%, transparent) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border-right: 1px solid rgba(255, 255, 255, 0.15) !important;
        }
        /* Soften Page H1 borders and boost text-shadow */
        .glass-enabled .page > h1, 
        .glass-enabled .page > div > h1 {
            text-shadow: 0px 2px 10px rgba(255, 255, 255, 0.6) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.3) !important;
            padding-bottom: 20px !important;
        }
        .glass-enabled.presentation-mode .page { background: transparent !important; box-shadow: none !important; border: none !important; }`;
    }

    let presentationCSS = '';
    if (outTheme.layoutMode === 'presentation') {
        presentationCSS = `
        .presentation-mode main { 
            scroll-snap-type: y mandatory; 
            overflow-y: scroll; 
            height: 100vh;
            padding: 0 !important;
            display: block !important;
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
        }
        .presentation-mode main::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
        }
        .presentation-mode .page { 
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            width: 100%;
            max-width: 1366px !important;
            padding: 0 !important;
            box-sizing: border-box;
            background-color: var(--exp-bg);
            color: var(--exp-text);
            border-bottom: none;
            margin: 0 !important;
            position: relative;
        }
        .presentation-mode img { max-height: 60vh !important; object-fit: contain !important; }
        .presentation-mode article[class*="col-span-"] { 
            flex-shrink: 0;
            min-height: 0;
            display: flex;
            flex-direction: column;
        }
        .presentation-mode .img-wrapper { 
            min-height: 0 !important; 
            flex-shrink: 1 !important; 
        }
        .presentation-mode .content-grid {
            flex: 1;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        .presentation-mode h1 { margin-top: 0; border-bottom-width: 1px; margin-bottom: 20px; font-size: 2.5rem; }
        .presentation-mode h1, .presentation-mode h2 { color: var(--exp-secondary); }
        .presentation-mode .block-row { 
            height: 100vh; 
            max-height: 100vh; 
            overflow: hidden; 
            position: relative; 
            scroll-snap-align: start; 
            padding-top: 100px;
            padding-bottom: 5%;
            padding-left: 8%;
            padding-right: 8%;
            display: grid;
        }
        .presentation-mode nav, .presentation-mode .hamburger { display: none !important; }

        .presentation-mode .master-presentation-header {
            position: fixed;
            top: 30px;
            left: 40px;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 15px;
            background: transparent !important;
            padding: 0;
            border: none !important;
            box-shadow: none !important;
        }
        .presentation-mode .master-presentation-header img.page-logo {
            max-height: 45px !important;
            width: auto !important;
            object-fit: contain !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
        }
        .presentation-mode .master-presentation-header h1 {
            font-size: 1.5rem !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            color: var(--exp-secondary) !important;
            background: transparent !important;
        }

        .slide-nav-controls {
            position: absolute;
            bottom: 30px;
            right: 40px;
            display: flex;
            gap: 15px;
            z-index: 100;
        }
        .slide-nav-btn {
            background-color: var(--accent);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
        }
        .slide-nav-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            filter: brightness(1.1);
        }
        `;
    }

    // Override the legacy variables with the new Output Theme rules
    const rootCss = `:root { 
        --brand-primary: ${outTheme.brand || '#6366f1'};
        --exp-bg: ${outTheme.bg || '#f8fafc'}; 
        --exp-nav: ${outTheme.brand || '#635bff'}; 
        --exp-main: ${outTheme.bg || '#ffffff'}; 
        --exp-text: ${mainContrastText}; 
        --exp-border: #f1f5f9; 
        --exp-head: #0f172a;
        --exp-secondary: ${outTheme.secondary || '#111111'};
        --accent: ${outTheme.brand || '#635bff'};
        --h1-color: ${outTheme.h1Color || '#111111'};
        --h1-font: ${outTheme.h1Font || 'Manrope'};
        --h2-color: ${outTheme.h2Color || '#333333'};
        --h2-font: ${outTheme.h2Font || 'Inter'};
    }`;

    // Pre-build TOC
    let tocHtml = `<section class="page active print-only" style="display: none; padding-bottom: 40px; border-bottom: 2px solid #eee;">
        <h1 style="color: ${chosenColor}; margin-bottom: 5px; font-size: 2.5rem;">${docTitle}</h1>
        <p style="color: #666; margin-bottom: 30px; font-size: 1.2rem;">Table of Contents</p>
        <ul style="list-style: none; padding: 0; margin: 0; font-size: 1.1rem; line-height: 2;">`;

    exportData.state.forEach((pageData, index) => {
        const title = pageData.title || "Untitled Page";
        if (pageData.blocks.length > 0) {
            tocHtml += `<li>
                <label for="nav_sec_${index}" class="toc-line" style="cursor: pointer; display: flex; align-items: center; width: 100%;">
                    <span class="toc-number" style="flex-shrink: 0; margin-right: 8px; font-weight: 700;">${index + 1}</span>
                    <span class="toc-title" style="flex-shrink: 0;">${title}</span>
                    <span class="toc-leader" style="flex: 1; overflow: hidden; white-space: nowrap; margin: 0 6px;"></span>
                    <span class="toc-page" style="flex-shrink: 0; margin-left: 6px; font-weight: 600;">${index + 1}</span>
                </label>
            </li>`;
        }
    });
    tocHtml += `</ul></section>`;

    let navRadioHtml = '';
    let dynamicCss = '';

    exportData.state.forEach((pageData, index) => {
        const title = pageData.title || "Untitled Page";
        let pageBlocks = '';

        navRadioHtml += `<input type="radio" name="page_nav" id="nav_sec_${index}" ${index === 0 ? 'checked' : ''} style="display:none;">\n`;
        dynamicCss += `#nav_sec_${index}:checked ~ main #sec_${index} { display: block; }\n`;
        dynamicCss += `#nav_sec_${index}:checked ~ nav label.nav-link[for="nav_sec_${index}"] { background: rgba(0,0,0,0.15); color: white; font-weight: 600; }\n`;
        dynamicCss += `.nav-bottom-mode #nav_sec_${index}:checked ~ nav label.nav-link[for="nav_sec_${index}"] { background: rgba(255,255,255,0.22); color: white; font-weight: 700; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }\n`;
        dynamicCss += `#nav_sec_${index}:checked ~ nav .bottom-nav-step-${index} { display: inline-flex; }\n`;

        function renderBlockToHTML(b, forceHeaderShim = false, rowIndex = -1) {
            if (b.type === 'section') {
                let innerHtml = '';
                if (b.innerBlocks) {
                    b.innerBlocks.forEach(inner => { innerHtml += renderBlockToHTML(inner); });
                }
                return `<section class="content-section" style="width: 100%; display: flex; flex-direction: column;">${innerHtml}</section>`;
            } else if (b.type === 'row') {
                let innerHtml = '';
                if (b.innerBlocks) {
                    const rowHasHeaders = b.innerBlocks.some(inner => inner.hasHeader && (inner.header || "").trim() !== "");
                    b.innerBlocks.forEach(inner => {
                        if (!inner.bgColor && b.bgColor) inner._inheritedBg = b.bgColor;
                        innerHtml += renderBlockToHTML(inner, rowHasHeaders, rowIndex);
                    });
                }
                const alignY = b.valign || 'stretch';

                let rowHeaderHtml = '';
                if (b.header) {
                    let effectiveRowBg = b.bgColor || pageData.bgColor || outTheme.bg || '#ffffff';
                    let rowContrastColor = getContrastYIQ(effectiveRowBg);
                    let headerColorStyle = rowContrastColor ? ` color: ${rowContrastColor} !important;` : '';
                    const headerStyleClass = (b.headerStyle && b.headerStyle !== 'standard')
                        ? ` header-style-${b.headerStyle}`
                        : '';
                    rowHeaderHtml = `<div class="col-span-12" style="text-align: ${b.headerAlign || 'left'}; width: 100%; margin-bottom: 20px;"><h2 class="${headerStyleClass.trim()}" style="display: inline-block;${headerColorStyle}">${b.header}</h2></div>`;
                    innerHtml = rowHeaderHtml + innerHtml;
                }

                let slideshowRadios = '';
                if (b.innerBlocks) {
                    const firstSlideshow = b.innerBlocks.find(inner => inner.type === 'slideshow');
                    if (firstSlideshow) {
                        const slides = firstSlideshow.slides || [];
                        slides.forEach((_, i) => {
                            slideshowRadios += `<input type="radio" name="slide_sync_p${index}_r${rowIndex}" id="sync_p${index}_r${rowIndex}_slide_${i}" ${i === 0 ? 'checked' : ''} style="display:none;">\n`;
                        });
                    }
                }

                let rowAttributes = '';
                let slideNavHtml = '';
                if (rowIndex >= 0 && outTheme.layoutMode === 'presentation') {
                    const slideId = `slide_${index}_${rowIndex}`;
                    rowAttributes = ` id="${slideId}"`;

                    let prevTarget = '';
                    let nextTarget = '';

                    if (rowIndex > 0) {
                        prevTarget = `slide_${index}_${rowIndex - 1}`;
                    } else if (index > 0) {
                        const prevPageBlockCount = exportData.state[index - 1].blocks.length;
                        if (prevPageBlockCount > 0) {
                            prevTarget = `slide_${index - 1}_${prevPageBlockCount - 1}`;
                        }
                    }

                    const currentPageBlockCount = pageData.blocks.length;
                    if (rowIndex < currentPageBlockCount - 1) {
                        nextTarget = `slide_${index}_${rowIndex + 1}`;
                    } else if (index < exportData.state.length - 1) {
                        if (exportData.state[index + 1].blocks.length > 0) {
                            nextTarget = `slide_${index + 1}_0`;
                        }
                    }

                    let prevBtn = prevTarget ? `<a href="#${prevTarget}" class="slide-nav-btn prev-btn" style="text-decoration: none; display: flex; align-items: center;">❮ Prev</a>` : '';
                    let nextBtn = nextTarget ? `<a href="#${nextTarget}" class="slide-nav-btn next-btn" style="text-decoration: none; display: flex; align-items: center;">Next ❯</a>` : '';

                    if (prevBtn || nextBtn) {
                        slideNavHtml = `<div class="slide-nav-controls">${prevBtn}${nextBtn}</div>`;
                    }
                }

                const rowBg = b.bgColor ? ` background-color: ${b.bgColor};` : '';
                const rowSpacing = (b.verticalSpacing !== undefined && b.verticalSpacing !== null && b.verticalSpacing !== '') ? ` margin-bottom: ${b.verticalSpacing}px;` : '';
                return `<section class="block-row"${rowAttributes} style="align-items: ${alignY};${rowBg}${rowSpacing}">${slideshowRadios}${innerHtml}${slideNavHtml}</section>`;
            }

            let headerText = b.hasHeader ? b.header : "";
            let contentValue = b.content || "";
            let imgAlignStyle = (b.halign === 'center') ? 'align-self: center;' : (b.halign === 'right') ? 'align-self: flex-end;' : 'align-self: flex-start;';

            let effectiveBgColor = b.bgColor || b._inheritedBg || pageData.bgColor || '';
            let computedContrastColor = '';
            if (effectiveBgColor) {
                computedContrastColor = getContrastYIQ(effectiveBgColor);
            }

            let hHtml = "";
            if (headerText) {
                let headerColorStyle = computedContrastColor ? ` color: ${computedContrastColor} !important;` : '';
                hHtml = `<h2 style="text-align: ${b.halign}; width: 100%;${headerColorStyle}">${headerText}</h2>`;
            } else if (forceHeaderShim) {
                hHtml = `<h2 style="visibility: hidden; width: 100%; user-select: none;">Spacer</h2>`;
            }

            const articleClass = `col-span-${b.span || 12}`;

            const valignMap = {
                'valign-top': 'flex-start',
                'valign-center': 'center',
                'valign-bottom': 'flex-end',
                'flex-start': 'flex-start',
                'center': 'center',
                'flex-end': 'flex-end',
                'stretch': 'stretch'
            };
            const alignSelfFinal = valignMap[b.valign] || 'flex-start';
            const articleStyle = `display: flex; flex-direction: column; justify-content: flex-start; align-self: ${alignSelfFinal};`;

            // NEW: Handle empty structural columns
            if (b.type === 'empty') {
                return `<article class="${articleClass}" style="${articleStyle}; visibility: hidden;"></article>`;
            }

            if (b.type === 'text') {
                const isHtmlMode = b.mode === 'source' || b.mode === 'html';
                let contentHtml = '';
                if (isHtmlMode) {
                    const escaped = (window.escapeHTML && !b.advancedHtml) ? window.escapeHTML(contentValue) : contentValue;
                    contentHtml = `<pre class="source-view" style="margin:0; padding:15px; background:#272822; color:#f8f8f2; overflow-x:auto; font-family:Consolas, monospace; font-size:14px; border-radius:4px;"><code>${escaped}</code></pre>`;
                } else {
                    if (computedContrastColor) {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = contentValue;
                        tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span').forEach(el => {
                            if (el.style && el.style.backgroundColor && !el.style.color) {
                                const hiContrast = getContrastYIQ(el.style.backgroundColor);
                                if (hiContrast) el.style.color = hiContrast;
                            } else if (!el.style?.color && !el.hasAttribute('color')) {
                                el.style.color = computedContrastColor;
                            }
                        });
                        contentValue = tempDiv.innerHTML;
                    }
                    contentValue = contentValue.replace(/<(a|span)[^>]*data-slide=["'](\d+)["'][^>]*>(.*?)<\/\1>/gi, (match, tag, slideIndex, innerHtml) => {
                        return `<label for="sync_p${index}_r${rowIndex}_slide_${slideIndex}" class="slide-sync-link slide-link" style="cursor: pointer;">${innerHtml}</label>`;
                    });

                    contentHtml = `<div class="text-body" style="text-align: ${b.halign || 'left'}; width: 100%;">${contentValue}</div>`;
                }
                return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${contentHtml}</article>`;
            } else if (b.type === 'image') {
                let wrapperStyle = `max-height: 800px; display: flex; flex-direction: column; overflow: hidden; max-width: 100%; width: 100%; margin-bottom: 15px; ${imgAlignStyle}`;
                let imgStyle = `width: fit-content; max-height: 800px; align-self: center; box-shadow: 0 5px 20px rgba(0,0,0,0.15); ${imgAlignStyle}`;

                if (b.objectFit === 'cover') {
                    imgStyle += `object-fit: cover; width: 100%; `;
                }

                if (b.imgFrame && b.imgFrame !== 'none') {
                    imgStyle = `width: 100%; height: 100%; object-fit: cover; ${imgAlignStyle}`;
                }

                if (b.imgBorder && b.imgBorder > 0) imgStyle += `border: ${b.imgBorder}px solid ${b.imgBorderColor || '#ccc'}; `;
                if (b.imgRadius) imgStyle += `border-radius: ${b.imgRadius}px; `;



                const fX = b.imgFocalX !== undefined ? b.imgFocalX : 50;
                const fY = b.imgFocalY !== undefined ? b.imgFocalY : 50;
                imgStyle += `object-position: ${fX}% ${fY}%; `;

                const zoom = b.imgZoom || 1;
                imgStyle += `transform: scale(${zoom}); transform-origin: ${fX}% ${fY}%; `;

                let resolvedSrc = contentValue;
                if (contentValue && contentValue.startsWith('asset_') && window.ConGenState && window.ConGenState.assets && window.ConGenState.assets[contentValue]) {
                    resolvedSrc = window.ConGenState.assets[contentValue];
                }
                let imgHtml = `<img src="${resolvedSrc}" style="${imgStyle}">`;

                // Apply frame and shape classes
                let wrapperClass = "export-img-wrapper";
                if (b.imgFrame && b.imgFrame !== 'none') wrapperClass += ` frame-${b.imgFrame}`;
                if (b.shape && b.shape !== 'none') wrapperClass += ` shape-${b.shape}`;

                if (b.linkEnabled && b.target) {
                    imgHtml = `<label for="nav_${b.target}" style="cursor: pointer; display: block; width: 100%; height: 100%;">${imgHtml}</label>`;
                }

                imgHtml = `<div class="${wrapperClass}" style="${wrapperStyle}">${imgHtml}</div>`;
                if (b.captionEnabled && b.captionText) {
                    const escapedCaption = window.escapeHTML ? window.escapeHTML(b.captionText) : b.captionText;

                    if (b.captionStyle === 'uno-card') {
                        // Override the standard imgHtml with the layered card structure
                        imgHtml = `
                            <div style="position: relative; padding-bottom: 60px; margin-top: 15px; display: inline-block; width: fit-content; max-width: 100%; ${imgAlignStyle}">
                                <div style="position: relative; z-index: 2; margin: 0; border-radius: 24px 24px 24px 0; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15);">
                                    <img src="${resolvedSrc}" style="${imgStyle}">
                                </div>
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #a5a5a5; color: #111; padding: 30px 20px 15px 20px; border-radius: 0 0 24px 24px; z-index: 1; font-weight: 500; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                    ${escapedCaption}
                                </div>
                            </div>
                        `;
                        return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${imgHtml}</article>`;
                    } else {
                        // Standard Caption
                        const captionHtml = `<div style="text-align: center; font-size: 0.95rem; color: #555; margin-top: 12px; font-style: italic; width: 100%;">${escapedCaption}</div>`;
                        return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${imgHtml}${captionHtml}</article>`;
                    }
                }

                // No Caption
                return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${imgHtml}</article>`;
            } else if (b.type === 'spacer') {
                const style = b.style || 'whitespace';
                const orientation = b.orientation || 'horizontal';
                const sizeStr = b.size ? `${b.size}px` : `${b.height || 50}px`;
                const thickStr = b.thickness ? `${b.thickness}px` : '2px';
                const lineColor = b.color || '#000000';

                let spacerContent = '';
                const articleClass = `col-span-${b.span || 12}`;
                const articleStyle = `display: flex; flex-direction: column; justify-content: center; align-items: center; align-self: stretch; min-height: 0; width: 100%;`;

                if (orientation === 'horizontal') {
                    if (style === 'solid' || style === 'dashed' || style === 'dotted') {
                        spacerContent = `<div style="width: 100%; border-top: ${thickStr} ${style} ${lineColor}; margin: 32px 0; flex-shrink: 0;"></div>`;
                    } else {
                        spacerContent = `<div style="width: 100%; height: ${sizeStr}; flex-shrink: 0;"></div>`;
                    }
                } else {
                    // Vertical Line Logic
                    if (style === 'solid' || style === 'dashed' || style === 'dotted') {
                        spacerContent = `<div style="min-height: ${sizeStr}; height: 100%; border-left: ${thickStr} ${style} ${lineColor}; margin: 0 auto; flex-shrink: 0;"></div>`;
                    } else {
                        spacerContent = `<div style="min-height: ${sizeStr}; height: 100%; width: ${sizeStr}; flex-shrink: 0; margin: 0 auto;"></div>`;
                    }
                }
                return `<article class="${articleClass}" style="${articleStyle}">${spacerContent}</article>`;

            } else if (b.type === 'button') {
                const target = b.target || 'sec_0';
                const text = b.text || 'Click Here';
                const btnAlign = b.halign === 'left' ? 'flex-start' : b.halign === 'right' ? 'flex-end' : 'center';

                const articleClass = `col-span-${b.span || 12}`;
                const articleStyle = `display: flex; flex-direction: column; justify-content: center; align-self: stretch; min-height: 0; width: 100%;`;

                const btnHtml = `<div style="display: flex; justify-content: ${btnAlign}; width: 100%;"><a href="#${target}" style="display: inline-block; padding: 12px 24px; background: var(--accent); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">${text}</a></div>`;

                return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${btnHtml}</article>`;
            } else if (b.type === 'slideshow') {
                const slides = b.slides || [];
                if (slides.length === 0) return '';

                const articleClass = `col-span-${b.span || 12}`;
                const articleStyle = `display: flex; flex-direction: column; align-self: stretch; min-height: 0; width: 100%;`;

                let slideHtml = '';
                let nextPrevLabels = '';

                slides.forEach((s, i) => {
                    let resolvedSlideSrc = s;
                    if (s && s.startsWith('asset_') && window.ConGenState && window.ConGenState.assets && window.ConGenState.assets[s]) {
                        resolvedSlideSrc = window.ConGenState.assets[s];
                    }
                    slideHtml += `
                    <div class="slide slide-${i}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 0.5s ease-in-out; display: flex; align-items: center; justify-content: center; z-index: 0;">
                        <img src="${resolvedSlideSrc}" style="width: 100%; height: 400px; object-fit: contain; background: #000; border-radius: 4px;">
                    </div>
                    `;

                    const prevIndex = (i - 1 + slides.length) % slides.length;
                    const nextIndex = (i + 1) % slides.length;

                    nextPrevLabels += `
                    <label for="sync_p${index}_r${rowIndex}_slide_${prevIndex}" class="ss-btn ss-prev ss-btn-for-slide-${i}" 
                           onmouseover="this.style.opacity=1" 
                           onmouseout="this.style.opacity=0.3"
                           style="position: absolute; left: 0; top: 0; height: 100%; width: 15%; background: linear-gradient(to right, rgba(0,0,0,0.6), transparent); color: white; border: none; padding-left: 20px; cursor: pointer; z-index: 10; font-size: 2rem; opacity: 0; transition: opacity 0.2s; display: none; align-items: center; justify-content: flex-start;">❮</label>
                    <label for="sync_p${index}_r${rowIndex}_slide_${nextIndex}" class="ss-btn ss-next ss-btn-for-slide-${i}" 
                           onmouseover="this.style.opacity=1" 
                           onmouseout="this.style.opacity=0.3"
                           style="position: absolute; right: 0; top: 0; height: 100%; width: 15%; background: linear-gradient(to left, rgba(0,0,0,0.6), transparent); color: white; border: none; padding-right: 20px; cursor: pointer; z-index: 10; font-size: 2rem; opacity: 0; transition: opacity 0.2s; display: none; align-items: center; justify-content: flex-end;">❯</label>
                    `;

                    dynamicCss += `#sync_p${index}_r${rowIndex}_slide_${i}:checked ~ article .slide-${i} { opacity: 1 !important; z-index: 1 !important; }\n`;
                    dynamicCss += `#sync_p${index}_r${rowIndex}_slide_${i}:checked ~ article .ss-btn-for-slide-${i} { display: flex !important; }\n`;
                    // Active style for slide link
                    dynamicCss += `#sync_p${index}_r${rowIndex}_slide_${i}:checked ~ article .text-body label[for="sync_p${index}_r${rowIndex}_slide_${i}"] { color: #ffffff !important; background: var(--brand-primary, #6366f1) !important; border-color: var(--brand-primary, #6366f1) !important; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35) !important; }\n`;

                    // Active style for slide link


                });

                const componentHtml = `
                    <div onmouseover="this.querySelectorAll('.ss-btn').forEach(b => { if(b.style.opacity < 1) b.style.opacity=0.3 })" 
                         onmouseout="this.querySelectorAll('.ss-btn').forEach(b => { b.style.opacity=0 })"
                         style="position: relative; width: 100%; height: 400px; background: #000; overflow: hidden; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); margin-top: 15px;">
                        ${slideHtml}
                        ${nextPrevLabels}
                    </div>
                `;

                return `<article class="${articleClass}" style="${articleStyle}">${hHtml}${componentHtml}</article>`;
            }

            return "";
        }

        pageData.blocks.forEach((blockData, rowIndex) => {
            pageBlocks += renderBlockToHTML(blockData, false, rowIndex);
        });

        // Convert internal links (buttons/text) into labels for the CSS Radio Hack
        if (pageBlocks) {
            pageBlocks = pageBlocks.replace(/<a([^>]*?)href=["']#sec_(\d+)["']([^>]*)>(.*?)<\/a>/gi, (match, beforeHref, secNum, afterHref, innerContent) => {
                let attrStr = beforeHref + afterHref;
                if (attrStr.match(/style=["']/i)) {
                    attrStr = attrStr.replace(/(style=["'])/i, '$1cursor: pointer; ');
                } else {
                    attrStr += ' style="cursor: pointer;"';
                }
                return `<label for="nav_sec_${secNum}"${attrStr}>${innerContent}</label>`;
            });
        }

        if (pageBlocks === "") return;
        const id = `sec_${index}`;
        const activeClass = validPageCount === 0 ? 'active' : '';

        let headerHtml = '';
        if (outTheme.layoutMode !== 'presentation') {
            // Apply YIQ contrast to the Page Title
            const activePageBg = pageData.titleBgColor || pageData.bgColor || outTheme.bg || '#ffffff';
            const titleContrastColor = pageData.titleColor || getContrastYIQ(activePageBg);

            let h1Style = '';
            if (titleContrastColor) h1Style += `color: ${titleContrastColor};`;
            if (pageData.titleAlign) h1Style += ` text-align: ${pageData.titleAlign} !important;`;
            if (pageData.titleFont) h1Style += ` font-family: ${pageData.titleFont} !important;`;

            let h1Class = '';
            if (pageData.titleStyle && pageData.titleStyle !== 'standard') {
                h1Class = `header-style-${pageData.titleStyle}`;
            }

            const headerBgStyle = pageData.titleBgColor ? ` background-color: ${pageData.titleBgColor}; padding: 20px; border-radius: 8px; margin-bottom: 30px;` : '';
            headerHtml = `<header class="page-header-container" style="${headerBgStyle}"><h1 class="${h1Class}" style="${h1Style}">${title}</h1></header>`;
        }

        let pageBgStyle = pageData.bgColor ? ` background-color: ${pageData.bgColor};` : '';
        validPageIndices.push(index);
        navHtml += `<label for="nav_sec_${index}" class="nav-link" onclick="this.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'})">${title}</label>`;
        contentHtml += `<section id="${id}" class="page" style="${pageBgStyle}">${headerHtml}<div class="content-grid">${pageBlocks}</div></section>`;
        validPageCount++;
    });

    if (outTheme.layoutMode !== 'presentation') {
        contentHtml = tocHtml + contentHtml;
    }

    // ── Email Template Compiler ──────────────────────────────────────────────
    // Mount contentHtml into a temporary DOM node so we can use querySelector
    // instead of regex to locate and replace every email template hook.
    (function compileEmailTemplates() {
        const emailTemplates = (window.ConGenState?.settings?.emailTemplates) || [];
        if (emailTemplates.length === 0) return; // Nothing to do — skip the DOM round-trip

        const tempDom = document.createElement('div');
        tempDom.innerHTML = contentHtml;

        const hooks = tempDom.querySelectorAll('a.compile-email-template');
        if (hooks.length === 0) return;

        hooks.forEach(anchor => {
            const templateId = anchor.dataset.templateId || '';
            const displayText = anchor.innerHTML || templateId;

            const tpl = emailTemplates.find(t => t.id === templateId);

            if (!tpl) {
                // Template not found — degrade gracefully: keep as a visually
                // distinct span so the author can spot the broken reference.
                const fallback = document.createElement('span');
                fallback.style.cssText = 'color:#e74c3c; text-decoration:underline; cursor:default;';
                fallback.title = `Email template "${templateId}" not found.`;
                fallback.innerHTML = displayText;
                anchor.replaceWith(fallback);
                return;
            }

            const to      = tpl.to      || '';
            const subject = tpl.subject || '';
            const body    = tpl.body    || '';

            const mailtoHref = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Build the <details> card using native DOM to stay regex-free
            const details = document.createElement('details');
            details.style.cssText = [
                'display:inline-block',
                'vertical-align:top',
                'margin:2px 0',
                'border:1px solid var(--border-color,#e2e8f0)',
                'border-radius:8px',
                'overflow:hidden',
                'font-family:inherit',
                'background:#fff',
                'box-shadow:0 1px 4px rgba(0,0,0,0.06)',
                'max-width:100%',
            ].join(';');

            // <summary> — the always-visible trigger row
            const summary = document.createElement('summary');
            summary.className = 'email-template-summary';
            summary.setAttribute('title', 'Click to preview · Use the link to open your email client');

            // Envelope icon inside the summary
            const icon = document.createElement('span');
            icon.setAttribute('aria-hidden', 'true');
            icon.style.cssText = 'flex-shrink:0; line-height:1;';
            icon.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;

            // The mailto: anchor inside the summary
            const mailtoLink = document.createElement('a');
            mailtoLink.href = mailtoHref;
            mailtoLink.target = '_blank';
            mailtoLink.rel = 'noopener noreferrer';
            mailtoLink.style.cssText = 'color:inherit; text-decoration:underline; flex:1;';
            mailtoLink.innerHTML = displayText;

            // Caret to signal expandability
            const caret = document.createElement('span');
            caret.setAttribute('aria-hidden', 'true');
            caret.style.cssText = 'flex-shrink:0; opacity:0.8; font-size:0.75rem;';
            caret.textContent = '▼';

            summary.appendChild(icon);
            summary.appendChild(mailtoLink);
            summary.appendChild(caret);

            // Expanded preview body
            const previewBody = document.createElement('div');
            previewBody.style.cssText = [
                'padding:12px 16px',
                'border-top:1px solid var(--border-color,#e2e8f0)',
                'background:#fafafa',
                'font-size:0.85rem',
            ].join(';');

            if (subject) {
                const subjectRow = document.createElement('div');
                subjectRow.style.cssText = 'margin-bottom:8px; color:#64748b;';
                subjectRow.innerHTML = `<strong style="color:#374151;">Subject:</strong> ${subject.replace(/</g,'&lt;').replace(/>/g,'&gt;')}`;
                previewBody.appendChild(subjectRow);
            }

            const bodyPre = document.createElement('pre');
            bodyPre.style.cssText = [
                'white-space:pre-wrap',
                'font-family:inherit',
                'margin:0',
                'padding:10px 12px',
                'background:#fff',
                'border:1px solid var(--border-color,#e2e8f0)',
                'border-radius:6px',
                'font-size:0.85rem',
                'line-height:1.6',
                'color:#374151',
                'overflow-x:auto',
                'max-height:200px',
                'overflow-y:auto',
            ].join(';');
            bodyPre.textContent = body; // textContent safely escapes all HTML

            previewBody.appendChild(bodyPre);

            details.appendChild(summary);
            details.appendChild(previewBody);

            anchor.replaceWith(details);
        });

        // Extract the compiled HTML back out of the temporary node
        contentHtml = tempDom.innerHTML;
    })();
    // ── End Email Template Compiler ──────────────────────────────────────────
    let navFinalHtml = navHtml;
    let bottomNavCSS = '';
    if (navPos === 'bottom' && outTheme.layoutMode !== 'presentation') {
        let bottomPrevButtons = '';
        let bottomNextButtons = '';
        validPageIndices.forEach((pIdx, k) => {
            const prevIdx = k > 0 ? validPageIndices[k - 1] : null;
            const nextIdx = k < validPageIndices.length - 1 ? validPageIndices[k + 1] : null;
            if (prevIdx !== null) {
                bottomPrevButtons += `<label for="nav_sec_${prevIdx}" class="bottom-nav-arrow bottom-nav-prev bottom-nav-step-${pIdx}" title="Previous Page" onclick="var t=this.parentElement.querySelector('label.nav-link[for=nav_sec_${prevIdx}]');if(t)t.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});">❮</label>`;
            } else {
                bottomPrevButtons += `<span class="bottom-nav-arrow bottom-nav-prev bottom-nav-disabled bottom-nav-step-${pIdx}" aria-disabled="true">❮</span>`;
            }
            if (nextIdx !== null) {
                bottomNextButtons += `<label for="nav_sec_${nextIdx}" class="bottom-nav-arrow bottom-nav-next bottom-nav-step-${pIdx}" title="Next Page" onclick="var t=this.parentElement.querySelector('label.nav-link[for=nav_sec_${nextIdx}]');if(t)t.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'});">❯</label>`;
            } else {
                bottomNextButtons += `<span class="bottom-nav-arrow bottom-nav-next bottom-nav-disabled bottom-nav-step-${pIdx}" aria-disabled="true">❯</span>`;
            }
        });
        navFinalHtml = `${bottomPrevButtons}<div class="bottom-nav-tabs">${navHtml}</div>${bottomNextButtons}`;
        bottomNavCSS = `
        /* Bottom Floating Dock Navigation Mode */
        .nav-bottom-mode .nav-launcher,
        .nav-bottom-mode .hamburger,
        .nav-bottom-mode #nav_toggle {
            display: none !important;
        }
        .nav-bottom-mode main {
            padding: 60px 60px 40px 60px !important;
            align-items: flex-start;
        }
        .nav-bottom-mode .page {
            padding-bottom: 40px;
        }
        .nav-bottom-mode .page::after {
            content: '';
            display: block;
            width: 100%;
            height: 110px;
            flex-shrink: 0;
            pointer-events: none;
        }
        .nav-bottom-mode nav {
            position: fixed;
            top: auto;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            max-width: min(92vw, 780px);
            height: auto;
            padding: 8px 10px;
            border-radius: 999px;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 8px;
            overflow: hidden;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.15);
            z-index: 6000;
        }
        .nav-bottom-mode #nav_toggle:checked ~ nav {
            transform: translateX(-50%);
        }
        .nav-bottom-mode .bottom-nav-tabs {
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 4px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            scroll-behavior: smooth;
            padding: 2px;
        }
        .nav-bottom-mode .bottom-nav-tabs::-webkit-scrollbar {
            display: none;
        }
        .nav-bottom-mode .nav-link {
            margin: 0;
            padding: 8px 16px;
            border-left: none;
            border-radius: 999px;
            white-space: nowrap;
            flex-shrink: 0;
            font-size: 0.9rem;
        }
        .nav-bottom-mode .bottom-nav-arrow {
            display: none;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            cursor: pointer;
            color: white;
            background: rgba(255, 255, 255, 0.14);
            font-size: 0.9rem;
            font-weight: 700;
            flex-shrink: 0;
            user-select: none;
            transition: background 0.2s ease, transform 0.15s ease, opacity 0.2s ease;
        }
        .nav-bottom-mode .bottom-nav-arrow:hover:not(.bottom-nav-disabled) {
            background: rgba(255, 255, 255, 0.28);
            transform: scale(1.06);
        }
        .nav-bottom-mode .bottom-nav-arrow.bottom-nav-disabled {
            opacity: 0.3;
            cursor: default;
        }
        .glass-enabled.nav-bottom-mode nav {
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
        }`;
    }

    const endScript = "</" + "script>";
    const endHTML = "</" + "html>";
    const endBody = "</" + "body>";
    const safeExportJSON = JSON.stringify(exportData).replace(/</g, '\\u003c');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="congen-doc-id" content="${window.ConGenState.docId || ''}">
<title>${docTitle}</title>
<style>
    ${customCSSVal}
    ${glassCSS}
    ${presentationCSS}
    ${mainTransparentCSS}
    ${rootCss}
    ${dynamicCss}
    :root { --sidebar-text: rgba(255, 255, 255, 0.85); --sidebar-hover: rgba(255, 255, 255, 0.1); }
    *, *::before, *::after { box-sizing: border-box; }
    
    /* Anti-aliased typography and modern system fonts */
    .congen-bg-layer {
        position: fixed;
        top: 0; left: 50%; transform: translateX(-50%);
        width: 100%; max-width: 1366px; height: 100vh;
        z-index: -1; pointer-events: none;
        ${bgImageCSS}
    }
    body { 
        font-family: '${outTheme.fontBody || 'Inter'}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
        -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; 
        margin: 0; display: flex; height: 100vh; overflow: hidden; line-height: 1.6;
        color: var(--exp-text); background-color: var(--exp-bg);
    }

    /* Export Device Frames & Shapes */
    .export-img-wrapper { display: inline-block; position: relative; max-width: 100%; }
    .export-img-wrapper.shape-circle img { border-radius: 50% !important; aspect-ratio: 1/1; object-fit: cover; }
    
    .export-img-wrapper.frame-mobile { padding: 45px 15px 60px 15px; background: #111; border-radius: 36px; box-shadow: inset 0 0 0 2px #444, 0 10px 30px rgba(0,0,0,0.3); }
    .export-img-wrapper.frame-mobile::before { content: ''; position: absolute; top: 15px; left: 50%; transform: translateX(-50%); width: 60px; height: 6px; background: #333; border-radius: 10px; }
    
    .export-img-wrapper.frame-tablet { padding: 30px; background: #111; border-radius: 24px; box-shadow: inset 0 0 0 2px #444, 0 12px 40px rgba(0,0,0,0.3); }
    .export-img-wrapper.frame-tablet::before { content: ''; position: absolute; top: 50%; left: 10px; transform: translateY(-50%); width: 6px; height: 40px; background: #333; border-radius: 10px; }
    
    .export-img-wrapper.frame-browser { padding-top: 40px; background: #f1f5f9; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .export-img-wrapper.frame-browser::before { content: ''; position: absolute; top: 15px; left: 15px; width: 10px; height: 10px; border-radius: 50%; background: #ef4444; box-shadow: 20px 0 0 #f59e0b, 40px 0 0 #10b981; }
    h1 { font-family: var(--h1-font, 'Manrope'), sans-serif; color: var(--h1-color, var(--exp-secondary)); }
    h2 { font-family: var(--h2-font, 'Inter'), sans-serif; color: var(--h2-color, var(--exp-secondary)); }
    
    .hamburger { position: fixed; top: 15px; left: 20px; z-index: 6100; background: var(--accent); color: white; border: none; width: 45px; height: 45px; border-radius: 8px; font-size: 1.5rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,0,0,0.3); transition: 0.2s; }
    .hamburger:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); }
    
    /* Sleek, branded sidebar */
    nav { position: fixed; top: 0; left: 0; height: 100vh; z-index: 6000; width: 280px; background: var(--exp-nav); color: white; display: flex; flex-direction: column; overflow-y: auto; flex-shrink: 0; transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); padding-top: 60px; box-shadow: 4px 0 15px rgba(0,0,0,0.15); }
    #nav_toggle:checked ~ nav { transform: translateX(0); }
    
    .nav-link { padding: 12px 24px; cursor: pointer; border-left: 3px solid transparent; transition: all 0.2s ease; display: block; color: var(--sidebar-text); font-size: 0.95rem; font-weight: 500; margin: 4px 12px; border-radius: 6px; }
    .nav-link:hover { background: var(--sidebar-hover); color: white; }
    
    /* Clean, card-based main content area */
    main { flex: 1; overflow-y: auto; padding: 60px 60px 60px 140px; scroll-behavior: smooth; background: var(--exp-main); display: flex; justify-content: center; }
    
    .page-logo { max-width: 180px; max-height: 60px; object-fit: contain; margin-bottom: 30px; display: block; }
    .page { display: none; max-width: 1366px; width: 100%; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    
    /* Modern 12-Column Grid System */
    .block-row { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; width: 100%; border-bottom: 1px solid var(--exp-border); padding-top: 30px; padding-bottom: 30px; }
    .block-row:last-child { border-bottom: none; }
    
    h1 { border-bottom: 2px solid var(--exp-border); padding-bottom: 12px; margin-bottom: 40px; font-size: 2.25rem; font-weight: 800; letter-spacing: -0.5px; }
    h2 { margin-top: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.3px; }
    h3 { color: var(--exp-text); font-size: 1.25rem; font-weight: 600; }
    
    .col-span-1 { grid-column: span 1; }
    .col-span-2 { grid-column: span 2; }
    .col-span-3 { grid-column: span 3; }
    .col-span-4 { grid-column: span 4; }
    .col-span-5 { grid-column: span 5; }
    .col-span-6 { grid-column: span 6; }
    .col-span-7 { grid-column: span 7; }
    .col-span-8 { grid-column: span 8; }
    .col-span-9 { grid-column: span 9; }
    .col-span-10 { grid-column: span 10; }
    .col-span-11 { grid-column: span 11; }
    .col-span-12 { grid-column: span 12; }

    article[class*="col-span-"] {
        background: #ffffff; 
        border-radius: 8px; 
        padding: 20px; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        border: 1px solid var(--exp-border);
    }
    /* Prevent spacer blocks from having a white background */
    article[class*="col-span-"]:has(.spacer-preview),
    article[class*="col-span-"]:empty {
        background: transparent; border: none; box-shadow: none;
    }

    /* Caption Overrides */
    [class*="uno-card"] {
        margin-top: -25px !important; 
        padding-top: 35px !important; 
        width: calc(100% + 10px) !important; 
        margin-left: -5px !important;
        position: relative;
        z-index: 0;
    }
    img {
        position: relative;
        z-index: 1; 
    }
    
    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    
    ${bottomNavCSS}

    /* Print Overrides */
    @media screen { .print-only { display: none !important; } }
    @media print {
        html, body { height: auto !important; overflow: visible !important; display: block !important; }
        nav, .hamburger, .nav-launcher, label[for="nav_toggle"], .congen-bg-layer, .nav-bottom-mode .page::after { display: none !important; }
        main { display: block !important; padding: 0 !important; overflow: visible !important; height: auto !important; width: 100% !important; max-width: none !important; flex: none !important; }
        .page { display: block !important; page-break-after: always; max-width: 100% !important; margin: 0 !important; padding-bottom: 0 !important; box-shadow: none !important; border: none !important; opacity: 1 !important; visibility: visible !important; animation: none !important; }
        .page:last-child { page-break-after: auto; }
        .block-row { display: flex !important; flex-wrap: wrap !important; gap: 0 !important; page-break-inside: avoid; padding-top: 8px !important; padding-bottom: 8px !important; border-bottom: none !important; }
        /* Guarantee text readability when printed */
        h1, h2, h3, h4, h5, h6, p, span, div.text-body { color: #000000 !important; text-shadow: none !important; }
        /* Full 12-column grid mapped to percentages for print/PDF engines */
        .col-span-1  { width: 8.33%   !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-2  { width: 16.66%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-3  { width: 25%     !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-4  { width: 33.33%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-5  { width: 41.66%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-6  { width: 50%     !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-7  { width: 58.33%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-8  { width: 66.66%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-9  { width: 75%     !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-10 { width: 83.33%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-11 { width: 91.66%  !important; padding: 0 10px; box-sizing: border-box; }
        .col-span-12 { width: 100%    !important; padding: 0 10px; box-sizing: border-box; }
        /* Slideshow static fallbacks: show only the first slide, hide controls */
        .slide-container { height: auto !important; display: block !important; page-break-inside: avoid; background: transparent !important; box-shadow: none !important; }
        .slide { position: relative !important; display: none !important; opacity: 1 !important; }
        .slide.slide-0 { display: block !important; } /* Only print the first slide */
        .ss-btn { display: none !important; }
        .slide-sync-link { text-decoration: none !important; color: #000 !important; }
        img { max-width: 100% !important; height: auto !important; page-break-inside: avoid; }
        .print-only { display: block !important; }
    }
    
    /* Mobile Warning Modal */
    .mobile-warning-modal { display: none; }
    @media (max-width: 768px) {
        .mobile-warning-modal { display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 9999; align-items: center; justify-content: center; backdrop-filter: blur(5px); }
        .mobile-warning-content { background: white; color: #111; padding: 30px; border-radius: 12px; text-align: center; max-width: 80%; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .mobile-warning-dismiss { display: inline-block; margin-top: 20px; padding: 10px 20px; background: var(--accent); color: white; border-radius: 6px; font-weight: bold; cursor: pointer; }
        #mobile_warning_toggle:checked ~ .mobile-warning-modal { display: none !important; }
    }

    /* TOC Dot Leader */
    .toc-leader::after {
        content: " . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .";
        display: inline;
        white-space: nowrap;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }

    /* =========================================================
       Unified Action Pills (Slide Links & Email Triggers)
       ========================================================= */

    /* Base State */
    .slide-link, 
    .email-template-summary {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 14px;
        margin: 4px 0;
        
        font-family: "Cascadia Code", "Fira Code", Consolas, Monaco, monospace;
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        
        color: var(--brand-primary, #6366f1); 
        background: rgba(99, 102, 241, 0.1); 
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: 20px; 
        
        transition: all 0.2s ease;
        cursor: pointer;
        
        list-style: none; 
        user-select: none;
    }

    /* Remove default dropdown arrow for summary tags in WebKit */
    .email-template-summary::-webkit-details-marker {
        display: none;
    }

    /* Hover State */
    .slide-link:hover, 
    .email-template-summary:hover {
        background: rgba(99, 102, 241, 0.2);
        border-color: rgba(99, 102, 241, 0.6);
        transform: translateY(-1px);
    }

    /* Active State */
    .slide-link.active,
    details[open] > .email-template-summary {
        color: #ffffff;
        background: var(--brand-primary, #6366f1);
        border-color: var(--brand-primary, #6366f1);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    }

    /* =========================================================
       Row Header Presentation Shapes
       ========================================================= */
    .header-style-slanted {
        display: inline-block;
        padding: 12px 50px 12px 20px;
        clip-path: polygon(0 0, 100% 0, calc(100% - 25px) 100%, 0 100%);
        background-color: var(--brand-primary, #6366f1);
        color: #ffffff !important; 
    }
    .header-style-pill {
        display: inline-block;
        padding: 8px 28px;
        border-radius: 50px;
        background-color: rgba(99, 102, 241, 0.1);
        border: 1px solid rgba(99, 102, 241, 0.3);
        color: var(--brand-primary, #6366f1) !important;
    }
    .header-style-synthwave {
        display: inline-block;
        padding: 10px 28px;
        background: transparent;
        color: #00b8c4 !important;
        text-shadow:
            2px  2px 0px #4a1a6e,
            -1px -1px 0px #4a1a6e,
            1px -1px 0px #4a1a6e,
            -1px  1px 0px #4a1a6e;
        border-top: 3px solid #00b8c4;
        border-left: 3px solid #00b8c4;
        border-bottom: 3px solid #4a1a6e;
        border-right: 3px solid #4a1a6e;
        border-radius: 2px;
        text-transform: uppercase;
        letter-spacing: 3px;
        font-style: italic;
        font-weight: 900;
    }
    /* Global Logo Overlay — 6-zone positioning */
    .global-logo-overlay { position: fixed; z-index: 5000; pointer-events: none; padding: 30px; }
    ${logoPos === 'top-left'     ? '.global-logo-overlay { top: 0; left: 0; }' : ''}
    ${logoPos === 'top-center'   ? '.global-logo-overlay { top: 0; left: 50%; transform: translateX(-50%); }' : ''}
    ${logoPos === 'top-right'    ? '.global-logo-overlay { top: 0; right: 0; }' : ''}
    ${logoPos === 'bottom-left'  ? '.global-logo-overlay { bottom: 0; left: 0; }' : ''}
    ${logoPos === 'bottom-center'? '.global-logo-overlay { bottom: 0; left: 50%; transform: translateX(-50%); }' : ''}
    ${logoPos === 'bottom-right' ? '.global-logo-overlay { bottom: 0; right: 0; }' : ''}
</style>
</head>
<body class="${outTheme.glassUI ? 'glass-enabled' : ''} ${outTheme.layoutMode === 'presentation' ? 'presentation-mode' : ''} ${(navPos === 'bottom' && outTheme.layoutMode !== 'presentation') ? 'nav-bottom-mode' : ''}">
<input type="checkbox" id="mobile_warning_toggle" style="display:none;">
<div class="mobile-warning-modal">
    <div class="mobile-warning-content">
        <p style="margin-top: 0; font-size: 1.2rem; font-weight: 600;">Mobile Warning</p>
        <p>This document is not optimized for mobile viewing.</p>
        <label for="mobile_warning_toggle" class="mobile-warning-dismiss">Dismiss</label>
    </div>
</div>
<input type="checkbox" id="nav_toggle" style="display:none;">
${navRadioHtml}
<div class="congen-bg-layer"></div>
<div class="global-logo-overlay">
    ${exportData.logo ? `<img src="${exportData.logo}" style="max-height: 60px; width: auto; object-fit: contain;">` : ''}
</div>
<div class="nav-launcher" style="position: fixed; top: 15px; left: 20px; z-index: 6100; display: flex; align-items: center; gap: 12px; pointer-events: none;">
    <label for="nav_toggle" class="hamburger" style="position: static; margin: 0; pointer-events: auto; cursor: pointer;">☰</label>
    <label for="nav_toggle" style="font-weight: 700; font-size: 1.1rem; color: var(--exp-text); text-shadow: 0px 1px 3px rgba(255,255,255,0.8); pointer-events: auto; cursor: pointer;">Menu</label>
</div>
<nav id="sidebar">${navFinalHtml}</nav>
<main>${contentHtml}</main>
<script id="congen-data" type="application/json">${safeExportJSON}</script>
${endBody}
${endHTML}`;
}

let previewDebounceTimer = null;

function updatePreview() {
    // Clear the existing timer if the user is still actively changing inputs
    clearTimeout(previewDebounceTimer);

    // Set a new timer to update the preview only after 300ms of inactivity
    previewDebounceTimer = setTimeout(() => {
        _executePreviewUpdate();
    }, 300);
}

function _executePreviewUpdate() {
    const frame = document.getElementById('previewFrame');
    if (!frame) return;

    // 1. Capture current viewport state
    let currentScroll = 0;
    let activeSecId = 'sec_0'; // Default fallback
    let targetWin = frame.contentWindow;
    let targetDoc = frame.contentDocument || targetWin.document;

    try {
        if (targetWin) currentScroll = targetWin.scrollY || 0;

        // Map the editor's active page ID to the exporter's sequential section ID
        if (window.ConGenState && window.ConGenState.activePageId && window.ConGenState.pages) {
            const activeIndex = window.ConGenState.pages.findIndex(p => p.id === window.ConGenState.activePageId);
            if (activeIndex > -1) {
                activeSecId = `sec_${activeIndex}`;
            }
        }
    } catch (e) { }

    // 2. Generate new HTML string
    const html = generateHTMLString(true);
    if (!html) return;

    // 3. Helper function for a Soft DOM Update
    const performUpdate = (win, doc) => {
        if (!doc.body || doc.body.innerHTML.trim() === '') {
            doc.open();
            doc.write(html);
            doc.close();
        } else {
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');

            doc.head.innerHTML = newDoc.head.innerHTML;
            doc.body.className = newDoc.body.className;
            doc.body.innerHTML = newDoc.body.innerHTML;

            const scripts = doc.querySelectorAll('body script');
            scripts.forEach(oldScript => {
                // Skip the static JSON data payload
                if (oldScript.id === 'congen-data') return;
                const newScript = doc.createElement('script');
                newScript.textContent = oldScript.textContent;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            });
        }

        doc.querySelectorAll('input[name="page_nav"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const idParts = e.target.id.split('_'); // nav_sec_0
                if (idParts.length === 3) {
                    const pageIndex = idParts[2];
                    window.dispatchEvent(new CustomEvent('congen-nav-sync', {
                        detail: {
                            source: 'preview',
                            targetId: `sec_${pageIndex}`
                        }
                    }));
                }
            });
        });

        setTimeout(() => {
            try {
                if (activeSecId && win && win.document) {
                    const radio = win.document.getElementById('nav_' + activeSecId);
                    if (radio) radio.checked = true;
                }
                if (win) win.scrollTo(0, currentScroll);
            } catch (e) { }
        }, 50);
    };

    // 4. Execute on main iframe
    performUpdate(targetWin, targetDoc);

    // 5. Execute on Popout Window if active
    if (window.popoutWindow && !window.popoutWindow.closed) {
        performUpdate(window.popoutWindow, window.popoutWindow.document);
    }
}

window.saveInPlace = async function() {
    if ('showSaveFilePicker' in window && window.activeFileHandle) {
        try {
            const html = generateHTMLString(false);
            if (!html) return;
            const writable = await window.activeFileHandle.createWritable();
            await writable.write(html);
            await writable.close();
            // UI Feedback
            const dropdownFileMenu = document.querySelector('#file-menu-dropdown span.menu-label-text');
            if (dropdownFileMenu) {
                const origText = dropdownFileMenu.innerText;
                dropdownFileMenu.innerText = "✅ Saved!";
                setTimeout(() => dropdownFileMenu.innerText = origText, 2000);
            }
        } catch (err) {
            console.error("Failed to save in place:", err);
            window.exportManual();
        }
    } else {
        window.exportManual();
    }
};

window.exportManual = async function() {
    const html = generateHTMLString(false);
    if (!html) return;

    const docTitle = document.getElementById('docTitle') ? document.getElementById('docTitle').value : "";
    let fileName = "Polished_Documentation.html";

    if (docTitle.trim() !== "") {
        const sanitized = docTitle.trim().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        fileName = `${sanitized}.html`;
    }

    if ('showSaveFilePicker' in window) {
        try {
            window.activeFileHandle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'HTML Document',
                    accept: { 'text/html': ['.html'] }
                }]
            });
            const writable = await window.activeFileHandle.createWritable();
            await writable.write(html);
            await writable.close();
            
            // UI Feedback
            const dropdownFileMenu = document.querySelector('#file-menu-dropdown span.menu-label-text');
            if (dropdownFileMenu) {
                const origText = dropdownFileMenu.innerText;
                dropdownFileMenu.innerText = "💾 Saved to Disk!";
                setTimeout(() => dropdownFileMenu.innerText = origText, 2000);
            }
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error("File System Access API failed, falling back to download:", err);
                fallbackDownload(html, fileName);
            }
        }
    } else {
        fallbackDownload(html, fileName);
    }
};

window.exportJSON = function() {
    if (!window.ConGenState) return;
    const jsonStr = JSON.stringify(window.ConGenState, null, 2);
    const docTitle = document.getElementById('docTitle') ? document.getElementById('docTitle').value : "";
    let fileName = "DocBuilder_Backup.json";
    if (docTitle.trim() !== "") {
        const sanitized = docTitle.trim().replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
        fileName = `${sanitized}_Backup.json`;
    }
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
};

window.importJSON = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                window.ConGenAPI.loadState(parsed);
                if (typeof window.saveProgress === 'function') window.saveProgress(false);
            } catch (err) {
                console.error("Failed to parse JSON backup:", err);
                alert("Invalid JSON backup file.");
            }
        };
        reader.readAsText(file);
    };
    input.click();
};

function fallbackDownload(html, fileName) {
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}
// --- Popout Preview Handler ---
window.openPopoutPreview = function () {
    if (window.popoutWindow && !window.popoutWindow.closed) {
        window.popoutWindow.focus();
    } else {
        window.popoutWindow = window.open('', 'DocBuilderPreview', 'width=1024,height=768');

        // Collapse the inline preview frame while pop-out is active
        const frame = document.getElementById('previewFrame');
        if (frame) frame.classList.add('collapsed-preview');

        // Clear any previous watcher
        if (window._popoutWatcher) clearInterval(window._popoutWatcher);

        // Poll until the pop-out is closed, then restore inline preview
        window._popoutWatcher = setInterval(() => {
            if (window.popoutWindow && window.popoutWindow.closed) {
                clearInterval(window._popoutWatcher);
                window._popoutWatcher = null;
                if (frame) frame.classList.remove('collapsed-preview');
                if (typeof updatePreview === 'function') updatePreview();
            }
        }, 800);
    }
    // Force the exporter to push the latest HTML to the new window
    if (typeof updatePreview === 'function') updatePreview();
};
