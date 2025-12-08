# OpenWorship Extensions Guide

## Overview
Extensions add features to OpenWorship without modifying core code. They're JavaScript files that hook into the modular system.

## Quick Start
Create a .js or .owx file with this structure:

```
/**
 * @extension
 * @id your_extension_id
 * @name Your Extension Name
 * @version 1.0.0
 * @author Your Name or Team
 */

function init(OpenWorship) {
    console.log("Extension initialized!");
    
    // Your code here
}
```
## Loading Extensions
### Individual File

Click Extensions → Load Extension...

Select your ```.js``` or ```.owx``` file

### Folder Upload

Click Extensions → Load Folder...

Select folder containing extension files

All valid extensions load automatically

## Core Concepts
### The OpenWorship Object
Access all modules via ```OpenWorship``` parameter:

```OpenWorship.UI``` - UI controls, toasts, modals

```OpenWorship.Data``` - Storage and file handling

```OpenWorship.Projector``` - Live output rendering

```OpenWorship.Library``` - Library management

```OpenWorship.State``` - Global application state

```OpenWorship.Extensions``` - Extension system API

### Hooks System
Extensions can hook into key events:
```
OpenWorship.Extensions.addHook('projector:open', function() {
    console.log("Projector opened!");
});

OpenWorship.Extensions.addHook('library:tab:switch', function(tabName) {
    console.log("Switched to tab:", tabName);
});
```
Available Hooks:

```core:initialized``` - App fully loaded

```projector:open``` - Projector window opened

```projector:close``` - Projector window closed

```library:tab:switch``` - Library tab changed

```editor:open``` - Editor opened

```editor:save``` - Editor saved

```font:loaded``` - New font loaded

```data:loaded``` - Content loaded from file

```live:slide:change``` - Live slide changed

```extension:loaded``` - New extension loaded

## Extension API Reference
### Adding UI Elements
Menu Items:
```
OpenWorship.Extensions.addExtensionMenuItem('My Feature', function() {
    // Your feature code
});
```
Buttons (Anywhere):
```
// Add button to header
const header = document.querySelector('header .controls');
const btn = document.createElement('button');
btn.textContent = 'My Button';
btn.onclick = myFunction;
header.appendChild(btn);
```
Floating Panels:


```
const panel = document.createElement('div');
panel.id = 'my-panel';
panel.style.cssText = `
    position: absolute;
    top: 100px;
    right: 20px;
    background: #252525;
    border: 1px solid #444;
    padding: 15px;
    z-index: 2000;
`;
document.body.appendChild(panel);
```
### Modifying Rendering
Override Slide Rendering:
```
const originalRender = OpenWorship.Projector.renderSlide;

OpenWorship.Projector.renderSlide = function(ctx, slideObj, footer) {
    // 1. Call original render
    originalRender.call(this, ctx, slideObj, footer);
    
    // 2. Add your overlay
    ctx.fillStyle = 'red';
    ctx.fillRect(50, 50, 100, 100);
};
```
### Working with Data
Save/Load Extension Data:
```
// Save
localStorage.setItem('myext_data', JSON.stringify(myData));

// Load
const data = JSON.parse(localStorage.getItem('myext_data'));
```
Access Global State:
```
// Read
const currentTab = OpenWorship.State.currentTab;
const library = OpenWorship.State.library;

// Modify (carefully!)
OpenWorship.State.library.push(newItem);
OpenWorship.Library.render(); // Refresh display
```
## Examples
### Simple Counter Button
```
/**
 * @extension
 * @id simple_counter
 * @name Simple Counter
 * @version 1.0.0
 * @author Developer
 */

function init(OW) {
    let count = 0;
    
    const btn = document.createElement('button');
    btn.textContent = `Count: ${count}`;
    btn.style.marginLeft = '10px';
    btn.onclick = () => {
        count++;
        btn.textContent = `Count: ${count}`;
        OW.UI.showToast(`Count is now ${count}`);
    };
    
    document.querySelector('header .controls').appendChild(btn);
}
```
### Live Clock Overlay
```
/**
 * @extension
 * @id live_clock
 * @name Live Clock Overlay
 * @version 1.0.0
 * @author Timekeeper
 */

function init(OW) {
    const originalRender = OW.Projector.renderSlide;
    
    OW.Projector.renderSlide = function(ctx, slideObj, footer) {
        originalRender.call(this, ctx, slideObj, footer);
        
        // Draw clock
        ctx.save();
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(new Date().toLocaleTimeString(), 
                     OPENWORSHIP_CONFIG.RESOLUTION.width - 50, 50);
        ctx.restore();
    };
}
```
## Best Practices
1. Namespace Your Elements
Use unique IDs: ```myext-panel```, ```myext-button```

2. Clean Up Event Listeners
Remove listeners when panel hidden:
```
panel.onremove = () => {
    document.removeEventListener('keydown', myKeyHandler);
};
```
3. Test Across Modules
Ensure your extension works with:

Projector window open/closed

Different library tabs

Editor open/closed

Fullscreen mode

4. Handle Errors Gracefully
```
try {
    // Your code
} catch (error) {
    console.error('Extension error:', error);
    OpenWorship.UI.showToast('Extension error - check console');
}
```
5. Use Extension Storage
Save settings per extension:
```
const extId = 'my_extension';
const settings = JSON.parse(localStorage.getItem(`ext_${extId}`)) || {};
settings.lastUsed = new Date().toISOString();
localStorage.setItem(`ext_${extId}`, JSON.stringify(settings));
```
## File Format Requirements
Supported Extensions:

```.js``` - Standard JavaScript

```.owx``` - OpenWorship Extension (same as .js)

Metadata Block (Required):
```
/**
 * @extension
 * @id unique_id_here
 * @name Display Name
 * @version 1.0.0
 * @author Your Name
 */
```
Required Functions:

```init(OpenWorship)``` - Called when extension loads

## Debugging
Console Access:

F12 Developer Tools

All extension logs appear in console

Common Issues:

Missing ```@extension``` metadata

```init``` function not defined

DOM elements not found (wait for ```core:initialized``` hook)

Conflicts with other extensions

## Distribution
Sharing Extensions:

Package your ```.js``` or ```.owx``` file

Include a README with instructions

List required permissions/hooks

Test in latest OpenWorship version

Official Repository:
Submit extensions to OpenWorship GitHub for inclusion in community pack.

## Security Notes
Extensions Can:

Modify DOM and styling

Access localStorage

Hook into rendering

Add UI elements

Extensions Cannot:

Access file system (except through OpenWorship file dialogs)

Make network requests (except through approved APIs)

Access other browser tabs/windows

User Consent:
Extensions load only when explicitly loaded by user through menu.

## Support
Community:

GitHub Issues for bug reports

Discord community for help

Extension examples repository

Version Compatibility:
Extensions targeting v3.0.0+ work with modular architecture.

## Changelog
v3.0.0 - Modular extension system introduced

Hooks API

Folder loading

Isolated execution

Better error handling

# _Happy extending! The OpenWorship Community_
