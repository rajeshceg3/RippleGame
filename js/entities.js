export class Ripple {
    constructor(x, y, isPulse = false) {
        this.x = x;
        this.y = y;
        this.isPulse = isPulse;
        this.radius = 0;
        this.maxRadius = isPulse ? 450 : 250;
        this.speed = isPulse ? 1.5 : 2.5; // Faster feedback
        this.opacity = isPulse ? 0.5 : 0.8;
        this.lineWidth = isPulse ? 2 : 3;
    }

    update() {
        this.radius += this.speed;
        // Nonlinear fade out
        if (this.opacity > 0) {
            this.opacity -= (this.radius / this.maxRadius) * 0.02;
            if(this.opacity < 0) this.opacity = 0;
        }
    }

    draw(ctx) {
        // Main Ripple
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Smoother gradient stroke
        const grad = ctx.createRadialGradient(this.x, this.y, Math.max(0, this.radius - 40), this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(0.5, `rgba(255, 255, 255, ${this.opacity * 0.3})`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${this.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth;

        // Add a glow effect
        ctx.shadowColor = "rgba(200, 220, 255, 0.5)";
        ctx.shadowBlur = 10;

        if (this.isPulse) {
            ctx.setLineDash([5, 15]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0; // Reset

        // Echo Ripple (Inner ring)
        if (!this.isPulse && this.radius > 20) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }
}

export class LightSeed {
    constructor(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2;
        this.radius = 5;
        this.energy = 0;
        this.maxEnergy = 3;
        // New properties
        this.history = [];
        this.maxHistory = 20;
        this.angle = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.05;
    }

    nudge(sourceX, sourceY) {
        this.energy = Math.min(this.maxEnergy, this.energy + 1);
        const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
        this.vx += Math.cos(angle) * 0.5;
        this.vy += Math.sin(angle) * 0.5;
        // Speed up the pulse as energy increases
        this.pulseSpeed = 0.05 + (this.energy * 0.02);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.98;
        this.vy *= 0.98;

        if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;

        // Trail logic
        this.history.push({x: this.x, y: this.y});
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }

        // Breathing animation
        this.angle += this.pulseSpeed;
    }

    draw(ctx) {
        // Draw Trail
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            // Dynamic color based on energy
            // 200-240 hue range (blue to purple)
            const hue = 200 + (this.energy * 15);
            ctx.strokeStyle = `rgba(${hue}, 220, 255, 0.15)`;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }

        // Draw Seed Glow
        ctx.beginPath();
        const breath = Math.sin(this.angle) * 2;
        const displayRadius = this.radius + this.energy * 2 + breath;

        // Complex gradient for "ethereal" feel
        const glow = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, displayRadius * 4);

        const r = 200 + (this.energy * 15);
        const g = 220 + (this.energy * 5);
        const b = 255;

        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.9 + this.energy * 0.05})`); // Hot center
        glow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.4 + this.energy * 0.05})`); // Inner glow
        glow.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${0.1})`); // Outer halo
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, displayRadius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        // Subtle inner shadow effect on the core by using a smaller gradient
        const coreGrad = ctx.createRadialGradient(this.x - 1, this.y - 1, 0, this.x, this.y, this.radius * 0.6);
        coreGrad.addColorStop(0, "#fff");
        coreGrad.addColorStop(1, "#eef");

        ctx.fillStyle = coreGrad;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = 5;
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
    }
}

class BloomParticle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1; // Faster explosion
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01;
        this.size = Math.random() * 3 + 1;
        this.hue = hue;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.92; // Stronger Drag
        this.vy *= 0.92;
        this.vy += 0.02; // Lighter Gravity
        this.life -= this.decay;
        this.size *= 0.95; // Shrink
    }

    draw(ctx) {
        if (this.life <= 0) return;
        ctx.globalAlpha = this.life;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 80%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle
        ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
        ctx.shadowBlur = 5;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1.0;
    }
}

export class Bloom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0; // Keeps track of overall bloom lifecycle
        this.particles = [];
        // Create particles
        const particleCount = 60; // More particles
        const hueBase = Math.random() > 0.5 ? 45 : 260; // Gold or Deep Purple
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new BloomParticle(x, y, hueBase + Math.random() * 40 - 20));
        }
    }

    update() {
        this.life -= 0.01;
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        // Central flash
        if (this.life > 0.8) {
            ctx.globalAlpha = (this.life - 0.8) * 5;
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
        this.particles.forEach(p => p.draw(ctx));
    }
}

export class ConstellationNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 3;
        this.opacity = 0;
        this.twinkleSpeed = Math.random() * 0.03 + 0.01;
        this.twinkleOffset = Math.random() * Math.PI;
    }

    update() {
        if (this.opacity < 1) {
            this.opacity += 0.02;
        }
    }

    draw(ctx) {
        const time = Date.now() * 0.001;
        const twinkle = Math.sin(time * 2 + this.twinkleOffset) * 0.3 + 0.7;
        const currentOpacity = this.opacity * twinkle;

        // Glow
        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 6);
        glow.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        glow.addColorStop(0.4, `rgba(200, 220, 255, ${currentOpacity * 0.5})`);
        glow.addColorStop(1, "rgba(200, 220, 255, 0)");

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 6, 0, Math.PI * 2);
        ctx.fill();

        // Core Star
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Spikes (Diamond shape)
        if (this.opacity > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity * 0.8})`;
            const spikeLen = this.radius * 4 * twinkle;
            const w = this.radius * 0.5;

            ctx.beginPath();
            // Vertical
            ctx.moveTo(this.x, this.y - spikeLen);
            ctx.quadraticCurveTo(this.x + w, this.y, this.x, this.y + spikeLen);
            ctx.quadraticCurveTo(this.x - w, this.y, this.x, this.y - spikeLen);
            // Horizontal
            ctx.moveTo(this.x - spikeLen, this.y);
            ctx.quadraticCurveTo(this.x, this.y - w, this.x + spikeLen, this.y);
            ctx.quadraticCurveTo(this.x, this.y + w, this.x - spikeLen, this.y);
            ctx.fill();
        }
    }
}
