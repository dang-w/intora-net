import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-bg font-mono">
      <div className="text-center">
        <div className="text-lg text-text-muted">SIGNAL NOT FOUND</div>
        <div className="mt-2 text-sm text-text-subtle">STATUS: NO INTERCEPT</div>
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm text-text-subtle hover:text-text-muted transition-colors"
          >
            ← RETURN TO ARCHIVE
          </Link>
        </div>
      </div>
    </div>
  );
}
