/**
 * @name Projector Pro
 * @id projector_pro
 * @version 1.3.0
 * @author OpenWorship Extensions
 * @description Enhances projector with smart text fitting, intelligent watermarks, persistent scripture backgrounds, offline custom fonts, and seamless window reconnection.
 */

function init(OW) {
    console.log("Initializing Projector Pro v1.3.0...");

    // ==========================================
    // 1. CSS INJECTION
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        .pp-btn {
            background: #333;
            border: 1px solid #555;
            color: #eee;
            cursor: pointer;
            border-radius: 4px;
            padding: 5px 10px;
            font-size: 0.8rem;
        }
        .pp-btn:hover { background: #444; }
        .pp-btn.active {
            background: #007acc;
            border-color: #005f9e;
        }
        .pp-control-group {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #333;
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. OFFLINE FONT STORAGE (INDEXED DB)
    // ==========================================
    async function loadOfflineFonts() {
        try {
            if (!OW.Storage) return;
            const record = await OW.Storage.get('global_settings', 'offline_custom_fonts');
            if (record && record.fonts) {
                const fonts = record.fonts;
                for (const fontName of Object.keys(fonts)) {
                    const dataURL = fonts[fontName];
                    OW.Data.localFontData[fontName] = dataURL;
                    
                    try {
                        const fontFace = new FontFace(fontName, `url(${dataURL})`);
                        const loadedFace = await fontFace.load();
                        document.fonts.add(loadedFace);
                        
                        if (!OW.State.availableFonts.includes(fontName)) {
                            OW.State.availableFonts.push(fontName);
                            // Update font select lists if they are populated
                            const selects = [document.getElementById('toolFont'), document.getElementById('scriptureFontSelect')];
                            selects.forEach(select => {
                                if (select && !Array.from(select.options).some(opt => opt.value === fontName)) {
                                    const option = document.createElement('option');
                                    option.value = fontName; option.textContent = fontName;
                                    select.appendChild(option);
                                }
                            });
                        }
                    } catch (err) {
                        console.warn("Projector Pro: Failed to load cached font:", fontName, err);
                    }
                }
                console.log("Projector Pro: Offline fonts loaded and injected successfully.");
            }
        } catch (e) {
            console.error("Projector Pro: DB Font load error", e);
        }
    }

    async function saveFontsToDB(fonts) {
        if (!OW.Storage) return;
        try {
            await OW.Storage.set('global_settings', { id: 'offline_custom_fonts', fonts: fonts });
        } catch (e) {
            console.error("Projector Pro: DB Font save error", e);
        }
    }

    // Attach Proxy to automatically save local fonts whenever they are added
    if (!OW.Data._fontProxyAttached) {
        OW.Data.localFontData = new Proxy(OW.Data.localFontData || {}, {
            set: function(target, property, value) {
                target[property] = value;
                saveFontsToDB(target);
                return true;
            },
            deleteProperty: function(target, property) {
                delete target[property];
                saveFontsToDB(target);
                return true;
            }
        });
        OW.Data._fontProxyAttached = true;
    }

    // Load fonts immediately
    loadOfflineFonts();


    // ==========================================
    // 3. PROJECTOR RECONNECT & SMART WATERMARK
    // ==========================================
    
    // Extracted Ghost Text setup to manage intervals cleanly and prevent resource leaks
    function setupGhostText(winRef) {
        let attempts = 0;
        if (window._ppCheckTimer) clearInterval(window._ppCheckTimer);
        
        window._ppCheckTimer = setInterval(() => {
            attempts++;
            if (attempts > 20) { clearInterval(window._ppCheckTimer); return; } // Timeout after 2s
            
            const win = winRef || OW.Projector.projectorWindow;
            if (win && !win.closed && win.document && win.document.getElementById('projectorCanvas')) {
                clearInterval(window._ppCheckTimer);
                
                // Inject if it doesn't exist
                if (!win.document.getElementById('ppGhostText')) {
                    const overlay = win.document.createElement('div');
                    overlay.id = 'ppGhostText';
                    overlay.style.cssText = `
                        position: absolute; 
                        top: 50%; left: 50%; 
                        transform: translate(-50%, -50%);
                        text-align: center; 
                        color: rgba(255,255,255,0.15); 
                        font-family: 'Segoe UI', sans-serif; 
                        pointer-events: none;
                        z-index: 9999;
                        width: 100%;
                        transition: opacity 0.3s;
                    `;
                    
                    overlay.innerHTML = `
                        <div style="font-size: 3vw; font-weight: bold; margin-bottom: 10px;">Double-click to Enter Fullscreen</div>
                        <div style="font-size: 1.5vw;">Press F11 to prevent accidental exit</div>
                    `;
                    
                    win.document.body.appendChild(overlay);
                }

                const overlay = win.document.getElementById('ppGhostText');
                
                const updateVisibility = () => {
                    if (!win || win.closed) {
                        if (window._ppGhostInterval) clearInterval(window._ppGhostInterval);
                        return;
                    }
                    
                    const isFS = win.document.fullscreenElement || 
                                 win.document.webkitFullscreenElement || 
                                 win.document.mozFullScreenElement;
                                 
                    const liveState = OW.State.liveState;
                    const hasSlide = liveState && liveState.slide !== null;
                    const isBlanked = OW.Projector.isBlack || OW.Projector.isClear || OW.Projector.isLogo;
                    const isPresentingContent = hasSlide && !isBlanked;

                    // HIDE if Fullscreen OR Presenting Content
                    overlay.style.opacity = (isFS || isPresentingContent) ? "0" : "1";
                };
                
                win.document.addEventListener('fullscreenchange', updateVisibility);
                win.document.addEventListener('resize', updateVisibility);
                
                // Clear any old interval to fix the resource leak
                if (window._ppGhostInterval) clearInterval(window._ppGhostInterval);
                window._ppGhostInterval = setInterval(updateVisibility, 250); 
                
                updateVisibility();
            }
        }, 100);
    }

    if (OW.Projector && OW.Projector.openProjector) {
        const originalOpenProjector = OW.Projector.openProjector;
        
        OW.Projector.openProjector = function() {
            let reconnected = false;
            
            try {
                // Try to reconnect to an existing projector window by hitting the exact same window name
                const existingWin = window.open("", "Projector", "width=800,height=600");
                
                if (existingWin && existingWin.document && existingWin.document.getElementById('projectorCanvas')) {
                    console.log("Projector Pro: Reconnecting to existing Projector window seamlessly.");
                    this.projectorWindow = existingWin;
                    reconnected = true;
                    
                    const status = document.getElementById('projStatus');
                    if (status) {
                        status.innerText = "LIVE (Reconnected)";
                        status.style.color = "#4caf50";
                    }
                    
                    // Safely re-establish the connection monitor without leaking
                    if (this._projMonitorInterval) clearInterval(this._projMonitorInterval);
                    this._projMonitorInterval = setInterval(() => {
                        if (this.projectorWindow && this.projectorWindow.closed) {
                            clearInterval(this._projMonitorInterval);
                            if (status) {
                                status.innerText = "OFFLINE";
                                status.style.color = "#d32f2f";
                            }
                        }
                    }, 1000);

                    // Re-sync fonts into the existing window to prevent fallback errors
                    try {
                        if (typeof existingWin.synchronizeFonts === 'function') {
                            existingWin.synchronizeFonts();
                        } else {
                            for (const fontName in OW.Data.localFontData) {
                                const fontFace = new existingWin.FontFace(fontName, `url(${OW.Data.localFontData[fontName]})`);
                                existingWin.document.fonts.add(fontFace);
                            }
                        }
                    } catch(e) { console.warn("Projector Pro: Font re-sync warning:", e); }
                    
                    // Force broadcast update
                    setTimeout(() => { this.reRenderLive(); }, 300);
                }
            } catch (e) {
                console.error("Projector Pro: Reconnection check failed", e);
            }
            
            // If we couldn't reconnect (or it was empty), run the original setup
            if (!reconnected) {
                originalOpenProjector.call(this);
            }
            
            // Apply the smart watermark
            setupGhostText(this.projectorWindow);
        };
    }

    // ==========================================
    // 4. SMART TEXT FITTING ENGINE
    // ==========================================
    function calculateFittingFontSize(ctx, text, fontFace, bold, italic, maxWidth, maxHeight, startSize) {
        let size = startSize;
        const minSize = 20;
        const lineSpacingMultiplier = 1.2;

        ctx.save();

        while (size >= minSize) {
            ctx.font = `${italic?'italic':''} ${bold?'bold':''} ${size}px "${fontFace}"`;
            
            const words = text.split('\n').join(' [BR] ').split(' ');
            let lines = 0;
            let currentLine = words[0];
            
            for (let i = 1; i < words.length; i++) {
                if (words[i] === '[BR]') {
                    lines++;
                    currentLine = "";
                    continue;
                }
                const testLine = currentLine + (currentLine === "" ? "" : " ") + words[i];
                const metrics = ctx.measureText(testLine);
                if (metrics.width < maxWidth) {
                    currentLine = testLine;
                } else {
                    lines++;
                    currentLine = words[i];
                }
            }
            if (currentLine) lines++;
            
            const totalHeight = lines * (size * lineSpacingMultiplier);
            
            // Check if fits (height < canvas height - margins)
            if (totalHeight < (maxHeight - 120)) { 
                ctx.restore();
                return size;
            }
            
            size -= 2; // Granular step down
        }
        ctx.restore();
        return minSize;
    }

    // Override Projector.renderSlide (Live Output)
    if (OW.Projector && OW.Projector.renderSlide) {
        const originalRender = OW.Projector.renderSlide;
        
        OW.Projector.renderSlide = function(ctx, slide, footer) {
            let slideClone = slide ? JSON.parse(JSON.stringify(slide)) : null;
            
            // Inject Global Scripture Background if applicable
            const settings = OW.State.scriptureSettings;
            if (slideClone && (
                (footer && footer.includes("(KJV)")) || 
                (ctx.canvas.id === 'scripturePreviewCanvas')
            )) {
                if (settings.bgImage && !slideClone.bgImage) {
                    slideClone.bgImage = settings.bgImage;
                }
            }

            // Apply Smart Sizing
            if (slideClone && slideClone.layers && slideClone.layers.length > 0) {
                const isScriptureContext = (footer && footer.includes("(KJV)")) || 
                                         (ctx.canvas.id === 'scripturePreviewCanvas');
                
                if (isScriptureContext) {
                    const layer = slideClone.layers[0];
                    const targetSize = settings.scriptureSize; 
                    const safeWidth = 1920 - 200; 
                    const safeHeight = 1080; 
                    
                    const optimalSize = calculateFittingFontSize(
                        ctx, 
                        layer.text, 
                        settings.font, 
                        settings.bold, 
                        settings.italic, 
                        safeWidth, 
                        safeHeight, 
                        targetSize 
                    );
                    
                    if (!layer.style) layer.style = {};
                    layer.style.fontSize = optimalSize;
                    
                    // Force settings
                    layer.style.bold = settings.bold;
                    layer.style.italic = settings.italic;
                    layer.style.font = settings.font;
                    layer.style.color = settings.color;
                }
            }

            originalRender.call(this, ctx, slideClone, footer);
        };
    }

    // ==========================================
    // 5. PREVIEW WINDOW FIX (Override Settings Preview)
    // ==========================================
    if (OW.ScriptureSettings && OW.ScriptureSettings.updatePreview) {
        OW.ScriptureSettings.updatePreview = function() {
            const settings = OW.State.scriptureSettings;
            
            // 1. Get Settings from UI
            settings.font = document.getElementById('scriptureFontSelect').value;
            settings.scriptureSize = parseInt(document.getElementById('scriptureSizeInput').value);
            settings.footerSize = parseInt(document.getElementById('footerSizeInput').value);
            
            // 2. Get Test Text
            const testScripture = document.getElementById('testScriptureSelect').value;
            let scriptureText = "";
            let reference = "";
            
            switch (testScripture) {
                case "John 3:16":
                    scriptureText = "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.";
                    reference = "John 3:16"; break;
                case "Psalm 23:1":
                    scriptureText = "The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters.";
                    reference = "Psalm 23:1"; break;
                case "Matthew 28:19":
                    scriptureText = "Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit.";
                    reference = "Matthew 28:19"; break;
                case "Romans 8:28":
                    scriptureText = "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.";
                    reference = "Romans 8:28"; break;
                case "Esther 8:9":
                    scriptureText = "Then were the king's scribes called at that time in the third month, that is, the month Sivan, on the three and twentieth day thereof; and it was written according to all that Mordecai commanded unto the Jews, and to the lieutenants, and the deputies and rulers of the provinces which are from India unto Ethiopia, an hundred twenty and seven provinces, unto every province according to the writing thereof, and unto every people after their language, and to the Jews according to their writing, and according to their language.";
                    reference = "Esther 8:9"; break;
            }
            
            // 3. Construct a Mock Slide
            const mockSlide = {
                layers: [{
                    text: scriptureText,
                    style: {
                        fontSize: settings.scriptureSize,
                        font: settings.font,
                        color: settings.color,
                        bold: settings.bold,
                        italic: settings.italic
                    }
                }],
                bgImage: settings.bgImage || null
            };
            
            // 4. Render using the Core Projector
            const canvas = document.getElementById('scripturePreviewCanvas');
            const ctx = canvas.getContext('2d');
            OW.Projector.renderSlide(ctx, mockSlide, `- ${reference} (KJV)`);
            
            if (this.updateSizeOptions) this.updateSizeOptions();
        };
    }

    // ==========================================
    // 6. SCRIPTURE SETTINGS UI (BG & FORMATTING)
    // ==========================================
    if (OW.ScriptureSettings && OW.ScriptureSettings.open) {
        const originalScriptureOpen = OW.ScriptureSettings.open;
        
        OW.ScriptureSettings.open = function() {
            originalScriptureOpen.call(OW.ScriptureSettings);
            
            // A. Add Formatting Buttons (Bold/Italic)
            const fontSelect = document.getElementById('scriptureFontSelect');
            if (fontSelect && !document.getElementById('ppBoldBtn')) {
                const container = fontSelect.parentNode;
                
                // Bold
                const boldBtn = document.createElement('button');
                boldBtn.id = 'ppBoldBtn';
                boldBtn.className = 'pp-btn';
                boldBtn.innerHTML = '<b>B</b>';
                boldBtn.style.marginLeft = '5px';
                boldBtn.onclick = () => {
                    OW.State.scriptureSettings.bold = !OW.State.scriptureSettings.bold;
                    updateUI();
                    OW.ScriptureSettings.updatePreview();
                };
                
                // Italic
                const italicBtn = document.createElement('button');
                italicBtn.id = 'ppItalicBtn';
                italicBtn.className = 'pp-btn';
                italicBtn.innerHTML = '<i>I</i>';
                italicBtn.style.marginLeft = '2px';
                italicBtn.onclick = () => {
                    OW.State.scriptureSettings.italic = !OW.State.scriptureSettings.italic;
                    updateUI();
                    OW.ScriptureSettings.updatePreview();
                };
                
                container.appendChild(boldBtn);
                container.appendChild(italicBtn);
            }

            // B. Add Background Image Controls
            const controlsCol = document.querySelector('.scripture-controls');
            if (controlsCol && !document.getElementById('ppBgControl')) {
                const bgGroup = document.createElement('div');
                bgGroup.id = 'ppBgControl';
                bgGroup.className = 'pp-control-group';
                
                bgGroup.innerHTML = `
                    <label style="color:#aaa; font-size:0.9rem; display:block; margin-bottom:8px;">Default Scripture Background</label>
                    <div style="display:flex; gap:10px;">
                        <button class="pp-btn" id="ppUploadBg">Upload Image...</button>
                        <button class="pp-btn" id="ppClearBg" style="background:#d32f2f; border-color:#b71c1c;">Clear</button>
                    </div>
                    <input type="file" id="ppBgInput" style="display:none" accept="image/*">
                    <div id="ppBgStatus" style="font-size:0.8rem; color:#888; margin-top:5px;"></div>
                `;
                
                controlsCol.appendChild(bgGroup);
                
                document.getElementById('ppUploadBg').onclick = () => document.getElementById('ppBgInput').click();
                
                document.getElementById('ppBgInput').onchange = (e) => {
                    if (e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                            OW.State.scriptureSettings.bgImage = evt.target.result;
                            document.getElementById('ppBgStatus').innerText = "Image Loaded";
                            OW.ScriptureSettings.updatePreview();
                        };
                        reader.readAsDataURL(e.target.files[0]);
                    }
                };
                
                document.getElementById('ppClearBg').onclick = () => {
                    delete OW.State.scriptureSettings.bgImage;
                    document.getElementById('ppBgStatus').innerText = "No image set";
                    OW.ScriptureSettings.updatePreview();
                };
            }
            
            // C. Add Longest Verse Option if not present
            const testSelect = document.getElementById('testScriptureSelect');
            if (testSelect && !testSelect.querySelector('option[value="Esther 8:9"]')) {
                const option = document.createElement('option');
                option.value = "Esther 8:9";
                option.textContent = "Esther 8:9 (Longest Verse)";
                testSelect.appendChild(option);
            }
            
            updateUI();
        };
    }

    function updateUI() {
        const boldBtn = document.getElementById('ppBoldBtn');
        const italicBtn = document.getElementById('ppItalicBtn');
        const bgStatus = document.getElementById('ppBgStatus');
        
        if (boldBtn) boldBtn.classList.toggle('active', OW.State.scriptureSettings.bold);
        if (italicBtn) italicBtn.classList.toggle('active', OW.State.scriptureSettings.italic);
        if (bgStatus) {
            bgStatus.innerText = OW.State.scriptureSettings.bgImage ? "Image set" : "No image set";
        }
    }

    // Force menu update
    if (OW.Extensions.addExtensionMenuItem) {
        OW.Extensions.addExtensionMenuItem("✅ Projector Pro Active", () => {});
        if (OW.Extensions.updateExtensionsMenu) OW.Extensions.updateExtensionsMenu();
    }
    
    OW.UI.showToast("Projector Pro v1.3 Loaded");
}
