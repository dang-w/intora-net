export default function INT002Analysis() {
  return (
    <article className="max-w-3xl space-y-8 text-sm">
      <header>
        <h1 className="text-lg text-amber">SIGNAL ANALYSIS: INT/002 — STATION</h1>
        <div className="text-text-subtle">═══════════════════════════════════════════</div>
        <div className="text-text-muted">CLASSIFICATION: OPEN · DATE: 2026-02-19</div>
        <div className="text-text-muted">ANALYST: INTORA SYSTEMS</div>
        <div className="text-text-muted">VERSION: 1.0</div>
      </header>

      {/* --- CONCEPT --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">01 — CONCEPT</h2>
        <div className="border-l-2 border-border pl-4 space-y-2 text-text-muted">
          <p>
            A number station intercept. Somewhere on the shortwave band, a coded transmission
            is broadcasting to an unknown recipient. You have tuned in. For approximately
            forty-two seconds you watch structure emerge from noise — digits freeze into groups,
            groups resolve into a message, and then the signal degrades and is lost. The next
            cycle, a different frequency, a different message. You are always too late and never
            quite sure what you witnessed.
          </p>
          <p>
            Where INT/001 DRIFT explored organic flow — currents, turbulence, dissolution —
            STATION is its structural inverse. Rhythmic. Gridded. Cold War cryptographic.
            The noise here is not Perlin; it is the static between stations, the random digits
            of a one-time pad. Structure does not emerge gradually — it snaps into place,
            holds for a transmission window, then collapses. The atmosphere is not natural
            but institutional: someone built this signal, and someone else is trying to read it.
          </p>
        </div>
      </section>

      {/* --- TECHNIQUE --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">02 — TECHNIQUE</h2>
        <div className="border-l-2 border-border pl-4 space-y-4 text-text-muted">
          <div>
            <div className="text-text">Randomness Model</div>
            <p>
              No simplex noise. STATION uses a seeded PRNG (mulberry32) for cycle
              reproducibility — each seed determines which message is selected and what
              digit sequences fill the transmission groups. A separate fast PRNG drives
              per-frame randomness for the scanning noise floor. The result is pure
              randomness shaped by phase logic, not spatial coherence. Every cell is
              independent. Structure comes from the code, not the noise.
            </p>
          </div>
          <div>
            <div className="text-text">Character Set</div>
            <p>
              The grid is populated exclusively with numeric digits (0–9) during most phases.
              During the decode phase, cells in the message zone spin through the full
              printable ASCII range (charCodes 33–126) before settling on the decoded
              character — a visual echo of a cipher machine cycling through possibilities.
              Decoded messages use uppercase Latin characters, numerals, and directional
              symbols (N, S, E, W for coordinates).
            </p>
          </div>
          <div>
            <div className="text-text">Radial Gradient Clearing</div>
            <p>
              The key rendering challenge: making structured groups visible against a dense
              numeric background without sacrificing atmosphere. Global approaches (sparse
              backgrounds, uniform dimming) all destroyed the noise field that gives the piece
              its character. The solution is <em>localised</em> colour separation — a radial
              gradient around each revealed group.
            </p>
            <p>
              When a transmission group appears, the Euclidean distance from every background
              cell to the nearest group center is computed. A six-step gradient maps distance
              to colour: cells within one unit of a group render near-invisible, graduating
              back to normal noise brightness at five units. The result is a localised clearing
              that forms around each group — like radio interference pushing the static aside.
              The dense noise field remains everywhere the signal is not.
            </p>
            <pre className="mt-2 leading-relaxed">
              <span style={{ color: '#252019' }}>  ████</span>{' '}
              <span style={{ color: '#3A3228' }}>████</span>{' '}
              <span className="text-text-subtle">████</span>{' '}
              <span className="text-text">████</span>{' '}
              <span className="text-accent">████</span>
            </pre>
            <pre className="text-text-subtle text-xs">
              {'  cleared  gradient  noise  groups  decoded'}
            </pre>
          </div>
          <div>
            <div className="text-text">Performance</div>
            <p>
              Same colour-batched canvas rendering as INT/001. Cells are grouped by
              colour, <span className="text-text">fillStyle</span> is set once per colour
              per frame, then all cells of that colour are drawn in a single pass.
              Canvas state changes stay in the single digits per frame regardless of
              grid density.
            </p>
          </div>
        </div>
      </section>

      {/* --- CYCLE --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">03 — CYCLE BEHAVIOUR</h2>
        <div className="border-l-2 border-border pl-4 space-y-2 text-text-muted">
          <p>
            Each cycle runs approximately 42 seconds and transitions through six phases.
            A new seed is generated per cycle, selecting a fresh message and digit sequences.
            The phase system is driven by elapsed time — no external triggers, no interaction.
            You are an observer intercepting a broadcast that does not know you are listening.
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs">
            <div className="flex gap-4">
              <span className="w-32 text-text">SCANNING</span>
              <span className="w-12 text-text-subtle text-right">0–6s</span>
              <span className="text-text-muted">Pure noise — rapid digit churning, searching for signal</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">LOCK</span>
              <span className="w-12 text-text-subtle text-right">6–11s</span>
              <span className="text-text-muted">Cells freeze progressively from center outward, colours warm</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">TRANSMISSION</span>
              <span className="w-12 text-text-subtle text-right">11–23s</span>
              <span className="text-text-muted">5-digit groups appear sequentially in centered block</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">DECODE</span>
              <span className="w-12 text-text-subtle text-right">23–31s</span>
              <span className="text-text-muted">Numbers transform to reveal message — character spin effect</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">CORRUPTION</span>
              <span className="w-12 text-text-subtle text-right">31–37s</span>
              <span className="text-text-muted">Signal degrades, message corrupts, structure dissolves</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">LOST</span>
              <span className="w-12 text-text-subtle text-right">37–42s</span>
              <span className="text-text-muted">Cells blank out, sparse remnants — SIGNAL LOST</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- ITERATIONS --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">04 — ITERATIONS</h2>
        <div className="border-l-2 border-border pl-4 space-y-4 text-text-muted">
          <div>
            <div className="text-text">v1 — Full density, uniform colour</div>
            <p>
              Initial implementation rendered every cell at standard palette intensity
              across all phases. Transmission groups were present but visually invisible —
              the signal drowned in its own noise floor. The grid read as a uniform wall
              of equally-bright digits. However, this version had the strongest atmospheric
              quality — the density and uniform colour created a convincing impression of
              shortwave static. Something important was happening, even if you could not
              quite see what.
            </p>
          </div>
          <div>
            <div className="text-text">v2 — Sparse background (~18% density)</div>
            <p>
              Attempted contrast by culling ~82% of background cells during transmission
              and decode. Bounding box blanking created structural gaps between groups.
              Groups became clearly visible against near-empty space, but the atmospheric
              density that defined the scanning phase was gone. The grid felt hollow.
              The sparse approach treated the noise as something to remove. It is not.
            </p>
          </div>
          <div>
            <div className="text-text">v3 — Colour dimming with bounding box</div>
            <p>
              Full cell density restored. Background cells dimmed to near-background
              palette tones (surfaceRaised, border). A blanked bounding box around the
              transmission zone created clear structural separation. Groups were readable
              but the blank rectangle carved a visible hole in the noise field — the piece
              felt divided into zones rather than unified.
            </p>
          </div>
          <div>
            <div className="text-text">v4 — Colour dimming, no bounding box</div>
            <p>
              Removed bounding box blanking. Noise flows right up to groups, contrast
              is colour-only. Better than v3 — the field feels continuous. But the
              aggressive dimming of background cells changed the character of the piece.
              The dark noise floor made the grid feel empty despite being full. The
              transition from bright scanning to dim transmission was too sharp a
              tonal shift. Returned to v1 as baseline.
            </p>
          </div>
          <div>
            <div className="text-text">v5 — Radial gradient clearing + message blink</div>
            <p>
              The breakthrough. Instead of dimming the entire background, only the noise
              <em>nearest each revealed group</em> fades toward the background colour. A
              six-step gradient radiates outward from each group center — near-invisible
              at 0–1 cells, graduating back to normal noise brightness at 5+ cells. The
              effect resembles a radio interference pattern: localised clearings form
              around each group while the dense noise field remains everywhere else.
              Full atmospheric density is preserved; the signal creates its own space.
            </p>
            <p>
              After the decode sweep completes, the message blinks at 500ms intervals —
              alternating between the decoded text in accent orange and the original
              encoded digits in primary text colour. The flicker between decoded and
              encoded states mirrors the uncertainty of an intercepted transmission:
              you are never quite sure which version is real.
            </p>
            <pre className="mt-2 text-xs leading-relaxed">
{`GRADIENT (distance from group center)
  0–1 cells ···· #252019  near-invisible
  1–2 cells ···· #2D2720  very dark
  2–3 cells ···· #3A3228  dark
  3–4 cells ···· #4D4438  medium-dark
  4–5 cells ···· #6A6050  approaching subtle
  5+ cells ····· textSubtle  normal noise`}
            </pre>
            <div className="mt-2 space-y-1 text-xs">
              <div>
                <span className="text-accent">SHIPPED</span>{' '}
                — This is the current rendering approach. The combination of localised
                gradient clearing and message blink achieves both atmospheric density and
                signal legibility without compromise.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- PARAMETERS --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">05 — CURRENT PARAMETERS</h2>
        <div className="border-l-2 border-border pl-4 text-text-muted">
          <pre className="text-xs leading-relaxed">
{`GRID
  cell_width ········· 14px
  cell_height ········ 20px
  font_size ·········· 14px
  chrome_rows ········ 2 (status line)

TIMING
  digit_change ······· 80ms (~12 changes/sec)
  scanning ··········· 6,000ms
  lock ··············· 5,000ms
  transmission ······· 12,000ms
  decode ············· 8,000ms
  corruption ········· 6,000ms
  lost ··············· 5,000ms
  total_cycle ········ ~42s

TRANSMISSION FORMAT
  group_size ········· 5 digits
  group_gap ·········· 1 cell
  row_gap ············ 1 row
  layout ············· centered block, computed per message

MESSAGE POOL (16 messages)
  coordinates ········ 6 (Berlin, Bletchley Park, UVB-76, Leningrad, DC, Munich)
  designations ······· 5 (ECHO 7, CARDINAL, NIGHTWATCH, FULCRUM, OPUS 3)
  phrases ············ 5 (THE WATER REMEMBERS, ALL SIGNALS ARE FINAL, ...)

RADIAL GRADIENT
  steps ·············· 6 (near-invisible → normal noise)
  inner_radius ······· 0–1 cells (#252019)
  outer_radius ······· 5+ cells (textSubtle)
  computation ········ Euclidean distance to nearest group center
  blink_interval ····· 500ms (decoded ↔ encoded)

CHROME
  status_line ········ phase indicator + progress bar
  frequency ·········· 4625.00 kHz (UVB-76 "Buzzer" frequency)
  scanning_freq ······ -----.-- kHz (no lock)

AUDIO (Tone.js)
  static ············· bandpass-filtered white noise + AM modulation
  carrier ············ sine oscillator, phase-synchronised
  beep_markers ······· per-group during transmission
  decode_pitch ······· carrier frequency rises during decode
  corruption ········· chaotic modulation
  lost ··············· silence`}
          </pre>
        </div>
      </section>

      {/* --- AUDIO --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">06 — AUDIO</h2>
        <div className="border-l-2 border-border pl-4 space-y-4 text-text-muted">
          <p>
            STATION is the first piece in the INT Series with audio. The shortwave radio
            atmosphere is constructed in Tone.js and synchronised to the phase cycle. Audio
            is muted by default — the piece works as a purely visual experience. Unmuting
            adds a layer that transforms the grid from abstract pattern into intercepted
            broadcast.
          </p>
          <div>
            <div className="text-text">Phase Synchronisation</div>
            <div className="mt-2 space-y-1 text-xs">
              <div>
                <span className="text-amber">SCANNING</span>{' '}
                — Shortwave static dominates. Bandpass-filtered white noise with slow AM
                modulation. The sound of tuning across an empty band.
              </div>
              <div>
                <span className="text-amber">LOCK</span>{' '}
                — A carrier tone (sine oscillator) fades in beneath the static.
                Signal acquisition — the moment you find the frequency.
              </div>
              <div>
                <span className="text-amber">TRANSMISSION</span>{' '}
                — Beep markers sound with each group reveal. The carrier holds steady.
                Static drops to a low murmur. Classic number station cadence.
              </div>
              <div>
                <span className="text-amber">DECODE</span>{' '}
                — Carrier pitch rises as the message resolves. Static textures shift.
                The signal is being processed.
              </div>
              <div>
                <span className="text-amber">CORRUPTION</span>{' '}
                — Chaotic modulation. The carrier warps. Static surges. The signal is
                breaking apart.
              </div>
              <div>
                <span className="text-amber">LOST</span>{' '}
                — Silence. The frequency is empty. Nothing remains.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DEPENDENCIES --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">07 — DEPENDENCIES</h2>
        <div className="border-l-2 border-border pl-4 text-text-muted">
          <pre className="text-xs leading-relaxed">
{`tone ············ shortwave audio synthesis (Tone.js)
mulberry32 ······ seeded PRNG for reproducible cycles (inline)
canvas 2d ······· browser-native rendering
geist mono ······ monospace typeface`}
          </pre>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-4 text-text-subtle text-xs">
        <div>═══════════════════════════════════════════</div>
        <div className="mt-1">END OF ANALYSIS · INT/002 — STATION · INTORA SYSTEMS</div>
      </footer>
    </article>
  );
}
