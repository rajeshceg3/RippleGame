export const state = {
    // --- App State ---
    isInitialized: false,
    isPaused: false,
    animationFrameId: null,

    // --- Entities ---
    ripples: [],
    seeds: [],
    blooms: [],
    backgroundStars: [],
    stardust: [],

    // --- Interaction ---
    lastTap: { time: 0, x: 0, y: 0 },
    mouse: { x: 0, y: 0 }, // For parallax effect
    isPointerDown: false,
    chargeStartTime: 0,
    isCharging: false,
    chargeX: 0,
    chargeY: 0,

    // --- Audio ---
    audioContext: null,
    lastSoundTime: 0,
    ambientGain: null,
    ambientOscillators: [],
    delayNode: null,
    feedbackGain: null,

    // --- Background Visuals ---
    shootingStars: [],

    // --- "Project Constellation" State ---
    noteSequence: [], // Tracks the last few notes the user has played
    unlockedConstellations: [], // Stores the data of unlocked constellations (key, center)
    constellationEntities: [], // Stores the actual constellation entities for rendering
    resonance: 0, // Calculates how close the user is to a harmonic sequence
    floatingTexts: [], // Temporary on-canvas labels
};

export const config = {
    // --- Interaction Tuning ---
    DOUBLE_TAP_DELAY: 300, // ms
    DOUBLE_TAP_RADIUS: 50, // pixels

    // --- Sound Engine ---
    SOUND_COOLDOWN: 100, // ms
    PENTATONIC_SCALE: [261.63, 329.63, 392.00, 440.00, 523.25],
    BLOOM_CHORD: [261.63, 329.63, 392.00],
};
