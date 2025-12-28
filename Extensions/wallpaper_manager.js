[file name]: wallpaper_manager.js
[file content begin]
/**
 * @extension
 * @id wallpaper_manager_v1
 * @name Wallpaper Pack Manager
 * @version 1.2.0
 * @author OpenWorship Project
 */

function init(OW) {
    console.log("Initializing Wallpaper Manager...");

    // CONFIGURATION
    const REPO_OWNER = "Cleo876";
    const REPO_NAME = "open-worship";
    const BASE_PATH = "Wallpapers";
    const API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${BASE_PATH}`;
    const CACHE_DB_NAME = "wp_manager_cache";
    const CACHE_DB_VERSION = 1;
    const CACHE_STORE_NAME = "images";

    // STATE
    let currentMode = 'manager'; // 'manager' or 'picker'
    let cachedPacks = null;
    let db = null; // IndexedDB connection

    // ==========================================
    // 0. OFFLINE STORAGE SYSTEM
    // ==========================================

    // Initialize IndexedDB for offline caching
    async function initCacheDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                console.warn("IndexedDB not supported, images will be streamed only");
                resolve(null);
                return;
            }

            const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);
            
            request.onerror = () => {
                console.error("Failed to open cache database");
                resolve(null);
            };
            
            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("Cache database initialized");
                resolve(db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
                    const store = db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'url' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    console.log("Cache store created");
                }
            };
        });
    }

    // Store image in cache
    async function cacheImage(url, blob, metadata = {}) {
        if (!db) return false;
        
        return new Promise((resolve) => {
            const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_STORE_NAME);
            
            const item = {
                url: url,
                blob: blob,
                timestamp: Date.now(),
                metadata: metadata,
                lastAccessed: Date.now()
            };
            
            const request = store.put(item);
            
            request.onsuccess = () => {
                console.log(`Cached image: ${url}`);
                resolve(true);
            };
            
            request.onerror = () => {
                console.error("Failed to cache image");
                resolve(false);
            };
        });
    }

    // Get image from cache
    async function getCachedImage(url) {
        if (!db) return null;
        
        return new Promise((resolve) => {
            const transaction = db.transaction([CACHE_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CACHE_STORE_NAME);
            const request = store.get(url);
            
            request.onsuccess = () => {
                if (request.result) {
                    // Update last accessed time
                    request.result.lastAccessed = Date.now();
                    store.put(request.result);
                    
                    // Convert blob back to URL
                    const blob = request.result.blob;
                    const blobUrl = URL.createObjectURL(blob);
                    resolve({
                        url: blobUrl,
                        cached: true,
                        metadata: request.result.metadata
                    });
                } else {
                    resolve(null);
                }
            };
            
            request.onerror = () => {
                resolve(null);
            };
        });
    }

    // Clear old cache entries (keep last 50)
    async function cleanCache() {
        if (!db) return;
        
        return new Promise((resolve) => {
            const transaction = db.transaction([CACHE_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CACHE_STORE_NAME);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'next');
            
            const entries = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    entries.push({ key: cursor.primaryKey, timestamp: cursor.value.timestamp });
                    cursor.continue();
                } else {
                    // Remove oldest entries beyond limit
                    if (entries.length > 50) {
                        entries.sort((a, b) => a.timestamp - b.timestamp);
                        const toDelete = entries.slice(0, entries.length - 50);
                        
                        toDelete.forEach(entry => {
                            store.delete(entry.key);
                        });
                        
                        console.log(`Cleaned ${toDelete.length} old cache entries`);
                    }
                    resolve();
                }
            };
        });
    }

    // Get image URL with caching
    async function getImageWithCache(url, metadata = {}) {
        // Check cache first
        const cached = await getCachedImage(url);
        if (cached) {
            return cached;
        }
        
        // If not in cache, fetch and cache
        try {
            OW.UI.showToast("Downloading image for offline use...");
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            // Cache the image
            await cacheImage(url, blob, metadata);
            
            // Clean old cache entries
            setTimeout(cleanCache, 1000);
            
            return {
                url: blobUrl,
                cached: false,
                metadata: metadata
            };
        } catch (error) {
            console.error("Failed to fetch image:", error);
            throw error;
        }
    }

    // ==========================================
    // 1. INTEGRATION
    // ==========================================

    // Initialize cache first
    initCacheDB().then(() => {
        console.log("Wallpaper Manager ready with offline support");
    });

    // A. Add to Extensions Menu
    const menuName = "Wallpaper Manager";
    const menuExists = OW.Extensions.menuItems && OW.Extensions.menuItems.some(item => item.name === menuName);
    
    if (!menuExists) {
        OW.Extensions.addExtensionMenuItem(menuName, () => openBrowser('manager'));
    }

    // CLEANUP: Remove self from the "Loaded Modules" list in Core.
    setTimeout(() => {
        if (OW.Extensions.loaded) {
            const myIndex = OW.Extensions.loaded.findIndex(e => e.id === "wallpaper_manager_v1");
            if (myIndex !== -1) {
                OW.Extensions.loaded.splice(myIndex, 1);
                if (typeof OW.Extensions.updateExtensionsMenu === 'function') {
                    OW.Extensions.updateExtensionsMenu();
                }
            }
        }
    }, 500);

    // B. Inject into Editor Toolbar
    setTimeout(injectEditorButton, 1000);

    function injectEditorButton() {
        const toolbar = document.querySelector('.editor-toolbar');
        if (!toolbar) return; 

        const existingButtons = toolbar.querySelectorAll('button');
        existingButtons.forEach(b => {
            if (b.innerText === "Web BG" || b.classList.contains('wp-web-bg-btn')) {
                b.remove();
            }
        });

        const groups = toolbar.querySelectorAll('.tool-group');
        let targetGroup = null;
        
        groups.forEach(g => {
            if (g.innerHTML.includes('BG Image')) targetGroup = g;
        });

        if (targetGroup) {
            const btn = document.createElement('button');
            btn.className = 'wp-web-bg-btn';
            btn.innerText = "Web BG";
            btn.title = "Browse GitHub Wallpapers (Cached Offline)";
            btn.style.marginLeft = "5px";
            btn.style.background = "linear-gradient(to bottom, #007acc, #005f9e)";
            btn.style.borderColor = "#005f9e";
            
            btn.onclick = () => openBrowser('picker');
            
            targetGroup.appendChild(btn);
            console.log("Wallpaper Manager: Editor button injected.");
        }
    }

    if (OW.Editor && OW.Editor.open) {
        if (!OW.Editor._wpManagerPatched) {
            const originalOpen = OW.Editor.open;
            OW.Editor.open = function(...args) {
                originalOpen.apply(this, args);
                setTimeout(injectEditorButton, 100);
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
                    <h3 style="margin: 0; color: #fff;">Wallpaper Packs <span style="font-size:0.8rem; color:#888; font-weight:normal;">(Cached Offline)</span></h3>
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
                        <button id="wp-clear-cache" style="background: #444; border: 1px solid #666; color: #ddd; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">Clear Cache</button>
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
        
        // Add cache clearing
        document.getElementById('wp-clear-cache').onclick = clearCache;
    }

    async function clearCache() {
        if (!db) {
            OW.UI.showToast("No cache database found");
            return;
        }
        
        if (confirm("Clear all cached wallpapers? This will remove offline access to previously used images.")) {
            try {
                const request = indexedDB.deleteDatabase(CACHE_DB_NAME);
                request.onsuccess = () => {
                    db = null;
                    initCacheDB();
                    OW.UI.showToast("Cache cleared successfully");
                };
                request.onerror = () => {
                    OW.UI.showToast("Failed to clear cache");
                };
            } catch (error) {
                OW.UI.showToast("Error clearing cache");
                console.error(error);
            }
        }
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

            const rawUrl = img.download_url;
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
    // 4. ACTIONS (UPDATED FOR OFFLINE USE)
    // ==========================================

    async function selectImageForEditor(url) {
        if (!OW.Editor || !OW.Editor.tempSlides) {
            OW.UI.showToast("Editor not active.");
            return;
        }

        OW.UI.showToast("Applying background (caching for offline use)...");
        
        try {
            // Get image with caching
            const result = await getImageWithCache(url, {
                selectedAt: Date.now(),
                source: "github"
            });
            
            // Apply cached/local URL to slide
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex].bgImage = result.url;
            
            // Also store the original URL as metadata for reference
            if (!OW.Editor.tempSlides[OW.Editor.currentSlideIndex]._bgMetadata) {
                OW.Editor.tempSlides[OW.Editor.currentSlideIndex]._bgMetadata = {};
            }
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex]._bgMetadata.originalUrl = url;
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex]._bgMetadata.cached = result.cached;
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex]._bgMetadata.cachedAt = Date.now();
            
            OW.Editor.renderPreview();
            document.getElementById(panelId).style.display = 'none';
            OW.UI.showToast(result.cached ? "Background loaded from cache!" : "Background cached for offline use!");
            
        } catch (error) {
            console.error("Failed to cache image:", error);
            
            // Fallback to direct URL if caching fails
            OW.UI.showToast("Using online version (caching failed)");
            OW.Editor.tempSlides[OW.Editor.currentSlideIndex].bgImage = url;
            OW.Editor.renderPreview();
            document.getElementById(panelId).style.display = 'none';
        }
    }

    function downloadImage(url, name) {
        OW.UI.showToast("Fetching image...");
        
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
                
                // Also cache it for future use
                cacheImage(url, blob, { downloadedAt: Date.now() });
                
                OW.UI.showToast("Download started and cached!");
            })
            .catch(err => {
                console.error("Download failed:", err);
                OW.UI.showToast("Direct download failed. Opening in new tab.");
                window.open(url, '_blank');
            });
    }
}
[file content end]
