import { state } from './state.js';
import { ConstellationManager } from './constellation.js';

export const UI = {
    // Cache DOM elements for performance
    codexButton: document.getElementById('codex-button'),
    codexOverlay: document.getElementById('codex-overlay'),
    codexList: document.getElementById('codex-list'),
    codexClose: document.getElementById('codex-close'),
    codexShare: document.getElementById('codex-share'),

    init() {
        // Attach event listeners
        this.codexButton.addEventListener('click', () => this.openCodex());
        this.codexClose.addEventListener('click', () => this.closeCodex());
        this.codexShare.addEventListener('click', () => this.shareGarden());
        this.codexOverlay.addEventListener('click', (e) => {
            // Close the codex if the user clicks on the overlay background
            if (e.target === this.codexOverlay) {
                this.closeCodex();
            }
        });
    },

    openCodex() {
        this.updateCodexContent();
        this.codexOverlay.classList.remove('hidden');
    },

    closeCodex() {
        this.codexOverlay.classList.add('hidden');
    },

    updateCodexContent() {
        // Clear the current list to prevent duplicates
        this.codexList.innerHTML = '';

        if (state.unlockedConstellations.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'Your garden is yet to reveal its secrets...';
            emptyItem.className = 'empty';
            emptyItem.style.animationDelay = '0.1s';
            this.codexList.appendChild(emptyItem);
        } else {
            state.unlockedConstellations.forEach((constellationData, index) => {
                const listItem = document.createElement('li');
                const definition = ConstellationManager.definitions[constellationData.key];
                listItem.textContent = definition ? definition.name : 'Unknown Star';
                // Stagger animation
                listItem.style.animationDelay = `${index * 0.15}s`;
                this.codexList.appendChild(listItem);
            });
        }
    },

    shareGarden() {
        if (state.unlockedConstellations.length === 0) {
            this.codexShare.textContent = "Unlock something first!";
            setTimeout(() => { this.codexShare.textContent = "Share Garden"; }, 2000);
            return;
        }

        try {
            const stateToShare = { unlockedConstellations: state.unlockedConstellations };
            const jsonString = JSON.stringify(stateToShare);
            const base64String = btoa(jsonString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#${base64String}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                this.codexShare.textContent = "Link Copied!";
                setTimeout(() => { this.codexShare.textContent = "Share Garden"; }, 2000);
            }, () => {
                this.codexShare.textContent = "Could not copy.";
                setTimeout(() => { this.codexShare.textContent = "Share Garden"; }, 2000);
            });
        } catch (error) {
            console.error("Could not create share link:", error);
            this.codexShare.textContent = "Error.";
            setTimeout(() => { this.codexShare.textContent = "Share Garden"; }, 2000);
        }
    }
};
