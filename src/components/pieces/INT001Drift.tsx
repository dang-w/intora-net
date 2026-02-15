'use client';

import { useRef, useEffect } from 'react';
import { createNoise3D, type NoiseFunction3D } from 'simplex-noise';
import { PALETTE } from '@/lib/palette';

// --- Grid ---
const FONT_SIZE = 14;
const CELL_WIDTH = 14;
const CELL_HEIGHT = 20;

// --- Characters ---
const FLOW_CHARS = ['─', '╲', '│', '╱', '─', '╲', '│', '╱'];
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

// --- Core functions ---
function angleToChar(angle: number): string {
  const normalised = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const index = Math.round(normalised / (Math.PI / 4)) % 8;
  return FLOW_CHARS[index];
}

function getNoiseParams(phase: Phase, phaseProgress: number) {
  switch (phase) {
    case 'emergence':
      return {
        noiseScale: 0.06 - 0.03 * phaseProgress,  // High → low (patterns cohere)
        zSpeed: 0.0005,
        magnitudeMultiplier: phaseProgress,          // Fade in
      };
    case 'flow':
      return {
        noiseScale: 0.03,
        zSpeed: 0.0005,
        magnitudeMultiplier: 1,
      };
    case 'turbulence':
      return {
        noiseScale: 0.03 + 0.04 * phaseProgress,   // Patterns fragment
        zSpeed: 0.0005 + 0.002 * phaseProgress,     // Speed increases
        magnitudeMultiplier: 1,
      };
    case 'dissolution':
      return {
        noiseScale: 0.07,
        zSpeed: 0.002,
        magnitudeMultiplier: 1 - phaseProgress * 0.9,  // Fade out
      };
    case 'terminal':
      return {
        noiseScale: 0.07,
        zSpeed: 0.001,
        magnitudeMultiplier: 0.05,
      };
    case 'reacquisition':
      return {
        noiseScale: 0.06 - 0.03 * phaseProgress,
        zSpeed: 0.0005,
        magnitudeMultiplier: phaseProgress * 0.5,
      };
  }
}

function getChar(angle: number, magnitude: number, phase: Phase, rand: () => number): string {
  // Dissolution dropout
  if (phase === 'dissolution' || phase === 'terminal') {
    if (rand() > magnitude * 2) {
      return rand() < 0.1 ? NOISE_CHARS[Math.floor(rand() * NOISE_CHARS.length)] : ' ';
    }
  }

  if (magnitude < 0.15) return ' ';
  if (magnitude < 0.25) return '·';
  if (magnitude < 0.35) return '░';
  if (magnitude < 0.45) return '▒';
  return angleToChar(angle);
}

function getColor(magnitude: number, phase: Phase): string {
  if (phase === 'terminal' || phase === 'reacquisition') return PALETTE.textSubtle;

  if (magnitude > 0.8) return PALETTE.accent;
  if (magnitude > 0.6) return PALETTE.amber;
  if (magnitude > 0.4) return PALETTE.amberLight;
  if (magnitude > 0.25) return PALETTE.textMuted;
  return PALETTE.textSubtle;
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

    // Deterministic per-frame random for dissolution effects
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
          // End of reacquisition → new cycle
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
          const x = col * params.noiseScale;
          const y = row * params.noiseScale;
          const z = timeOffset * params.zSpeed;

          const noiseValue = cycleState.noise3D(x, y, z);
          const angle = noiseValue * Math.PI * 2;

          const magNoise = (cycleState.noise3D(x * 2, y * 2, z + 100) + 1) / 2;
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
