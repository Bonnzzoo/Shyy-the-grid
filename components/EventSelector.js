import { useState, useEffect } from 'react';
import { getAllEvents, getEventsByOrganizer } from '../utils/eventService';

/*
  EventSelector — Card-based event picker
  Shows after login, before entering the dashboard.
  Lists all events the logged-in user manages with key stats.
*/

export default function EventSelector({ user, onSelectEvent }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      setIsLoading(true);
      try {
        // Admin sees all events, organizer sees only their own
        const list = user?.role === 'admin'
          ? await getAllEvents()
          : await getEventsByOrganizer(user?.organizerId || 'org_lydia');
        setEvents(list);
      } catch (e) {
        console.error('Failed to load events:', e);
        setEvents([]);
      }
      setIsLoading(false);
    }
    loadEvents();
  }, [user]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '12px', animation: 'pulse 1.5s ease infinite' }}>✦</div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-xl)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '8px' }}>Your Events</h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Select an event to manage, or create a new one.
        </p>
      </div>

      {events.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 'var(--space-2xl)',
          border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎪</div>
          <h3 style={{ fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>No events yet</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Create your first bazaar event to get started.
          </p>
          <button className="btn btn-primary">+ Create Event</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => onSelectEvent(event)}
              className="glass-card"
              style={{
                padding: '28px', textAlign: 'left', cursor: 'pointer',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-card)',
                transition: 'all 0.2s ease',
                display: 'flex', flexDirection: 'column', gap: '16px',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = event.brandAccent || 'var(--text-primary)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Event Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {event.logoUrl ? (
                  <img src={event.logoUrl} alt={event.organizer} style={{
                    width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                    border: '2px solid var(--border-color)',
                  }} onError={(e) => { e.target.style.display = 'none'; }} />
                ) : (
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: event.brandAccent || 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {(event.name || '?')[0]}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {event.edition && <span>{event.edition} · </span>}
                    {event.organizer}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase',
                  letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                  background: event.status === 'published' ? 'var(--color-success-light)' : 'var(--bg-secondary)',
                  color: event.status === 'published' ? 'var(--color-success)' : 'var(--text-muted)',
                }}>
                  {event.status || 'draft'}
                </span>
              </div>

              {/* Event Meta */}
              <div style={{ display: 'flex', gap: '24px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Date</div>
                  {event.date}
                </div>
                <div>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>Location</div>
                  {event.locationShort || event.location}
                </div>
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)',
              }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                    {event.soldBooths || 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sold</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: 'var(--text-primary)' }}>
                    {event.totalBooths || 0}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 400, color: event.brandAccent || 'var(--color-success)' }}>
                    {(event.totalBooths || 0) - (event.soldBooths || 0)}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Available</div>
                </div>
              </div>

              {/* Phase indicator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', color: 'var(--text-muted)',
              }}>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: event.currentPhase === 'sold_out' ? 'var(--color-danger)' : event.currentPhase === 'waitlist_open' ? 'var(--color-warning)' : 'var(--color-success)',
                }} />
                {event.currentPhase === 'sold_out' ? 'Sold Out' : event.currentPhase === 'waitlist_open' ? 'Applications Open' : 'Priority Booking'}
              </div>
            </button>
          ))}

          {/* Create New Event Card */}
          <button
            onClick={() => { /* TODO: Navigate to create page */ window.location.href = '/create'; }}
            style={{
              padding: '28px', textAlign: 'center', cursor: 'pointer',
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              background: 'transparent',
              transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '12px', minHeight: '200px', width: '100%',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-primary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--text-primary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <div style={{ fontSize: '2rem', lineHeight: 1 }}>+</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>Create New Event</div>
          </button>
        </div>
      )}
    </div>
  );
}
