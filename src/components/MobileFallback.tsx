export default function MobileFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg font-mono">
      <pre className="text-text-muted text-sm leading-relaxed">
{`┌─────────────────────────┐
│ INT ARCHIVE             │
│ ─────────────────────── │
│                         │
│ DISPLAY INSUFFICIENT    │
│ MINIMUM: 1920×1080      │
│                         │
│ TERMINAL ACCESS REQUIRED│
│                         │
└─────────────────────────┘`}
      </pre>
    </div>
  );
}
