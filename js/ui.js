import { state } from './state.js';
import { ConstellationManager } from './constellation.js';

export const UI = {
    // Cache DOM elements for performance
    codexButton: document.getElementById('codex-button'),
    codexOverlay: document.getElementById('codex-overlay'),
    codexList: document.getElementById('codex-list'),
    codexContent: document.getElementById('codex-content'),
    codexClose: document.getElementById('codex-close'),
    codexShare: document.getElementById('codex-share'),

    init() {
        // Attach event listeners
        this.codexButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.openCodex();
        });

        // Touch specific for better responsiveness
        this.codexButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.openCodex();
        }, { passive: false });

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
        // Reset scroll position
        if(this.codexContent) this.codexContent.scrollTop = 0;
    },

    closeCodex() {
        this.codexOverlay.classList.add('hidden');
    },

    updateCodexContent() {
        // Clear the current list to prevent duplicates
        this.codexList.innerHTML = '';

        if (!state.unlockedConstellations || state.unlockedConstellations.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.textContent = 'Your garden is yet to reveal its secrets...';
            emptyItem.className = 'empty';
            emptyItem.style.animationDelay = '0.1s';
            this.codexList.appendChild(emptyItem);
        } else {
            // Reverse order to show newest first
            [...state.unlockedConstellations].reverse().forEach((constellationData, index) => {
                const listItem = document.createElement('li');
                const definition = ConstellationManager.definitions[constellationData.key];
                listItem.textContent = definition ? definition.name : 'Unknown Star';
                // Stagger animation faster for a snappier feel
                listItem.style.animationDelay = `${index * 0.08}s`;
                this.codexList.appendChild(listItem);
            });
        }
    },

    shareGarden() {
        if (!state.unlockedConstellations || state.unlockedConstellations.length === 0) {
            this.animateButtonFeedback(this.codexShare, "Unlock something first!", "error");
            return;
        }

        try {
            const stateToShare = { unlockedConstellations: state.unlockedConstellations };
            const jsonString = JSON.stringify(stateToShare);
            const base64String = btoa(jsonString);
            const shareUrl = `${window.location.origin}${window.location.pathname}#${base64String}`;

            navigator.clipboard.writeText(shareUrl).then(() => {
                this.animateButtonFeedback(this.codexShare, "Link Copied!", "success");
            }, () => {
                this.animateButtonFeedback(this.codexShare, "Could not copy", "error");
            });
        } catch (error) {
            console.error("Could not create share link:", error);
            this.animateButtonFeedback(this.codexShare, "Error", "error");
        }
    },

    animateButtonFeedback(button, message, type) {
        const originalText = "Share Garden";

        // Save original styles
        const originalColor = button.style.color;
        const originalBorder = button.style.borderColor;
        const originalBg = button.style.background;

        button.textContent = message;

        if (type === 'success') {
            button.style.borderColor = '#4caf50';
            button.style.color = '#4caf50';
            button.style.background = 'rgba(76, 175, 80, 0.1)';
        } else {
            button.style.borderColor = '#f44336';
            button.style.color = '#f44336';
            button.style.background = 'rgba(244, 67, 54, 0.1)';
        }

        setTimeout(() => {
            button.textContent = originalText;
            button.style.color = originalColor;
            button.style.borderColor = originalBorder;
            button.style.background = originalBg;
        }, 2000);
    }
};
