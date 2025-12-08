/**
 * @extension
 * @id video_manager_v1
 * @name Video Playback Manager
 * @version 1.0.5
 * @author OpenWorship Project
 */

function init(OW) {
    console.log("Initializing Video Manager v1.0.5...");

    // ==========================================
    // 1. STATE & CONFIG
    // ==========================================
    const VideoState = {
        activeItem: null,
        isPlaying: false,
        duration: 0,
        currentTime: 0,
        volume: 1.0,
        isLooping: false,
        status: "Idle", // Idle, Loading, Ready, Error
        loadingToastId: null
    };

    const panelId = 'video-control-panel';

    // ==========================================
    // 2. INTEGRATION
    // ==========================================

    const fileMenu = document.querySelector('.menu-item[data-menu="file"] .dropdown');
    if (fileMenu) {
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'videoInput';
        input.accept = 'video/mp4,video/webm,video/ogg,video/*';
        input.style.display = 'none';
        input.onchange = (e) => handleVideoImport(e.target);
        document.body.appendChild(input);

        const exitOption = Array.from(fileMenu.children).find(c => c.innerText === 'Exit');
        const importItem = document.createElement('div');
        importItem.innerText = "Import Video...";
        importItem.onclick = () => input.click();
        
        if (exitOption) {
            fileMenu.insertBefore(importItem, exitOption);
        } else {
            fileMenu.appendChild(importItem);
        }
    }

    const originalGoLive = OW.Projector.goLive;
    
    OW.Projector.goLive = function(slide, item, element) {
        if (item && item.type === 'Video') {
            document.querySelectorAll('.slide-wrapper').forEach(x => x.classList.remove('active'));
            if (element) element.classList.add('active');
            
            OW.State.liveState.item = item;
            OW.State.liveState.slide = slide;

            launchVideoOnProjector(item);
        } else {
            stopVideoOnProjector();
            originalGoLive.call(OW.Projector, slide, item, element);
        }
    };

    // ==========================================
    // 3. LOGIC
    // ==========================================

    function handleVideoImport(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // We store the FILE OBJECT itself, not the URL.
            // This allows us to create the URL inside the projector context later.
            console.log("Imported video file:", file.name, file.type);

            const newItem = {
                id: Date.now(),
                title: file.name,
                type: 'Video',
                fileObj: file, // Store raw file
                videoType: file.type || 'video/mp4',
                slides: [{
                    layers: [{
                        text: "[VIDEO FILE]\n" + file.name,
                        style: { fontSize: 60, color: "#00C4FF" }
                    }]
                }]
            };

            OW.State.library.push(newItem);
            OW.State.schedule.push(newItem);
            OW.Schedule.render();
            
            OW.UI.showToast("Video added! (File kept in memory)");
            input.value = "";
        }
    }

    function launchVideoOnProjector(item) {
        VideoState.activeItem = item;
        VideoState.status = "Initializing...";
        showControlPanel();
        showLoadingToast("Connecting to Projector...");

        // Ensure Projector is open
        if (!OW.Projector.projectorWindow || OW.Projector.projectorWindow.closed) {
            OW.Projector.openProjector();
            // Wait for window to initialize
            setTimeout(() => setupProjectorVideo(item), 1500);
        } else {
            setupProjectorVideo(item);
        }
    }

    function setupProjectorVideo(item) {
        VideoState.status = "Loading Media...";
        updateControlPanelUI();
        
        const win = OW.Projector.projectorWindow;
        if (!win) {
            handleError("Projector window lost.");
            return;
        }
        const doc = win.document;
        
        // Hide Canvas
        const canvas = doc.getElementById('projectorCanvas');
        if (canvas) canvas.style.display = 'none';

        // Get/Create Video Element
        let vid = doc.getElementById('activeVideo');
        if (!vid) {
            vid = doc.createElement('video');
            vid.id = 'activeVideo';
            vid.style.cssText = `
                position: absolute; top: 0; left: 0; 
                width: 100vw; height: 100vh; 
                object-fit: contain; background: black;
                z-index: 10;
            `;
            doc.body.appendChild(vid);
        } else {
            vid.style.display = 'block';
        }

        // --- CONTEXT FIX ---
        // We create the ObjectURL *inside* the projector window context
        // using the file object passed from the main window.
        if (item.fileObj) {
            try {
                // Revoke previous if exists to save memory
                if (win._currentVideoUrl) {
                    win.URL.revokeObjectURL(win._currentVideoUrl);
                }
                win._currentVideoUrl = win.URL.createObjectURL(item.fileObj);
                vid.src = win._currentVideoUrl;
            } catch (e) {
                console.error("Context URL creation failed:", e);
                // Fallback (might fail cors)
                vid.src = URL.createObjectURL(item.fileObj);
            }
        } else if (item.videoUrl) {
            // Legacy/Fallback
            vid.src = item.videoUrl;
        }

        vid.type = item.videoType;
        vid.volume = VideoState.volume;
        vid.loop = VideoState.isLooping;
        
        // --- EVENTS ---
        
        vid.onloadstart = () => {
            VideoState.status = "Loading...";
            updateControlPanelUI();
        };

        vid.onwaiting = () => {
            VideoState.status = "Buffering...";
            updateControlPanelUI();
            showLoadingToast("Buffering...");
        };

        vid.oncanplay = () => {
            console.log("Video Can Play");
            VideoState.status = "Ready";
            hideLoadingToast(); // HIDE TOAST HERE
            updateControlPanelUI();
        };

        vid.onerror = (e) => {
            hideLoadingToast();
            const err = vid.error;
            let msg = "Unknown Error";
            if (err) {
                if (err.code === 4) msg = "Format Not Supported";
                else if (err.code === 3) msg = "Decode Error";
                else if (err.code === 2) msg = "Network Error";
            }
            handleError(msg);
        };

        vid.onloadedmetadata = () => {
            VideoState.duration = vid.duration;
            updateControlPanelUI();
        };

        vid.ontimeupdate = () => {
            VideoState.currentTime = vid.currentTime;
            updateControlPanelTime();
        };

        vid.onended = () => {
            VideoState.isPlaying = false;
            VideoState.status = "Ended";
            updateControlPanelUI();
        };

        // Trigger load
        vid.load();

        // Attempt Autoplay
        const playPromise = vid.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                VideoState.isPlaying = true;
                VideoState.status = "Playing";
                updateControlPanelUI();
            }).catch(error => {
                console.warn("Autoplay block:", error);
                VideoState.isPlaying = false;
                VideoState.status = "Paused (Click Play)";
                hideLoadingToast();
                updateControlPanelUI();
            });
        }
    }

    function stopVideoOnProjector() {
        VideoState.isPlaying = false;
        VideoState.activeItem = null;
        hideLoadingToast();
        
        const panel = document.getElementById(panelId);
        if (panel) panel.style.display = 'none';

        if (OW.Projector.projectorWindow && !OW.Projector.projectorWindow.closed) {
            const doc = OW.Projector.projectorWindow.document;
            const vid = doc.getElementById('activeVideo');
            const canvas = doc.getElementById('projectorCanvas');
            
            if (vid) {
                vid.pause();
                vid.removeAttribute('src');
                vid.load();
                vid.style.display = 'none';
            }
            if (canvas) canvas.style.display = 'block';
        }
    }

    // ==========================================
    // 4. UI HELPERS
    // ==========================================

    function showLoadingToast(msg) {
        // Remove existing custom toast if any
        let toast = document.getElementById('vid-process-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'vid-process-toast';
            toast.style.cssText = `
                position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8); color: white; padding: 20px 40px;
                border-radius: 8px; font-size: 1.5rem; border: 1px solid #00C4FF;
                z-index: 9999; display: flex; flex-direction: column; align-items: center; gap: 10px;
            `;
            // Simple spinner
            toast.innerHTML = `
                <div style="width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #00C4FF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <span id="vid-toast-text">${msg}</span>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            document.body.appendChild(toast);
        } else {
            document.getElementById('vid-toast-text').innerText = msg;
            toast.style.display = 'flex';
        }
    }

    function hideLoadingToast() {
        const toast = document.getElementById('vid-process-toast');
        if (toast) toast.style.display = 'none';
    }

    function handleError(msg) {
        VideoState.status = "Error";
        VideoState.isPlaying = false;
        hideLoadingToast();
        updateControlPanelUI();
        OW.UI.showToast("Video Error: " + msg);
        
        const title = document.getElementById('vid-title');
        if(title) {
            title.innerText = "ERROR: " + msg;
            title.style.color = "#ff4444";
        }
    }

    function showControlPanel() {
        let panel = document.getElementById(panelId);
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = panelId;
            panel.style.cssText = `
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                width: 500px; background: #1e1e1e; border: 1px solid #444; border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8); z-index: 7000; padding: 15px;
                display: flex; flex-direction: column; gap: 5px; font-family: 'Segoe UI', sans-serif;
            `;
            
            panel.innerHTML = `
                <div style="display:flex; justify-content:space-between; color:#ccc; font-size:0.9rem;">
                    <div style="display:flex; flex-direction:column;">
                        <span id="vid-title" style="font-weight:bold; color:white;">No Video</span>
                        <span id="vid-status" style="font-size:0.75rem; color:#00C4FF;">Idle</span>
                    </div>
                    <button style="background:none; border:none; color:#888; cursor:pointer; height:fit-content;" onclick="this.parentElement.parentElement.style.display='none'">&times;</button>
                </div>
                
                <!-- Progress Bar -->
                <div style="display:flex; align-items:center; gap:15px; margin: 15px 0;">
                    <span id="vid-time-curr" style="color:#00C4FF; font-family:monospace; min-width: 45px; text-align: right;">00:00</span>
                    <input type="range" id="vid-seek" min="0" max="100" value="0" style="flex:1; cursor:pointer;">
                    <span id="vid-time-total" style="color:#888; font-family:monospace; min-width: 45px;">00:00</span>
                </div>

                <!-- Controls -->
                <div style="display:flex; align-items:center; justify-content:center; gap:20px;">
                    <button id="vid-btn-stop" style="background:#333; border:none; color:white; width:40px; height:40px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:0; font-size:1.2rem;">■</button>
                    
                    <button id="vid-btn-play" style="background:#00C4FF; border:none; color:white; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:1.5rem; display:flex; align-items:center; justify-content:center; padding:0; padding-left:4px;">▶</button>
                    
                    <div style="display:flex; align-items:center; gap:5px;">
                        <span style="font-size:0.8rem; color:#aaa;">Vol</span>
                        <input type="range" id="vid-vol" min="0" max="1" step="0.1" value="1" style="width:80px;">
                    </div>
                    
                    <button id="vid-btn-loop" style="background:transparent; border:1px solid #444; color:#666; padding:5px 10px; border-radius:4px; cursor:pointer; font-size:0.8rem; display:flex; align-items:center; justify-content:center;">Loop</button>
                </div>
            `;
            
            document.body.appendChild(panel);

            // Bind Events
            document.getElementById('vid-btn-play').onclick = togglePlay;
            document.getElementById('vid-btn-stop').onclick = stopPlayback;
            document.getElementById('vid-btn-loop').onclick = toggleLoop;
            
            const seek = document.getElementById('vid-seek');
            seek.oninput = () => {
                const vid = getProjectorVideo();
                if(vid && VideoState.duration) {
                    vid.currentTime = (seek.value / 100) * VideoState.duration;
                }
            };

            const vol = document.getElementById('vid-vol');
            vol.oninput = () => {
                VideoState.volume = vol.value;
                const vid = getProjectorVideo();
                if(vid) vid.volume = VideoState.volume;
            };
        }

        panel.style.display = 'flex';
        updateControlPanelUI();
    }

    function togglePlay() {
        const vid = getProjectorVideo();
        if(!vid) return;
        
        if (vid.paused) {
            vid.play().catch(e => OW.UI.showToast("Error: " + e.message));
            VideoState.isPlaying = true;
            VideoState.status = "Playing";
        } else {
            vid.pause();
            VideoState.isPlaying = false;
            VideoState.status = "Paused";
        }
        updateControlPanelUI();
    }

    function stopPlayback() {
        const vid = getProjectorVideo();
        if(vid) {
            vid.pause();
            vid.currentTime = 0;
        }
        VideoState.isPlaying = false;
        VideoState.status = "Stopped";
        updateControlPanelUI();
    }

    function toggleLoop() {
        const vid = getProjectorVideo();
        const btn = document.getElementById('vid-btn-loop');
        VideoState.isLooping = !VideoState.isLooping;
        if(vid) vid.loop = VideoState.isLooping;
        if(btn) {
            btn.style.color = VideoState.isLooping ? "#00C4FF" : "#666";
            btn.style.borderColor = VideoState.isLooping ? "#00C4FF" : "#444";
        }
    }

    function getProjectorVideo() {
        if (OW.Projector.projectorWindow && !OW.Projector.projectorWindow.closed) {
            return OW.Projector.projectorWindow.document.getElementById('activeVideo');
        }
        return null;
    }

    function updateControlPanelUI() {
        const btnPlay = document.getElementById('vid-btn-play');
        const title = document.getElementById('vid-title');
        const status = document.getElementById('vid-status');
        
        if(btnPlay) {
            btnPlay.innerHTML = VideoState.isPlaying ? '❚❚' : '▶';
            // Adjust padding for pause symbol to center it (doesn't need the left nudge like the triangle)
            btnPlay.style.paddingLeft = VideoState.isPlaying ? '0' : '4px';
            btnPlay.style.background = VideoState.isPlaying ? '#ff9800' : '#00C4FF';
        }
        
        if(title && VideoState.activeItem) {
            title.innerText = VideoState.activeItem.title;
            title.style.color = "white";
        }

        if(status) status.innerText = VideoState.status;
    }

    function updateControlPanelTime() {
        const curr = document.getElementById('vid-time-curr');
        const total = document.getElementById('vid-time-total');
        const seek = document.getElementById('vid-seek');

        if(curr) curr.innerText = formatTime(VideoState.currentTime);
        if(total) total.innerText = formatTime(VideoState.duration);
        if(seek && VideoState.duration > 0) {
            seek.value = (VideoState.currentTime / VideoState.duration) * 100;
        }
    }

    function formatTime(seconds) {
        if(!seconds || isNaN(seconds)) return "00:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
}
