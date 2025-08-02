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
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.lineWidth = this.lineWidth;
        if (this.isPulse) {
            ctx.setLineDash([5, 15]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
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
    }

    draw(ctx) {
        ctx.beginPath();
        const displayRadius = this.radius + this.energy * 2;
        const glow = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, displayRadius * 2);
        glow.addColorStop(0, `rgba(255, 255, 255, ${0.5 + this.energy * 0.15})`);
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, displayRadius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class Bloom {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 1.0;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        this.life -= 0.008;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + (1 - this.life) * 0.5);
        for (let i = 0; i < 6; i++) {
            const length = 50 + (1 - this.life) * 100;
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(length, 0);
            ctx.strokeStyle = `rgba(255, 220, 180, ${this.life * 0.8})`;
            ctx.lineWidth = 3 * this.life;
            ctx.stroke();
        }
        ctx.restore();
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
        const twinkleOpacity = this.opacity * (0.6 + Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset) * 0.4);

        ctx.beginPath();
        const glow = ctx.createRadialGradient(this.x, this.y, 1, this.x, this.y, this.radius * 3);
        glow.addColorStop(0, `rgba(220, 240, 255, ${twinkleOpacity})`);
        glow.addColorStop(1, "rgba(220, 240, 255, 0)");

        ctx.fillStyle = glow;
        ctx.arc(this.x, this.y, this.radius * 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
