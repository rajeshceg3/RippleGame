// --- Data Definitions ---

// Defines the patterns (Harmonic Sequences) that unlock constellations.
// The sequences are arrays of note indices (corresponding to seed.energy).
const HARMONIC_SEQUENCES = {
    // A simple, rising 3-note sequence
    LYRA: [1, 2, 3],
    // A more complex 4-note sequence
    ORION: [3, 2, 1, 0],
    // W shape
    CASSIOPEIA: [0, 2, 1, 3, 2],
    // Cross shape
    CYGNUS: [2, 3, 4, 3, 2],
    // Dipper shape
    URSA_MINOR: [1, 1, 2, 2, 3],
};

// Defines the structure of the constellations themselves.
// Each constellation has a name and a set of node positions.
// Positions are relative to a center point (the location of the bloom that completed the sequence).
const CONSTELLATIONS = {
    LYRA: {
        name: 'Lyra',
        nodes: [
            { x: 0, y: -30 },
            { x: -50, y: 20 },
            { x: 50, y: 20 },
        ],
        edges: [
            [0, 1], [0, 2], [1, 2]
        ]
    },
    ORION: {
        name: 'Orion',
        nodes: [
            { x: -30, y: -50 },
            { x: 30, y: -50 },
            { x: -40, y: 0 },
            { x: 0, y: 0 },
            { x: 40, y: 0 },
            { x: -30, y: 50 },
            { x: 30, y: 50 },
        ],
        edges: [
            [0, 1], [0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]
        ]
    },
    CASSIOPEIA: {
        name: 'Cassiopeia',
        nodes: [
            { x: -60, y: -20 },
            { x: -30, y: 30 },
            { x: 0, y: 0 },
            { x: 30, y: 40 },
            { x: 60, y: -10 },
        ],
        edges: [
            [0, 1], [1, 2], [2, 3], [3, 4]
        ]
    },
    CYGNUS: {
        name: 'Cygnus',
        nodes: [
            { x: 0, y: -60 },
            { x: 0, y: -20 },
            { x: 0, y: 20 },
            { x: 0, y: 60 },
            { x: -40, y: -10 },
            { x: 40, y: -10 },
        ],
        edges: [
            [0, 1], [1, 2], [2, 3], [1, 4], [1, 5]
        ]
    },
    URSA_MINOR: {
        name: 'Ursa Minor',
        nodes: [
            { x: -70, y: 30 },
            { x: -40, y: 10 },
            { x: -10, y: 0 },
            { x: 20, y: -20 },
            { x: 60, y: -30 },
            { x: 30, y: 20 },
            { x: 70, y: 10 },
        ],
        edges: [
            [0, 1], [1, 2], [2, 3], [3, 4], [4, 6], [6, 5], [5, 3]
        ]
    }
};


// --- System Logic ---

// The ConstellationManager is the strategic core of this feature.
// It will check note sequences and manage the state of unlocked constellations.
export const ConstellationManager = {
    sequences: HARMONIC_SEQUENCES,
    definitions: CONSTELLATIONS,

    /**
     * Checks if the provided sequence of notes matches a known Harmonic Sequence.
     * @param {number[]} sequence - The sequence of notes played by the user.
     * @returns {string|null} The key of the unlocked constellation, or null if no match.
     */
    checkSequence(sequence) {
        // This will be fully implemented in a later step.
        // For now, it's a placeholder.
        for (const key in this.sequences) {
            const requiredSequence = this.sequences[key];
            // Check if the tail of the user's sequence matches a required sequence
            if (sequence.length >= requiredSequence.length) {
                const recentNotes = sequence.slice(-requiredSequence.length);
                if (recentNotes.every((val, index) => val === requiredSequence[index])) {
                    return key; // Found a match
                }
            }
        }
        return null; // No match
    },

    /**
     * Calculates how close the current sequence is to any known Harmonic Sequence.
     * @param {number[]} sequence - The sequence of notes played by the user.
     * @returns {number} A value from 0.0 to 1.0 representing the resonance score.
     */
    getResonance(sequence) {
        if (!sequence || sequence.length === 0) return 0;
        let maxResonance = 0;
        for (const key in this.sequences) {
            const req = this.sequences[key];
            for (let i = 1; i <= req.length; i++) {
                const subSeq = req.slice(0, i);
                if (sequence.length >= i) {
                    const recentNotes = sequence.slice(-i);
                    let match = true;
                    for (let j = 0; j < i; j++) {
                        if (recentNotes[j] !== subSeq[j]) {
                            match = false;
                            break;
                        }
                    }
                    if (match) {
                        maxResonance = Math.max(maxResonance, i / req.length);
                    }
                }
            }
        }
        return maxResonance;
    }
};
