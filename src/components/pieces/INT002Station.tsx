'use client';

import { useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { PALETTE } from '@/lib/palette';
import { useAudio } from '@/lib/audioContext';

// --- Grid ---
const FONT_SIZE = 14;
const CELL_WIDTH = 14;
const CELL_HEIGHT = 20;

// --- Number station format ---
const GROUP_SIZE = 5;        // Classic 5-digit groups
const GROUP_GAP = 1;         // 1 cell gap between groups
const ROW_GAP = 1;           // 1 empty row between transmission rows
const CHROME_ROWS = 2;       // Reserved bottom rows for status line

// --- Digit change rate ---
const DIGIT_CHANGE_INTERVAL = 80; // ms — readable flicker (~12 changes/sec)

// --- Cycle timing (ms) ---
const PHASE_TIMINGS = {
  scanning:      6_000,
  lock:          5_000,
  transmission: 12_000,
  decode:        8_000,
  corruption:    6_000,
  lost:          5_000,
};

type Phase = keyof typeof PHASE_TIMINGS;
const PHASE_ORDER: Phase[] = ['scanning', 'lock', 'transmission', 'decode', 'corruption', 'lost'];

// --- Decoded messages ---
interface DecodedMessage {
  type: 'coordinates' | 'designation' | 'phrase';
  raw: string;
  groups: number;
}

const MESSAGES: DecodedMessage[] = [
  // Coordinates (real Cold War sites)
  { type: 'coordinates', raw: '52.5163N  13.3777E', groups: 24 },  // Brandenburg Gate, Berlin
  { type: 'coordinates', raw: '51.9975N  1.1346W',  groups: 24 },  // Bletchley Park
  { type: 'coordinates', raw: '56.1304N  40.4067E', groups: 24 },  // UVB-76 transmitter
  { type: 'coordinates', raw: '59.9311N  30.3609E', groups: 24 },  // Leningrad
  { type: 'coordinates', raw: '38.8977N  77.0365W', groups: 24 },  // Washington DC
  { type: 'coordinates', raw: '48.1375N  11.5755E', groups: 24 },  // Munich, Radio Free Europe

  // Designations
  { type: 'designation', raw: 'ECHO  7  CONFIRMED',       groups: 18 },
  { type: 'designation', raw: 'CARDINAL  ACTIVE',          groups: 16 },
  { type: 'designation', raw: 'NIGHTWATCH  STANDING  BY',  groups: 20 },
  { type: 'designation', raw: 'FULCRUM  STATUS  RED',      groups: 18 },
  { type: 'designation', raw: 'OPUS  3  TERMINATED',       groups: 18 },

  // Phrases
  { type: 'phrase', raw: 'THE  WATER  REMEMBERS',   groups: 20 },
  { type: 'phrase', raw: 'ALL  SIGNALS  ARE  FINAL', groups: 22 },
  { type: 'phrase', raw: 'VERIFY  AT  DAWN',         groups: 16 },
  { type: 'phrase', raw: 'THE  PATTERN  HOLDS',      groups: 18 },
  { type: 'phrase', raw: 'NOTHING  IS  LOST',        groups: 16 },
];

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

// --- Chrome helpers ---
function progressBar(progress: number, width: number = 12): string {
  const filled = Math.floor(progress * width);
  return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
}

function animatedDots(timestamp: number, interval: number = 500): string {
  const count = (Math.floor(timestamp / interval) % 3) + 1;
  return '.'.repeat(count) + ' '.repeat(3 - count);
}

// --- Types ---
interface CycleState {
  phase: Phase;
  phaseStartTime: number;
  cycleStartTime: number;
  seed: number;
  rand: () => number;
  message: DecodedMessage;
  transmissionGroups: string[][];
}

interface TransmissionLayout {
  groupsPerRow: number;
  totalRows: number;
  startRow: number;
  startCol: number;
  groupPositions: Array<{ row: number; col: number }>;
}

interface PieceProps {
  width: number;
  height: number;
  fps?: number;
}

export default function INT002Station({ width, height, fps }: PieceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isMuted, isAudioReady } = useAudio();
  const isMutedRef = useRef(isMuted);
  const isAudioReadyRef = useRef(isAudioReady);

  // Keep refs in sync without triggering re-renders
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isAudioReadyRef.current = isAudioReady; }, [isAudioReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const cols = Math.floor(width / CELL_WIDTH);
    const rows = Math.floor(height / CELL_HEIGHT);
    const mainRows = rows - CHROME_ROWS;
    const totalCells = cols * mainRows;

    // --- Cell state arrays ---
    let cellDigits = new Array(totalCells).fill(0);
    let cellFrozen = new Array(totalCells).fill(false);
    let cellVisible = new Array(totalCells).fill(true);

    // --- Per-frame random (fast, non-seeded) ---
    let frameRandSeed = 0;
    function frameRand(): number {
      frameRandSeed = (frameRandSeed * 16807 + 0) % 2147483647;
      return frameRandSeed / 2147483647;
    }

    // --- Audio engine (Tone.js) ---
    // Master gain → controls mute/unmute
    const masterGain = new Tone.Gain(0).toDestination();

    // Static channel: Noise → BandpassFilter → AM gain → staticGain → master
    const noise = new Tone.Noise('white');
    const bandpass = new Tone.BiquadFilter(2000, 'bandpass');
    bandpass.Q.value = 1.5;
    const amGain = new Tone.Gain(1); // AM modulation target
    const amLFO = new Tone.LFO('4n', 0.3, 1);
    const staticGain = new Tone.Gain(0.35);
    noise.connect(bandpass);
    bandpass.connect(amGain);
    amLFO.connect(amGain.gain);
    amGain.connect(staticGain);
    staticGain.connect(masterGain);

    // Carrier channel: Oscillator → oscGain → master
    const carrier = new Tone.Oscillator(440, 'sine');
    const oscGain = new Tone.Gain(0);
    carrier.connect(oscGain);
    oscGain.connect(masterGain);

    // Beep channel: Oscillator → beepGain → master
    const beepOsc = new Tone.Oscillator(880, 'sine');
    const beepGain = new Tone.Gain(0);
    beepOsc.connect(beepGain);
    beepGain.connect(masterGain);

    let audioStarted = false;
    let lastBeepGroup = -1; // Track which group triggered the last beep

    function startAudioNodes() {
      if (audioStarted) return;
      audioStarted = true;
      noise.start();
      amLFO.start();
      carrier.start();
      beepOsc.start();
    }

    function updateAudio(phase: Phase, phaseProgress: number, groupsRevealed: number) {
      // Start nodes on first audio-ready frame
      if (isAudioReadyRef.current && !audioStarted) {
        startAudioNodes();
      }

      // Master mute
      const targetMaster = isMutedRef.current ? 0 : 0.6;
      masterGain.gain.rampTo(targetMaster, 0.1);

      if (!audioStarted) return;

      const now = Tone.now();

      switch (phase) {
        case 'scanning':
          // Shortwave static dominates. Bandpass sweeps slowly.
          staticGain.gain.rampTo(0.35, 0.3);
          bandpass.frequency.rampTo(1500 + Math.sin(now * 0.7) * 800, 0.1);
          bandpass.Q.rampTo(1.5 + Math.sin(now * 1.3) * 0.5, 0.1);
          amLFO.frequency.rampTo(3 + Math.sin(now * 0.4) * 2, 0.2);
          oscGain.gain.rampTo(0, 0.3);
          break;

        case 'lock': {
          // Static reduces, carrier fades in (detuned → locks)
          staticGain.gain.rampTo(0.25 - phaseProgress * 0.1, 0.2);
          bandpass.frequency.rampTo(2000, 0.3);
          bandpass.Q.rampTo(2, 0.3);
          amLFO.frequency.rampTo(2, 0.3);
          // Carrier: starts detuned, locks to 440Hz
          const detune = (1 - phaseProgress) * 30;
          carrier.frequency.rampTo(440 + detune, 0.2);
          oscGain.gain.rampTo(phaseProgress * 0.08, 0.3);
          break;
        }

        case 'transmission':
          // Low static, steady carrier, beep markers per group
          staticGain.gain.rampTo(0.08, 0.5);
          bandpass.frequency.rampTo(2500, 0.5);
          bandpass.Q.rampTo(3, 0.5);
          amLFO.frequency.rampTo(1, 0.5);
          carrier.frequency.rampTo(440, 0.2);
          oscGain.gain.rampTo(0.06, 0.3);

          // Beep marker when a new group is revealed
          if (groupsRevealed > lastBeepGroup && groupsRevealed > 0) {
            lastBeepGroup = groupsRevealed;
            beepGain.gain.setValueAtTime(0.12, now);
            beepGain.gain.linearRampToValueAtTime(0, now + 0.08);
          }
          break;

        case 'decode':
          // Carrier pitch rises, static shifts
          staticGain.gain.rampTo(0.06, 0.3);
          bandpass.frequency.rampTo(3000 + phaseProgress * 1000, 0.2);
          carrier.frequency.rampTo(440 + phaseProgress * 220, 0.2);
          oscGain.gain.rampTo(0.07 + phaseProgress * 0.03, 0.2);
          break;

        case 'corruption':
          // Chaotic modulation, carrier warps, static surges
          staticGain.gain.rampTo(0.15 + phaseProgress * 0.25, 0.2);
          bandpass.frequency.rampTo(1800 + Math.sin(now * 5) * 1000, 0.05);
          bandpass.Q.rampTo(1 + Math.sin(now * 3) * 2, 0.1);
          amLFO.frequency.rampTo(6 + phaseProgress * 8, 0.1);
          carrier.frequency.rampTo(440 + Math.sin(now * 2.5) * 100 * phaseProgress, 0.05);
          oscGain.gain.rampTo(0.1 * (1 - phaseProgress), 0.2);
          break;

        case 'lost':
          // Fade to silence
          staticGain.gain.rampTo(0.02 * (1 - phaseProgress), 0.3);
          oscGain.gain.rampTo(0, 0.5);
          break;
      }
    }

    // --- Transmission layout calculation ---
    function calcTransmissionLayout(message: DecodedMessage): TransmissionLayout {
      const groupCellWidth = GROUP_SIZE + GROUP_GAP;
      const margin = 4;
      const groupsPerRow = Math.max(1, Math.floor((cols - margin * 2) / groupCellWidth));
      const totalGroupRows = Math.ceil(message.groups / groupsPerRow);
      const totalRows = totalGroupRows + (totalGroupRows - 1) * ROW_GAP;
      const startRow = Math.floor((mainRows - totalRows) / 2);
      const usedWidth = groupsPerRow * groupCellWidth - GROUP_GAP;
      const startCol = Math.floor((cols - usedWidth) / 2);

      const groupPositions: Array<{ row: number; col: number }> = [];
      for (let g = 0; g < message.groups; g++) {
        const gRow = Math.floor(g / groupsPerRow);
        const gCol = g % groupsPerRow;
        groupPositions.push({
          row: startRow + gRow * (1 + ROW_GAP),
          col: startCol + gCol * groupCellWidth,
        });
      }

      return { groupsPerRow, totalRows, startRow, startCol, groupPositions };
    }

    // --- Cycle management ---
    let transmissionLayout: TransmissionLayout;

    function initCycle(timestamp: number): CycleState {
      const seed = Math.floor(Math.random() * 2147483647);
      const rand = mulberry32(seed);

      const messageIndex = Math.floor(rand() * MESSAGES.length);
      const message = MESSAGES[messageIndex];

      const transmissionGroups: string[][] = [];
      for (let g = 0; g < message.groups; g++) {
        const group: string[] = [];
        for (let d = 0; d < GROUP_SIZE; d++) {
          group.push(String(Math.floor(rand() * 10)));
        }
        transmissionGroups.push(group);
      }

      // Reset cell state
      for (let i = 0; i < totalCells; i++) {
        cellDigits[i] = Math.floor(rand() * 10);
        cellFrozen[i] = false;
        cellVisible[i] = true;
      }

      transmissionLayout = calcTransmissionLayout(message);
      lastBeepGroup = -1;

      return {
        phase: 'scanning',
        phaseStartTime: timestamp,
        cycleStartTime: timestamp,
        seed,
        rand,
        message,
        transmissionGroups,
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

    // --- Radial gradient colours (graduated clearing around groups) ---
    // From inner (near group) to outer (normal noise)
    const GRADIENT = [
      '#252019',  // 0–1 cells: near-invisible
      '#2D2720',  // 1–2 cells: very dark
      '#3A3228',  // 2–3 cells: dark
      '#4D4438',  // 3–4 cells: medium-dark
      '#6A6050',  // 4–5 cells: approaching subtle
      PALETTE.textSubtle, // 5+ cells: normal noise
    ];

    function gradientColorForDistance(dist: number): string {
      if (dist < 1) return GRADIENT[0];
      if (dist < 2) return GRADIENT[1];
      if (dist < 3) return GRADIENT[2];
      if (dist < 4) return GRADIENT[3];
      if (dist < 5) return GRADIENT[4];
      return GRADIENT[5];
    }

    // --- Compute min distance from a cell to any revealed group center ---
    function minDistToGroup(
      cellRow: number,
      cellCol: number,
      layout: TransmissionLayout,
      numGroupsRevealed: number,
    ): number {
      let minDist = Infinity;
      for (let g = 0; g < numGroupsRevealed; g++) {
        const pos = layout.groupPositions[g];
        if (!pos) continue;
        // Group center (middle of the 5-digit group)
        const gRow = pos.row;
        const gCol = pos.col + 2; // center of 5 digits
        const dr = cellRow - gRow;
        const dc = cellCol - gCol;
        const dist = Math.sqrt(dr * dr + dc * dc);
        if (dist < minDist) minDist = dist;
      }
      return minDist;
    }

    // --- Determine cell colour for each phase ---
    function getCellColor(
      phase: Phase,
      phaseProgress: number,
      cellIndex: number,
      isFrozen: boolean,
      isInTransmissionZone: boolean,
      isDecoded: boolean,
      isDecoding: boolean,
      distToGroup: number,
      isBlinkOff: boolean,
    ): string {
      switch (phase) {
        case 'scanning':
          return frameRand() < 0.3 ? PALETTE.textMuted : PALETTE.textSubtle;

        case 'lock':
          if (isFrozen) {
            return phaseProgress > 0.6 ? PALETTE.amber : PALETTE.textMuted;
          }
          return PALETTE.textSubtle;

        case 'transmission':
          // Group cells: bright
          if (isInTransmissionZone && isFrozen) return PALETTE.text;
          // Background: radial gradient based on distance to nearest group
          if (distToGroup < Infinity) return gradientColorForDistance(distToGroup);
          // No groups revealed yet — normal scanning
          if (isFrozen) return PALETTE.textMuted;
          return PALETTE.textSubtle;

        case 'decode':
          // Decoded message — blink between decoded and encoded
          if (isDecoded) {
            if (isBlinkOff) return PALETTE.text; // Show as encoded digit colour
            return PALETTE.accent;
          }
          if (isDecoding) return PALETTE.amber;
          // Group cells
          if (isInTransmissionZone && isFrozen) return PALETTE.text;
          // Background: radial gradient (same clearing as transmission)
          if (distToGroup < Infinity) return gradientColorForDistance(distToGroup);
          return frameRand() < 0.3 ? PALETTE.textMuted : PALETTE.textSubtle;

        case 'corruption': {
          const fade = phaseProgress;
          if (isDecoded && frameRand() > fade * 0.8) return PALETTE.accent;
          if (isFrozen && frameRand() > fade * 0.5) return PALETTE.textMuted;
          // Gradient fades back to normal as corruption progresses
          if (distToGroup < Infinity && frameRand() > fade) {
            return gradientColorForDistance(distToGroup);
          }
          return PALETTE.textSubtle;
        }

        case 'lost':
          return PALETTE.textSubtle;
      }
    }

    // --- Render chrome / status line ---
    function renderChrome(
      phase: Phase,
      phaseProgress: number,
      timestamp: number,
      groupsRevealed: number,
      totalGroups: number,
    ) {
      const chromeY = mainRows * CELL_HEIGHT;
      const leftMargin = 4 * CELL_WIDTH;
      const rightMargin = (cols - 4) * CELL_WIDTH;

      // Divider line
      ctx.fillStyle = PALETTE.border;
      ctx.fillRect(leftMargin, chromeY + 2, rightMargin - leftMargin, 1);

      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = 'top';

      // Left: phase status
      let statusText = '';
      let statusColor: string = PALETTE.textSubtle;

      switch (phase) {
        case 'scanning':
          statusText = `SCANNING ${animatedDots(timestamp)}`;
          statusColor = PALETTE.textSubtle;
          break;
        case 'lock':
          statusText = `SIGNAL ACQUIRED  ${progressBar(phaseProgress)}`;
          statusColor = PALETTE.textMuted;
          break;
        case 'transmission':
          statusText = `RECEIVING  GROUP ${String(groupsRevealed).padStart(2, '0')}/${String(totalGroups).padStart(2, '0')}  ${progressBar(phaseProgress)}`;
          statusColor = PALETTE.amber;
          break;
        case 'decode':
          statusText = phaseProgress < 0.72 ? `DECODING ${animatedDots(timestamp)}` : 'DECODE COMPLETE';
          statusColor = phaseProgress < 0.72 ? PALETTE.amber : PALETTE.accent;
          break;
        case 'corruption':
          statusText = `SIGNAL DEGRADING  ${progressBar(1 - phaseProgress)}`;
          statusColor = PALETTE.textMuted;
          break;
        case 'lost':
          statusText = 'SIGNAL LOST';
          statusColor = PALETTE.textSubtle;
          break;
      }

      ctx.fillStyle = statusColor;
      ctx.fillText(statusText, leftMargin, chromeY + CELL_HEIGHT * 0.5 + 2);

      // Right: frequency
      const freqText = phase === 'scanning' ? 'FREQ: -----.-- kHz' : 'FREQ: 4625.00 kHz';
      ctx.fillStyle = PALETTE.textSubtle;
      ctx.textAlign = 'right';
      ctx.fillText(freqText, rightMargin, chromeY + CELL_HEIGHT * 0.5 + 2);
      ctx.textAlign = 'start';
    }

    // --- Build set of cells that are in the transmission zone ---
    function getTransmissionCellSet(layout: TransmissionLayout, groupsRevealed: number): Set<number> {
      const cellSet = new Set<number>();
      for (let g = 0; g < groupsRevealed; g++) {
        const pos = layout.groupPositions[g];
        if (!pos) continue;
        for (let d = 0; d < GROUP_SIZE; d++) {
          const ci = pos.row * cols + pos.col + d;
          if (ci >= 0 && ci < totalCells) cellSet.add(ci);
        }
      }
      return cellSet;
    }

    // --- Map decoded message chars to grid positions ---
    function getDecodePositions(layout: TransmissionLayout, message: DecodedMessage): Array<{ cellIndex: number; char: string }> {
      const positions: Array<{ cellIndex: number; char: string }> = [];
      const messageChars = message.raw.split('');

      // Center the message in the transmission zone
      const messageRow = layout.startRow + Math.floor(layout.totalRows / 2);
      const messageStartCol = Math.floor((cols - messageChars.length) / 2);

      for (let i = 0; i < messageChars.length; i++) {
        const col = messageStartCol + i;
        if (col >= 0 && col < cols) {
          const ci = messageRow * cols + col;
          if (ci >= 0 && ci < totalCells) {
            positions.push({ cellIndex: ci, char: messageChars[i] });
          }
        }
      }
      return positions;
    }

    // --- Main render state ---
    let cycleState = initCycle(performance.now());
    let animationId: number;
    let lastDigitChangeTime = 0;

    // Frame throttling
    const frameDuration = fps ? 1000 / fps : 0;
    let lastRenderTime = 0;

    function render(timestamp: number) {
      if (frameDuration && timestamp - lastRenderTime < frameDuration) {
        animationId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = timestamp;

      cycleState = updatePhase(cycleState, timestamp);

      const phaseElapsed = timestamp - cycleState.phaseStartTime;
      const phaseDuration = PHASE_TIMINGS[cycleState.phase];
      const phaseProgress = Math.min(phaseElapsed / phaseDuration, 1);
      const phase = cycleState.phase;

      // Seed per-frame random
      frameRandSeed = Math.floor(timestamp) % 2147483647;

      // --- Update digit changes at controlled rate ---
      const shouldChangeDigits = timestamp - lastDigitChangeTime > DIGIT_CHANGE_INTERVAL;
      if (shouldChangeDigits) {
        lastDigitChangeTime = timestamp;
      }

      // --- Phase-specific cell updates ---
      const centerRow = Math.floor(mainRows / 2);
      const groupsRevealed = phase === 'transmission' || phase === 'decode' || phase === 'corruption'
        ? Math.min(Math.floor(
            phase === 'transmission' ? phaseProgress * cycleState.message.groups
            : cycleState.message.groups
          ), cycleState.message.groups)
        : 0;

      const transmissionCells = (phase === 'transmission' || phase === 'decode' || phase === 'corruption')
        ? getTransmissionCellSet(transmissionLayout, groupsRevealed)
        : new Set<number>();

      const decodePositions = (phase === 'decode' || phase === 'corruption')
        ? getDecodePositions(transmissionLayout, cycleState.message)
        : [];

      const charsDecoded = phase === 'decode'
        ? Math.floor(phaseProgress * (cycleState.message.raw.length + 3) * 1.5)
        : phase === 'corruption' ? cycleState.message.raw.length + 3 : 0;

      // Build decode lookup
      const decodeLookup = new Map<number, { char: string; index: number }>();
      for (let i = 0; i < decodePositions.length; i++) {
        decodeLookup.set(decodePositions[i].cellIndex, { char: decodePositions[i].char, index: i });
      }

      // --- LOCK: freeze cells ---
      if (phase === 'lock' && shouldChangeDigits) {
        for (let i = 0; i < totalCells; i++) {
          if (!cellFrozen[i]) {
            const row = Math.floor(i / cols);
            const rowProximity = 1 - Math.abs(row - centerRow) / (mainRows / 2);
            const freezeChance = phaseProgress * 0.15 * (0.3 + 0.7 * rowProximity);
            if (frameRand() < freezeChance) {
              cellFrozen[i] = true;
            }
          }
        }
      }

      // --- TRANSMISSION: freeze transmission zone cells ---
      if (phase === 'transmission') {
        for (const ci of transmissionCells) {
          if (!cellFrozen[ci]) {
            cellFrozen[ci] = true;
            // Set to the pre-generated group digit
            const groupIndex = findGroupForCell(ci, transmissionLayout);
            if (groupIndex !== null) {
              const { group, digitIndex } = groupIndex;
              cellDigits[ci] = parseInt(cycleState.transmissionGroups[group][digitIndex]);
            }
          }
        }
      }

      // --- CORRUPTION: unfreeze cells ---
      if (phase === 'corruption' && shouldChangeDigits) {
        for (let i = 0; i < totalCells; i++) {
          if (cellFrozen[i] && frameRand() < phaseProgress * 0.1) {
            cellFrozen[i] = false;
          }
        }
      }

      // --- LOST: blank cells ---
      if (phase === 'lost' && shouldChangeDigits) {
        for (let i = 0; i < totalCells; i++) {
          if (cellVisible[i] && frameRand() < phaseProgress * 0.15) {
            cellVisible[i] = false;
          }
        }
      }

      // --- Update non-frozen digits ---
      if (shouldChangeDigits) {
        for (let i = 0; i < totalCells; i++) {
          if (!cellFrozen[i]) {
            cellDigits[i] = Math.floor(frameRand() * 10);
          }
        }
      }

      // --- Clear canvas ---
      ctx.fillStyle = PALETTE.bg;
      ctx.fillRect(0, 0, width, height);

      // --- Font setup ---
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.textBaseline = 'top';

      // --- Colour batching ---
      const colorBuckets: Map<string, Array<{ char: string; x: number; y: number }>> = new Map();

      // --- Blink state for decoded message ---
      const allCharsDecoded = phase === 'decode' && charsDecoded - 3 >= cycleState.message.raw.length;
      const isBlinkOff = allCharsDecoded && Math.floor(timestamp / 500) % 2 === 1;

      for (let i = 0; i < totalCells; i++) {
        if (!cellVisible[i]) continue;

        const row = Math.floor(i / cols);
        const col = i % cols;

        const isInTransmissionZone = transmissionCells.has(i);
        const decodeInfo = decodeLookup.get(i);
        const isDecoded = !!decodeInfo && decodeInfo.index < charsDecoded - 3;
        const isDecoding = !!decodeInfo && !isDecoded && decodeInfo.index < charsDecoded;

        // Compute distance to nearest revealed group (for radial gradient)
        const distToGroup = (phase === 'transmission' || phase === 'decode' || phase === 'corruption')
          && groupsRevealed > 0 && !isInTransmissionZone
          ? minDistToGroup(row, col, transmissionLayout, groupsRevealed)
          : Infinity;

        // Determine character
        let char: string;
        if (isDecoded && phase === 'decode') {
          if (isBlinkOff) {
            // Blink off: show original encoded digit
            char = String(cellDigits[i]);
          } else {
            char = decodeInfo!.char;
          }
        } else if (isDecoding && phase === 'decode') {
          // Spin through random printable chars
          char = String.fromCharCode(33 + Math.floor(frameRand() * 93));
        } else if (phase === 'corruption' && decodeInfo) {
          // Corruption of decoded chars
          if (frameRand() > phaseProgress * 0.8) {
            char = decodeInfo.char;
          } else {
            char = String(Math.floor(frameRand() * 10));
          }
        } else {
          char = String(cellDigits[i]);
        }

        const color = getCellColor(
          phase, phaseProgress, i,
          cellFrozen[i], isInTransmissionZone, isDecoded, isDecoding,
          distToGroup, isBlinkOff,
        );

        if (!colorBuckets.has(color)) colorBuckets.set(color, []);
        colorBuckets.get(color)!.push({
          char,
          x: col * CELL_WIDTH,
          y: row * CELL_HEIGHT,
        });
      }

      // Draw batched by colour
      for (const [color, cells] of colorBuckets) {
        ctx.fillStyle = color;
        for (const cell of cells) {
          ctx.fillText(cell.char, cell.x, cell.y);
        }
      }

      // --- Chrome ---
      renderChrome(phase, phaseProgress, timestamp, groupsRevealed, cycleState.message.groups);

      // --- Audio ---
      updateAudio(phase, phaseProgress, groupsRevealed);

      animationId = requestAnimationFrame(render);
    }

    // Helper: find which group/digit a cell index belongs to
    function findGroupForCell(cellIndex: number, layout: TransmissionLayout): { group: number; digitIndex: number } | null {
      const cellRow = Math.floor(cellIndex / cols);
      const cellCol = cellIndex % cols;
      for (let g = 0; g < layout.groupPositions.length; g++) {
        const pos = layout.groupPositions[g];
        if (cellRow === pos.row && cellCol >= pos.col && cellCol < pos.col + GROUP_SIZE) {
          return { group: g, digitIndex: cellCol - pos.col };
        }
      }
      return null;
    }

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      // Dispose all Tone.js nodes to prevent HMR audio artifacts
      noise.stop();
      noise.dispose();
      bandpass.dispose();
      amGain.dispose();
      amLFO.stop();
      amLFO.dispose();
      staticGain.dispose();
      carrier.stop();
      carrier.dispose();
      oscGain.dispose();
      beepOsc.stop();
      beepOsc.dispose();
      beepGain.dispose();
      masterGain.dispose();
    };
  }, [width, height]);

  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block' }} />;
}
