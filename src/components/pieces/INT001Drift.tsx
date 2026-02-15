'use client';

import { useRef, useEffect } from 'react';
import { createNoise3D, type NoiseFunction3D } from 'simplex-noise';
import { PALETTE } from '@/lib/palette';

// --- Grid ---
const FONT_SIZE = 14;
const CELL_WIDTH = 14;
const CELL_HEIGHT = 20;

// --- Characters ---
// Primary: directional flow (8 directions mapped to angle)
const FLOW_CHARS = ['─', '╲', '│', '╱', '─', '╲', '│', '╱'];
// Lighter variants scattered at ~12% probability for texture within currents
const FLOW_CHARS_LIGHT = ['╌', '╲', '╎', '╱', '╌', '╲', '╎', '╱'];
// Ghost: noise floor / barely-there signal
const GHOST_CHARS = ['·', '∙', ':', '∶'];
// Block elements: only used during emergence/dissolution, not during flow
const BLOCK_CHARS = ['░', '▒'];
// Noise: dissolution static
const NOISE_CHARS = ['∴', '∶', '◦', '·'];

// --- Cycle timing (ms) ---
const PHASE_TIMINGS = {
  emergence:      5_000,
  flow:          20_000,
  turbulence:    10_000,
  dissolution:    3_000,
  terminal:       2_000,
  reacquisition:  2_000,
};

type Phase = keyof typeof PHASE_TIMINGS;
const PHASE_ORDER: Phase[] = ['emergence', 'flow', 'turbulence', 'dissolution', 'terminal', 'reacquisition'];

interface CycleState {
  phase: Phase;
  phaseStartTime: number;
  cycleStartTime: number;
  noise3D: NoiseFunction3D;
}

// --- Seeded PRNG (mulberry32) ---
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Fractal noise (3 octaves) ---
function fractalNoise(noise3D: NoiseFunction3D, x: number, y: number, z: number): number {
  let value = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxAmplitude = 0;

  for (let i = 0; i < 3; i++) {
    value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
    maxAmplitude += amplitude;
    amplitude *= 0.5;
    frequency *= 2.0;
  }

  return value / maxAmplitude;
}

// --- Core functions ---
function angleToChar(angle: number, rand: () => number): string {
  const normalised = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.round(normalised / (Math.PI / 4)) % 8;
  // ~12% chance of lighter variant for texture
  if (rand() < 0.12) return FLOW_CHARS_LIGHT[index];
  return FLOW_CHARS[index];
}

function getNoiseParams(phase: Phase, phaseProgress: number) {
  switch (phase) {
    case 'emergence':
      return {
        noiseScale: 0.025 - 0.01 * phaseProgress,  // Starts tighter, coheres to base
        zSpeed: 0.0004,
        magnitudeMultiplier: phaseProgress,
      };
    case 'flow':
      return {
        noiseScale: 0.015,                           // Base scale — broad sweeping currents
        zSpeed: 0.0004,
        magnitudeMultiplier: 1,
      };
    case 'turbulence':
      return {
        noiseScale: 0.015 + 0.025 * phaseProgress,  // Fragments toward dissolution
        zSpeed: 0.0004 + 0.002 * phaseProgress,
        magnitudeMultiplier: 1,
      };
    case 'dissolution':
      return {
        noiseScale: 0.04,
        zSpeed: 0.002,
        magnitudeMultiplier: 1 - phaseProgress * 0.9,
      };
    case 'terminal':
      return {
        noiseScale: 0.04,
        zSpeed: 0.001,
        magnitudeMultiplier: 0.05,
      };
    case 'reacquisition':
      return {
        noiseScale: 0.025 - 0.01 * phaseProgress,
        zSpeed: 0.0004,
        magnitudeMultiplier: phaseProgress * 0.5,
      };
  }
}

function getChar(angle: number, magnitude: number, phase: Phase, rand: () => number): string {
  // Dissolution/terminal: progressive dropout with noise static
  if (phase === 'dissolution' || phase === 'terminal') {
    if (rand() > magnitude * 2) {
      if (rand() < 0.08) return NOISE_CHARS[Math.floor(rand() * NOISE_CHARS.length)];
      if (rand() < 0.05) return BLOCK_CHARS[Math.floor(rand() * BLOCK_CHARS.length)];
      return ' ';
    }
  }

  // Emergence: block noise breaking into flow
  if (phase === 'emergence' && rand() < 0.15 * (1 - magnitude)) {
    return BLOCK_CHARS[Math.floor(rand() * BLOCK_CHARS.length)];
  }

  // Core thresholds — generous negative space
  if (magnitude < 0.30) return ' ';
  if (magnitude < 0.40) return GHOST_CHARS[Math.floor(rand() * GHOST_CHARS.length)];
  return angleToChar(angle, rand);
}

function getColor(magnitude: number, phase: Phase): string {
  if (phase === 'terminal' || phase === 'reacquisition') return PALETTE.textSubtle;

  if (magnitude > 0.82) return PALETTE.accent;      // Orange — rare hot streaks
  if (magnitude > 0.70) return PALETTE.amber;        // Golden amber — strong flow
  if (magnitude > 0.55) return PALETTE.amberLight;   // Amber light — medium flow
  if (magnitude > 0.40) return PALETTE.textMuted;    // Muted — quiet flow
  return PALETTE.textSubtle;                          // Ghost — barely there
}

interface PieceProps {
  width: number;
  height: number;
}

export default function INT001Drift({ width, height }: PieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const cols = Math.floor(width / CELL_WIDTH);
    const rows = Math.floor(height / CELL_HEIGHT);

    // Deterministic per-frame random for dissolution/character variation
    let frameRandSeed = 0;
    function frameRand(): number {
      frameRandSeed = (frameRandSeed * 16807 + 0) % 2147483647;
      return frameRandSeed / 2147483647;
    }

    function initCycle(timestamp: number): CycleState {
      const seed = Math.floor(Math.random() * 2147483647);
      const prng = mulberry32(seed);
      return {
        phase: 'emergence',
        phaseStartTime: timestamp,
        cycleStartTime: timestamp,
        noise3D: createNoise3D(prng),
      };
    }

    function updatePhase(state: CycleState, timestamp: number): CycleState {
      const phaseElapsed = timestamp - state.phaseStartTime;
      const phaseDuration = PHASE_TIMINGS[state.phase];

      if (phaseElapsed >= phaseDuration) {
        const currentIndex = PHASE_ORDER.indexOf(state.phase);
        if (currentIndex === PHASE_ORDER.length - 1) {
          return initCycle(timestamp);
        }
        const nextPhase = PHASE_ORDER[currentIndex + 1];
        return {
          ...state,
          phase: nextPhase,
          phaseStartTime: timestamp,
        };
      }
      return state;
    }

    let cycleState = initCycle(performance.now());
    let animationId: number;

    // Dot animation for reacquisition
    let lastDotTime = 0;
    let dotCount = 1;

    function render(timestamp: number) {
      cycleState = updatePhase(cycleState, timestamp);

      const phaseElapsed = timestamp - cycleState.phaseStartTime;
      const phaseDuration = PHASE_TIMINGS[cycleState.phase];
      const phaseProgress = Math.min(phaseElapsed / phaseDuration, 1);
      const timeOffset = (timestamp - cycleState.cycleStartTime);

      const params = getNoiseParams(cycleState.phase, phaseProgress);

      // Seed the per-frame random
      frameRandSeed = Math.floor(timestamp) % 2147483647;

      // Clear
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, width, height);

      // Font setup
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = 'top';

      // Colour batching: group cells by colour, draw each group
      const colorBuckets: Map<string, Array<{ char: string; x: number; y: number }>> = new Map();

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const nx = col * params.noiseScale;
          const ny = row * params.noiseScale;
          const nz = timeOffset * params.zSpeed;

          // Fractal noise for angle — broad sweeping currents with subtle texture
          const noiseValue = fractalNoise(cycleState.noise3D, nx, ny, nz);
          const angle = noiseValue * Math.PI * 2;

          // Separate magnitude sample at different frequency
          const magNoise = (fractalNoise(cycleState.noise3D, nx * 1.7, ny * 1.7, nz + 100) + 1) / 2;
          const magnitude = magNoise * params.magnitudeMultiplier;

          const char = getChar(angle, magnitude, cycleState.phase, frameRand);
          if (char === ' ') continue;

          const color = getColor(magnitude, cycleState.phase);
          if (!colorBuckets.has(color)) colorBuckets.set(color, []);
          colorBuckets.get(color)!.push({
            char,
            x: col * CELL_WIDTH,
            y: row * CELL_HEIGHT,
          });
        }
      }

      // Draw batched by colour
      for (const [color, cells] of colorBuckets) {
        ctx.fillStyle = color;
        for (const cell of cells) {
          ctx.fillText(cell.char, cell.x, cell.y);
        }
      }

      // Terminal message
      if (cycleState.phase === 'terminal') {
        const msg = '· · SIGNAL LOST · ·';
        ctx.fillStyle = PALETTE.textSubtle;
        ctx.font = `${FONT_SIZE}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(msg, width / 2, height / 2);
        ctx.textAlign = 'start';
      }

      // Reacquisition message
      if (cycleState.phase === 'reacquisition') {
        if (timestamp - lastDotTime > 500) {
          dotCount = (dotCount % 3) + 1;
          lastDotTime = timestamp;
        }
        const dots = Array.from({ length: dotCount }, () => '·').join(' ');
        const msg = `REACQUIRING ${dots}`;
        ctx.fillStyle = PALETTE.textSubtle;
        ctx.font = `${FONT_SIZE}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(msg, width / 2, height / 2);
        ctx.textAlign = 'start';
      }

      animationId = requestAnimationFrame(render);
    }

    animationId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animationId);
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
}
