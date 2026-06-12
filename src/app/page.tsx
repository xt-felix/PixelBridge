import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--accent)] flex items-center justify-center mx-auto mb-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--text-primary)] mb-2">PixelBridge</h1>
        <p className="text-[14px] text-[var(--text-muted)] mb-8 max-w-[320px] mx-auto leading-relaxed">
          Server-side conversion tracking. Higher match quality. Better ROAS.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg text-[14px] font-medium text-white transition-all duration-200"
          style={{ background: 'var(--accent)', boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}
        >
          Open Dashboard
        </Link>
      </div>
    </div>
  );
}
