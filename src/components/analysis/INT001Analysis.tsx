export default function INT001Analysis() {
  return (
    <article className="max-w-3xl space-y-8 text-sm">
      <header>
        <h1 className="text-lg text-amber">SIGNAL ANALYSIS: INT/001 — DRIFT</h1>
        <div className="text-text-subtle">═══════════════════════════════════════════</div>
        <div className="text-text-muted">CLASSIFICATION: OPEN · DATE: 2026-02-15</div>
        <div className="text-text-muted">ANALYST: INTORA SYSTEMS</div>
      </header>

      {/* --- CONCEPT --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">01 — CONCEPT</h2>
        <div className="border-l-2 border-border pl-4 space-y-2 text-text-muted">
          <p>
            An invisible force field made visible through characters. A 2D Perlin noise field
            maps flow angles and magnitudes to oriented text characters across a monospace grid.
            The result reads as flowing currents — rivers of box-drawing characters streaming
            across a dark amber field.
          </p>
          <p>
            DRIFT is the &ldquo;hello world&rdquo; of the INT Series: the simplest possible expression
            of the series constraints. One noise field. One character set. One palette. The
            constraint is the point — the narrow medium forces compositional decisions that
            richer tools would let you avoid.
          </p>
        </div>
      </section>

      {/* --- TECHNIQUE --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">02 — TECHNIQUE</h2>
        <div className="border-l-2 border-border pl-4 space-y-4 text-text-muted">
          <div>
            <div className="text-text">Noise Field</div>
            <p>
              3D simplex noise sampled at each grid cell. The third dimension (z-axis)
              advances with time, creating slow evolution without abrupt changes. Three
              octaves of fractal noise are layered — the first octave creates broad sweeping
              currents, higher octaves add subtle turbulence within them, preventing the flow
              from looking too smooth or mechanical.
            </p>
          </div>
          <div>
            <div className="text-text">Character Mapping</div>
            <p>
              The noise angle at each cell maps to one of 8 directional characters:
            </p>
            <pre className="text-amber mt-1">  ─  ╲  │  ╱  ─  ╲  │  ╱</pre>
            <p className="mt-1">
              Lighter dashed variants (<span className="text-amber">╌ ╎</span>) are scattered at ~12%
              probability for visual texture within currents. Low-magnitude cells render as
              ghost characters (<span className="text-text-subtle">· ∙ : ∶</span>) or empty space.
              Block elements (<span className="text-text-subtle">░ ▒</span>) are reserved exclusively
              for the emergence and dissolution phases — never during the main flow.
            </p>
          </div>
          <div>
            <div className="text-text">Colour Mapping</div>
            <p>
              Magnitude maps to the Amber Schematic palette as a heat gradient.
              The highest-magnitude cells — thin concentrated streaks in the fastest-flowing
              channels — glow in accent orange. The majority of the field stays in warm amber
              and muted tones. The target: standing back from the screen, the impression is
              warm amber-brown with occasional bright orange veins.
            </p>
            <pre className="mt-2 leading-relaxed">
              <span className="text-text-subtle">  ████</span>{' '}
              <span className="text-text-muted">████</span>{' '}
              <span className="text-amber-light">████</span>{' '}
              <span className="text-amber">████</span>{' '}
              <span className="text-accent">████</span>
            </pre>
            <pre className="text-text-subtle text-xs">
              {'  ghost  muted  medium  strong  hot'}
            </pre>
          </div>
          <div>
            <div className="text-text">Performance</div>
            <p>
              At ~7,000 cells per frame, rendering is colour-batched: cells are grouped by
              colour, <span className="text-text">fillStyle</span> is set once per colour per
              frame, then all cells of that colour are drawn. This reduces canvas state changes
              from ~7,000 to ~5–6 per frame.
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
            The reset/reacquisition moment is in-universe — not a loading state but part
            of the narrative. Each new cycle generates a fresh noise seed, so repeat viewers
            see different flow patterns.
          </p>
          <div className="mt-3 space-y-1 font-mono text-xs">
            <div className="flex gap-4">
              <span className="w-32 text-text">EMERGENCE</span>
              <span className="w-12 text-text-subtle text-right">0–5s</span>
              <span className="text-text-muted">Scattered noise coheres into flow patterns</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">FLOW</span>
              <span className="w-12 text-text-subtle text-right">5–25s</span>
              <span className="text-text-muted">Stable currents evolve slowly through z-axis</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">TURBULENCE</span>
              <span className="w-12 text-text-subtle text-right">25–35s</span>
              <span className="text-text-muted">Noise frequency increases, patterns fragment</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">DISSOLUTION</span>
              <span className="w-12 text-text-subtle text-right">35–38s</span>
              <span className="text-text-muted">Progressive character dropout, signal degrades</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">TERMINAL</span>
              <span className="w-12 text-text-subtle text-right">38–40s</span>
              <span className="text-text-muted">Near-empty grid — SIGNAL LOST</span>
            </div>
            <div className="flex gap-4">
              <span className="w-32 text-text">REACQUISITION</span>
              <span className="w-12 text-text-subtle text-right">40–42s</span>
              <span className="text-text-muted">New seed, field rebuilds — REACQUIRING · · ·</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- ITERATIONS --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">04 — ITERATIONS</h2>
        <div className="border-l-2 border-border pl-4 space-y-4 text-text-muted">
          <div>
            <div className="text-text">v1 — Initial render</div>
            <p>
              Dense character texture with single-sample noise, block elements filling
              low-magnitude areas, and uniform colour distribution. The canvas read as a quilted
              patchwork of oriented blocks rather than flowing currents. Accent orange appeared
              everywhere, diluting its impact.
            </p>
          </div>
          <div>
            <div className="text-text">v2 — Flow refinement</div>
            <p>
              Four targeted corrections applied simultaneously:
            </p>
            <div className="mt-2 space-y-1 text-xs">
              <div>
                <span className="text-amber">NOISE SCALE</span>{' '}
                <span className="text-text-subtle">0.03 → 0.015</span>{' '}
                — Halved base scale, added 3-octave fractal noise. Flow lines now extend 15–20+
                cells before curving. Visible directional bands at arm&apos;s length.
              </div>
              <div>
                <span className="text-amber">NEGATIVE SPACE</span>{' '}
                <span className="text-text-subtle">threshold 0.15 → 0.30</span>{' '}
                — Aggressive empty-cell threshold. ~30% of the grid is now dark background.
                Currents have banks.
              </div>
              <div>
                <span className="text-amber">BLOCK REMOVAL</span>{' '}
                <span className="text-text-subtle">░▒ removed from flow phase</span>{' '}
                — Block elements confined to emergence and dissolution only. During main flow:
                only directional characters, ghost dots, and empty space.
              </div>
              <div>
                <span className="text-amber">COLOUR DISTRIBUTION</span>{' '}
                <span className="text-text-subtle">accent threshold 0.80 → 0.92</span>{' '}
                — Initially pushed too high for fractal noise&apos;s compressed output range.
              </div>
            </div>
          </div>
          <div>
            <div className="text-text">v3 — Colour correction</div>
            <p>
              Fractal noise with 3 octaves practically maxes out around ~0.85–0.88, meaning
              the 0.92 accent threshold never triggered. Lowered to 0.82 to account for
              compressed distribution. Orange veins now appear as thin concentrated streaks
              in the fastest-flowing channels.
            </p>
          </div>
          <div>
            <div className="text-text">v4 — Warmth and flow polish</div>
            <div className="mt-2 space-y-1 text-xs">
              <div>
                <span className="text-amber">COLOUR WARMTH</span>{' '}
                <span className="text-text-subtle">amber 0.70 → 0.60, amber_light 0.55 → 0.45</span>{' '}
                — Widened the warm colour bands so amber tones dominate the visible flow.
                Canvas impression shifted from grey-brown to warm amber-brown.
              </div>
              <div>
                <span className="text-amber">FLOW LENGTH</span>{' '}
                <span className="text-text-subtle">noise scale 0.015 → 0.011, lacunarity 2.0 → 1.8</span>{' '}
                — Broader sweeping currents with smoother internal transitions. Flow lines
                now extend 15–20+ cells before curving. Directional bands clearly visible
                at arm&apos;s length.
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
  cell_width ····· 14px
  cell_height ···· 20px
  font_size ······ 14px
  target_density · ~130 cols × 55 rows @ 1080p

NOISE (flow phase)
  scale ·········· 0.011
  z_speed ········ 0.0004
  octaves ········ 3
  persistence ···· 0.5
  lacunarity ····· 1.8

CHARACTER THRESHOLDS
  empty ·········· magnitude < 0.30
  ghost ·········· magnitude < 0.40
  flow ··········· magnitude ≥ 0.40
  light_variant ·· 12% probability

COLOUR THRESHOLDS
  accent (orange) · magnitude > 0.82
  amber ··········· magnitude > 0.60
  amber_light ····· magnitude > 0.45
  muted ··········· magnitude > 0.38
  subtle ·········· magnitude ≤ 0.38`}
          </pre>
        </div>
      </section>

      {/* --- DEPENDENCIES --- */}
      <section className="space-y-3">
        <h2 className="text-amber-light">06 — DEPENDENCIES</h2>
        <div className="border-l-2 border-border pl-4 text-text-muted">
          <pre className="text-xs leading-relaxed">
{`simplex-noise ··· 3D noise field generation
mulberry32 ······ seeded PRNG for reproducible cycles (inline)
canvas 2d ······· browser-native rendering
geist mono ······ monospace typeface`}
          </pre>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="pt-4 text-text-subtle text-xs">
        <div>═══════════════════════════════════════════</div>
        <div className="mt-1">END OF ANALYSIS · INT/001 — DRIFT · INTORA SYSTEMS</div>
      </footer>
    </article>
  );
}
