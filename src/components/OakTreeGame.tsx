import React, { useRef, useEffect, useCallback } from 'react';
import './OakTreeGame.css';

// --- Types ---
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

interface Leaf {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  wobbleOffset: number;
}

interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
}

interface TapEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  particles: Particle[];
}

// --- Constants ---
const STAGES = ['Acorn', 'Sprout', 'Sapling', 'Young Tree', 'Mature Oak', 'Ancient Oak'];
const STAGE_THRESHOLDS = [0, 10, 30, 60, 100, 150];
const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const SEASON_DURATION = 20000; // 20 seconds per season

const SEASON_COLORS = {
  sky: [
    ['#87CEEB', '#E0F0FF'], // Spring
    ['#4A90D9', '#87CEEB'], // Summer
    ['#D4856B', '#F5DEB3'], // Autumn
    ['#8899AA', '#C0C8D0'], // Winter
  ],
  leaf: [
    ['#66BB6A', '#81C784', '#A5D6A7'], // Spring
    ['#2E7D32', '#388E3C', '#43A047'], // Summer
    ['#E65100', '#F57C00', '#FFB74D'], // Autumn
    ['#90A4AE', '#B0BEC5', '#78909C'], // Winter
  ],
  ground: [
    ['#4CAF50', '#388E3C'], // Spring
    ['#388E3C', '#2E7D32'], // Summer
    ['#8D6E63', '#6D4C41'], // Autumn
    ['#CFD8DC', '#B0BEC5'], // Winter
  ],
  sun: ['#FFD54F', '#FF8F00', '#FF6D00', '#B0BEC5'],
};

const STORAGE_KEY = 'oak_tree_game';

interface GameState {
  energy: number;
  totalTaps: number;
  startTime: number;
}

function loadGameState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { energy: 0, totalTaps: 0, startTime: Date.now() };
}

function saveGameState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function getStage(energy: number): number {
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (energy >= STAGE_THRESHOLDS[i]) return i;
  }
  return 0;
}

const OakTreeGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef({
    ...loadGameState(),
    season: 0,
    seasonTimer: 0,
    leaves: [] as Leaf[],
    clouds: [] as Cloud[],
    tapEffects: [] as TapEffect[],
    snowflakes: [] as Particle[],
    sway: 0,
    lastTime: 0,
    animId: 0,
    width: 0,
    height: 0,
  });

  const initClouds = useCallback((width: number, height: number) => {
    const g = gameRef.current;
    g.clouds = [];
    for (let i = 0; i < 3; i++) {
      g.clouds.push({
        x: Math.random() * width,
        y: 30 + Math.random() * (height * 0.2),
        width: 60 + Math.random() * 80,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.5 + Math.random() * 0.3,
      });
    }
  }, []);

  const spawnLeaf = useCallback((width: number, height: number, season: number) => {
    const colors = SEASON_COLORS.leaf[season];
    const groundY = height * 0.72;
    return {
      x: Math.random() * width,
      y: -10,
      vy: 0.5 + Math.random() * 1,
      vx: 0,
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      color: colors[Math.floor(Math.random() * colors.length)],
      wobbleOffset: Math.random() * Math.PI * 2,
    } as Leaf;
  }, []);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);

    const g = gameRef.current;
    g.energy += 1;
    g.totalTaps += 1;
    saveGameState({ energy: g.energy, totalTaps: g.totalTaps, startTime: g.startTime });

    // Spawn tap effect
    const particles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      particles.push({
        x, y,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 3,
        color: '#FFD700',
      });
    }
    g.tapEffects.push({ x, y, radius: 0, maxRadius: 40, opacity: 1, particles });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);
      gameRef.current.width = w;
      gameRef.current.height = h;
      if (gameRef.current.clouds.length === 0) initClouds(w, h);
    };

    resize();
    window.addEventListener('resize', resize);

    const g = gameRef.current;
    g.lastTime = performance.now();
    g.seasonTimer = 0;

    function drawSky(w: number, h: number, season: number) {
      const colors = SEASON_COLORS.sky[season];
      const grad = ctx!.createLinearGradient(0, 0, 0, h * 0.75);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);
    }

    function drawSun(w: number, h: number, season: number, time: number) {
      const sunX = w * 0.75 + Math.sin(time * 0.0003) * 30;
      const sunY = h * 0.12 + Math.cos(time * 0.0003) * 10;
      const sunColor = SEASON_COLORS.sun[season];
      const sunRadius = season === 3 ? 20 : 28;

      // Glow
      const glow = ctx!.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.5);
      glow.addColorStop(0, sunColor + '80');
      glow.addColorStop(1, sunColor + '00');
      ctx!.fillStyle = glow;
      ctx!.beginPath();
      ctx!.arc(sunX, sunY, sunRadius * 2.5, 0, Math.PI * 2);
      ctx!.fill();

      // Sun body
      ctx!.fillStyle = sunColor;
      ctx!.beginPath();
      ctx!.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawCloud(cloud: Cloud) {
      ctx!.fillStyle = `rgba(255,255,255,${cloud.opacity})`;
      const cx = cloud.x;
      const cy = cloud.y;
      const w = cloud.width;
      ctx!.beginPath();
      ctx!.arc(cx, cy, w * 0.22, 0, Math.PI * 2);
      ctx!.arc(cx + w * 0.2, cy - w * 0.08, w * 0.18, 0, Math.PI * 2);
      ctx!.arc(cx - w * 0.2, cy - w * 0.04, w * 0.16, 0, Math.PI * 2);
      ctx!.arc(cx + w * 0.1, cy + w * 0.06, w * 0.14, 0, Math.PI * 2);
      ctx!.fill();
    }

    function drawGround(w: number, h: number, season: number) {
      const groundY = h * 0.72;
      const colors = SEASON_COLORS.ground[season];
      const grad = ctx!.createLinearGradient(0, groundY, 0, h);
      grad.addColorStop(0, colors[0]);
      grad.addColorStop(1, colors[1]);
      ctx!.fillStyle = grad;

      // Gentle hill
      ctx!.beginPath();
      ctx!.moveTo(0, groundY + 20);
      ctx!.quadraticCurveTo(w * 0.25, groundY - 5, w * 0.5, groundY + 10);
      ctx!.quadraticCurveTo(w * 0.75, groundY + 25, w, groundY + 15);
      ctx!.lineTo(w, h);
      ctx!.lineTo(0, h);
      ctx!.closePath();
      ctx!.fill();

      // Grass tufts (spring/summer)
      if (season < 2) {
        ctx!.strokeStyle = '#66BB6A';
        ctx!.lineWidth = 1.5;
        for (let i = 0; i < 20; i++) {
          const gx = (w / 20) * i + 10;
          const gy = groundY + 15 + Math.sin(i * 1.3) * 5;
          ctx!.beginPath();
          ctx!.moveTo(gx, gy);
          ctx!.quadraticCurveTo(gx - 3, gy - 8, gx - 1, gy - 12);
          ctx!.stroke();
          ctx!.beginPath();
          ctx!.moveTo(gx, gy);
          ctx!.quadraticCurveTo(gx + 3, gy - 9, gx + 2, gy - 11);
          ctx!.stroke();
        }
      }
    }

    function drawAcorn(cx: number, cy: number, sway: number) {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(sway * 0.02);

      // Acorn cap
      ctx!.fillStyle = '#795548';
      ctx!.beginPath();
      ctx!.ellipse(0, -8, 10, 6, 0, Math.PI, 0);
      ctx!.fill();

      // Cap texture
      ctx!.strokeStyle = '#5D4037';
      ctx!.lineWidth = 0.5;
      for (let i = -8; i <= 8; i += 3) {
        ctx!.beginPath();
        ctx!.moveTo(i, -10);
        ctx!.lineTo(i, -6);
        ctx!.stroke();
      }

      // Acorn body
      ctx!.fillStyle = '#A1887F';
      ctx!.beginPath();
      ctx!.ellipse(0, 2, 9, 12, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Highlight
      ctx!.fillStyle = 'rgba(255,255,255,0.2)';
      ctx!.beginPath();
      ctx!.ellipse(-3, -1, 3, 6, -0.2, 0, Math.PI * 2);
      ctx!.fill();

      // Stem
      ctx!.strokeStyle = '#5D4037';
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(0, -14);
      ctx!.lineTo(0, -18);
      ctx!.stroke();

      ctx!.restore();
    }

    function drawTree(stage: number, cx: number, groundY: number, sway: number, season: number) {
      if (stage === 0) {
        drawAcorn(cx, groundY - 5, sway);
        return;
      }

      ctx!.save();
      ctx!.translate(cx, groundY);

      // Sway at base
      const swayAngle = Math.sin(sway) * (0.02 / stage);
      ctx!.rotate(swayAngle);

      const trunkW = 3 + stage * 7;
      const trunkH = 15 + stage * 28;

      // Roots (stage 3+)
      if (stage >= 3) {
        ctx!.strokeStyle = '#5D4037';
        ctx!.lineWidth = 2 + stage * 0.5;
        for (let i = -1; i <= 1; i += 1) {
          ctx!.beginPath();
          ctx!.moveTo(i * trunkW * 0.3, 0);
          ctx!.quadraticCurveTo(
            i * trunkW * 1.2, 8,
            i * trunkW * 1.5, 15
          );
          ctx!.stroke();
        }
      }

      // Trunk
      const trunkGrad = ctx!.createLinearGradient(-trunkW / 2, 0, trunkW / 2, 0);
      trunkGrad.addColorStop(0, '#5D4037');
      trunkGrad.addColorStop(0.3, '#795548');
      trunkGrad.addColorStop(0.7, '#6D4C41');
      trunkGrad.addColorStop(1, '#4E342E');
      ctx!.fillStyle = trunkGrad;

      // Tapered trunk
      ctx!.beginPath();
      ctx!.moveTo(-trunkW / 2, 0);
      ctx!.lineTo(-trunkW / 3, -trunkH);
      ctx!.lineTo(trunkW / 3, -trunkH);
      ctx!.lineTo(trunkW / 2, 0);
      ctx!.closePath();
      ctx!.fill();

      // Bark texture
      ctx!.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx!.lineWidth = 1;
      for (let i = 0; i < stage * 2; i++) {
        const by = -Math.random() * trunkH;
        const bx = (Math.random() - 0.5) * trunkW * 0.4;
        ctx!.beginPath();
        ctx!.moveTo(bx - 3, by);
        ctx!.lineTo(bx + 3, by + 5);
        ctx!.stroke();
      }

      // Branches (stage 2+)
      if (stage >= 2) {
        const branchCount = Math.min(stage * 2, 8);
        ctx!.strokeStyle = '#5D4037';

        for (let i = 0; i < branchCount; i++) {
          const startY = -trunkH * (0.4 + (i / branchCount) * 0.5);
          const side = i % 2 === 0 ? -1 : 1;
          const len = 15 + stage * 8 + Math.random() * 10;
          const angle = side * (0.4 + Math.random() * 0.4);

          ctx!.lineWidth = 1.5 + stage * 0.5;
          ctx!.beginPath();
          ctx!.moveTo(0, startY);
          ctx!.quadraticCurveTo(
            side * len * 0.5, startY - len * 0.3,
            side * len * Math.cos(angle), startY - len * Math.sin(0.5)
          );
          ctx!.stroke();
        }
      }

      // Canopy (stage 1+)
      if (stage >= 1) {
        const leafColors = SEASON_COLORS.leaf[season];
        const canopyRadius = 8 + stage * 16;
        const canopyY = -trunkH - canopyRadius * 0.4;
        const numCircles = 2 + stage * 3;

        // Shadow under canopy
        ctx!.fillStyle = 'rgba(0,0,0,0.05)';
        ctx!.beginPath();
        ctx!.ellipse(0, 5, canopyRadius * 1.2, 8, 0, 0, Math.PI * 2);
        ctx!.fill();

        // Draw leaf clusters
        for (let i = 0; i < numCircles; i++) {
          const angle = (Math.PI * 2 * i) / numCircles + sway * 0.01;
          const dist = canopyRadius * 0.4 * (0.3 + Math.random() * 0.7);
          const lx = Math.cos(angle) * dist;
          const ly = canopyY + Math.sin(angle) * dist * 0.6;
          const lr = canopyRadius * (0.4 + Math.random() * 0.3);

          // Winter: fewer, transparent circles
          if (season === 3) {
            ctx!.fillStyle = leafColors[i % leafColors.length] + '40';
          } else {
            ctx!.fillStyle = leafColors[i % leafColors.length];
          }
          ctx!.beginPath();
          ctx!.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx!.fill();
        }

        // Center canopy mass
        if (season !== 3) {
          ctx!.fillStyle = leafColors[1];
          ctx!.beginPath();
          ctx!.arc(0, canopyY, canopyRadius * 0.55, 0, Math.PI * 2);
          ctx!.fill();
        }

        // Spring flowers
        if (season === 0 && stage >= 3) {
          ctx!.fillStyle = '#F8BBD0';
          for (let i = 0; i < 8; i++) {
            const fx = (Math.random() - 0.5) * canopyRadius * 1.4;
            const fy = canopyY + (Math.random() - 0.5) * canopyRadius * 0.8;
            ctx!.beginPath();
            ctx!.arc(fx, fy, 2.5, 0, Math.PI * 2);
            ctx!.fill();
          }
        }
      }

      // Sprout detail (stage 1)
      if (stage === 1) {
        // Two small starter leaves
        ctx!.fillStyle = '#81C784';
        ctx!.save();
        ctx!.translate(0, -trunkH);
        // Left leaf
        ctx!.beginPath();
        ctx!.ellipse(-6, -4, 5, 3, -0.5, 0, Math.PI * 2);
        ctx!.fill();
        // Right leaf
        ctx!.beginPath();
        ctx!.ellipse(6, -4, 5, 3, 0.5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      ctx!.restore();
    }

    function drawLeafParticle(leaf: Leaf) {
      ctx!.save();
      ctx!.translate(leaf.x, leaf.y);
      ctx!.rotate(leaf.rotation);
      ctx!.fillStyle = leaf.color;

      // Leaf shape
      ctx!.beginPath();
      ctx!.ellipse(0, 0, leaf.size, leaf.size * 0.5, 0, 0, Math.PI * 2);
      ctx!.fill();

      // Vein
      ctx!.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx!.lineWidth = 0.5;
      ctx!.beginPath();
      ctx!.moveTo(-leaf.size, 0);
      ctx!.lineTo(leaf.size, 0);
      ctx!.stroke();

      ctx!.restore();
    }

    function drawHUD(w: number, h: number, energy: number, stage: number, season: number) {
      // Energy display
      ctx!.fillStyle = 'rgba(0,0,0,0.4)';
      ctx!.beginPath();
      const hudX = 12, hudY = 10;
      roundRect(ctx!, hudX, hudY, 140, 60, 10);
      ctx!.fill();

      ctx!.fillStyle = '#FFF';
      ctx!.font = 'bold 16px sans-serif';
      ctx!.fillText(`Energy: ${Math.floor(energy)}`, hudX + 12, hudY + 22);

      ctx!.font = '13px sans-serif';
      ctx!.fillStyle = '#FFD700';
      ctx!.fillText(STAGES[stage], hudX + 12, hudY + 40);

      ctx!.fillStyle = '#B3E5FC';
      ctx!.fillText(SEASONS[season], hudX + 12, hudY + 54);

      // Next stage progress
      if (stage < 5) {
        const nextThreshold = STAGE_THRESHOLDS[stage + 1];
        const prevThreshold = STAGE_THRESHOLDS[stage];
        const progress = (energy - prevThreshold) / (nextThreshold - prevThreshold);

        ctx!.fillStyle = 'rgba(0,0,0,0.4)';
        ctx!.beginPath();
        roundRect(ctx!, w - 152, hudY, 140, 30, 10);
        ctx!.fill();

        // Progress bar bg
        ctx!.fillStyle = 'rgba(255,255,255,0.2)';
        ctx!.beginPath();
        roundRect(ctx!, w - 142, hudY + 8, 120, 14, 7);
        ctx!.fill();

        // Progress bar fill
        ctx!.fillStyle = '#66BB6A';
        ctx!.beginPath();
        roundRect(ctx!, w - 142, hudY + 8, 120 * Math.min(progress, 1), 14, 7);
        ctx!.fill();
      }

      // Tap hint (only at start)
      if (energy < 3) {
        const pulse = Math.sin(performance.now() * 0.005) * 0.3 + 0.7;
        ctx!.fillStyle = `rgba(255,255,255,${pulse})`;
        ctx!.font = '18px sans-serif';
        ctx!.textAlign = 'center';
        ctx!.fillText('Tap to grow your oak!', w / 2, h * 0.55);
        ctx!.textAlign = 'start';
      }
    }

    function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
      c.moveTo(x + r, y);
      c.lineTo(x + w - r, y);
      c.arcTo(x + w, y, x + w, y + r, r);
      c.lineTo(x + w, y + h - r);
      c.arcTo(x + w, y + h, x + w - r, y + h, r);
      c.lineTo(x + r, y + h);
      c.arcTo(x, y + h, x, y + h - r, r);
      c.lineTo(x, y + r);
      c.arcTo(x, y, x + r, y, r);
    }

    function update(time: number) {
      const g = gameRef.current;
      const dt = Math.min(time - g.lastTime, 50); // cap delta
      g.lastTime = time;

      const w = g.width;
      const h = g.height;
      if (w === 0 || h === 0) {
        g.animId = requestAnimationFrame(update);
        return;
      }

      const groundY = h * 0.72;

      // Auto energy
      g.energy += 0.1 * (dt / 1000);

      // Season cycle
      g.seasonTimer += dt;
      if (g.seasonTimer >= SEASON_DURATION) {
        g.seasonTimer = 0;
        g.season = (g.season + 1) % 4;
      }

      // Sway
      g.sway = time * 0.001;

      const stage = getStage(g.energy);

      // Spawn falling leaves
      const leafRate = g.season === 2 ? 0.08 : g.season === 3 ? 0.01 : 0.03;
      if (stage >= 2 && Math.random() < leafRate) {
        g.leaves.push(spawnLeaf(w, h, g.season));
      }

      // Update leaves
      g.leaves = g.leaves.filter(l => {
        l.y += l.vy;
        l.x += Math.sin(l.wobbleOffset + l.y * 0.02) * 0.5;
        l.rotation += l.rotSpeed;
        return l.y < groundY + 20;
      });
      // Limit leaf count
      if (g.leaves.length > 50) g.leaves = g.leaves.slice(-50);

      // Spawn snowflakes in winter
      if (g.season === 3 && Math.random() < 0.1) {
        g.snowflakes.push({
          x: Math.random() * w,
          y: -5,
          vx: (Math.random() - 0.5) * 0.5,
          vy: 0.5 + Math.random() * 1,
          life: 1,
          maxLife: 1,
          size: 1.5 + Math.random() * 2.5,
          color: '#FFF',
        });
      }
      g.snowflakes = g.snowflakes.filter(s => {
        s.y += s.vy;
        s.x += s.vx + Math.sin(s.y * 0.01) * 0.3;
        return s.y < h;
      });
      if (g.snowflakes.length > 80) g.snowflakes = g.snowflakes.slice(-80);

      // Update clouds
      g.clouds.forEach(c => {
        c.x += c.speed;
        if (c.x > w + c.width) c.x = -c.width;
      });

      // Update tap effects
      g.tapEffects = g.tapEffects.filter(t => {
        t.radius += 2;
        t.opacity -= 0.03;
        t.particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.life -= 0.03;
        });
        t.particles = t.particles.filter(p => p.life > 0);
        return t.opacity > 0;
      });

      // Save periodically (every ~2 seconds)
      if (Math.random() < 0.03) {
        saveGameState({ energy: g.energy, totalTaps: g.totalTaps, startTime: g.startTime });
      }

      // --- RENDER ---
      const dpr = window.devicePixelRatio || 1;
      ctx!.save();
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      drawSky(w, h, g.season);
      drawSun(w, h, g.season, time);

      // Clouds
      g.clouds.forEach(c => drawCloud(c));

      // Snow (behind tree)
      g.snowflakes.forEach(s => {
        ctx!.fillStyle = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx!.fill();
      });

      drawGround(w, h, g.season);

      // Falling leaves (behind tree)
      g.leaves.forEach(l => drawLeafParticle(l));

      // Tree
      drawTree(stage, w / 2, groundY + 10, g.sway, g.season);

      // Tap effects
      g.tapEffects.forEach(t => {
        // Ring
        ctx!.strokeStyle = `rgba(255,215,0,${t.opacity})`;
        ctx!.lineWidth = 2;
        ctx!.beginPath();
        ctx!.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx!.stroke();

        // +1 text floating up
        ctx!.fillStyle = `rgba(255,215,0,${t.opacity})`;
        ctx!.font = 'bold 16px sans-serif';
        ctx!.fillText('+1', t.x + 10, t.y - t.radius);

        // Particles
        t.particles.forEach(p => {
          ctx!.fillStyle = `rgba(255,215,0,${p.life})`;
          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx!.fill();
        });
      });

      // HUD
      drawHUD(w, h, g.energy, stage, g.season);

      ctx!.restore();

      g.animId = requestAnimationFrame(update);
    }

    g.animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(g.animId);
      saveGameState({ energy: g.energy, totalTaps: g.totalTaps, startTime: g.startTime });
    };
  }, [initClouds, spawnLeaf]);

  return (
    <div ref={containerRef} className="oak-game-container">
      <canvas
        ref={canvasRef}
        className="oak-game-canvas"
        onClick={handleTap}
        onTouchStart={handleTap}
      />
    </div>
  );
};

export default OakTreeGame;
