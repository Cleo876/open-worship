/**
 * @name Song Creator Pro + UI Fixes
 * @id song_creator_complete
 * @version 1.3.0
 * @author OpenWorship Extensions
 * @description Adds Song Creator, plus fixes missing Bold/Italic buttons and Projector instructions. Fixed severe resource leaks.
 */

function init(OW) {
    console.log("Initializing Song Creator Pro + UI Fixes v1.3.0...");

    // ==========================================
    // 1. CSS INJECTION (Song Creator + Fixes)
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        /* FAB Button specific for Songs */
        .song-fab {
            position: absolute; 
            bottom: 20px; 
            right: 420px; 
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            border: none;
            background: #9c27b0; 
            color: white; 
            font-size: 24px; 
            font-weight: bold;
            display: none; 
            align-items: center; 
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5); 
            cursor: pointer; 
            z-index: 100;
            transition: transform 0.2s, background 0.2s;
            text-align: center;
            line-height: 1;
        }
        .song-fab:hover { 
            transform: scale(1.1); 
            background: #7b1fa2; 
        }

        /* Modal Layout */
        #songCreatorModal {
            display: none;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            z-index: 5000;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
        }

        .sc-window {
            width: 90vw;
            height: 85vh;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 50px rgba(0,0,0,0.7);
        }

        .sc-header {
            padding: 15px;
            background: #252525;
            border-bottom: 1px solid #333;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .sc-body {
            display: flex;
            flex: 1;
            overflow: hidden;
        }

        .sc-panel-left {
            width: 35%;
            padding: 20px;
            background: #181818;
            border-right: 1px solid #333;
            display: flex;
            flex-direction: column;
            gap: 15px;
            overflow-y: auto;
        }

        .sc-panel-right {
            flex: 1;
            padding: 20px;
            background: #121212;
            overflow-y: auto;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            grid-auto-rows: max-content;
            gap: 15px;
            align-content: start;
        }

        .sc-control-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
            text-align: center;
        }

        .sc-control-group label {
            color: #aaa;
            font-size: 0.9rem;
            text-align: center;
            display: block;
        }

        .sc-input {
            background: #222;
            border: 1px solid #444;
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-family: inherit;
            text-align: center; 
        }
        
        textarea.sc-input {
            text-align: left;
            resize: none;
            height: 200px;
        }

        .sc-slider-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            background: #222;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #333;
        }

        .sc-btn {
            background: #9c27b0;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            transition: background 0.2s;
        }
        .sc-btn:hover { background: #7b1fa2; }
        .sc-btn-secondary { background: #444; }
        .sc-btn-secondary:hover { background: #555; }
        .sc-btn-success { background: #4caf50; }
        .sc-btn-success:hover { background: #43a047; }

        .sc-card {
            background: #222;
            border: 1px solid #444;
            border-radius: 6px;
            overflow: hidden;
            transition: transform 0.2s, border-color 0.2s;
            cursor: pointer;
            display: flex;
            flex-direction: column;
        }
        .sc-card:hover {
            transform: translateY(-2px);
            border-color: #9c27b0;
        }
        .sc-card-thumb {
            width: 100%;
            aspect-ratio: 16/9;
            background: black;
            border-bottom: 1px solid #333;
            position: relative;
        }
        .sc-card-thumb canvas {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .sc-card-body {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            align-items: center;
        }
        .sc-badge {
            background: #333;
            color: #ccc;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 0.7rem;
        }

        .sc-mini-editor {
            display: none;
            flex-direction: column;
            gap: 15px;
            animation: fadeIn 0.3s;
        }
        
        .sc-status {
            font-size: 0.8rem;
            color: #888;
            margin-top: 5px;
            height: 1.2em;
        }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* --- UI FIX STYLES --- */
        .ext-bold-btn {
            font-weight: bold;
            width: 30px;
            background: #333;
            border: 1px solid #555;
            color: #eee;
            cursor: pointer;
            border-radius: 4px;
        }
        .ext-bold-btn.active {
            background: #007acc;
            border-color: #005f9e;
        }
        .ext-italic-btn {
            font-style: italic;
            width: 30px;
            background: #333;
            border: 1px solid #555;
            color: #eee;
            cursor: pointer;
            border-radius: 4px;
        }
        .ext-italic-btn.active {
            background: #007acc;
            border-color: #005f9e;
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. SONG CREATOR UI (FAB & MODAL)
    // ==========================================

    // 2a. Create FAB
    const fab = document.createElement('button');
    fab.className = 'song-fab';
    fab.innerHTML = '&#9835;'; // Music Note
    fab.title = "Create New Song";
    
    // Inject into the main library content area
    const libContent = document.querySelector('.library-content');
    if (libContent) {
        libContent.appendChild(fab);
    } else {
        document.body.appendChild(fab);
    }

    // 2b. Monkey Patch Tab Switcher to toggle FAB visibility
    if (OW.Library && OW.Library.switchTab) {
        const originalSwitchTab = OW.Library.switchTab;
        OW.Library.switchTab = function(tab) {
            originalSwitchTab.call(OW.Library, tab);
            if (tab === 'Song') {
                fab.style.display = 'flex';
            } else {
                fab.style.display = 'none';
            }
        };
    }

    if (OW.State.currentTab === 'Song') fab.style.display = 'flex';

    // 2c. Create Modal Structure
    const modal = document.createElement('div');
    modal.id = 'songCreatorModal';
    modal.innerHTML = `
        <div class="sc-window">
            <div class="sc-header">
                <div style="font-weight:bold; font-size:1.2rem; color:#e0e0e0;">🎵 Song Creator Pro</div>
                <button id="scCloseBtn" style="background:none; border:none; color:#888; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            <div class="sc-body">
                <!-- LEFT: CONTROLS -->
                <div class="sc-panel-left">
                    <div class="sc-control-group">
                        <label>Song Title</label>
                        <input type="text" id="scTitle" class="sc-input" placeholder="e.g. Amazing Grace">
                    </div>

                    <!-- MAIN INPUT VIEW -->
                    <div id="scMainInputView" style="display:flex; flex-direction:column; gap:15px;">
                        <div class="sc-control-group">
                            <label>Lyrics (Paste Here)</label>
                            <textarea id="scLyrics" class="sc-input" placeholder="Paste full lyrics here... Slides generate automatically 1s after typing."></textarea>
                            <div id="scAutoStatus" class="sc-status"></div>
                        </div>
                        
                        <div class="sc-slider-container">
                            <label id="scSliderLabel">Lines per Slide: 4</label>
                            <input type="range" id="scLinesSlider" min="1" max="8" value="4" style="width:100%; cursor:pointer;">
                        </div>

                        <div class="sc-control-group">
                            <label>Global Background Image</label>
                            <button id="scGlobalBgBtn" class="sc-btn sc-btn-secondary">Select Image...</button>
                            <input type="file" id="scGlobalBgInput" style="display:none" accept="image/*">
                        </div>
                        
                        <div class="sc-control-group">
                             <button id="scForceGenBtn" class="sc-btn" style="background:#555; font-size:0.9rem;">
                                <span>Force Regenerate</span>
                            </button>
                        </div>
                    </div>

                    <!-- MINI EDITOR VIEW (Hidden by default) -->
                    <div id="scMiniEditorView" class="sc-mini-editor">
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                            <button id="scBackBtn" class="sc-btn sc-btn-secondary" style="width:auto;">&larr;</button>
                            <h4 style="margin:0; color:white; text-align:center; flex:1;">Edit Slide #<span id="scEditNum">1</span></h4>
                        </div>

                        <div class="sc-control-group">
                            <label>Slide Text</label>
                            <textarea id="scEditText" class="sc-input" style="height:100px; text-align:center;"></textarea>
                        </div>

                        <div class="sc-control-group">
                            <label>Font Size</label>
                            <input type="number" id="scEditSize" class="sc-input" value="90">
                        </div>

                        <div class="sc-control-group">
                            <label>Slide Background</label>
                            <button id="scEditBgBtn" class="sc-btn sc-btn-secondary">Change This Image...</button>
                            <input type="file" id="scEditBgInput" style="display:none" accept="image/*">
                            <button id="scClearBgBtn" style="margin-top:5px; background:none; border:none; color:#d32f2f; cursor:pointer;">Clear Image</button>
                        </div>
                    </div>

                    <div style="flex:1;"></div>
                    <button id="scSaveBtn" class="sc-btn sc-btn-success">💾 Save to Library</button>
                </div>

                <!-- RIGHT: PREVIEW -->
                <div class="sc-panel-right" id="scPreviewGrid">
                    <!-- Slides generated here -->
                    <div style="grid-column:1/-1; text-align:center; color:#555; margin-top:50px;">
                        Paste lyrics to start...
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // ==========================================
    // 3. SONG CREATOR LOGIC
    // ==========================================
    let songState = { slides: [], globalBg: null };
    let currentEditIndex = -1;
    let autoGenTimer = null;

    fab.onclick = () => {
        document.getElementById('scTitle').value = "";
        document.getElementById('scLyrics').value = "";
        document.getElementById('scAutoStatus').innerText = "";
        songState = { slides: [], globalBg: null };
        document.getElementById('scPreviewGrid').innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#555; margin-top:50px;">Paste lyrics to start...</div>';
        showMainInput();
        modal.style.display = 'flex';
    };

    document.getElementById('scCloseBtn').onclick = () => modal.style.display = 'none';

    // Auto-Generation
    const lyricsInput = document.getElementById('scLyrics');
    const statusDiv = document.getElementById('scAutoStatus');

    lyricsInput.addEventListener('input', () => {
        statusDiv.innerText = "Typing...";
        clearTimeout(autoGenTimer);
        autoGenTimer = setTimeout(() => {
            statusDiv.innerText = "Generating...";
            generateSlides();
            statusDiv.innerText = `Generated ${songState.slides.length} slides.`;
        }, 1000);
    });

    const slider = document.getElementById('scLinesSlider');
    const sliderLabel = document.getElementById('scSliderLabel');
    slider.oninput = () => {
        sliderLabel.textContent = `Lines per Slide: ${slider.value}`;
        if (lyricsInput.value.trim()) generateSlides(); 
    };

    function generateSlides() {
        const text = lyricsInput.value;
        const linesPerSlide = parseInt(slider.value);
        if (!text.trim()) return;
        const lines = text.split('\n').filter(l => l.trim() !== '');
        songState.slides = [];
        for (let i = 0; i < lines.length; i += linesPerSlide) {
            const chunk = lines.slice(i, i + linesPerSlide).join('\n');
            songState.slides.push({
                layers: [{ text: chunk, style: { fontSize: 80, color: '#ffffff', font: 'Segoe UI' } }],
                bgImage: songState.globalBg
            });
        }
        renderGrid();
    }

    document.getElementById('scForceGenBtn').onclick = () => { generateSlides(); OW.UI.showToast("Slides Regenerated"); };

    document.getElementById('scGlobalBgBtn').onclick = () => document.getElementById('scGlobalBgInput').click();
    document.getElementById('scGlobalBgInput').onchange = (e) => {
        if(e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                songState.globalBg = evt.target.result;
                if (document.getElementById('scLyrics').value.trim()) generateSlides();
                OW.UI.showToast("Global background updated");
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    document.getElementById('scBackBtn').onclick = showMainInput;

    document.getElementById('scEditText').oninput = (e) => {
        if(currentEditIndex > -1) { songState.slides[currentEditIndex].layers[0].text = e.target.value; updateCard(currentEditIndex); }
    };
    document.getElementById('scEditSize').oninput = (e) => {
        if(currentEditIndex > -1) { songState.slides[currentEditIndex].layers[0].style.fontSize = parseInt(e.target.value); updateCard(currentEditIndex); }
    };
    document.getElementById('scEditBgBtn').onclick = () => document.getElementById('scEditBgInput').click();
    document.getElementById('scEditBgInput').onchange = (e) => {
        if(e.target.files[0] && currentEditIndex > -1) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                songState.slides[currentEditIndex].bgImage = evt.target.result;
                updateCard(currentEditIndex);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    document.getElementById('scClearBgBtn').onclick = () => {
        if (currentEditIndex > -1) { delete songState.slides[currentEditIndex].bgImage; updateCard(currentEditIndex); }
    };

    document.getElementById('scSaveBtn').onclick = async () => {
        const title = document.getElementById('scTitle').value.trim() || "Untitled Song";
        if (songState.slides.length === 0) { OW.UI.showToast("Generate some slides first!"); return; }
        const newSong = {
            id: Date.now(), title: title, type: "Song",
            slides: JSON.parse(JSON.stringify(songState.slides)),
            created: Date.now(), modified: Date.now()
        };
        OW.State.library.push(newSong);
        if (OW.Data.saveLibraryItemToStorage) await OW.Data.saveLibraryItemToStorage(newSong);
        if (OW.State.currentTab === 'Song') OW.Library.render();
        modal.style.display = 'none';
        OW.UI.showToast(`Song "${title}" saved!`);
    };

    function showMainInput() {
        document.getElementById('scMainInputView').style.display = 'flex';
        document.getElementById('scMiniEditorView').style.display = 'none';
        document.querySelectorAll('.sc-card').forEach(c => c.style.borderColor = '#444');
        currentEditIndex = -1;
    }
    function showMiniEditor(index) {
        currentEditIndex = index;
        const slide = songState.slides[index];
        document.getElementById('scMainInputView').style.display = 'none';
        document.getElementById('scMiniEditorView').style.display = 'flex';
        document.getElementById('scEditNum').innerText = index + 1;
        document.getElementById('scEditText').value = slide.layers[0].text;
        document.getElementById('scEditSize').value = slide.layers[0].style.fontSize || 80;
        document.querySelectorAll('.sc-card').forEach((c, i) => { c.style.borderColor = (i === index) ? '#9c27b0' : '#444'; });
    }
    
    // FIX: Memory leak in grid generation
    function renderGrid() {
        const grid = document.getElementById('scPreviewGrid');
        grid.innerHTML = '';
        if (songState.slides.length === 0) { 
            grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#555; margin-top:50px;">Paste lyrics to start...</div>'; 
            return; 
        }
        
        songState.slides.forEach((slide, index) => {
            const card = document.createElement('div'); 
            card.className = 'sc-card'; 
            card.id = `sc-card-${index}`;
            
            const thumb = document.createElement('div'); 
            thumb.className = 'sc-card-thumb';
            
            const canvas = document.createElement('canvas'); 
            // Dramatically reduce canvas memory footprint (saves ~94% memory)
            canvas.width = 480; 
            canvas.height = 270;
            thumb.appendChild(canvas);
            
            const ctx = canvas.getContext('2d'); 
            // Scale drawing operations to fit the smaller canvas
            ctx.scale(0.25, 0.25);
            OW.Projector.renderSlide(ctx, slide);
            
            const body = document.createElement('div'); 
            body.className = 'sc-card-body';
            body.innerHTML = `<span class="sc-badge">Slide ${index + 1}</span>`;
            
            card.appendChild(thumb); 
            card.appendChild(body);
            card.onclick = () => showMiniEditor(index);
            grid.appendChild(card);
        });
    }
    
    function updateCard(index) {
        const card = document.getElementById(`sc-card-${index}`);
        if (!card) return;
        const canvas = card.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas efficiently
        ctx.setTransform(1, 0, 0, 1, 0, 0); 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reapply scaling
        ctx.scale(0.25, 0.25);
        OW.Projector.renderSlide(ctx, songState.slides[index]);
    }

    // ==========================================
    // 4. UI FIXES INJECTION
    // ==========================================

    // FIX 1: Projector Instructions
    // Monkey patch the openProjector function
    if (OW.Projector && OW.Projector.openProjector) {
        const originalOpenProjector = OW.Projector.openProjector;
        OW.Projector.openProjector = function() {
            originalOpenProjector.call(OW.Projector);
            
            let attempts = 0;
            // Wait for window to open
            const checkTimer = setInterval(() => {
                attempts++;
                if (attempts > 20) { // Stop checking after 10 seconds to prevent endless polling leak
                    clearInterval(checkTimer);
                    return;
                }
                if (OW.Projector.projectorWindow && !OW.Projector.projectorWindow.closed && OW.Projector.projectorWindow.document.body) {
                    clearInterval(checkTimer);
                    
                    const win = OW.Projector.projectorWindow;
                    if (!win.document.getElementById('projInstructions')) {
                        const instructions = win.document.createElement('div');
                        instructions.id = 'projInstructions';
                        instructions.style.cssText = `
                            position: absolute; 
                            bottom: 20px; 
                            width: 100%; 
                            text-align: center; 
                            color: rgba(255,255,255,0.3); 
                            font-family: sans-serif; 
                            font-size: 14px; 
                            pointer-events: none;
                            text-shadow: 0 1px 2px rgba(0,0,0,0.8);
                        `;
                        instructions.innerText = "Double-click to Toggle Fullscreen";
                        win.document.body.appendChild(instructions);
                    }
                }
            }, 500);
        };
    }

    // FIX 2: Scripture Bold/Italic Buttons
    // Monkey patch ScriptureSettings.open
    if (OW.ScriptureSettings && OW.ScriptureSettings.open) {
        const originalScriptureOpen = OW.ScriptureSettings.open;
        OW.ScriptureSettings.open = function() {
            originalScriptureOpen.call(OW.ScriptureSettings);
            
            // Inject buttons if they don't exist
            const fontSelect = document.getElementById('scriptureFontSelect');
            if (fontSelect && !document.getElementById('extBoldBtn')) {
                const container = fontSelect.parentNode; // .control-row
                
                // Bold Button
                const boldBtn = document.createElement('button');
                boldBtn.id = 'extBoldBtn';
                boldBtn.className = 'ext-bold-btn';
                boldBtn.innerText = 'B';
                boldBtn.onclick = () => {
                    OW.State.scriptureSettings.bold = !OW.State.scriptureSettings.bold;
                    updateButtonStates();
                    OW.ScriptureSettings.updatePreview();
                };
                
                // Italic Button
                const italicBtn = document.createElement('button');
                italicBtn.id = 'extItalicBtn';
                italicBtn.className = 'ext-italic-btn';
                italicBtn.innerText = 'I';
                italicBtn.onclick = () => {
                    OW.State.scriptureSettings.italic = !OW.State.scriptureSettings.italic;
                    updateButtonStates();
                    OW.ScriptureSettings.updatePreview();
                };
                
                container.appendChild(boldBtn);
                container.appendChild(italicBtn);
            }
            
            updateButtonStates();
        };
    }

    function updateButtonStates() {
        const boldBtn = document.getElementById('extBoldBtn');
        const italicBtn = document.getElementById('extItalicBtn');
        if (boldBtn) {
            boldBtn.classList.toggle('active', OW.State.scriptureSettings.bold);
        }
        if (italicBtn) {
            italicBtn.classList.toggle('active', OW.State.scriptureSettings.italic);
        }
    }

    // FIX 3: Extension List Refresh
    // Force the menu to update immediately to show this extension
    if (OW.Extensions.addExtensionMenuItem) {
        OW.Extensions.addExtensionMenuItem(" Song Creator Pro (Active)", () => {
            OW.UI.showToast("Song Creator is active in Songs tab");
        });
        // Try to force update if method exists
        if (OW.Extensions.updateExtensionsMenu) {
            OW.Extensions.updateExtensionsMenu();
        }
    }

    console.log("Song Creator Complete loaded with UI fixes.");
    OW.UI.showToast("Song Creator & Fixes Loaded!");
}
