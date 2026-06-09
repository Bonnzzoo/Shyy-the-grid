import Head from 'next/head';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import AiCopilot from '../components/AiCopilot';

const mockBookings = [
  { id: 'B1', brand: 'MYVI', amount: 25000, date: '10 mins ago', status: 'Paid', phone: '+20 100 123 4567' },
  { id: 'L12', brand: 'Sweet Treats', amount: 4000, date: '1 hr ago', status: 'Pending Approval', phone: '+20 111 987 6543' },
  { id: 'C4', brand: 'Simple', amount: 25000, date: '3 hrs ago', status: 'Paid', phone: '+20 122 456 7890' },
  { id: 'A2', brand: 'Capixy', amount: 18000, date: '5 hrs ago', status: 'Paid', phone: '+20 155 333 2222' },
  { id: 'R8', brand: 'Handmade Co', amount: 4000, date: 'Yesterday', status: 'Paid', phone: '+20 100 999 8888' },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (tab) => {
    if (!document.startViewTransition) {
      setActiveTab(tab);
      return;
    }
    document.startViewTransition(() => {
      flushSync(() => {
        setActiveTab(tab);
      });
    });
  };

  const filteredBookings = mockBookings.filter(b => 
    b.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Command Center | The Grid, by SHYY</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        
        {/* Sidebar */}
        <aside style={{ width: '260px', background: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', padding: 'var(--space-xl) var(--space-lg)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}>
              The Grid <span style={{ fontSize: '0.65rem', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>by SHYY</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>Command Center</div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button onClick={() => handleTabChange('overview')} style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'overview' ? 'var(--bg-secondary)' : 'transparent', border: 'none', color: activeTab === 'overview' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'overview' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              📊 Overview
            </button>
            <button onClick={() => handleTabChange('vendors')} style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'vendors' ? 'var(--bg-secondary)' : 'transparent', border: 'none', color: activeTab === 'vendors' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'vendors' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              🛍 Vendors
            </button>
            <button onClick={() => handleTabChange('map')} style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', background: activeTab === 'map' ? 'var(--bg-secondary)' : 'transparent', border: 'none', color: activeTab === 'map' ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'map' ? 600 : 500, cursor: 'pointer', transition: 'all 0.2s' }}>
              🗺 Floor Plan
            </button>
            <button style={{ textAlign: 'left', padding: '12px 16px', borderRadius: '8px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontWeight: 500, cursor: 'not-allowed', opacity: 0.6 }}>
              ⚙️ Settings
            </button>
          </nav>

          <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
             <img src="/la-logo.jpg" alt="LA Market" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
             <div>
               <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Lydia Akram</div>
               <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Organizer</div>
             </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: 'var(--space-2xl) 40px', overflowY: 'auto', viewTransitionName: 'main-content' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
            <div>
              <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>
                {activeTab === 'overview' ? 'Good Afternoon, Lydia.' : 'Vendor Management'}
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>
                {activeTab === 'overview' ? "Here's what's happening with Eid with Summer Breeze today." : "Manage all your bookings and waitlists."}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setIsAIOpen(true)}
                style={{ background: 'linear-gradient(135deg, #1A1A1A, #4A4A4A)', color: 'white', border: 'none', borderRadius: '8px', padding: '0 16px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                ✨ Ask AI
              </button>
              <button className="btn btn-outline btn-sm">⬇ Export CSV</button>
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>+ Manual Reserve</button>
            </div>
          </div>

          {activeTab === 'overview' && (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: 'var(--space-2xl)' }}>
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Revenue Collected</div>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1.1 }}>1,485,000 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>EGP</span></div>
                </div>
                
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Booths Sold</div>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1.1 }}>237 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>/ 264</span></div>
                  <div style={{ width: '100%', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                    <div style={{ width: '89%', height: '100%', background: 'var(--color-primary)' }}></div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Waitlist Leads</div>
                  <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', color: 'var(--text-primary)', lineHeight: 1.1 }}>42</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '8px', fontWeight: 500 }}>+12 since yesterday</div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Recent Bookings</h2>
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('vendors'); }} style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>View All</a>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Booth</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Brand</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Phone</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Amount</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockBookings.slice(0, 3).map((b, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                        <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.id}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{b.brand}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.phone}</td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{b.amount.toLocaleString()} EGP</td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ 
                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                            background: b.status === 'Paid' ? '#E8F5E9' : '#FFF3E0', color: b.status === 'Paid' ? '#2E7D32' : '#E65100'
                          }}>{b.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'vendors' && (
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search by Brand Name or Booth ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
                />
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Booth</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Brand</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Phone</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Amount</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--bg-secondary)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 600, color: 'var(--text-primary)' }}>{b.id}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-primary)' }}>{b.brand}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{b.phone}</td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-primary)', fontWeight: 500 }}>{b.amount.toLocaleString()} EGP</td>
                      <td style={{ padding: '16px 24px' }}>
                        <span style={{ 
                          padding: '4px 10px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 600,
                          background: b.status === 'Paid' ? '#E8F5E9' : '#FFF3E0', color: b.status === 'Paid' ? '#2E7D32' : '#E65100'
                        }}>{b.status}</span>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>Edit</button>
                      </td>
                    </tr>
                  ))}
                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>

      {/* Manual Reserve Modal */}
      <div className={`booking-panel-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)} style={{ zIndex: 999 }} />
      <div className={`booking-panel ${isModalOpen ? 'open' : ''}`} style={{ zIndex: 1000, maxWidth: '500px' }}>
        <button className="booking-panel-close" onClick={() => setIsModalOpen(false)}>✕</button>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>Manual Reservation</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>Reserve a booth for a VIP or sponsor without going through the payment gateway.</p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label>Booth ID</label>
            <input className="input" placeholder="e.g. C4" />
          </div>
          <div className="input-group">
            <label>Sponsor / Brand Name</label>
            <input className="input" placeholder="e.g. L'Oreal" />
          </div>
          <div className="input-group">
            <label>Reservation Reason</label>
            <select className="input" style={{ appearance: 'auto' }}>
              <option>VIP Sponsor</option>
              <option>Paid via Bank Transfer</option>
              <option>Internal Use</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline btn-block" onClick={() => setIsModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary btn-block" onClick={() => setIsModalOpen(false)}>Confirm Reservation</button>
        </div>
      </div>

      <AiCopilot isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} contextData={mockBookings} />
    </>
  );
}
