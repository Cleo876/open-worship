/**
 * @extension
 * @id wallpaper_manager_v1
 * @name Wallpaper Pack Manager
 * @version 1.1.4
 * @author OpenWorship Project
 */

function init(OW) {
    console.log("Initializing Wallpaper Manager...");

    // CONFIGURATION
    const REPO_OWNER = "Cleo876";
    const REPO_NAME = "open-worship";
    const BASE_PATH = "Wallpapers";
    const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}`;

    // STATE
    let currentMode = 'manager'; // 'manager' or 'picker'
    let cachedPacks = null;

    // ==========================================
    // 1. INTEGRATION
    // ==========================================

    // A. Add to Extensions Menu
    const menuName = "Wallpaper Manager";
    // Check if menu item already exists to prevent duplicates
    const menuExists = OW.Extensions.menuItems && OW.Extensions.menuItems.some(item => item.name === menuName);
    
    if (!menuExists) {
        OW.Extensions.addExtensionMenuItem(menuName, () => openBrowser('manager'));
    }

    // CLEANUP: Remove self from the "Loaded Modules" list in Core.
    // The Core automatically lists all loaded extensions, which creates a duplicate/useless 
    // entry for this extension since we added a custom menu item above.
    setTimeout(() => {
        if (OW.Extensions.loaded) {
            const myIndex = OW.Extensions.loaded.findIndex(e => e.id === "wallpaper_manager_v1");
            if (myIndex !== -1) {
                OW.Extensions.loaded.splice(myIndex, 1);
                // Trigger a menu refresh if the function exists
                if (typeof OW.Extensions.updateExtensionsMenu === 'function') {
                    OW.Extensions.updateExtensionsMenu();
                }
            }
        }
    }, 500);

    // B. Inject into Editor Toolbar
    // We wait briefly to ensure the DOM is ready or inject immediately if present
    setTimeout(injectEditorButton, 1000);

    function injectEditorButton() {
        const toolbar = document.querySelector('.editor-toolbar');
        if (!toolbar) return; 

        // CLEANUP: Remove ANY existing Web BG buttons (legacy or current) to prevent duplicates
        // This handles cases where the extension is re-loaded or updated
        const existingButtons = toolbar.querySelectorAll('button');
        existingButtons.forEach(b => {
            if (b.innerText === "Web BG" || b.classList.contains('wp-web-bg-btn')) {
                b.remove();
            }
        });

        // Find the "BG Image" button group
        const groups = toolbar.querySelectorAll('.tool-group');
        let targetGroup = null;
        
        // Look for the group containing "BG Image" text or button
        groups.forEach(g => {
            if (g.innerHTML.includes('BG Image')) targetGroup = g;
        });

        if (targetGroup) {
            const btn = document.createElement('button');
            btn.className = 'wp-web-bg-btn'; // Add class for identification
            btn.innerText = "Web BG";
            btn.title = "Browse GitHub Wallpapers";
            btn.style.marginLeft = "5px";
            btn.style.background = "linear-gradient(to bottom, #007acc, #005f9e)";
            btn.style.borderColor = "#005f9e";
            
            btn.onclick = () => openBrowser('picker');
            
            targetGroup.appendChild(btn);
            console.log("Wallpaper Manager: Editor button injected.");
        }
    }

    // Attempt to inject whenever editor opens (monkey patch open method)
    if (OW.Editor && OW.Editor.open) {
        // Only patch if we haven't already (check for a flag or unique property)
        if (!OW.Editor._wpManagerPatched) {
            const originalOpen = OW.Editor.open;
            OW.Editor.open = function(...args) {
                originalOpen.apply(this, args);
                setTimeout(injectEditorButton, 100); // Re-inject after render
            };
            OW.Editor._wpManagerPatched = true;
        }
    }

    // ==========================================
    // 2. UI: BROWSER MODAL
    // ==========================================
    const panelId = 'wallpaper-browser-panel';

    function openBrowser(mode) {
        currentMode = mode;
        let panel = document.getElementById(panelId);

        if (!panel) {
            createPanel();
            panel = document.getElementById(panelId);
        }

        panel.style.display = 'flex';
        fetchPacks();
    }

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = panelId;
        panel.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 6000;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
        `;

        panel.innerHTML = `
            <div style="width: 800px; height: 600px; background: #1e1e1e; border: 1px solid #444; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.5);">
                <!-- Header -->
                <div style="padding: 15px 20px; background: #252525; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #fff;">Wallpaper Packs <span style="font-size:0.8rem; color:#888; font-weight:normal;">(from GitHub)</span></h3>
                    <button id="wp-close-btn" style="background: none; border: none; color: #aaa; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <!-- Content Area -->
                <div id="wp-content" style="flex: 1; overflow-y: auto; padding: 20px;">
                    <div style="text-align:center; color:#888; margin-top:50px;">Loading Packs...</div>
                </div>

                <!-- Footer (Breadcrumbs/Status/Close) -->
                <div id="wp-footer" style="padding: 10px 20px; background: #151515; border-top: 1px solid #333; color: #666; font-size: 0.9rem; display:flex; justify-content:space-between; align-items:center;">
                    <span id="wp-breadcrumbs">Home</span>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <span>Source: github.com/${REPO_OWNER}/${REPO_NAME}</span>
                        <button id="wp-footer-close" style="background: #333; border: 1px solid #555; color: #ddd; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center;">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        const closeAction = () => {
            panel.style.display = 'none';
        };

        document.getElementById('wp-close-btn').onclick = closeAction;
        document.getElementById('wp-footer-close').onclick = closeAction;
    }

    // ==========================================
    // 3. LOGIC: GITHUB API
    // ==========================================

    function fetchPacks() {
        const container = document.getElementById('wp-content');
        const breadcrumbs = document.getElementById('wp-breadcrumbs');
        
        breadcrumbs.innerText = "Home";
        
        if (cachedPacks) {
            renderPacks(cachedPacks);
            return;
        }

        container.innerHTML = `<div style="text-align:center; color:#00C4FF;">Fetching folder structure from GitHub...</div>`;

        fetch(API_URL)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter for directories (Packs)
                    const folders = data.filter(item => item.type === 'dir');
                    cachedPacks = folders;
                    renderPacks(folders);
                } else {
                    container.innerHTML = `<div style="color:red; text-align:center;">Error: Rate limit exceeded or invalid repo path.</div>`;
                }
            })
            .catch(err => {
                container.innerHTML = `<div style="color:red; text-align:center;">Network Error: ${err.message}</div>`;
            });
    }

    function renderPacks(folders) {
        const container = document.getElementById('wp-content');
        container.innerHTML = "";
        
        const grid = document.createElement('div');
        grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px;`;

        folders.forEach(folder => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: #2b2b2b; border: 1px solid #444; border-radius: 6px; 
                cursor: pointer; overflow: hidden; transition: transform 0.2s;
                display: flex; flex-direction: column;
            `;
            card.onmouseover = () => { card.style.transform = 'translateY(-2px)'; card.style.borderColor = '#007acc'; };
            card.onmouseout = () => { card.style.transform = 'translateY(0)'; card.style.borderColor = '#444'; };
            card.onclick = () => fetchPackContents(folder);

            card.innerHTML = `
                <div style="height: 100px; background: #222; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #333;">
                    <i class="fa-solid fa-folder" style="font-size: 3rem; color: #555;"></i>
                    <!-- Placeholder for potential cover image -->
                    <div style="font-size:3rem; color:#444;">📁</div> 
                </div>
                <div style="padding: 10px; font-weight: bold; color: #ddd; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${folder.name}
                </div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);
    }

    function fetchPackContents(folder) {
        const container = document.getElementById('wp-content');
        const breadcrumbs = document.getElementById('wp-breadcrumbs');
        
        breadcrumbs.innerHTML = `<span style="cursor:pointer; color:#007acc; text-decoration:underline;" onclick="document.getElementById('wp-back-btn').click()">Home</span> > ${folder.name}`;
        
        container.innerHTML = `<div style="text-align:center; color:#00C4FF;">Opening Pack: ${folder.name}...</div>`;

        fetch(folder.url)
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Filter for Images
                    const images = data.filter(item => item.name.match(/\.(png|jpg|jpeg|gif)$/i));
                    renderImages(images, folder.name);
                }
            })
            .catch(err => {
                container.innerHTML = `<div style="color:red; text-align:center;">Error loading pack: ${err.message}</div>`;
            });
    }

    function renderImages(images, packName) {
        const container = document.getElementById('wp-content');
        container.innerHTML = "";

        // Back Button
        const backBtn = document.createElement('button');
        backBtn.id = 'wp-back-btn';
        backBtn.innerText = "← Back to Packs";
        backBtn.style.cssText = "margin-bottom: 15px; background: #333; color: white; border: 1px solid #555; padding: 5px 10px; border-radius: 4px; cursor: pointer; display: flex; justify-content: center; align-items: center;";
        backBtn.onclick = () => renderPacks(cachedPacks);
        container.appendChild(backBtn);

        if (images.length === 0) {
            container.innerHTML += `<div style="text-align:center; color:#777; margin-top:20px;">No images found in this pack.</div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.style.cssText = `display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;`;

        images.forEach(img => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: #2b2b2b; border: 1px solid #444; border-radius: 6px; 
                overflow: hidden; position: relative;
            `;

            // Use download_url for raw image
            const rawUrl = img.download_url;
            // Get name without extension
            const imageName = img.name.replace(/\.[^/.]+$/, "");

            card.innerHTML = `
                <div style="height: 120px; background: black; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${rawUrl}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.8">
                </div>
                <div style="padding: 5px 10px 0; text-align: center; font-size: 0.8rem; color: #ccc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${imageName}</div>
                <div style="padding: 10px; display: flex; gap: 5px; justify-content: center;">
                    ${currentMode === 'picker' 
                        ? `<button class="wp-action-btn" data-url="${rawUrl}" style="flex:1; background: #007acc; border: none; color: white; padding: 5px; border-radius: 3px; cursor: pointer; font-size: 0.8rem; display: flex; justify-content: center; align-items: center;">Select</button>`
                        : `<button class="wp-dl-btn" data-url="${rawUrl}" data-name="${img.name}" style="flex:1; background: #333; border: 1px solid #555; color: white; padding: 5px; border-radius: 3px; cursor: pointer; font-size: 0.8rem; display: flex; justify-content: center; align-items: center;">Download</button>`
                    }
                </div>
            `;
            grid.appendChild(card);
        });

        container.appendChild(grid);

        // Bind events
        if (currentMode === 'picker') {
            container.querySelectorAll('.wp-action-btn').forEach(btn => {
                btn.onclick = () => selectImageForEditor(btn.getAttribute('data-url'));
            });
        } else {
            container.querySelectorAll('.wp-dl-btn').forEach(btn => {
                btn.onclick = () => downloadImage(btn.getAttribute('data-url'), btn.getAttribute('data-name'));
            });
        }
    }

    // ==========================================
    // 4. ACTIONS
    // ==========================================

    function selectImageForEditor(url) {
        if (!OW.Editor || !OW.Editor.tempSlides) {
            OW.UI.showToast("Editor not active.");
            return;
        }

        OW.UI.showToast("Applying background...");
        
        // Load image to cache it and verify
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Crucial for GitHub images
        img.src = url;
        
        img.onload = () => {
            // Apply to current slide
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex].bgImage = url;
            OW.Editor.renderPreview();
            document.getElementById(panelId).style.display = 'none';
            OW.UI.showToast("Background Applied!");
        };
        
        img.onerror = () => {
            OW.UI.showToast("Failed to load image. Check connection.");
        };
    }

    function downloadImage(url, name) {
        OW.UI.showToast("Fetching image...");
        
        // Fetch as blob to force download instead of opening in tab
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Network error");
                return response.blob();
            })
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
                OW.UI.showToast("Download started!");
            })
            .catch(err => {
                console.error("Download failed:", err);
                OW.UI.showToast("Direct download failed. Opening in new tab.");
                // Fallback for strict CORS environments
                window.open(url, '_blank');
            });
    }
}
