export class Ripple {
    constructor(x, y, isPulse = false) {
        this.x = x;
        this.y = y;
        this.isPulse = isPulse;
        this.radius = 0;
        this.maxRadius = isPulse ? 400 : 180;
        this.speed = isPulse ? 1.0 : 1.8;
        this.opacity = isPulse ? 0.6 : 1.0;
        this.lineWidth = isPulse ? 2 : 4;
    }

    update() {
        this.radius += this.speed;
        if (this.opacity > 0) this.opacity -= 0.01;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

        // Enhance style with gradient stroke
        const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.8, this.x, this.y, this.radius);
        grad.addColorStop(0, `rgba(255, 255, 255, 0)`);
        grad.addColorStop(1, `rgba(255, 255, 255, ${this.opacity})`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = this.lineWidth;

        if (this.isPulse) {
            ctx.setLineDash([5, 15]);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Double ring for non-pulse
        if (!this.isPulse) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius * 0.9, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.closePath();
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
    }

    nudge(sourceX, sourceY) {
        this.energy = Math.min(this.maxEnergy, this.energy + 1);
        const angle = Math.atan2(this.y - sourceY, this.x - sourceX);
        this.vx += Math.cos(angle) * 0.5;
        this.vy += Math.sin(angle) * 0.5;
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
        this.angle += 0.05;
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
        const glow = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, displayRadius * 3);

        const r = 200 + (this.energy * 15);
        const g = 220 + (this.energy * 5);
        const b = 255;

        glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 + this.energy * 0.05})`);
        glow.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.3 + this.energy * 0.05})`);
        glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, displayRadius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.fillStyle = "#fff";
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

class BloomParticle {
    constructor(x, y, hue) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.01 + 0.005;
        this.size = Math.random() * 2 + 1;
        this.hue = hue;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= 0.95; // Drag
        this.vy *= 0.95;
        this.vy += 0.05; // Gravity
        this.life -= this.decay;
    }

    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = `hsl(${this.hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
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
        const particleCount = 40;
        const hueBase = Math.random() > 0.5 ? 45 : 280; // Gold or Purple
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new BloomParticle(x, y, hueBase + Math.random() * 20));
        }
    }

    update() {
        this.life -= 0.005;
        this.particles.forEach(p => p.update());
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
    }
}

export class ConstellationNode {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 2;
        this.opacity = 0; // Start invisible and fade in
        this.twinkleSpeed = Math.random() * 0.01 + 0.005;
        this.twinkleOffset = Math.random() * Math.PI;
    }

    update() {
        // Fade in
        if (this.opacity < 1) {
            this.opacity += 0.01;
        }
    }

    draw(ctx) {
        // Calculate twinkle effect
        const twinkleFactor = Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset);
        const twinkleOpacity = this.opacity * (0.6 + twinkleFactor * 0.4);

        ctx.beginPath();
        const glow = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 4);
        glow.addColorStop(0, `rgba(220, 240, 255, ${twinkleOpacity})`);
        glow.addColorStop(1, "rgba(220, 240, 255, 0)");

        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, this.radius * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw Star Spike (Cross)
        if (this.opacity > 0.5) {
            ctx.globalAlpha = twinkleOpacity * 0.8;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
            ctx.lineWidth = 1;
            const spikeLen = this.radius * 3 * (1 + twinkleFactor * 0.5);

            ctx.beginPath();
            ctx.moveTo(this.x - spikeLen, this.y);
            ctx.lineTo(this.x + spikeLen, this.y);
            ctx.moveTo(this.x, this.y - spikeLen);
            ctx.lineTo(this.x, this.y + spikeLen);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }

        // Core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
