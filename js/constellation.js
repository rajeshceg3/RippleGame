// --- Data Definitions ---

// Defines the patterns (Harmonic Sequences) that unlock constellations.
// The sequences are arrays of note indices (corresponding to seed.energy).
const HARMONIC_SEQUENCES = {
    // A simple, rising 3-note sequence
    LYRA: [1, 2, 3],
    // A more complex 4-note sequence
    ORION: [3, 2, 1, 0],
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
    }
};
