import { state, config } from './state.js';
import { Ripple, LightSeed, Bloom, ConstellationEntity, StardustParticle, ShootingStar } from './entities.js';
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

        window.addEventListener('mousedown', (e) => {
            state.isPointerDown = true;
            state.isCharging = true;
            state.chargeStartTime = Date.now();
            state.chargeX = e.clientX;
            state.chargeY = e.clientY;
        });
        window.addEventListener('mouseup', (e) => {
            state.isPointerDown = false;
            if (state.isCharging) {
                const duration = Date.now() - state.chargeStartTime;
                if (duration > 500) {
                    // Initialize if not already (do this FIRST)
                    if (!state.isInitialized) {
                        this.handleInteraction({clientX: state.chargeX, clientY: state.chargeY});
                    }
                    // Super Ripple
                    state.ripples.push(new Ripple(state.chargeX, state.chargeY, 'super'));
                    this.playChord([130.81, 196.00, 261.63], 0.5, state.chargeX);
                } else {
                    // Normal tap logic
                    this.handleInteraction({clientX: state.chargeX, clientY: state.chargeY});
                }
                state.isCharging = false;
            }
        });

        window.addEventListener('touchstart', (e) => {
            // e.preventDefault(); // Removed to allow UI clicks, handled in CSS or specific elements if needed
            // Actually, keep preventDefault for canvas but check target?
            // Canvas covers everything, UI is on top.
            if(e.target === this.canvas) {
                 e.preventDefault();
                 state.isPointerDown = true;
                 state.isCharging = true;
                 state.chargeStartTime = Date.now();
                 state.chargeX = e.touches[0].clientX;
                 state.chargeY = e.touches[0].clientY;
            }
        }, { passive: false });
        window.addEventListener('touchend', (e) => {
            state.isPointerDown = false;
            if (state.isCharging) {
                const duration = Date.now() - state.chargeStartTime;
                if (duration > 500) {
                    // Initialize if not already
                    if (!state.isInitialized) {
                        this.handleInteraction({clientX: state.chargeX, clientY: state.chargeY});
                    }
                    // Super Ripple
                    state.ripples.push(new Ripple(state.chargeX, state.chargeY, 'super'));
                    this.playChord([130.81, 196.00, 261.63], 0.5, state.chargeX);
                } else {
                    // Normal tap logic
                    this.handleInteraction({clientX: state.chargeX, clientY: state.chargeY});
                }
                state.isCharging = false;
            }
        });

        window.addEventListener('mousemove', (e) => {
            state.mouse.x = e.clientX;
            state.mouse.y = e.clientY;

            // Add Stardust
            if (state.isInitialized && Math.random() > 0.5) {
                state.stardust.push(new StardustParticle(e.clientX, e.clientY));
            }
        });

        window.addEventListener('touchmove', (e) => {
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                state.mouse.x = touch.clientX;
                state.mouse.y = touch.clientY;

                // Add Stardust
                if (state.isInitialized && Math.random() > 0.3) {
                    state.stardust.push(new StardustParticle(touch.clientX, touch.clientY));
                }
            }
        }, { passive: true });

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
        state.constellationEntities = [];

        state.unlockedConstellations = newState.unlockedConstellations;

        // Re-create the visual entities from the loaded data
        state.unlockedConstellations.forEach(constellationData => {
            const definition = ConstellationManager.definitions[constellationData.key];
            if (definition) {
                const entity = new ConstellationEntity(definition, constellationData.x, constellationData.y, true);
                state.constellationEntities.push(entity);
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

    createReverb() {
        if (!state.audioContext) return null;
        const sampleRate = state.audioContext.sampleRate;
        const length = sampleRate * 3; // 3 seconds reverb
        const impulse = state.audioContext.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (sampleRate * 1.5)); // Exponential decay
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }

        const convolver = state.audioContext.createConvolver();
        convolver.buffer = impulse;
        return convolver;
    },

    initAmbientAudio() {
        if (!state.audioContext) return;

        // Master Gain
        state.masterGain = state.audioContext.createGain();
        state.masterGain.gain.setValueAtTime(0.8, state.audioContext.currentTime);
        state.masterGain.connect(state.audioContext.destination);

        // Setup Reverb
        state.reverbNode = this.createReverb();
        state.reverbGain = state.audioContext.createGain();
        state.reverbGain.gain.setValueAtTime(0.4, state.audioContext.currentTime); // Wet mix level
        if (state.reverbNode) {
            state.reverbNode.connect(state.reverbGain);
            state.reverbGain.connect(state.masterGain);
        }

        // Setup Delay Line (Echo effect)
        state.delayNode = state.audioContext.createDelay(1.0); // max 1s
        state.delayNode.delayTime.setValueAtTime(0.3, state.audioContext.currentTime); // 300ms echo
        state.feedbackGain = state.audioContext.createGain();
        state.feedbackGain.gain.setValueAtTime(0.3, state.audioContext.currentTime); // 30% feedback

        state.delayNode.connect(state.feedbackGain);
        state.feedbackGain.connect(state.delayNode);

        // Connect delay to reverb and master
        state.delayNode.connect(state.reverbGain);
        state.delayNode.connect(state.masterGain);

        state.ambientGain = state.audioContext.createGain();
        state.ambientGain.gain.setValueAtTime(0, state.audioContext.currentTime);
        state.ambientGain.connect(state.masterGain);

        const baseFrequencies = [130.81, 196.00, 261.63, 392.00]; // Low C3, G3, C4, G4

        baseFrequencies.forEach(freq => {
            const osc = state.audioContext.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, state.audioContext.currentTime);

            // LFO for slow volume panning/modulation
            const lfo = state.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.setValueAtTime(0.05 + Math.random() * 0.05, state.audioContext.currentTime); // very slow

            const lfoGain = state.audioContext.createGain();
            lfoGain.gain.setValueAtTime(0.2, state.audioContext.currentTime); // depth of modulation

            lfo.connect(lfoGain.gain);
            osc.connect(lfoGain).connect(state.ambientGain);

            osc.start();
            lfo.start();

            state.ambientOscillators.push({ osc, lfoGain });
        });
    },

    updateAmbientAudio() {
        if (!state.ambientGain) return;

        // Base volume is extremely low
        let targetVolume = 0.01;

        // Increase volume slightly based on unlocked constellations
        if (state.unlockedConstellations && state.unlockedConstellations.length > 0) {
            targetVolume = Math.min(0.08, targetVolume + (state.unlockedConstellations.length * 0.015));
        }

        // Add a bit more volume if seeds are high energy
        const totalEnergy = state.seeds.reduce((sum, seed) => sum + seed.energy, 0);
        targetVolume += (totalEnergy * 0.002);

        // Add a substantial swell for active resonance (diegetic feedback)
        targetVolume += (state.resonance || 0) * 0.05;

        // Ensure it stays subtle
        targetVolume = Math.min(0.12, targetVolume);

        // Smooth transition to target volume
        state.ambientGain.gain.setTargetAtTime(targetVolume, state.audioContext.currentTime, 2.0);
    },

    playSound(freq, volume = 0.2, type = 'sine', x = null) {
        const now = Date.now();
        if (!state.audioContext) return;
        // Relaxed cooldown check to allow more polyphony, but keeping it to prevent explosion
        if (now - state.lastSoundTime < 20) return;
        state.lastSoundTime = now;

        // Set up Spatial Audio Panner
        const panner = state.audioContext.createStereoPanner();
        if (x !== null) {
            // Map x to -1 (left) to 1 (right)
            const panValue = (x / window.innerWidth) * 2 - 1;
            panner.pan.setValueAtTime(panValue, state.audioContext.currentTime);
        } else {
            panner.pan.setValueAtTime(0, state.audioContext.currentTime);
        }

        // Connect panner to dry mix and reverb (wet mix)
        panner.connect(state.masterGain);
        if (state.reverbNode) {
            panner.connect(state.reverbNode);
        }
        if (state.delayNode) {
            panner.connect(state.delayNode);
        }

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

        oscillator.connect(gainNode).connect(panner);
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

            osc2.connect(gain2).connect(panner);
            osc2.start();
            osc2.stop(state.audioContext.currentTime + decay);
        }
    },

    playChord(chord, volume, x = null) {
        // Staggered strum
        chord.forEach((freq, index) => {
            setTimeout(() => {
                this.playSound(freq, volume, 'sine', x);
            }, index * 60);
        });
    },

    handleInteraction(e) {
        if (!state.isInitialized) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initAmbientAudio();
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
            this.playSound(config.PENTATONIC_SCALE[0] / 2, 0.3, 'sine', x);
            state.lastTap.time = 0;
        } else {
            state.ripples.push(new Ripple(x, y, false));
            this.playSound(config.PENTATONIC_SCALE[1], 0.2, 'sine', x);
        }
        state.lastTap = { time: currentTime, x, y };
    },

    animate() {
        if (state.isPaused) return;

        // Update ambient audio dynamic volume
        if (state.isInitialized) {
            this.updateAmbientAudio();
        }

        // Clear based on logical size
        this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        // Spawn Shooting Stars periodically
        if (state.isInitialized && Math.random() < 0.005) {
            state.shootingStars.push(new ShootingStar({ width: window.innerWidth, height: window.innerHeight }));
        }

        // Draw Background Stars
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Calculate and draw dynamic atmospheric resonance glow
        state.resonance = ConstellationManager.getResonance(state.noteSequence);
        const resonanceGlow = state.resonance * 0.5;
        const progressGlow = (state.unlockedConstellations ? state.unlockedConstellations.length : 0) * 0.1;
        const totalGlow = Math.min(1, resonanceGlow + progressGlow);

        if (totalGlow > 0) {
            const grad = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(window.innerWidth, window.innerHeight));
            grad.addColorStop(0, `rgba(30, 10, 50, ${totalGlow * 0.4})`);
            grad.addColorStop(1, `rgba(0, 0, 0, 0)`);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        }

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

        this.ctx.globalCompositeOperation = 'lighter';

        state.shootingStars.forEach(star => {
            star.update();
            star.draw(this.ctx);
        });
        state.shootingStars = state.shootingStars.filter(s => s.active);

        // Draw Charging Indicator
        if (state.isCharging) {
            const chargeDuration = Date.now() - state.chargeStartTime;
            if (chargeDuration > 100) { // Small delay before showing
                const chargeRadius = Math.min(100, chargeDuration * 0.1);
                this.ctx.beginPath();
                this.ctx.arc(state.chargeX, state.chargeY, chargeRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = `rgba(255, 215, 0, ${Math.min(0.5, chargeDuration / 1000)})`; // Golden, fading in
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                if (chargeDuration > 500) {
                    this.ctx.fillStyle = `rgba(255, 215, 0, 0.2)`;
                    this.ctx.fill();
                }
            }
        }

        // Draw Energy Threads between close seeds and check for collisions
        for (let i = 0; i < state.seeds.length; i++) {
            for (let j = i + 1; j < state.seeds.length; j++) {
                const seedA = state.seeds[i];
                const seedB = state.seeds[j];
                const dist = Math.hypot(seedA.x - seedB.x, seedA.y - seedB.y);

                if (dist < 150) {
                    const opacity = 1 - (dist / 150);
                    this.ctx.beginPath();
                    this.ctx.moveTo(seedA.x, seedA.y);
                    this.ctx.lineTo(seedB.x, seedB.y);
                    this.ctx.strokeStyle = `rgba(200, 220, 255, ${opacity * 0.4})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }

                // Collision Chimes
                if (dist < seedA.radius + seedB.radius + 5) {
                    const now = Date.now();
                    if (!state.lastCollisionTime) state.lastCollisionTime = 0;
                    if (now - state.lastCollisionTime > 150) {
                        const freq = 800 + (seedA.energy + seedB.energy) * 100;
                        this.playSound(freq, 0.1, 'triangle', (seedA.x + seedB.x) / 2);
                        state.lastCollisionTime = now;
                    }
                }
            }
        }

        state.seeds.forEach(seed => {
            if (state.isPointerDown) {
                const dx = state.mouse.x - seed.x;
                const dy = state.mouse.y - seed.y;
                const distance = Math.hypot(dx, dy);
                if (distance > 0) {
                    // Normalize the vector and apply an attractive force
                    const force = 0.5 / distance;
                    seed.vx += (dx / distance) * force;
                    seed.vy += (dy / distance) * force;
                }
            }
            seed.update(state.seeds, state.mouse);
            seed.draw(this.ctx);
        });

        state.constellationEntities.forEach(entity => {
            entity.update();
            entity.draw(this.ctx);
        });

        state.stardust.forEach(particle => {
            particle.update(state.ripples);
            particle.draw(this.ctx);
        });
        state.stardust = state.stardust.filter(p => p.life > 0);

        state.ripples.forEach(ripple => {
            ripple.update();
            ripple.draw(this.ctx);

            state.seeds.forEach((seed, sIndex) => {
                const dist = Math.hypot(ripple.x - seed.x, ripple.y - seed.y);
                if (Math.abs(dist - ripple.radius) < 10) {
                    seed.nudge(ripple.x, ripple.y);
                    this.playSound(config.PENTATONIC_SCALE[seed.energy], 0.4, 'sine', seed.x);

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

                                // Diegetic visual feedback: Massive screen-wide shockwave ripple
                                const shockwave = new Ripple(seed.x, seed.y, true);
                                shockwave.maxRadius = Math.max(window.innerWidth, window.innerHeight) * 1.5;
                                state.ripples.push(shockwave);

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

                            // Create the visual entities for the constellation
                            const definition = ConstellationManager.definitions[unlockedKey];
                            if (definition) {
                                const entity = new ConstellationEntity(definition, newConstellationData.x, newConstellationData.y, false);
                                state.constellationEntities.push(entity);
                            }
                        }

                        // Clear the sequence regardless of whether it was a new unlock or not,
                        // to ensure the user can start a new sequence.
                        state.noteSequence = [];
                    }
                    // --- End Sequence Tracking ---

                    if (seed.energy >= seed.maxEnergy) {
                        state.blooms.push(new Bloom(seed.x, seed.y));
                        this.playChord(config.BLOOM_CHORD, 0.3, seed.x);
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

        this.ctx.globalCompositeOperation = 'source-over';

        state.animationFrameId = requestAnimationFrame(() => this.animate());
    }
};

// --- Launch Application ---
App.init();
