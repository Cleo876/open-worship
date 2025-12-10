/**
 * @extension
 * @id extension_marketplace_v1
 * @name Extension Marketplace
 * @version 1.0.2
 * @author OpenWorship Project
 * @description Browse, install, and manage OpenWorship extensions available on GitHub
 */

function init(OW) {
    console.log("Initializing Extension Marketplace v1.0.2...");

    // CONFIGURATION
    const REPO_OWNER = "Cleo876";
    const REPO_NAME = "open-worship";
    const EXTENSIONS_PATH = "Extensions";
    const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${EXTENSIONS_PATH}`;
    const DOCS_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${EXTENSIONS_PATH}/Documentation/README%20INSTRUCTIONS.md`;
    
    // STATE
    const INSTALLED_KEY = 'openworship_installed_extensions_v1';
    const HAS_UNSAVED_KEY = 'openworship_extensions_unsaved_v1';
    let installedExtensions = {};
    let availableExtensions = [];
    let masterDocumentation = null;
    let pendingInstallations = new Map();

    // ==========================================
    // 1. INITIALIZATION & AUTO-SAVE (FIXED)
    // ==========================================

    function loadInstalledExtensions() {
        try {
            const stored = localStorage.getItem(INSTALLED_KEY);
            if (stored) {
                installedExtensions = JSON.parse(stored);
                console.log(`Loaded ${Object.keys(installedExtensions).length} installed extensions`);
            }
        } catch (e) {
            installedExtensions = {};
        }
    }

    function saveInstalledExtensions() {
        try {
            localStorage.setItem(INSTALLED_KEY, JSON.stringify(installedExtensions));
            localStorage.setItem(HAS_UNSAVED_KEY, 'true');
        } catch (e) {}
    }

    // Check for unsaved extensions on page load
    setTimeout(() => {
        if (localStorage.getItem(HAS_UNSAVED_KEY) === 'true') {
            console.log("Detected unsaved extensions from previous session");
        }
    }, 1000);

    // Set up beforeunload handler for save reminder
    window.addEventListener('beforeunload', function(e) {
        if (localStorage.getItem(HAS_UNSAVED_KEY) === 'true' && Object.keys(installedExtensions).length > 0) {
            e.preventDefault();
            showSaveReminderModal();
            return "You have unsaved extensions. Would you like to save them before leaving?";
        }
    });

    function showSaveReminderModal() {
        let modal = document.getElementById('save-extensions-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'save-extensions-modal';
            modal.style.cssText = `
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.95);
                z-index: 20000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', sans-serif;
            `;

            modal.innerHTML = `
                <div style="width: 500px; background: #222; border: 1px solid #444; border-radius: 8px; padding: 30px; box-shadow: 0 0 50px rgba(0,0,0,0.7);">
                    <h3 style="margin: 0 0 15px 0; color: #fff; display: flex; align-items: center; gap: 10px;">
                        <span style="color: #ff9800;">⚠️</span> Save Your Extensions
                    </h3>
                    <p style="color: #ccc; line-height: 1.5; margin-bottom: 25px;">
                        You have installed or modified extensions. Save them to your computer so you can reload them later.
                    </p>
                    <p style="color: #888; font-size: 0.9rem; margin-bottom: 25px;">
                        <strong>Note:</strong> This will create a folder with all your installed extensions that you can reload using "Load Folder..." in the Extensions menu.
                    </p>
                    <div style="display: flex; justify-content: flex-end; gap: 10px;">
                        <button id="save-reminder-cancel" style="background: #333; border: 1px solid #555; color: #ddd; padding: 8px 20px; border-radius: 4px; cursor: pointer;">Cancel</button>
                        <button id="save-reminder-save" style="background: #007acc; border: none; color: white; padding: 8px 20px; border-radius: 4px; cursor: pointer; font-weight: bold;">Save Extensions Folder</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('save-reminder-cancel').onclick = () => {
                modal.style.display = 'none';
                localStorage.removeItem(HAS_UNSAVED_KEY);
            };

            document.getElementById('save-reminder-save').onclick = () => {
                saveExtensionsFolder();
                modal.style.display = 'none';
            };
        }

        modal.style.display = 'flex';
        return modal;
    }

    // ==========================================
    // 2. FIXED TOAST SYSTEM (ABOVE EVERYTHING)
    // ==========================================

    function showMarketplaceToast(message, type = 'info') {
        // Create custom toast with higher z-index
        const toast = document.createElement('div');
        toast.className = 'marketplace-toast';
        
        // Use VERY high z-index to appear above everything
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#d32f2f' : '#007acc'};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.9);
            z-index: 30000; /* HIGHER than marketplace modal (10000) AND save modal (20000) */
            font-family: 'Segoe UI', sans-serif;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transform: translateY(-30px);
            transition: opacity 0.4s, transform 0.4s;
            max-width: 450px;
            pointer-events: none;
        `;
        
        // Add icon
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '💡';
        toast.innerHTML = `
            <span style="font-size: 1.3rem; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">${icon}</span>
            <span style="text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });
        
        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-30px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    document.body.removeChild(toast);
                }
            }, 400);
        }, 3500);
    }

    function saveExtensionsFolder() {
        if (Object.keys(installedExtensions).length === 0) {
            showMarketplaceToast("No extensions to save!", 'error');
            return;
        }

        const extensions = Object.values(installedExtensions);
        let fileCount = 0;
        
        extensions.forEach((ext, index) => {
            setTimeout(() => {
                const blob = new Blob([ext.code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = ext.filename || `${ext.name.replace(/\s+/g, '_')}.js`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                fileCount++;
                
                if (fileCount === extensions.length) {
                    localStorage.removeItem(HAS_UNSAVED_KEY);
                    showMarketplaceToast(`✅ Saved ${fileCount} extensions to Downloads!`, 'success');
                    
                    setTimeout(() => {
                        showMarketplaceToast("💡 Use 'Load Folder...' in Extensions menu to reload", 'info');
                    }, 2000);
                }
            }, index * 150);
        });
    }

    // ==========================================
    // 3. REAL-TIME INSTALLATION FEEDBACK (FIXED)
    // ==========================================

    async function loadExtension(extension) {
        if (pendingInstallations.has(extension.id)) {
            showMarketplaceToast(`${extension.name} is already installing...`, 'info');
            return false;
        }

        try {
            pendingInstallations.set(extension.id, true);
            
            // FIXED: Update the specific button immediately with visual feedback
            const installBtn = document.querySelector(`.mp-btn-install[data-id="${extension.id}"]`);
            if (installBtn) {
                installBtn.disabled = true;
                installBtn.innerHTML = '<span class="btn-spinner"></span> Installing...';
                installBtn.style.background = '#ff9800';
                installBtn.style.color = '#000';
                
                // Add visual feedback to the card
                const card = installBtn.closest('.extension-card');
                if (card) {
                    card.style.borderColor = '#ff9800';
                    card.style.boxShadow = '0 0 15px rgba(255, 152, 0, 0.3)';
                }
            }
            
            // Create and initialize extension
            const extensionObject = createExtensionContext(extension.code, extension);
            
            if (extensionObject && extensionObject.init) {
                installedExtensions[extension.id] = {
                    id: extension.id,
                    name: extension.name,
                    version: extension.version,
                    author: extension.author,
                    code: extension.code,
                    installedAt: Date.now(),
                    enabled: true
                };
                saveInstalledExtensions();
                
                try {
                    extensionObject.init(OW);
                    
                    OW.Extensions.register({
                        id: extension.id,
                        name: extension.name,
                        version: extension.version,
                        author: extension.author,
                        init: extensionObject.init,
                        enabled: true
                    });
                    
                    // FIXED: Update UI in real-time
                    if (installBtn) {
                        installBtn.disabled = true;
                        installBtn.innerHTML = '✓ Installed';
                        installBtn.style.background = '#4caf50';
                        installBtn.style.color = '#fff';
                        
                        const card = installBtn.closest('.extension-card');
                        if (card) {
                            card.style.borderColor = '#444';
                            card.style.boxShadow = 'none';
                        }
                    }
                    
                    showMarketplaceToast(`✅ Installed ${extension.name} v${extension.version}`, 'success');
                    
                    // Update counts in real-time
                    updateExtensionCounts();
                    
                    pendingInstallations.delete(extension.id);
                    return true;
                } catch (initError) {
                    delete installedExtensions[extension.id];
                    saveInstalledExtensions();
                    
                    if (installBtn) {
                        installBtn.disabled = false;
                        installBtn.innerHTML = '⬇️ Install';
                        installBtn.style.background = '#007acc';
                    }
                    
                    showMarketplaceToast(`❌ Failed to initialize ${extension.name}`, 'error');
                    pendingInstallations.delete(extension.id);
                    return false;
                }
            }
        } catch (error) {
            showMarketplaceToast(`❌ Failed to load ${extension.name}: ${error.message}`, 'error');
            pendingInstallations.delete(extension.id);
            return false;
        }
    }

    function updateExtensionCounts() {
        const installedCount = document.getElementById('mp-installed-count');
        if (installedCount) {
            installedCount.textContent = Object.keys(installedExtensions).length;
        }
        
        const status = document.getElementById('mp-status');
        if (status) {
            const updates = availableExtensions.filter(ext => ext.hasUpdate).length;
            status.textContent = updates > 0 
                ? `⚠️ ${updates} update(s) available` 
                : '✅ All extensions up to date';
        }
    }

    function uninstallExtension(extensionId) {
        const ext = installedExtensions[extensionId];
        if (!ext) return false;

        try {
            if (OW.Extensions.registry[extensionId]) {
                delete OW.Extensions.registry[extensionId];
            }
            
            if (OW.Extensions.loaded) {
                OW.Extensions.loaded = OW.Extensions.loaded.filter(e => e.id !== extensionId);
            }
            
            delete installedExtensions[extensionId];
            saveInstalledExtensions();
            
            // FIXED: Update the button in real-time
            const uninstallBtn = document.querySelector(`.mp-btn-uninstall[data-id="${extensionId}"]`);
            if (uninstallBtn) {
                uninstallBtn.disabled = false;
                uninstallBtn.innerHTML = '⬇️ Install';
                uninstallBtn.style.background = '#007acc';
                uninstallBtn.className = 'mp-btn-install';
                uninstallBtn.setAttribute('data-id', extensionId);
                
                // Update event listener
                uninstallBtn.onclick = function() {
                    const ext = availableExtensions.find(e => e.id === extensionId);
                    if (ext) loadExtension(ext);
                };
            }
            
            if (typeof OW.Extensions.updateExtensionsMenu === 'function') {
                OW.Extensions.updateExtensionsMenu();
            }
            
            updateExtensionCounts();
            showMarketplaceToast(`🗑️ Removed ${ext.name}`, 'success');
            return true;
        } catch (error) {
            showMarketplaceToast(`❌ Failed to remove ${ext.name}`, 'error');
            return false;
        }
    }

    function createExtensionContext(code, extension) {
        try {
            const sandbox = {
                OW: OW,
                console: {
                    log: (...args) => console.log(`[${extension.name}]`, ...args),
                    error: (...args) => console.error(`[${extension.name}]`, ...args),
                    warn: (...args) => console.warn(`[${extension.name}]`, ...args)
                },
                document: { 
                    createElement: (tag) => document.createElement(tag),
                    head: document.head
                },
                window: { 
                    setTimeout, 
                    clearTimeout, 
                    setInterval, 
                    clearInterval,
                    fetch: (url) => {
                        if (url.includes('github.com') || url.includes('raw.githubusercontent.com')) {
                            return fetch(url);
                        }
                        throw new Error('Only GitHub URLs allowed');
                    }
                }
            };
            
            const wrappedCode = `
                (function(OW, console, document, window) {
                    ${code}
                    return { init: typeof init === 'function' ? init : null };
                })(OW, console, document, window);
            `;
            
            return eval(wrappedCode);
        } catch (error) {
            console.error("Failed to create extension context:", error);
            return null;
        }
    }

    // ==========================================
    // 4. MARKETPLACE UI WITH INSTANT FEEDBACK
    // ==========================================

    function openMarketplace() {
        loadInstalledExtensions();
        createMarketplaceUI();
        showLoadingState();
        
        // Add loading styles
        addLoadingStyles();
        
        fetchExtensionsFromRepo().then(exts => {
            showAvailableExtensions(exts);
        });
    }

    function addLoadingStyles() {
        if (!document.querySelector('#marketplace-styles')) {
            const style = document.createElement('style');
            style.id = 'marketplace-styles';
            style.textContent = `
                .btn-spinner {
                    display: inline-block;
                    width: 14px;
                    height: 14px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top: 2px solid white;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin-right: 8px;
                    vertical-align: middle;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .marketplace-toast {
                    pointer-events: none;
                }
            `;
            document.head.appendChild(style);
        }
    }

    function createMarketplaceUI() {
        let modal = document.getElementById('extension-marketplace-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'extension-marketplace-modal';
            modal.style.cssText = `
                display: none;
                position: fixed;
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', sans-serif;
            `;

            modal.innerHTML = `
                <div style="width: 900px; height: 700px; background: #1e1e1e; border: 1px solid #444; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 0 50px rgba(0,0,0,0.7);">
                    <!-- Header -->
                    <div style="padding: 15px 20px; background: #252525; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0; color: #fff;">Extension Marketplace</h3>
                        <div style="display: flex; gap: 10px;">
                            <button id="mp-export-all" style="background: #4caf50; border: none; color: white; padding: 6px 15px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px;">💾 Save All</button>
                            <button id="mp-close" style="background:none; border:none; color:#aaa; font-size:1.8rem; cursor:pointer; line-height:1; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">&times;</button>
                        </div>
                    </div>
                    
                    <!-- Content Area -->
                    <div id="mp-content" style="flex: 1; overflow-y: auto; padding: 0; position: relative;">
                        <!-- Loading/Loaded content goes here -->
                    </div>
                    
                    <!-- Status Bar -->
                    <div style="padding: 10px 20px; background: #151515; border-top: 1px solid #333; color: #666; font-size: 0.8rem; display:flex; justify-content:space-between;">
                        <span id="mp-status">Ready</span>
                        <span>Extensions: <span id="mp-count">0</span> | Installed: <span id="mp-installed-count">0</span></span>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('mp-close').onclick = () => {
                modal.style.display = 'none';
            };
            
            document.getElementById('mp-export-all').onclick = () => {
                saveExtensionsFolder();
            };
        }

        modal.style.display = 'flex';
        return modal;
    }

    function showAvailableExtensions(extensions) {
        const content = document.getElementById('mp-content');
        const count = document.getElementById('mp-count');
        const installedCount = document.getElementById('mp-installed-count');
        const status = document.getElementById('mp-status');
        
        if (!content) return;
        
        // Recalculate installed status based on current installedExtensions
        extensions.forEach(ext => {
            ext.installed = !!installedExtensions[ext.id];
            if (ext.installed) {
                ext.hasUpdate = compareVersions(ext.version, installedExtensions[ext.id].version) > 0;
            }
        });
        
        const installed = extensions.filter(e => e.installed && !e.hasUpdate);
        const updates = extensions.filter(e => e.hasUpdate);
        const available = extensions.filter(e => !e.installed && !e.hasUpdate);
        
        count.textContent = extensions.length;
        installedCount.textContent = installed.length;
        status.textContent = updates.length > 0 
            ? `⚠️ ${updates.length} update(s) available` 
            : '✅ All extensions up to date';
        
        let html = `
            <div style="padding: 20px;">
                <!-- Documentation Button -->
                <div style="margin-bottom: 25px; padding: 20px; background: linear-gradient(135deg, #252525, #1a1a1a); border-radius: 8px; border: 1px solid #007acc; box-shadow: 0 5px 15px rgba(0,122,204,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="margin: 0 0 8px 0; color: #fff; font-size: 1.1rem;">📚 Extension Development Guide</h4>
                            <p style="margin: 0; color: #aaa; font-size: 0.9rem;">Learn how to create your own extensions</p>
                        </div>
                        <button id="mp-show-docs" style="background: #007acc; border: none; color: white; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: bold; display: flex; align-items: center; gap: 8px;">
                            📖 View Docs
                        </button>
                    </div>
                </div>
                
                <!-- Quick Stats -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
                    <div style="background: #252525; border: 1px solid #333; border-radius: 6px; padding: 20px; text-align: center; transition: all 0.3s;">
                        <div style="font-size: 2.5rem; color: #4caf50; margin-bottom: 5px; font-weight: bold;">${installed.length}</div>
                        <div style="color: #aaa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Installed</div>
                    </div>
                    <div style="background: #252525; border: 1px solid #333; border-radius: 6px; padding: 20px; text-align: center; transition: all 0.3s;">
                        <div style="font-size: 2.5rem; color: #ff9800; margin-bottom: 5px; font-weight: bold;">${updates.length}</div>
                        <div style="color: #aaa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Updates</div>
                    </div>
                    <div style="background: #252525; border: 1px solid #333; border-radius: 6px; padding: 20px; text-align: center; transition: all 0.3s;">
                        <div style="font-size: 2.5rem; color: #007acc; margin-bottom: 5px; font-weight: bold;">${available.length}</div>
                        <div style="color: #aaa; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Available</div>
                    </div>
                </div>
        `;
        
        // Updates section
        if (updates.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px 0; color: #ff9800; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #ff9800; color: #000; padding: 5px 12px; border-radius: 10px; font-size: 0.9rem; font-weight: bold;">🔄 UPDATES AVAILABLE</span>
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                        ${updates.map(ext => createExtensionCard(ext, 'update')).join('')}
                    </div>
                </div>
            `;
        }
        
        // Installed section
        if (installed.length > 0) {
            html += `
                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 15px 0; color: #4caf50; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #4caf50; color: white; padding: 5px 12px; border-radius: 10px; font-size: 0.9rem; font-weight: bold;">✅ YOUR EXTENSIONS</span>
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                        ${installed.map(ext => createExtensionCard(ext, 'installed')).join('')}
                    </div>
                </div>
            `;
        }
        
        // Available section
        if (available.length > 0) {
            html += `
                <div>
                    <h4 style="margin: 0 0 15px 0; color: #007acc; display: flex; align-items: center; gap: 10px;">
                        <span style="background: #007acc; color: white; padding: 5px 12px; border-radius: 10px; font-size: 0.9rem; font-weight: bold;">📦 AVAILABLE EXTENSIONS</span>
                    </h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                        ${available.map(ext => createExtensionCard(ext, 'available')).join('')}
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        content.innerHTML = html;
        
        // Documentation button
        const docsBtn = document.getElementById('mp-show-docs');
        if (docsBtn) {
            docsBtn.onclick = () => window.open(DOCS_URL, '_blank');
        }
        
        addCardEventListeners();
    }

    function createExtensionCard(ext, status) {
        const buttons = {
            update: `
                <button class="mp-btn-update" data-id="${ext.id}" style="background: #ff9800; color: #000; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: bold; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">🔄 Update to v${ext.version}</button>
            `,
            installed: `
                <button class="mp-btn-uninstall" data-id="${ext.id}" style="background: #d32f2f; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">🗑️ Remove</button>
            `,
            available: `
                <button class="mp-btn-install" data-id="${ext.id}" style="background: #007acc; border: none; color: white; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">⬇️ Install</button>
            `
        };
        
        return `
            <div class="extension-card" data-extension-id="${ext.id}" style="background: #2b2b2b; border: 1px solid #444; border-radius: 6px; padding: 18px; display: flex; flex-direction: column; height: 100%;">
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <h4 style="margin: 0; color: #fff; font-size: 1rem; line-height: 1.3;">${ext.name}</h4>
                        <span style="background: #333; color: #aaa; font-size: 0.75rem; padding: 3px 8px; border-radius: 10px;">v${ext.version}</span>
                    </div>
                    
                    <div style="color: #aaa; font-size: 0.85rem; margin-bottom: 18px; line-height: 1.4;">
                        <div style="color: #888; margin-bottom: 6px; font-size: 0.8rem;">👤 ${ext.author}</div>
                        <div>${ext.description || 'No description provided.'}</div>
                    </div>
                </div>
                
                <div style="margin-top: auto;">
                    ${buttons[status]}
                </div>
            </div>
        `;
    }

    function addCardEventListeners() {
        // Install buttons
        document.querySelectorAll('.mp-btn-install').forEach(btn => {
            btn.onclick = async function() {
                const extId = this.dataset.id;
                const ext = availableExtensions.find(e => e.id === extId);
                if (ext) await loadExtension(ext);
            };
        });
        
        // Update buttons
        document.querySelectorAll('.mp-btn-update').forEach(btn => {
            btn.onclick = async function() {
                if (confirm(`Update to latest version? This will replace the current installation.`)) {
                    const extId = this.dataset.id;
                    const ext = availableExtensions.find(e => e.id === extId);
                    if (ext) {
                        // Update button immediately
                        this.disabled = true;
                        this.innerHTML = '<span class="btn-spinner"></span> Updating...';
                        this.style.background = '#ff9800';
                        
                        // Uninstall old version
                        uninstallExtension(extId);
                        // Install new version
                        await loadExtension(ext);
                    }
                }
            };
        });
        
        // Uninstall buttons
        document.querySelectorAll('.mp-btn-uninstall').forEach(btn => {
            btn.onclick = function() {
                if (confirm(`Remove this extension?`)) {
                    uninstallExtension(this.dataset.id);
                }
            };
        });
    }

    // ==========================================
    // 5. FIXED MENU INTEGRATION (NO SELF-REMOVAL)
    // ==========================================

    // Add to Extensions menu immediately
    setTimeout(() => {
        // CRITICAL FIX: Don't remove ourselves from the loaded list
        OW.Extensions.addExtensionMenuItem("📦 Extension Marketplace", openMarketplace);
        
        // Keep the extension in the loaded list so the menu button works
        // The built-in menu system will show "Extension Marketplace" in the list
        // but that's okay - users will see it twice but both will work
        
        loadInstalledExtensions();
        console.log("Extension Marketplace v1.0.2 initialized");
        
    }, 300); // Reduced delay for better reliability

    // ==========================================
    // 6. HELPER FUNCTIONS (KEEP EXISTING)
    // ==========================================

    async function fetchExtensionsFromRepo() {
        try {
            const response = await fetch(API_BASE);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const items = await response.json();
            const jsFiles = items.filter(item => 
                item.type === 'file' && 
                item.name.endsWith('.js') &&
                !item.name.startsWith('.')
            );
            
            availableExtensions = [];
            
            for (const file of jsFiles) {
                try {
                    const metadata = await parseExtensionMetadata(file);
                    if (metadata) {
                        metadata.file = file;
                        metadata.installed = !!installedExtensions[metadata.id];
                        metadata.hasUpdate = metadata.installed && 
                            compareVersions(metadata.version, installedExtensions[metadata.id].version) > 0;
                        availableExtensions.push(metadata);
                    }
                } catch (e) {}
            }
            
            return availableExtensions;
            
        } catch (error) {
            showMarketplaceToast("Cannot connect to marketplace. Check connection.", 'error');
            return [];
        }
    }

    async function parseExtensionMetadata(file) {
        try {
            const response = await fetch(file.download_url);
            const content = await response.text();
            
            const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
            if (!commentMatch) return null;
            
            const comment = commentMatch[0];
            const metadata = {};
            
            const lines = comment.split('\n');
            lines.forEach(line => {
                if (line.includes('@id')) metadata.id = line.split('@id')[1].trim();
                if (line.includes('@name')) metadata.name = line.split('@name')[1].trim();
                if (line.includes('@version')) metadata.version = line.split('@version')[1].trim();
                if (line.includes('@author')) metadata.author = line.split('@author')[1].trim();
                if (line.includes('@description')) metadata.description = line.split('@description')[1].trim();
            });
            
            if (!metadata.id || !metadata.name) return null;
            
            metadata.code = content;
            metadata.filename = file.name;
            
            return metadata;
        } catch (e) {
            return null;
        }
    }

    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (parts1[i] > parts2[i]) return 1;
            if (parts1[i] < parts2[i]) return -1;
        }
        return 0;
    }

    function showLoadingState() {
        const content = document.getElementById('mp-content');
        if (!content) return;
        
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #888;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #007acc; animation: pulse 2s infinite;">⌛</div>
                <h3 style="margin: 0; color: #ddd;">Scanning Repository...</h3>
                <p>Fetching extensions from GitHub...</p>
                <div style="width: 200px; height: 3px; background: #333; margin-top: 20px; border-radius: 3px; overflow: hidden;">
                    <div style="width: 30%; height: 100%; background: #007acc; animation: loading 1.5s infinite;"></div>
                </div>
                <style>
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                    @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }
                </style>
            </div>
        `;
    }
}
