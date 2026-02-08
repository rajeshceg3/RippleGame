import { state, config } from './state.js';
import { Ripple, LightSeed, Bloom, ConstellationNode } from './entities.js';
import { ConstellationManager } from './constellation.js';
import { UI } from './ui.js';

export const App = {
    // --- Elements & Context ---
    canvas: document.getElementById('aura-canvas'),
    ctx: null,
    introMessage: document.getElementById('intro-message'),

    init() {
        this.ctx = this.canvas.getContext('2d');
        this.loadState(); // Load progress before anything else

        // Initialize Background Stars
        // Increased count and improved variance for a better "sky"
        for (let i = 0; i < 200; i++) {
            const z = Math.random(); // Depth factor 0 (far) to 1 (near)
            state.backgroundStars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2 * z + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: (Math.random() * 0.02 + 0.005) * z,
                z: z, // For parallax
                hue: Math.random() > 0.8 ? 200 + Math.random() * 60 : 50 // Mostly blue/white, some gold
            });
        }

        this.resizeCanvas();
        UI.init();

        // Attach all event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousedown', (e) => this.handleInteraction(e));
        window.addEventListener('touchstart', (e) => {
            // e.preventDefault(); // Removed to allow UI clicks, handled in CSS or specific elements if needed
            // Actually, keep preventDefault for canvas but check target?
            // Canvas covers everything, UI is on top.
            if(e.target === this.canvas) {
                 e.preventDefault();
                 this.handleInteraction(e);
            }
        }, { passive: false });

        window.addEventListener('mousemove', (e) => {
            state.mouse.x = e.clientX;
            state.mouse.y = e.clientY;
        });

        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());

        this.animate();
    },

    loadState() {
        let stateLoaded = false;

        // 1. Attempt to load from URL hash first
        if (window.location.hash && window.location.hash.length > 1) {
            try {
                const base64String = window.location.hash.substring(1);
                const jsonString = atob(base64String); // Decode Base64
                const decodedState = JSON.parse(jsonString);

                if (decodedState && Array.isArray(decodedState.unlockedConstellations)) {
                    this.applyState(decodedState);
                    stateLoaded = true;
                    console.log("Loaded garden state from URL.");
                    // Clear the hash to avoid re-loading on refresh and have a clean URL
                    history.replaceState(null, document.title, window.location.pathname + window.location.search);
                }
            } catch (error) {
                console.error("Failed to load state from URL hash:", error);
            }
        }

        // 2. If not loaded from URL, fall back to localStorage
        if (!stateLoaded) {
            try {
                const savedStateJSON = localStorage.getItem('auraGardenState');
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    if (savedState && Array.isArray(savedState.unlockedConstellations)) {
                        this.applyState(savedState);
                        console.log("Loaded garden state from localStorage.");
                    }
                }
            } catch (error) {
                console.error("Failed to load state from localStorage:", error);
            }
        }
    },

    applyState(newState) {
        // Clear any existing state before applying the new one
        state.unlockedConstellations = [];
        state.constellationNodes = [];

        state.unlockedConstellations = newState.unlockedConstellations;

        // Re-create the visual nodes from the loaded data
        state.unlockedConstellations.forEach(constellationData => {
            const definition = ConstellationManager.definitions[constellationData.key];
            if (definition) {
                definition.nodes.forEach(nodeOffset => {
                    const nodeX = constellationData.x + nodeOffset.x;
                    const nodeY = constellationData.y + nodeOffset.y;
                    const node = new ConstellationNode(nodeX, nodeY);
                    node.opacity = 1; // Make them instantly visible
                    state.constellationNodes.push(node);
                });
            }
        });
    },

    handleVisibilityChange() {
        if (document.visibilityState === 'hidden') {
            state.isPaused = true;
            cancelAnimationFrame(state.animationFrameId);
        } else {
            state.isPaused = false;
            this.animate();
        }
    },

    resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.canvas.style.width = `${window.innerWidth}px`;
        this.canvas.style.height = `${window.innerHeight}px`;
        this.ctx.scale(dpr, dpr);
        this.repositionElements();
    },

    repositionElements() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        state.seeds.forEach(seed => {
            seed.x = Math.max(0, Math.min(width, seed.x));
            seed.y = Math.max(0, Math.min(height, seed.y));
            seed.canvas = { width, height }; // Update boundary reference
        });

        // Redistribute stars on resize
        state.backgroundStars.forEach(star => {
            star.x = Math.random() * width;
            star.y = Math.random() * height;
        });
    },

    playSound(freq, volume = 0.2, type = 'sine') {
        const now = Date.now();
        if (!state.audioContext) return;
        // Relaxed cooldown check to allow more polyphony, but keeping it to prevent explosion
        if (now - state.lastSoundTime < 20) return;
        state.lastSoundTime = now;

        // Oscillator 1 (Fundamental)
        const oscillator = state.audioContext.createOscillator();
        const gainNode = state.audioContext.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, state.audioContext.currentTime);

        const attack = 0.02;
        const decay = 2.5; // Longer tail

        gainNode.gain.setValueAtTime(0, state.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, state.audioContext.currentTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + decay);

        oscillator.connect(gainNode).connect(state.audioContext.destination);
        oscillator.start();
        oscillator.stop(state.audioContext.currentTime + decay);

        // Oscillator 2 (Harmonic overtone for "glassy" sound)
        if (type === 'sine') {
            const osc2 = state.audioContext.createOscillator();
            const gain2 = state.audioContext.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(freq * 2, state.audioContext.currentTime); // Octave up

            gain2.gain.setValueAtTime(0, state.audioContext.currentTime);
            gain2.gain.linearRampToValueAtTime(volume * 0.15, state.audioContext.currentTime + attack);
            gain2.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + decay * 0.7);

            osc2.connect(gain2).connect(state.audioContext.destination);
            osc2.start();
            osc2.stop(state.audioContext.currentTime + decay);
        }
    },

    playChord(chord, volume) {
        // Staggered strum
        chord.forEach((freq, index) => {
            setTimeout(() => {
                this.playSound(freq, volume, 'sine');
            }, index * 60);
        });
    },

    handleInteraction(e) {
        if (!state.isInitialized) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.introMessage.style.opacity = '0';
            // Pass the logical canvas size to LightSeed
            const logicalCanvas = { width: window.innerWidth, height: window.innerHeight };
            for (let i = 0; i < 5; i++) { state.seeds.push(new LightSeed(logicalCanvas)); }
            state.isInitialized = true;
        }

        const currentTime = Date.now();
        const timeSinceLastTap = currentTime - state.lastTap.time;
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        const dist = Math.hypot(x - state.lastTap.x, y - state.lastTap.y);

        if (timeSinceLastTap < config.DOUBLE_TAP_DELAY && dist < config.DOUBLE_TAP_RADIUS) {
            state.ripples.push(new Ripple(x, y, true));
            this.playSound(config.PENTATONIC_SCALE[0] / 2, 0.3);
            state.lastTap.time = 0;
        } else {
            state.ripples.push(new Ripple(x, y, false));
            this.playSound(config.PENTATONIC_SCALE[1], 0.2);
        }
        state.lastTap = { time: currentTime, x, y };
    },

    animate() {
        if (state.isPaused) return;

        // Clear based on logical size
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Draw Background Stars
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        state.backgroundStars.forEach(star => {
            star.opacity += star.speed;
            if (star.opacity > 1 || star.opacity < 0.1) star.speed *= -1;

            // Parallax shift
            const moveX = (state.mouse.x - centerX) * star.z * 0.05;
            const moveY = (state.mouse.y - centerY) * star.z * 0.05;

            this.ctx.globalAlpha = Math.abs(star.opacity) * (0.5 + star.z * 0.5);
            // Dynamic color
            if (star.hue === 50) {
                 this.ctx.fillStyle = `hsl(50, 100%, 80%)`; // Goldish
            } else {
                 this.ctx.fillStyle = `hsl(${star.hue}, 80%, 90%)`; // Blueish
            }

            this.ctx.beginPath();
            this.ctx.arc(star.x + moveX, star.y + moveY, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;

        state.seeds.forEach(seed => {
            seed.update();
            seed.draw(this.ctx);
        });

        state.constellationNodes.forEach(node => {
            node.update();
            node.draw(this.ctx);
        });

        state.ripples.forEach(ripple => {
            ripple.update();
            ripple.draw(this.ctx);

            state.seeds.forEach((seed, sIndex) => {
                const dist = Math.hypot(ripple.x - seed.x, ripple.y - seed.y);
                if (Math.abs(dist - ripple.radius) < 10) {
                    seed.nudge(ripple.x, ripple.y);
                    this.playSound(config.PENTATONIC_SCALE[seed.energy], 0.4);

                    // --- Sequence Tracking ---
                    state.noteSequence.push(seed.energy);
                    if (state.noteSequence.length > 10) {
                        state.noteSequence.shift(); // Keep the sequence from growing too long
                    }

                    const unlockedKey = ConstellationManager.checkSequence(state.noteSequence);
                    if (unlockedKey) {
                        // Check if this constellation has already been unlocked to prevent duplicates
                        const isAlreadyUnlocked = state.unlockedConstellations.some(c => c.key === unlockedKey);

                        if (!isAlreadyUnlocked) {
                            console.log(`Unlocked: ${unlockedKey}`);

                            // Add the new constellation to the application state
                            const newConstellationData = {
                                key: unlockedKey,
                                x: seed.x,
                                y: seed.y
                            };
                            state.unlockedConstellations.push(newConstellationData);

                            // Save the new state to localStorage
                            try {
                                const stateToSave = { unlockedConstellations: state.unlockedConstellations };
                                localStorage.setItem('auraGardenState', JSON.stringify(stateToSave));
                            } catch (error) {
                                console.error("Could not save to localStorage:", error);
                            }

                            // Create the visual entities (the nodes) for the constellation
                            const definition = ConstellationManager.definitions[unlockedKey];
                            if (definition) {
                                definition.nodes.forEach(nodeOffset => {
                                    const nodeX = newConstellationData.x + nodeOffset.x;
                                    const nodeY = newConstellationData.y + nodeOffset.y;
                                    state.constellationNodes.push(new ConstellationNode(nodeX, nodeY));
                                });
                            }
                        }

                        // Clear the sequence regardless of whether it was a new unlock or not,
                        // to ensure the user can start a new sequence.
                        state.noteSequence = [];
                    }
                    // --- End Sequence Tracking ---

                    if (seed.energy >= seed.maxEnergy) {
                        state.blooms.push(new Bloom(seed.x, seed.y));
                        this.playChord(config.BLOOM_CHORD, 0.3);
                        state.seeds.splice(sIndex, 1);
                        // Make sure new seed gets the canvas dimensions reference
                        setTimeout(() => state.seeds.push(new LightSeed({ width: window.innerWidth, height: window.innerHeight })), 2000);
                    }
                }
            });
        });

        state.blooms.forEach(bloom => {
            bloom.update();
            bloom.draw(this.ctx);
        });

        state.ripples = state.ripples.filter(r => r.opacity > 0);
        state.blooms = state.blooms.filter(b => b.life > 0);

        state.animationFrameId = requestAnimationFrame(() => this.animate());
    }
};

// --- Launch Application ---
App.init();
