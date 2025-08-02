export const state = {
    // --- App State ---
    isInitialized: false,
    isPaused: false,
    animationFrameId: null,

    // --- Entities ---
    ripples: [],
    seeds: [],
    blooms: [],

    // --- Interaction ---
    lastTap: { time: 0, x: 0, y: 0 },

    // --- Audio ---
    audioContext: null,
    lastSoundTime: 0,

    // --- "Project Constellation" State ---
    noteSequence: [], // Tracks the last few notes the user has played
    unlockedConstellations: [], // Stores the data of unlocked constellations (key, center)
    constellationNodes: [], // Stores the actual node entities for rendering
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
