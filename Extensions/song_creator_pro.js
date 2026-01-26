/**
 * @name Song Creator Pro
 * @id song_creator_pro
 * @version 1.1.0
 * @author OpenWorship Extensions
 * @description Advanced song creation with batch lyrics, smart splitting, and visual preview management.
 */

function init(OW) {
    console.log("Initializing Song Creator Pro v1.1.0...");

    // ==========================================
    // 1. CSS INJECTION
    // ==========================================
    const style = document.createElement('style');
    style.textContent = `
        /* FAB Button specific for Songs */
        .song-fab {
            position: absolute; 
            bottom: 20px; 
            right: 420px; /* FIXED: Aligned with Presentation Add Button */
            width: 40px; 
            height: 40px; 
            border-radius: 50%; 
            border: none;
            background: #9c27b0; /* Distinct Purple Color */
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

        /* Left Panel: Inputs */
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

        /* Right Panel: Preview Grid */
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

        /* Controls styling - CENTER ALIGNED */
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
            text-align: center; /* Center text input */
        }
        
        textarea.sc-input {
            text-align: left; /* Exception for large text block */
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

        /* Preview Cards */
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

        /* Mini Editor Overlay (inside left panel) */
        .sc-mini-editor {
            display: none;
            flex-direction: column;
            gap: 15px;
            animation: fadeIn 0.3s;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Status Indicator */
        .sc-status {
            font-size: 0.8rem;
            color: #888;
            margin-top: 5px;
            height: 1.2em;
        }
    `;
    document.head.appendChild(style);

    // ==========================================
    // 2. UI CREATION (FAB & MODAL)
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
    const originalSwitchTab = OW.Library.switchTab;
    OW.Library.switchTab = function(tab) {
        originalSwitchTab.call(OW.Library, tab);
        if (tab === 'Song') {
            fab.style.display = 'flex';
        } else {
            fab.style.display = 'none';
        }
    };

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
    // 3. LOGIC & STATE
    // ==========================================
    let songState = {
        slides: [],
        globalBg: null
    };
    let currentEditIndex = -1;
    let autoGenTimer = null;

    // --- EVENT LISTENERS ---

    // Open/Close
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

    // 3a. Auto-Generation Logic (Lyrics Input)
    const lyricsInput = document.getElementById('scLyrics');
    const statusDiv = document.getElementById('scAutoStatus');

    lyricsInput.addEventListener('input', () => {
        statusDiv.innerText = "Typing...";
        clearTimeout(autoGenTimer);
        
        // Debounce 1 second
        autoGenTimer = setTimeout(() => {
            statusDiv.innerText = "Generating...";
            generateSlides();
            statusDiv.innerText = `Generated ${songState.slides.length} slides.`;
        }, 1000);
    });

    // 3b. Slider Logic (Immediate Update)
    const slider = document.getElementById('scLinesSlider');
    const sliderLabel = document.getElementById('scSliderLabel');
    slider.oninput = () => {
        sliderLabel.textContent = `Lines per Slide: ${slider.value}`;
        // Generate immediately for slider interaction
        if (lyricsInput.value.trim()) {
            generateSlides(); 
        }
    };

    // 3c. Core Generation Function
    function generateSlides() {
        const text = lyricsInput.value;
        const linesPerSlide = parseInt(slider.value);
        
        if (!text.trim()) return;

        const lines = text.split('\n').filter(l => l.trim() !== '');
        songState.slides = [];

        for (let i = 0; i < lines.length; i += linesPerSlide) {
            const chunk = lines.slice(i, i + linesPerSlide).join('\n');
            songState.slides.push({
                layers: [{ 
                    text: chunk, 
                    style: { fontSize: 80, color: '#ffffff', font: 'Segoe UI' } 
                }],
                bgImage: songState.globalBg // Apply global if exists
            });
        }

        renderGrid();
    }

    // Force Gen Button (just in case)
    document.getElementById('scForceGenBtn').onclick = () => {
        generateSlides();
        OW.UI.showToast("Slides Regenerated");
    };

    // 3d. Global BG (Immediate Update)
    document.getElementById('scGlobalBgBtn').onclick = () => document.getElementById('scGlobalBgInput').click();
    document.getElementById('scGlobalBgInput').onchange = (e) => {
        if(e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                songState.globalBg = evt.target.result;
                
                // If lyrics exist, regenerate fully to ensure clean slate
                if (document.getElementById('scLyrics').value.trim()) {
                    generateSlides();
                } else {
                    // Just update state if no slides yet
                }
                OW.UI.showToast("Global background updated");
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // Navigation
    document.getElementById('scBackBtn').onclick = showMainInput;

    // Mini Editor Logic
    document.getElementById('scEditText').oninput = (e) => {
        if(currentEditIndex > -1) {
            songState.slides[currentEditIndex].layers[0].text = e.target.value;
            updateCard(currentEditIndex);
        }
    };

    document.getElementById('scEditSize').oninput = (e) => {
        if(currentEditIndex > -1) {
            songState.slides[currentEditIndex].layers[0].style.fontSize = parseInt(e.target.value);
            updateCard(currentEditIndex);
        }
    };

    document.getElementById('scEditBgBtn').onclick = () => document.getElementById('scEditBgInput').click();
    document.getElementById('scEditBgInput').onchange = (e) => {
        if(e.target.files[0] && currentEditIndex > -1) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                songState.slides[currentEditIndex].bgImage = evt.target.result;
                updateCard(currentEditIndex);
                OW.UI.showToast("Slide background updated");
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    document.getElementById('scClearBgBtn').onclick = () => {
        if (currentEditIndex > -1) {
            delete songState.slides[currentEditIndex].bgImage;
            updateCard(currentEditIndex);
        }
    };

    // SAVE LOGIC
    document.getElementById('scSaveBtn').onclick = async () => {
        const title = document.getElementById('scTitle').value.trim() || "Untitled Song";
        if (songState.slides.length === 0) {
            OW.UI.showToast("Generate some slides first!");
            return;
        }

        const newSong = {
            id: Date.now(),
            title: title,
            type: "Song",
            slides: JSON.parse(JSON.stringify(songState.slides)), // Deep copy
            created: Date.now(),
            modified: Date.now()
        };

        // Add to Library State
        OW.State.library.push(newSong);
        
        // Save to IndexedDB
        if (OW.Data.saveLibraryItemToStorage) {
            await OW.Data.saveLibraryItemToStorage(newSong);
        }

        // Refresh UI
        if (OW.State.currentTab === 'Song') {
            OW.Library.render();
        }

        modal.style.display = 'none';
        OW.UI.showToast(`Song "${title}" saved to library!`);
    };

    // ==========================================
    // 4. HELPER FUNCTIONS
    // ==========================================

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
        
        document.querySelectorAll('.sc-card').forEach((c, i) => {
            c.style.borderColor = (i === index) ? '#9c27b0' : '#444';
        });
    }

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
            
            // Thumb
            const thumb = document.createElement('div');
            thumb.className = 'sc-card-thumb';
            const canvas = document.createElement('canvas');
            canvas.width = 1920; 
            canvas.height = 1080;
            thumb.appendChild(canvas);
            
            // Render content to canvas
            const ctx = canvas.getContext('2d');
            OW.Projector.renderSlide(ctx, slide);

            // Info
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
        OW.Projector.renderSlide(ctx, songState.slides[index]);
    }

    console.log("Song Creator Pro v1.1.0 loaded successfully.");
}
