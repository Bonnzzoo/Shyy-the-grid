import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>BAZAAR-OS — The Operating System for Premium Bazaars</title>
        <meta name="description" content="Give your bazaar a professional booking page. Vendors pick their booth, pay instantly, done. Free for organizers." />
      </Head>

      <nav className="navbar" style={{ padding: 'var(--space-md) var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '0.05em' }}>
          BAZAAR-OS
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Link href="/b/lydia-demo" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Live Demo</Link>
          <Link href="/create" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-primary)' }}>Sign In</Link>
        </div>
      </nav>

      <main>
        <section className="container" style={{ padding: 'var(--space-3xl) var(--space-xl)', textAlign: 'center', maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', marginBottom: 'var(--space-lg)' }}>
            The new standard for organizing bazaars.
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)', textWrap: 'balance' }}>
            Transform your venue layout into an interactive booking experience in 60 seconds. Say goodbye to WhatsApp screenshots and Excel sheets.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
            <Link href="/create" className="btn btn-primary btn-lg">
              Start Building
            </Link>
            <Link href="/b/lydia-demo" className="btn btn-outline btn-lg">
              View Demo
            </Link>
          </div>
        </section>

        <section className="container" style={{ padding: 'var(--space-3xl) var(--space-xl)' }}>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3xl)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-2xl)' }}>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>01. Interactive Mapping</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Live Booth Selection</h3>
              <p>Vendors see exactly which booths are available, reserved, or sold. A seamless visual experience that drives urgency.</p>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>02. Automated Payments</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Instant Checkouts</h3>
              <p>Integrated directly with Paymob. Vendors pay via Card or InstaPay, and booths are secured automatically without manual verification.</p>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 'var(--space-md)' }}>03. Intelligent Management</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Real-Time Roster</h3>
              <p>Watch your vendor list populate instantly. Track revenue, monitor zone demand, and export your directory with one click.</p>
            </div>
          </div>
        </section>

        <section style={{ background: '#FFFFFF', padding: 'var(--space-3xl) 0', marginTop: 'var(--space-3xl)' }}>
          <div className="container" style={{ textAlign: 'center', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: 'var(--space-md)' }}>Zero Cost for Organizers</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
              We add a transparent 10% platform fee to the vendor's checkout. You receive 100% of your booth price. No subscriptions, no hidden fees.
            </p>
            <Link href="/create" className="btn btn-primary btn-lg">
              Create Your First Bazaar
            </Link>
          </div>
        </section>

        <footer style={{ padding: 'var(--space-2xl) var(--space-xl)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>BAZAAR-OS © 2026</div>
          <div>Designed in Cairo.</div>
        </footer>
      </main>
    </>
  );
}
