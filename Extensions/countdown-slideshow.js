/**
 * @extension
 * @id countdown_slideshow_v3
 * @name Countdown Slideshow
 * @version 3.0.0
 * @author OpenWorship Project
 * @description Display beautiful abstract animated countdowns with vector graphics
 */

function init(OW) {
    console.log("Initializing Countdown Slideshow extension v3.0...");
    
    // ==========================================
    // 1. EXTENSION SETUP
    // ==========================================
    
    // Add to Extensions Menu
    const menuName = "Countdown Slideshow";
    OW.Extensions.addExtensionMenuItem(menuName, () => openCountdownPanel());
    
    // Cleanup from auto-loaded extensions list
    setTimeout(() => {
        if (OW.Extensions.loaded) {
            const myIndex = OW.Extensions.loaded.findIndex(e => e.id === "countdown_slideshow_v3");
            if (myIndex !== -1) {
                OW.Extensions.loaded.splice(myIndex, 1);
                if (typeof OW.Extensions.updateExtensionsMenu === 'function') {
                    OW.Extensions.updateExtensionsMenu();
                }
            }
        }
    }, 500);
    
    // ==========================================
    // 2. ENHANCED ANIMATION SYSTEM
    // ==========================================
    
    const animations = {
        // Animation 1: Celestial Vector Network
        celestialNetwork: {
            name: "Celestial Network",
            description: "Geometric star patterns with pulsing connections",
            draw: function(ctx, time, progress, width, height, remainingSeconds) {
                // Deep space gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#0a0e29');
                gradient.addColorStop(0.5, '#161b44');
                gradient.addColorStop(1, '#0a0e29');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Create celestial nodes
                const nodeCount = 24;
                const nodes = [];
                const radius = Math.min(width, height) * 0.35;
                
                for (let i = 0; i < nodeCount; i++) {
                    const angle = (i / nodeCount) * Math.PI * 2 + time / 5000;
                    const distance = radius + Math.sin(time / 2000 + i * 0.5) * 20;
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    const size = 8 + Math.sin(time / 1000 + i) * 4;
                    const pulse = 0.6 + Math.sin(time / 800 + i) * 0.4;
                    
                    nodes.push({ x, y, size, pulse, angle });
                    
                    // Draw glowing node
                    const nodeGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                    nodeGradient.addColorStop(0, `rgba(100, 200, 255, ${pulse})`);
                    nodeGradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = nodeGradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw node core
                    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw connecting lines (vector network)
                ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
                ctx.lineWidth = 1;
                ctx.lineCap = 'round';
                
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dist = Math.sqrt(
                            Math.pow(nodes[i].x - nodes[j].x, 2) + 
                            Math.pow(nodes[i].y - nodes[j].y, 2)
                        );
                        
                        if (dist < 200) {
                            const opacity = 0.15 * (1 - dist / 200);
                            ctx.strokeStyle = `rgba(100, 200, 255, ${opacity})`;
                            ctx.beginPath();
                            ctx.moveTo(nodes[i].x, nodes[i].y);
                            ctx.lineTo(nodes[j].x, nodes[j].y);
                            ctx.stroke();
                        }
                    }
                }
                
                // Draw central geometric pattern
                const sides = 6;
                const patternRadius = 120;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                for (let i = 0; i <= sides; i++) {
                    const angle = (i / sides) * Math.PI * 2 + time / 3000;
                    const x = centerX + Math.cos(angle) * patternRadius;
                    const y = centerY + Math.sin(angle) * patternRadius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                
                // Draw time in center
                drawCenteredTime(ctx, centerX, centerY, remainingSeconds, '#ffffff', '#00C4FF');
                
                // Subtle particles
                for (let i = 0; i < 40; i++) {
                    const angle = (time / 2000 + i * 0.1) % (Math.PI * 2);
                    const distance = patternRadius + 80 + Math.sin(time / 1000 + i) * 40;
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    const size = 1 + Math.sin(time / 500 + i) * 1;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.sin(time / 300 + i) * 0.2})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        },
        
        // Animation 2: Fluid Waves & Particles
        fluidWaves: {
            name: "Fluid Waves",
            description: "Dynamic fluid simulation with floating particles",
            draw: function(ctx, time, progress, width, height, remainingSeconds) {
                // Ocean deep gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#001220');
                gradient.addColorStop(0.5, '#003366');
                gradient.addColorStop(1, '#001220');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Draw multiple wave layers
                const waveCount = 4;
                for (let w = 0; w < waveCount; w++) {
                    const waveHeight = 40 + w * 20;
                    const waveSpeed = 0.002 + w * 0.001;
                    const waveAmplitude = 30 + w * 10;
                    const waveColor = `rgba(0, ${150 + w * 25}, ${200 + w * 15}, ${0.1 + w * 0.05})`;
                    
                    ctx.strokeStyle = waveColor;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    
                    for (let x = 0; x <= width; x += 2) {
                        const waveOffset = Math.sin(x * 0.01 + time * waveSpeed + w) * waveAmplitude;
                        const y = centerY + waveHeight + waveOffset;
                        
                        if (x === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.stroke();
                }
                
                // Draw floating particles
                for (let i = 0; i < 60; i++) {
                    const particleX = (i * 37) % width;
                    const particleY = (centerY + 50) + Math.sin(time / 1000 + i) * 100;
                    const size = 2 + Math.sin(time / 500 + i) * 2;
                    const opacity = 0.3 + Math.sin(time / 400 + i) * 0.3;
                    const hue = 180 + Math.sin(time / 1000 + i) * 30;
                    
                    ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${opacity})`;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw subtle glow
                    const glow = ctx.createRadialGradient(
                        particleX, particleY, 0,
                        particleX, particleY, size * 3
                    );
                    glow.addColorStop(0, `hsla(${hue}, 80%, 70%, ${opacity * 0.3})`);
                    glow.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = glow;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, size * 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw central fluid orb
                const orbRadius = 140;
                const orbPulse = 0.8 + Math.sin(time / 800) * 0.2;
                
                // Orb gradient
                const orbGradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, orbRadius
                );
                orbGradient.addColorStop(0, 'rgba(0, 200, 255, 0.8)');
                orbGradient.addColorStop(0.5, 'rgba(0, 150, 200, 0.4)');
                orbGradient.addColorStop(1, 'rgba(0, 100, 150, 0.1)');
                
                ctx.fillStyle = orbGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, orbRadius * orbPulse, 0, Math.PI * 2);
                ctx.fill();
                
                // Orb surface details
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + time / 2000;
                    const startX = centerX + Math.cos(angle) * (orbRadius * 0.7);
                    const startY = centerY + Math.sin(angle) * (orbRadius * 0.7);
                    const endX = centerX + Math.cos(angle) * (orbRadius * orbPulse);
                    const endY = centerY + Math.sin(angle) * (orbRadius * orbPulse);
                    
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
                
                // Draw time with fluid effect
                drawCenteredTime(ctx, centerX, centerY, remainingSeconds, '#ffffff', '#00ffff');
                
                // Ripple effect
                const rippleCount = 3;
                for (let r = 0; r < rippleCount; r++) {
                    const rippleTime = (time + r * 500) % 2000;
                    const rippleProgress = rippleTime / 2000;
                    const rippleRadius = orbRadius + rippleProgress * 100;
                    const rippleOpacity = 0.3 * (1 - rippleProgress);
                    
                    ctx.strokeStyle = `rgba(0, 200, 255, ${rippleOpacity})`;
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        },
        
        // Animation 3: Geometric Prism
        geometricPrism: {
            name: "Geometric Prism",
            description: "Rotating 3D-like geometric shapes with light refraction",
            draw: function(ctx, time, progress, width, height, remainingSeconds) {
                // Gradient background
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                gradient.addColorStop(0, '#1a1a2e');
                gradient.addColorStop(0.5, '#16213e');
                gradient.addColorStop(1, '#0f3460');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Draw rotating cube (isometric projection)
                const cubeSize = 120;
                const rotation = time / 2000;
                
                // Cube vertices
                const vertices = [
                    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
                    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
                ];
                
                // Project 3D to 2D
                const projected = vertices.map(v => {
                    const [x, y, z] = v;
                    
                    // Rotation matrices
                    const cosA = Math.cos(rotation);
                    const sinA = Math.sin(rotation);
                    const cosB = Math.cos(rotation * 0.7);
                    const sinB = Math.sin(rotation * 0.7);
                    
                    // Rotate around Y and X axes
                    const x1 = x * cosA - z * sinA;
                    const z1 = x * sinA + z * cosA;
                    const y1 = y * cosB - z1 * sinB;
                    const z2 = y * sinB + z1 * cosB;
                    
                    // Isometric projection
                    const scale = cubeSize;
                    const isoX = (x1 - y1) * Math.cos(Math.PI / 6) * scale;
                    const isoY = (x1 + y1) * Math.sin(Math.PI / 6) * scale - z2 * scale * 0.7;
                    
                    return {
                        x: centerX + isoX,
                        y: centerY + isoY,
                        z: z2
                    };
                });
                
                // Cube faces
                const faces = [
                    [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
                    [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
                ];
                
                const faceColors = [
                    'rgba(255, 100, 100, 0.6)', 'rgba(100, 255, 100, 0.6)',
                    'rgba(100, 100, 255, 0.6)', 'rgba(255, 255, 100, 0.6)',
                    'rgba(255, 100, 255, 0.6)', 'rgba(100, 255, 255, 0.6)'
                ];
                
                // Draw faces
                faces.forEach((face, index) => {
                    ctx.fillStyle = faceColors[index];
                    ctx.beginPath();
                    
                    face.forEach((vertexIdx, i) => {
                        const vertex = projected[vertexIdx];
                        if (i === 0) {
                            ctx.moveTo(vertex.x, vertex.y);
                        } else {
                            ctx.lineTo(vertex.x, vertex.y);
                        }
                    });
                    
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add face outline
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                });
                
                // Draw connecting beams from cube to perimeter
                const beamCount = 12;
                for (let i = 0; i < beamCount; i++) {
                    const angle = (i / beamCount) * Math.PI * 2 + rotation;
                    const endX = centerX + Math.cos(angle) * 250;
                    const endY = centerY + Math.sin(angle) * 250;
                    
                    const beamGradient = ctx.createLinearGradient(centerX, centerY, endX, endY);
                    beamGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                    beamGradient.addColorStop(1, 'transparent');
                    
                    ctx.strokeStyle = beamGradient;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(centerX, centerY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                    
                    // Draw endpoint
                    const pulse = 0.5 + Math.sin(time / 500 + i) * 0.5;
                    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
                    ctx.beginPath();
                    ctx.arc(endX, endY, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw time inside cube
                drawCenteredTime(ctx, centerX, centerY, remainingSeconds, '#ffffff', '#ffffff');
                
                // Add floating triangles
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2 + rotation * 1.5;
                    const distance = 300 + Math.sin(time / 800 + i) * 50;
                    const triX = centerX + Math.cos(angle) * distance;
                    const triY = centerY + Math.sin(angle) * distance;
                    const triSize = 15 + Math.sin(time / 600 + i) * 5;
                    
                    drawRotatingTriangle(ctx, triX, triY, triSize, time / 1000 + i, 
                                        `rgba(255, 255, 255, ${0.3 + Math.sin(time / 400 + i) * 0.2})`);
                }
            }
        },
        
        // Animation 4: Aurora Borealis
        auroraBorealis: {
            name: "Aurora Borealis",
            description: "Northern lights simulation with flowing color bands",
            draw: function(ctx, time, progress, width, height, remainingSeconds) {
                // Deep night sky
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, '#03071e');
                gradient.addColorStop(0.3, '#1a1a2e');
                gradient.addColorStop(1, '#16213e');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // Draw stars
                for (let i = 0; i < 80; i++) {
                    const x = (i * 53) % width;
                    const y = (i * 37) % height;
                    const size = 1 + Math.sin(time / 1000 + i) * 1;
                    const opacity = 0.5 + Math.sin(time / 800 + i) * 0.5;
                    const twinkle = Math.sin(time / 300 + i) * 0.5 + 0.5;
                    
                    ctx.fillStyle = `rgba(255, 255, 255, ${opacity * twinkle})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Create flowing aurora layers
                const auroraLayers = [
                    { height: 0.3, speed: 0.0003, amplitude: 80, color: 'rgba(0, 255, 200, 0.4)' },
                    { height: 0.4, speed: 0.0004, amplitude: 60, color: 'rgba(100, 200, 255, 0.3)' },
                    { height: 0.5, speed: 0.0005, amplitude: 40, color: 'rgba(200, 100, 255, 0.2)' }
                ];
                
                auroraLayers.forEach(layer => {
                    const yPos = height * layer.height;
                    
                    ctx.strokeStyle = layer.color;
                    ctx.lineWidth = 30;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    
                    for (let x = 0; x <= width; x += 5) {
                        const wave = Math.sin(x * 0.01 + time * layer.speed) * layer.amplitude +
                                   Math.sin(x * 0.005 + time * layer.speed * 1.3) * layer.amplitude * 0.5;
                        const y = yPos + wave;
                        
                        if (x === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.stroke();
                    
                    // Add glow effect
                    ctx.shadowColor = layer.color;
                    ctx.shadowBlur = 20;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                });
                
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Draw celestial body (moon)
                const moonRadius = 80;
                const moonX = centerX - 200;
                const moonY = centerY - 100;
                
                // Moon gradient
                const moonGradient = ctx.createRadialGradient(
                    moonX, moonY, 0,
                    moonX, moonY, moonRadius
                );
                moonGradient.addColorStop(0, 'rgba(255, 255, 220, 0.9)');
                moonGradient.addColorStop(0.7, 'rgba(200, 200, 180, 0.4)');
                moonGradient.addColorStop(1, 'rgba(150, 150, 130, 0.1)');
                
                ctx.fillStyle = moonGradient;
                ctx.beginPath();
                ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // Moon craters
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const distance = moonRadius * 0.6;
                    const craterX = moonX + Math.cos(angle) * distance;
                    const craterY = moonY + Math.sin(angle) * distance;
                    const craterSize = 8 + Math.sin(time / 1000 + i) * 4;
                    
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                    ctx.beginPath();
                    ctx.arc(craterX, craterY, craterSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Draw time with aurora glow
                const timeColor = '#e0f7fa';
                const glowColor = '#00bcd4';
                drawCenteredTime(ctx, centerX + 100, centerY, remainingSeconds, timeColor, glowColor);
                
                // Add floating light particles
                for (let i = 0; i < 30; i++) {
                    const angle = (time / 3000 + i * 0.2) % (Math.PI * 2);
                    const distance = 150 + Math.sin(time / 1000 + i) * 50;
                    const x = centerX + 100 + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    const size = 2 + Math.sin(time / 400 + i) * 1;
                    
                    // Color based on position
                    const hue = 180 + Math.sin(time / 1000 + i) * 60;
                    const saturation = 80 + Math.sin(time / 800 + i) * 20;
                    const lightness = 70 + Math.sin(time / 600 + i) * 20;
                    
                    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Particle trail
                    const trailLength = 5;
                    for (let t = 1; t <= trailLength; t++) {
                        const trailX = x - Math.cos(angle) * t * 2;
                        const trailY = y - Math.sin(angle) * t * 2;
                        const trailOpacity = 0.6 * (1 - t / trailLength);
                        
                        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${trailOpacity})`;
                        ctx.beginPath();
                        ctx.arc(trailX, trailY, size * 0.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        },
        
        // Animation 5: Classic Church (Kept from before - refined)
        classicChurch: {
            name: "Classic Church",
            description: "Traditional church style with stained glass effect",
            draw: function(ctx, time, progress, width, height, remainingSeconds) {
                // Stained glass background with subtle animation
                const gradient = ctx.createLinearGradient(0, 0, width, height);
                const hueShift = Math.sin(time / 10000) * 10;
                gradient.addColorStop(0, `hsl(${220 + hueShift}, 60%, 15%)`);
                gradient.addColorStop(0.5, `hsl(${240 + hueShift}, 60%, 20%)`);
                gradient.addColorStop(1, `hsl(${260 + hueShift}, 60%, 15%)`);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                
                // Animated stained glass "panes"
                const paneSize = 120;
                for (let y = 0; y < height; y += paneSize) {
                    for (let x = 0; x < width; x += paneSize) {
                        const hue = ((x + y + time / 50) % 360);
                        const saturation = 60 + Math.sin(time / 2000 + x + y) * 20;
                        const lightness = 25 + Math.sin(time / 3000 + x + y) * 10;
                        const color = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.25)`;
                        
                        ctx.fillStyle = color;
                        ctx.fillRect(x, y, paneSize, paneSize);
                        
                        // Animated pane borders
                        const borderOpacity = 0.2 + Math.sin(time / 1000 + x + y) * 0.1;
                        ctx.strokeStyle = `rgba(0, 0, 0, ${borderOpacity})`;
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, paneSize, paneSize);
                        
                        // Add leading lines
                        ctx.strokeStyle = `rgba(139, 69, 19, ${0.3 + Math.sin(time / 1500 + x + y) * 0.1})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(x + paneSize / 2, y);
                        ctx.lineTo(x + paneSize / 2, y + paneSize);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(x, y + paneSize / 2);
                        ctx.lineTo(x + paneSize, y + paneSize / 2);
                        ctx.stroke();
                    }
                }
                
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Draw ornate church window frame with subtle animation
                const framePulse = 0.95 + Math.sin(time / 800) * 0.05;
                
                // Outer frame
                ctx.fillStyle = 'rgba(101, 67, 33, 0.9)';
                roundRect(ctx, centerX - 300 * framePulse, centerY - 200 * framePulse, 
                         600 * framePulse, 400 * framePulse, 15, true, false);
                
                // Inner frame with wood grain effect
                ctx.fillStyle = 'rgba(139, 69, 19, 0.8)';
                roundRect(ctx, centerX - 280 * framePulse, centerY - 180 * framePulse, 
                         560 * framePulse, 360 * framePulse, 10, true, false);
                
                // Wood grain details
                ctx.strokeStyle = 'rgba(101, 67, 33, 0.6)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const yPos = centerY - 180 * framePulse + (i * 45);
                    ctx.beginPath();
                    ctx.moveTo(centerX - 280 * framePulse + 20, yPos);
                    ctx.lineTo(centerX + 280 * framePulse - 20, yPos);
                    ctx.stroke();
                }
                
                // Time display with elegant typography
                const hours = Math.floor(remainingSeconds / 3600);
                const minutes = Math.floor((remainingSeconds % 3600) / 60);
                const seconds = Math.floor(remainingSeconds % 60);
                
                let timeString = '';
                if (hours > 0) {
                    timeString = `${hours}h ${minutes}m ${seconds}s`;
                } else if (minutes > 0) {
                    timeString = `${minutes}m ${seconds}s`;
                } else {
                    timeString = `${seconds} seconds`;
                }
                
                // Large time display with gold leaf effect
                const textPulse = 1 + Math.sin(time / 600) * 0.03;
                ctx.font = `bold ${90 * textPulse}px "Times New Roman", serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Gold gradient text
                const textGradient = ctx.createLinearGradient(
                    centerX - 250, centerY,
                    centerX + 250, centerY
                );
                textGradient.addColorStop(0, '#f1c40f');
                textGradient.addColorStop(0.5, '#ffd700');
                textGradient.addColorStop(1, '#f1c40f');
                
                ctx.fillStyle = textGradient;
                ctx.fillText(timeString, centerX, centerY);
                
                // Text shadow for depth
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.strokeStyle = 'rgba(101, 67, 33, 0.8)';
                ctx.lineWidth = 3;
                ctx.strokeText(timeString, centerX, centerY);
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                
                // Ornate border around time with pulsing glow
                const borderGlow = 0.3 + Math.sin(time / 400) * 0.1;
                ctx.strokeStyle = `rgba(241, 196, 15, ${borderGlow})`;
                ctx.lineWidth = 4;
                roundRect(ctx, centerX - 250, centerY - 80, 500, 160, 10, false, true);
                
                // Church symbols with subtle animation
                const symbols = [
                    { symbol: '✝', x: centerX - 200, y: centerY - 150, size: 50 },
                    { symbol: '🕊', x: centerX + 200, y: centerY - 150, size: 45 },
                    { symbol: '🕯', x: centerX - 200, y: centerY + 150, size: 40 },
                    { symbol: '📖', x: centerX + 200, y: centerY + 150, size: 40 }
                ];
                
                symbols.forEach((sym, i) => {
                    const symbolPulse = 1 + Math.sin(time / 700 + i) * 0.1;
                    ctx.font = `bold ${sym.size * symbolPulse}px Arial`;
                    ctx.fillStyle = `rgba(241, 196, 15, ${0.8 + Math.sin(time / 500 + i) * 0.2})`;
                    ctx.fillText(sym.symbol, sym.x, sym.y);
                    
                    // Symbol glow
                    ctx.shadowColor = '#f1c40f';
                    ctx.shadowBlur = 15 * symbolPulse;
                    ctx.fillText(sym.symbol, sym.x, sym.y);
                    ctx.shadowBlur = 0;
                });
                
                // Title with stained glass effect and animation
                const titlePulse = 1 + Math.sin(time / 1000) * 0.05;
                ctx.font = `bold ${50 * titlePulse}px "Times New Roman", serif`;
                const titleGradient = ctx.createLinearGradient(
                    centerX - 150, centerY - 250,
                    centerX + 150, centerY - 250
                );
                titleGradient.addColorStop(0, '#e74c3c');
                titleGradient.addColorStop(0.3, '#f1c40f');
                titleGradient.addColorStop(0.7, '#2ecc71');
                titleGradient.addColorStop(1, '#3498db');
                
                ctx.fillStyle = titleGradient;
                ctx.fillText('Church Countdown', centerX, centerY - 250);
                
                // Falling light rays effect
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    const rayAngle = (time / 2000 + i * 0.5) % (Math.PI * 2);
                    const rayLength = 400;
                    const startX = centerX + Math.cos(rayAngle) * 100;
                    const startY = centerY - 250;
                    const endX = startX + Math.cos(rayAngle - 0.2) * rayLength;
                    const endY = startY + Math.sin(rayAngle - 0.2) * rayLength;
                    
                    const rayGradient = ctx.createLinearGradient(startX, startY, endX, endY);
                    rayGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
                    rayGradient.addColorStop(1, 'transparent');
                    
                    ctx.strokeStyle = rayGradient;
                    ctx.beginPath();
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();
                }
                
                // Subtle floating dust particles
                for (let i = 0; i < 20; i++) {
                    const dustX = centerX - 280 + (i * 37) % 560;
                    const dustY = centerY - 180 + Math.sin(time / 1000 + i) * 50;
                    const dustSize = 1 + Math.sin(time / 500 + i) * 0.5;
                    const dustOpacity = 0.3 + Math.sin(time / 700 + i) * 0.2;
                    
                    ctx.fillStyle = `rgba(255, 255, 220, ${dustOpacity})`;
                    ctx.beginPath();
                    ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    };
    
    // ==========================================
    // 3. HELPER DRAWING FUNCTIONS
    // ==========================================
    
    function drawCenteredTime(ctx, x, y, remainingSeconds, textColor, glowColor) {
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        
        let timeString = '';
        if (hours > 0) {
            timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Digital time display
        ctx.font = `bold 100px 'Courier New', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = textColor;
        ctx.fillText(timeString, x, y);
        ctx.shadowBlur = 0;
        
        // Optional: Add smaller label
        if (remainingSeconds > 60) {
            ctx.font = 'bold 24px "Segoe UI", sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillText('Time Remaining', x, y + 80);
        }
    }
    
    function drawRotatingTriangle(ctx, x, y, size, rotation, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof radius === 'undefined') radius = 5;
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            const defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (let side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
    
    // ==========================================
    // 4. STATE MANAGEMENT (Same as before)
    // ==========================================
    
    let countdownState = {
        isRunning: false,
        startTime: 0,
        duration: 300,
        selectedAnimation: 'celestialNetwork',
        targetScheduleIndex: 0,
        originalLiveState: null,
        animationFrame: null,
        panel: null
    };
    
    // ==========================================
    // 5. UI: CONTROL PANEL (Same beautiful UI as before)
    // ==========================================
    
    function openCountdownPanel() {
        if (countdownState.panel) {
            countdownState.panel.style.display = 'flex';
            return;
        }
        
        createCountdownPanel();
    }
    
    function createCountdownPanel() {
        const panel = document.createElement('div');
        panel.id = 'countdown-panel';
        panel.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
            font-family: 'Segoe UI', sans-serif;
        `;
        
        panel.innerHTML = `
            <div class="countdown-modal" style="
                background: #222;
                border: 1px solid #444;
                border-radius: 8px;
                width: 500px;
                max-width: 90vw;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 0 30px rgba(0,0,0,0.5);
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div style="
                    padding: 15px 20px;
                    background: linear-gradient(to right, #252525, #2d2d2d);
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 8px 8px 0 0;
                ">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="font-size: 24px; color: #00C4FF;">⏳</div>
                        <h3 style="margin: 0; color: #fff; font-weight: 600; font-size: 1.2rem;">Countdown Slideshow</h3>
                    </div>
                    <button id="countdown-close-btn" style="
                        background: #333;
                        border: 1px solid #555;
                        color: #aaa;
                        font-size: 1.2rem;
                        cursor: pointer;
                        width: 32px;
                        height: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 4px;
                        transition: all 0.2s;
                        padding: 0;
                    ">&times;</button>
                </div>
                
                <!-- Content -->
                <div style="padding: 20px; flex: 1; overflow-y: auto;">
                    <!-- Time Settings -->
                    <div class="control-section" style="margin-bottom: 25px;">
                        <div class="section-title" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 15px;
                            color: #ddd;
                            font-weight: 500;
                            font-size: 1rem;
                        ">
                            <span style="color: #00C4FF; font-size: 1.2rem;">⏰</span>
                            <span>Duration</span>
                        </div>
                        
                        <div class="time-inputs" style="
                            display: grid;
                            grid-template-columns: repeat(3, 1fr);
                            gap: 10px;
                            margin-bottom: 15px;
                        ">
                            <div class="time-input-group">
                                <label style="
                                    display: block;
                                    color: #aaa;
                                    margin-bottom: 5px;
                                    font-size: 0.85rem;
                                    text-align: center;
                                ">Hours</label>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <button class="time-btn minus" data-field="hours" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">-</button>
                                    <input type="number" id="countdown-hours" value="0" min="0" max="23" style="
                                        width: 100%;
                                        padding: 8px;
                                        background: #111;
                                        border: 1px solid #444;
                                        color: white;
                                        border-radius: 4px;
                                        font-size: 1.1rem;
                                        text-align: center;
                                        box-sizing: border-box;
                                    ">
                                    <button class="time-btn plus" data-field="hours" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">+</button>
                                </div>
                            </div>
                            
                            <div class="time-input-group">
                                <label style="
                                    display: block;
                                    color: #aaa;
                                    margin-bottom: 5px;
                                    font-size: 0.85rem;
                                    text-align: center;
                                ">Minutes</label>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <button class="time-btn minus" data-field="minutes" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">-</button>
                                    <input type="number" id="countdown-minutes" value="5" min="0" max="59" style="
                                        width: 100%;
                                        padding: 8px;
                                        background: #111;
                                        border: 1px solid #444;
                                        color: white;
                                        border-radius: 4px;
                                        font-size: 1.1rem;
                                        text-align: center;
                                        box-sizing: border-box;
                                    ">
                                    <button class="time-btn plus" data-field="minutes" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">+</button>
                                </div>
                            </div>
                            
                            <div class="time-input-group">
                                <label style="
                                    display: block;
                                    color: #aaa;
                                    margin-bottom: 5px;
                                    font-size: 0.85rem;
                                    text-align: center;
                                ">Seconds</label>
                                <div style="display: flex; align-items: center; gap: 5px;">
                                    <button class="time-btn minus" data-field="seconds" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">-</button>
                                    <input type="number" id="countdown-seconds" value="0" min="0" max="59" style="
                                        width: 100%;
                                        padding: 8px;
                                        background: #111;
                                        border: 1px solid #444;
                                        color: white;
                                        border-radius: 4px;
                                        font-size: 1.1rem;
                                        text-align: center;
                                        box-sizing: border-box;
                                    ">
                                    <button class="time-btn plus" data-field="seconds" style="
                                        background: #333;
                                        border: 1px solid #555;
                                        color: #ddd;
                                        width: 36px;
                                        height: 36px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-size: 1.2rem;
                                        flex-shrink: 0;
                                    ">+</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="duration-display" style="
                            background: #1a1a1a;
                            padding: 12px;
                            border-radius: 6px;
                            border-left: 3px solid #00C4FF;
                            font-size: 0.9rem;
                            color: #bbb;
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
                                <span style="color: #00C4FF;">✨</span>
                                <span>Total: <span id="total-seconds-display" style="color: #fff; font-weight: bold;">300</span> seconds</span>
                            </div>
                            <div>Set hours, minutes, and seconds for precise countdown timing</div>
                        </div>
                    </div>
                    
                    <!-- Animation Selection -->
                    <div class="control-section" style="margin-bottom: 25px;">
                        <div class="section-title" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 15px;
                            color: #ddd;
                            font-weight: 500;
                            font-size: 1rem;
                        ">
                            <span style="color: #00C4FF; font-size: 1.2rem;">🎨</span>
                            <span>Animation Style</span>
                        </div>
                        
                        <select id="countdown-animation" style="
                            width: 100%;
                            padding: 10px;
                            background: #111;
                            border: 1px solid #444;
                            color: white;
                            border-radius: 6px;
                            font-size: 0.95rem;
                            margin-bottom: 15px;
                            box-sizing: border-box;
                            cursor: pointer;
                        ">
                            ${Object.entries(animations).map(([key, anim]) => 
                                `<option value="${key}">${anim.name}</option>`
                            ).join('')}
                        </select>
                        
                        <div id="animation-description" style="
                            color: #bbb;
                            font-size: 0.9rem;
                            padding: 10px;
                            background: #1a1a1a;
                            border-radius: 6px;
                            border-left: 3px solid #007acc;
                            line-height: 1.4;
                        ">
                            Select an animation style for the countdown display
                        </div>
                    </div>
                    
                    <!-- Schedule Target -->
                    <div class="control-section" style="margin-bottom: 25px;">
                        <div class="section-title" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 15px;
                            color: #ddd;
                            font-weight: 500;
                            font-size: 1rem;
                        ">
                            <span style="color: #00C4FF; font-size: 1.2rem;">🎯</span>
                            <span>Transition Target</span>
                        </div>
                        
                        <div style="margin-bottom: 10px; color: #aaa; font-size: 0.9rem;">
                            After countdown ends, transition to:
                        </div>
                        
                        <select id="countdown-target" style="
                            width: 100%;
                            padding: 10px;
                            background: #111;
                            border: 1px solid #444;
                            color: white;
                            border-radius: 6px;
                            font-size: 0.95rem;
                            box-sizing: border-box;
                            cursor: pointer;
                        ">
                            <option value="-1">First Item in Schedule</option>
                        </select>
                    </div>
                    
                    <!-- Status Display -->
                    <div id="countdown-status" style="
                        background: linear-gradient(135deg, #151515, #1a1a1a);
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 25px;
                        text-align: center;
                        display: none;
                        border: 1px solid #333;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 15px;
                            margin-bottom: 10px;
                        ">
                            <div style="font-size: 28px; color: #00C4FF;">🔥</div>
                            <div id="countdown-timer" style="
                                font-size: 2.2rem;
                                font-weight: bold;
                                color: #00C4FF;
                                font-family: 'Courier New', monospace;
                                letter-spacing: 2px;
                            ">05:00</div>
                            <div style="font-size: 28px; color: #00C4FF;">🔥</div>
                        </div>
                        <div id="countdown-message" style="
                            color: #aaa;
                            font-size: 0.95rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                        ">
                            <span>▶️</span>
                            <span>Countdown in progress...</span>
                        </div>
                    </div>
                    
                    <!-- Control Buttons -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 12px;
                        margin-top: 10px;
                    ">
                        <button id="countdown-cancel-btn" class="action-btn stop-btn" style="
                            background: linear-gradient(135deg, #d32f2f, #b71c1c);
                            border: 1px solid #b71c1c;
                            color: white;
                            padding: 12px;
                            border-radius: 6px;
                            cursor: pointer;
                            display: none;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            font-weight: 600;
                            font-size: 0.95rem;
                            transition: all 0.2s;
                        ">
                            <span style="font-size: 1.1rem;">⏹</span>
                            <span>Stop</span>
                        </button>
                        <button id="countdown-start-btn" class="action-btn start-btn" style="
                            background: linear-gradient(135deg, #007acc, #005f9e);
                            border: 1px solid #005f9e;
                            color: white;
                            padding: 12px;
                            border-radius: 6px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            font-weight: 600;
                            font-size: 0.95rem;
                            transition: all 0.2s;
                        ">
                            <span style="font-size: 1.1rem;">▶</span>
                            <span>Start Countdown</span>
                        </button>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="
                    padding: 12px 20px;
                    background: #151515;
                    border-top: 1px solid #333;
                    color: #666;
                    font-size: 0.8rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-radius: 0 0 8px 8px;
                ">
                    <span>OpenWorship Countdown v3.0</span>
                    <div style="display: flex; gap: 8px; color: #888;">
                        <span>✨</span>
                        <span>⚡</span>
                        <span>🌟</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        countdownState.panel = panel;
        
        // Setup event listeners
        setupPanelEvents();
        populateScheduleItems();
        updateAnimationDescription();
        updateTotalSecondsDisplay();
        
        // Add hover effects
        addHoverEffects();
        
        // Show panel
        panel.style.display = 'flex';
    }
    
    function addHoverEffects() {
        const panel = countdownState.panel;
        if (!panel) return;
        
        // Add hover effects to all buttons
        const buttons = panel.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                if (!this.classList.contains('time-btn')) {
                    this.style.transform = 'translateY(-1px)';
                    this.style.boxShadow = '0 3px 8px rgba(0, 0, 0, 0.3)';
                }
                this.style.filter = 'brightness(1.2)';
            });
            
            btn.addEventListener('mouseleave', function() {
                if (!this.classList.contains('time-btn')) {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                }
                this.style.filter = 'brightness(1)';
            });
        });
        
        // Special hover for time buttons
        const timeButtons = panel.querySelectorAll('.time-btn');
        timeButtons.forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.background = '#444';
                this.style.borderColor = '#666';
            });
            btn.addEventListener('mouseleave', function() {
                this.style.background = '#333';
                this.style.borderColor = '#555';
            });
        });
        
        // Special hover for close button
        const closeBtn = panel.querySelector('#countdown-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('mouseenter', function() {
                this.style.background = '#444';
                this.style.color = '#fff';
                this.style.borderColor = '#666';
            });
            closeBtn.addEventListener('mouseleave', function() {
                this.style.background = '#333';
                this.style.color = '#aaa';
                this.style.borderColor = '#555';
            });
        }
        
        // Add focus effects to inputs
        const inputs = panel.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                this.style.borderColor = '#007acc';
                this.style.boxShadow = '0 0 0 2px rgba(0, 122, 204, 0.2)';
            });
            input.addEventListener('blur', function() {
                this.style.borderColor = '#444';
                this.style.boxShadow = 'none';
            });
        });
    }
    
    function setupPanelEvents() {
        const panel = countdownState.panel;
        
        // Close button
        panel.querySelector('#countdown-close-btn').onclick = () => {
            panel.style.display = 'none';
        };
        
        // Animation selection
        panel.querySelector('#countdown-animation').onchange = updateAnimationDescription;
        
        // Time inputs - update total seconds
        panel.querySelector('#countdown-hours').oninput = updateTotalSecondsDisplay;
        panel.querySelector('#countdown-minutes').oninput = updateTotalSecondsDisplay;
        panel.querySelector('#countdown-seconds').oninput = updateTotalSecondsDisplay;
        
        // Time adjustment buttons
        panel.querySelectorAll('.time-btn').forEach(btn => {
            btn.onclick = function() {
                const field = this.getAttribute('data-field');
                const isPlus = this.classList.contains('plus');
                const input = panel.querySelector(`#countdown-${field}`);
                let value = parseInt(input.value) || 0;
                
                if (isPlus) {
                    value++;
                } else {
                    value--;
                }
                
                // Apply limits
                const max = field === 'hours' ? 23 : 59;
                const min = 0;
                value = Math.max(min, Math.min(max, value));
                
                input.value = value;
                updateTotalSecondsDisplay();
                
                // Trigger input event for validation
                input.dispatchEvent(new Event('input'));
            };
        });
        
        // Start button
        panel.querySelector('#countdown-start-btn').onclick = startCountdown;
        
        // Cancel button
        panel.querySelector('#countdown-cancel-btn').onclick = stopCountdown;
        
        // Click outside to close (like other OpenWorship modals)
        panel.addEventListener('click', (e) => {
            if (e.target === panel) {
                panel.style.display = 'none';
            }
        });
    }
    
    function updateAnimationDescription() {
        const panel = countdownState.panel;
        if (!panel) return;
        
        const select = panel.querySelector('#countdown-animation');
        const animation = animations[select.value];
        const desc = panel.querySelector('#animation-description');
        
        if (animation && desc) {
            desc.textContent = animation.description;
        }
    }
    
    function updateTotalSecondsDisplay() {
        const panel = countdownState.panel;
        if (!panel) return;
        
        const hours = parseInt(panel.querySelector('#countdown-hours').value) || 0;
        const minutes = parseInt(panel.querySelector('#countdown-minutes').value) || 0;
        const seconds = parseInt(panel.querySelector('#countdown-seconds').value) || 0;
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        
        const display = panel.querySelector('#total-seconds-display');
        if (display) {
            display.textContent = totalSeconds;
            
            // Color code based on duration
            if (totalSeconds < 10) {
                display.style.color = '#ff4444'; // Red for very short
            } else if (totalSeconds < 60) {
                display.style.color = '#ffaa00'; // Orange for short
            } else {
                display.style.color = '#00C4FF'; // Blue for normal/long
            }
        }
        
        // Update timer display preview
        updateTimerDisplay(totalSeconds);
    }
    
    function updateTimerDisplay(totalSeconds) {
        const panel = countdownState.panel;
        if (!panel) return;
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        const timer = panel.querySelector('#countdown-timer');
        if (timer) {
            if (hours > 0) {
                timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }
    }
    
    function populateScheduleItems() {
        const panel = countdownState.panel;
        if (!panel) return;
        
        const select = panel.querySelector('#countdown-target');
        select.innerHTML = '<option value="-1">First Item in Schedule</option>';
        
        if (OW.State && OW.State.schedule && OW.State.schedule.length > 0) {
            OW.State.schedule.forEach((item, index) => {
                const option = document.createElement('option');
                option.value = index;
                
                // Add icon based on type
                let icon = '📄';
                if (item.type === 'Song') icon = '🎵';
                else if (item.type === 'Scripture') icon = '📖';
                else if (item.type === 'Presentation') icon = '📊';
                
                option.textContent = `${icon} ${item.title} (${item.type})`;
                select.appendChild(option);
            });
        }
    }
    
    // ==========================================
    // 6. COUNTDOWN LOGIC (Same as before)
    // ==========================================
    
    function startCountdown() {
        if (countdownState.isRunning) return;
        
        const panel = countdownState.panel;
        const hours = parseInt(panel.querySelector('#countdown-hours').value) || 0;
        const minutes = parseInt(panel.querySelector('#countdown-minutes').value) || 0;
        const seconds = parseInt(panel.querySelector('#countdown-seconds').value) || 0;
        const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        const animationKey = panel.querySelector('#countdown-animation').value;
        const targetIndex = parseInt(panel.querySelector('#countdown-target').value) || -1;
        
        // Validate duration
        if (totalSeconds < 1) {
            OW.UI.showToast("Countdown must be at least 1 second");
            return;
        }
        
        if (hours > 23) {
            OW.UI.showToast("Maximum 23 hours");
            return;
        }
        
        if (minutes > 59) {
            OW.UI.showToast("Maximum 59 minutes");
            return;
        }
        
        if (seconds > 59) {
            OW.UI.showToast("Maximum 59 seconds");
            return;
        }
        
        // Save original live state
        countdownState.originalLiveState = {
            slide: OW.State.liveState.slide,
            item: OW.State.liveState.item,
            isBlack: OW.Projector.isBlack,
            isClear: OW.Projector.isClear,
            isLogo: OW.Projector.isLogo
        };
        
        // Clear projector
        OW.Projector.isBlack = false;
        OW.Projector.isClear = true;
        OW.Projector.isLogo = false;
        
        // Update UI
        document.getElementById('btnBlack')?.classList.remove('active-state');
        document.getElementById('btnClear')?.classList.add('active-state');
        document.getElementById('btnLogo')?.classList.remove('active-state');
        
        // Set countdown state
        countdownState.isRunning = true;
        countdownState.startTime = Date.now();
        countdownState.duration = totalSeconds;
        countdownState.selectedAnimation = animationKey;
        countdownState.targetScheduleIndex = targetIndex;
        
        // Update panel UI
        panel.querySelector('#countdown-status').style.display = 'block';
        panel.querySelector('#countdown-cancel-btn').style.display = 'flex';
        panel.querySelector('#countdown-start-btn').style.display = 'none';
        
        const animation = animations[animationKey];
        panel.querySelector('#countdown-message').innerHTML = `
            <span>🎨</span>
            <span>Playing "${animation.name}"</span>
        `;
        
        // Start animation loop
        animateCountdown();
        
        OW.UI.showToast(`Countdown started for ${formatDuration(totalSeconds)}!`);
    }
    
    function stopCountdown() {
        if (!countdownState.isRunning) return;
        
        // Stop animation loop
        if (countdownState.animationFrame) {
            cancelAnimationFrame(countdownState.animationFrame);
            countdownState.animationFrame = null;
        }
        
        // Restore original state
        if (countdownState.originalLiveState) {
            OW.Projector.isBlack = countdownState.originalLiveState.isBlack;
            OW.Projector.isClear = countdownState.originalLiveState.isClear;
            OW.Projector.isLogo = countdownState.originalLiveState.isLogo;
            
            // Update UI buttons
            document.getElementById('btnBlack')?.classList.toggle('active-state', OW.Projector.isBlack);
            document.getElementById('btnClear')?.classList.toggle('active-state', OW.Projector.isClear);
            document.getElementById('btnLogo')?.classList.toggle('active-state', OW.Projector.isLogo);
            
            // Restore live display
            if (countdownState.originalLiveState.slide || countdownState.originalLiveState.item) {
                OW.Projector.reRenderLive();
            }
        }
        
        // Reset state
        countdownState.isRunning = false;
        countdownState.originalLiveState = null;
        
        // Update panel UI
        const panel = countdownState.panel;
        if (panel) {
            panel.querySelector('#countdown-status').style.display = 'none';
            panel.querySelector('#countdown-cancel-btn').style.display = 'none';
            panel.querySelector('#countdown-start-btn').style.display = 'flex';
        }
        
        OW.UI.showToast("Countdown stopped");
    }
    
    function animateCountdown() {
        if (!countdownState.isRunning) return;
        
        const elapsed = (Date.now() - countdownState.startTime) / 1000;
        const remaining = countdownState.duration - elapsed;
        
        if (remaining <= 0) {
            finishCountdown();
            return;
        }
        
        // Update timer display
        updateCountdownDisplay(remaining);
        
        // Get canvas contexts
        const monitorCanvas = document.getElementById('monitorCanvas');
        const projectorCanvas = OW.Projector.projectorWindow ? 
            OW.Projector.projectorWindow.document.getElementById('projectorCanvas') : null;
        
        if (monitorCanvas) {
            drawCountdownFrame(monitorCanvas.getContext('2d'), remaining);
        }
        
        if (projectorCanvas) {
            drawCountdownFrame(projectorCanvas.getContext('2d'), remaining);
        }
        
        // Continue animation
        countdownState.animationFrame = requestAnimationFrame(animateCountdown);
    }
    
    function drawCountdownFrame(ctx, remainingSeconds) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const time = Date.now() - countdownState.startTime;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw selected animation
        const animation = animations[countdownState.selectedAnimation];
        if (animation) {
            animation.draw(ctx, time, 1 - (remainingSeconds / countdownState.duration), 
                          width, height, remainingSeconds);
        }
    }
    
    function updateCountdownDisplay(remainingSeconds) {
        const panel = countdownState.panel;
        if (!panel) return;
        
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = Math.floor(remainingSeconds % 60);
        const timer = panel.querySelector('#countdown-timer');
        
        if (timer) {
            if (hours > 0) {
                timer.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            } else {
                timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
            
            // Color change based on time remaining
            if (remainingSeconds < 10) {
                timer.style.color = '#ff4444'; // Red for last 10 seconds
                timer.style.animation = 'pulse 0.5s infinite';
            } else if (remainingSeconds < 60) {
                timer.style.color = '#ffaa00'; // Orange for last minute
                timer.style.animation = 'pulse 1s infinite';
            } else if (remainingSeconds < 300) {
                timer.style.color = '#ffaa00'; // Orange for last 5 minutes
                timer.style.animation = 'none';
            } else {
                timer.style.color = '#00C4FF'; // Blue for normal
                timer.style.animation = 'none';
            }
        }
    }
    
    function finishCountdown() {
        // Stop animation
        stopCountdown();
        
        // Transition to selected schedule item
        let targetIndex = countdownState.targetScheduleIndex;
        
        if (targetIndex === -1 && OW.State.schedule.length > 0) {
            targetIndex = 0; // First item
        }
        
        if (targetIndex >= 0 && targetIndex < OW.State.schedule.length) {
            const targetItem = OW.State.schedule[targetIndex];
            const targetSlide = targetItem.slides?.[0];
            
            if (targetSlide) {
                // Find and click the corresponding schedule item
                const scheduleItems = document.querySelectorAll('.schedule-item');
                if (scheduleItems[targetIndex]) {
                    scheduleItems[targetIndex].click();
                    
                    // Then go live with the first slide
                    const gridWrappers = document.querySelectorAll('#slideGrid .slide-wrapper');
                    if (gridWrappers[0]) {
                        gridWrappers[0].click();
                    }
                }
                
                OW.UI.showToast(`Transitioned to: ${targetItem.title}`);
            }
        } else {
            // Just re-render whatever was there before
            OW.Projector.reRenderLive();
        }
        
        // Show completion message with confetti effect
        setTimeout(() => {
            OW.UI.showToast("🎉 Countdown complete!");
        }, 500);
    }
    
    // ==========================================
    // 7. HELPER FUNCTIONS
    // ==========================================
    
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
    
    // ==========================================
    // 8. CLEANUP ON UNLOAD
    // ==========================================
    
    // Clean up if extension is reloaded
    window.addEventListener('beforeunload', () => {
        if (countdownState.isRunning) {
            stopCountdown();
        }
        
        if (countdownState.panel) {
            countdownState.panel.remove();
        }
    });
    
    // Add CSS animation for pulsing
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        /* Better scrollbar for the modal */
        .countdown-modal::-webkit-scrollbar {
            width: 8px;
        }
        
        .countdown-modal::-webkit-scrollbar-track {
            background: #1a1a1a;
            border-radius: 4px;
        }
        
        .countdown-modal::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
        }
        
        .countdown-modal::-webkit-scrollbar-thumb:hover {
            background: #555;
        }
    `;
    document.head.appendChild(style);
    
    console.log("Countdown Slideshow extension v3.0 loaded successfully!");
}
