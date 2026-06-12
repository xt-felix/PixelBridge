import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--accent)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </div>
        <h1 className="text-[26px] font-bold tracking-[-0.02em] mb-2" style={{ color: 'var(--text-primary)' }}>PixelBridge</h1>
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          Boost your ad performance with server-side conversion tracking. Works with Meta, Google, TikTok & more.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-8 py-3 rounded-xl text-[15px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', boxShadow: '0 2px 12px rgba(99, 91, 255, 0.25)' }}
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}
