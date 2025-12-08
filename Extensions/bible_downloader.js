/**
 * @extension
 * @id bible_downloader_v1
 * @name Bible Version Downloader
 * @version 1.1.0
 * @author OpenWorship Project
 */

function init(OW) {
    console.log("Initializing Bible Downloader Extension...");

    // ==========================================
    // 1. CONFIGURATION: AVAILABLE VERSIONS
    // ==========================================
    // Note: NIV, NLT, and NKJV are copyrighted and typically not available via public JSON.
    // We use legal Public Domain / Open License alternatives here.
    const BIBLE_SOURCES = [
        {
            name: "World English Bible (WEB)",
            key: "en_web",
            desc: "Modern English, Public Domain. Best alternative to NIV/NLT.",
            url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_web.json"
        },
        {
            name: "American Standard Version (ASV)",
            key: "en_asv",
            desc: "Literal and accurate. The basis for the NASB.",
            url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_asv.json"
        },
        {
            name: "Bible in Basic English (BBE)",
            key: "en_bbe",
            desc: "Simplified English. Great for kids or ESL.",
            url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json"
        },
        {
            name: "Young's Literal Translation (YLT)",
            key: "en_ylt",
            desc: "Strictly literal translation for study.",
            url: "https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_ylt.json"
        }
    ];

    // ==========================================
    // 2. REGISTER MENU ITEM
    // ==========================================
    OW.Extensions.addExtensionMenuItem("Bible Downloader", showDownloaderPanel);

    // ==========================================
    // 3. UI GENERATION
    // ==========================================
    const panelId = 'bible-downloader-panel';
    
    function showDownloaderPanel() {
        let panel = document.getElementById(panelId);
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = panelId;
            panel.style.cssText = `
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 500px;
                background: #1e1e1e;
                border: 1px solid #444;
                border-radius: 8px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.9);
                z-index: 6000;
                font-family: 'Segoe UI', sans-serif;
                overflow: hidden;
            `;
            
            // Header
            const header = `
                <div style="background:#252525; padding:15px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; color:#fff; font-size:1.1rem;">Download Bibles</span>
                    <button style="background:none; border:none; color:#888; cursor:pointer; font-size:1.2rem;" onclick="document.getElementById('${panelId}').style.display='none'">&times;</button>
                </div>
            `;
            
            // List Generation
            let listHtml = `<div style="padding:15px; max-height:400px; overflow-y:auto;">`;
            
            BIBLE_SOURCES.forEach((source, index) => {
                listHtml += `
                    <div style="background:#151515; border:1px solid #333; border-radius:6px; padding:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="flex:1; padding-right:15px; display:flex; flex-direction:column; justify-content:center;">
                            <div style="color:#00C4FF; font-weight:bold; margin-bottom:4px;">${source.name}</div>
                            <div style="color:#888; font-size:0.8rem;">${source.desc}</div>
                        </div>
                        <button class="download-btn" data-index="${index}" style="background:#333; border:1px solid #555; color:white; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:0.8rem; height:fit-content;">
                            FETCH
                        </button>
                    </div>
                `;
            });
            
            listHtml += `
                <div style="margin-top:15px; padding:10px; background:rgba(255,165,0,0.1); border-left:3px solid orange; color:#ccc; font-size:0.8rem; line-height:1.4;">
                    <strong>Note:</strong> Copyrighted versions (NIV, NLT, NKJV) are not available via public fetchers due to licensing restrictions. The "World English Bible" is recommended as a modern alternative.
                </div>
            </div>`;
            
            panel.innerHTML = header + listHtml;
            document.body.appendChild(panel);
            
            // Bind Events
            const btns = panel.querySelectorAll('.download-btn');
            btns.forEach(btn => {
                btn.onclick = function() {
                    const idx = this.getAttribute('data-index');
                    fetchBible(BIBLE_SOURCES[idx], this);
                };
            });
        }
        
        panel.style.display = 'block';
    }

    // ==========================================
    // 4. FETCH & PROCESS LOGIC
    // ==========================================
    function fetchBible(source, btnElement) {
        const originalText = btnElement.innerText;
        btnElement.innerText = "LOADING...";
        btnElement.style.background = "#555";
        btnElement.disabled = true;
        
        OW.UI.showToast(`Fetching ${source.name}...`);
        
        fetch(source.url)
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                processBibleData(data, source.key, source.name);
                
                btnElement.innerText = "DONE!";
                btnElement.style.background = "#4caf50";
                btnElement.style.borderColor = "#4caf50";
                
                setTimeout(() => {
                    btnElement.innerText = originalText;
                    btnElement.style.background = "#333";
                    btnElement.style.borderColor = "#555";
                    btnElement.disabled = false;
                }, 3000);
            })
            .catch(err => {
                console.error(err);
                OW.UI.showToast("Error: " + err.message);
                btnElement.innerText = "FAILED";
                btnElement.style.background = "#d32f2f";
                setTimeout(() => {
                    btnElement.innerText = originalText;
                    btnElement.style.background = "#333";
                    btnElement.disabled = false;
                }, 3000);
            });
    }

    function processBibleData(data, filePrefix, displayName) {
        // Validation check
        if (!Array.isArray(data) || !data[0].chapters) {
            OW.UI.showToast("Invalid JSON format received.");
            return;
        }

        const newBibleLibrary = []; 
        let idCounter = Date.now(); // Ensure unique IDs

        // Conversion Loop (Same logic as main app)
        data.forEach(book => {
            book.chapters.forEach((chapter, cIdx) => {
                chapter.forEach((verse, vIdx) => {
                    newBibleLibrary.push({ 
                        id: idCounter++, 
                        title: `${book.name} ${cIdx+1}:${vIdx+1}`, 
                        type: "Scripture", 
                        slides: [{layers:[{text: verse, style: {fontSize: 90}}]}] 
                    });
                });
            });
        });

        // Trigger Download
        saveToDisk(newBibleLibrary, `OpenWorship_${filePrefix.toUpperCase()}`, 'bible');
        OW.UI.showToast(`Ready to save ${displayName}!`);
    }

    function saveToDisk(data, fileName, extension) {
        const jsonStr = JSON.stringify(data);
        const blob = new Blob([jsonStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
