/**
 * @extension
 * @id live_alerts_v2
 * @name Live Alerts (News Ticker)
 * @version 2.0.3
 * @author OpenWorship Community
 */

function init(OW) {
    console.log("Initializing Live Alerts Extension (Ticker Mode)...");

    // ==========================================
    // 1. EXTENSION STATE
    // ==========================================
    const AlertState = {
        visible: false,
        text: "Parents of child 102 please report to nursery...",
        color: "#cc0000", // Dark Red
        textColor: "#ffffff",
        opacity: 0.9,
        // Ticker State
        tickerX: 1920, // Start off-screen right
        speed: 4,      // Pixels per frame
        animationFrameId: null
    };

    // ==========================================
    // 2. INJECT UI CONTROLS (MENU ITEM)
    // ==========================================
    
    // We utilize the ExtensionSystem to add a proper menu item
    OW.Extensions.addExtensionMenuItem("Live Alerts Control", toggleAlertPanel);

    // ==========================================
    // 3. FLOATING CONTROL PANEL
    // ==========================================
    const panelId = 'alerts-floating-panel';
    let panel = document.getElementById(panelId);
    
    if (!panel) {
        panel = document.createElement('div');
        panel.id = panelId;
        // Updated styling for better UI adaptation
        panel.style.cssText = `
            display: none;
            position: absolute;
            top: 40px;
            right: 250px; 
            width: 300px;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.8);
            z-index: 5000;
            padding: 15px;
            font-family: 'Segoe UI', sans-serif;
        `;
        
        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #333; padding-bottom:10px;">
                <span style="font-weight:bold; color:#e0e0e0; font-size:1.1rem;">News Ticker Control</span>
                <button style="background:none; border:none; color:#888; font-size:1.2rem; cursor:pointer;" onclick="document.getElementById('${panelId}').style.display='none'">&times;</button>
            </div>
            
            <div style="margin-bottom:15px;">
                <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Ticker Message</label>
                <textarea id="alertInputText" rows="3" 
                       style="width:100%; box-sizing:border-box; padding:10px; background:#121212; border:1px solid #444; color:white; border-radius:4px; resize:vertical; font-family:inherit;">${AlertState.text}</textarea>
            </div>
            
            <div style="display:flex; gap:15px; margin-bottom:20px;">
                <div style="flex:1;">
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Background</label>
                    <div style="display:flex; align-items:center; background:#121212; border:1px solid #444; border-radius:4px; padding:2px;">
                        <input type="color" id="alertInputBg" value="${AlertState.color}" style="width:100%; height:30px; border:none; padding:0; background:none; cursor:pointer;">
                    </div>
                </div>
                <div style="flex:1;">
                    <label style="display:block; color:#aaa; font-size:0.85rem; margin-bottom:5px;">Speed</label>
                    <input type="range" id="alertSpeed" min="1" max="10" value="${AlertState.speed}" style="width:100%;">
                </div>
            </div>
            
            <button id="btnToggleAlert" style="display:flex; align-items:center; justify-content:center; width:100%; padding:12px; font-weight:bold; font-size:1rem; background:#2b2b2b; border:1px solid #555; color:white; border-radius:6px; cursor:pointer; transition: all 0.2s;">
                START TICKER
            </button>
        `;
        
        document.body.appendChild(panel);
        
        // Bind Events
        const inputTxt = panel.querySelector('#alertInputText');
        const inputBg = panel.querySelector('#alertInputBg');
        const inputSpeed = panel.querySelector('#alertSpeed');
        const btnToggle = panel.querySelector('#btnToggleAlert');
        
        inputTxt.oninput = () => { AlertState.text = inputTxt.value; };
        inputBg.oninput = () => { AlertState.color = inputBg.value; };
        inputSpeed.oninput = () => { AlertState.speed = parseInt(inputSpeed.value); };
        
        btnToggle.onclick = () => {
            AlertState.visible = !AlertState.visible;
            
            if (AlertState.visible) {
                // START
                btnToggle.style.background = '#d32f2f';
                btnToggle.style.borderColor = '#b71c1c';
                btnToggle.innerText = "STOP TICKER";
                AlertState.tickerX = OPENWORSHIP_CONFIG.RESOLUTION.width; // Reset to right edge
                startTickerAnimation();
            } else {
                // STOP
                btnToggle.style.background = '#2b2b2b';
                btnToggle.style.borderColor = '#555';
                btnToggle.innerText = "START TICKER";
                stopTickerAnimation();
                
                // Force one redraw to clear the ticker
                forceRedraw(); 
            }
        };
    }

    function toggleAlertPanel() {
        const p = document.getElementById(panelId);
        if (p) {
            p.style.display = (p.style.display === 'none') ? 'block' : 'none';
        }
    }

    // ==========================================
    // 4. ANIMATION LOOP
    // ==========================================
    function startTickerAnimation() {
        if (AlertState.animationFrameId) cancelAnimationFrame(AlertState.animationFrameId);
        
        function loop() {
            if (!AlertState.visible) return;
            
            // Move ticker
            AlertState.tickerX -= AlertState.speed;
            
            // Render
            forceRedraw();
            
            // Loop
            AlertState.animationFrameId = requestAnimationFrame(loop);
        }
        
        loop();
    }

    function stopTickerAnimation() {
        if (AlertState.animationFrameId) {
            cancelAnimationFrame(AlertState.animationFrameId);
            AlertState.animationFrameId = null;
        }
    }

    // Helper to bypass standard transition logic for smooth 60fps animation
    function forceRedraw() {
        // Get current live content
        const slide = OW.State.liveState.slide;
        const item = OW.State.liveState.item;
        
        // Construct footer like the main app does
        let footer = "";
        if (slide && slide.verseReference) footer = `- ${slide.verseReference} (KJV)`;
        else if (item && item.type === 'Scripture') footer = `- ${item.title} (KJV)`;

        // Redraw Monitor
        const monitorCtx = document.getElementById('monitorCanvas').getContext('2d');
        OW.Projector.renderSlide(monitorCtx, slide, footer);

        // Redraw Projector (if open)
        if (OW.Projector.projectorWindow && !OW.Projector.projectorWindow.closed) {
            const pCanvas = OW.Projector.projectorWindow.document.getElementById('projectorCanvas');
            if (pCanvas) {
                OW.Projector.renderSlide(pCanvas.getContext('2d'), slide, footer);
            }
        }
    }

    // ==========================================
    // 5. MONKEY PATCH RENDERER
    // ==========================================
    const originalRender = OW.Projector.renderSlide;
    
    OW.Projector.renderSlide = function(ctx, slideObj, footer) {
        // 1. Draw Standard Slide
        originalRender.call(OW.Projector, ctx, slideObj, footer);
        
        // 2. Draw Ticker Layer
        const isThumbnail = ctx.canvas.className.includes('preview-canvas');
        
        if (AlertState.visible && !isThumbnail) {
            drawTicker(ctx);
        }
    };
    
    function drawTicker(ctx) {
        const { width, height } = OPENWORSHIP_CONFIG.RESOLUTION;
        const text = AlertState.text;
        if (!text) return;
        
        ctx.save();
        
        // Ticker Settings
        const barHeight = 80;
        const fontSize = 50;
        const yPos = height - barHeight;
        
        // 1. Draw Full Width Background Bar
        ctx.fillStyle = AlertState.color;
        ctx.globalAlpha = AlertState.opacity;
        ctx.fillRect(0, yPos, width, barHeight);
        
        // 2. Draw Top Border for contrast
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillRect(0, yPos, width, 4);

        // 3. Draw Scrolling Text
        ctx.globalAlpha = 1.0;
        ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
        ctx.fillStyle = AlertState.textColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Measure to handle looping logic
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        
        // Draw text (Adjusted Y -5 for better visual centering)
        ctx.fillText(text, AlertState.tickerX, yPos + (barHeight/2) - 5);
        
        // Loop Logic: If text goes off screen left, reset to screen right
        if (AlertState.tickerX + textWidth < 0) {
            AlertState.tickerX = width;
        }
        
        ctx.restore();
    }
}
