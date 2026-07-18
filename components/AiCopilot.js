import { useState, useRef, useEffect } from 'react';

export default function AiCopilot({ isOpen, onClose, contextData, waitlistData }) {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'ai', text: 'Hello Lydia! I\'m your Grid AI Assistant. I can help you manage bookings, analyze your waitlist, suggest promotions, and answer questions about your bazaar. What would you like to know?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const simulateAiResponse = async (userPrompt) => {
    setIsTyping(true);
    setConversation(prev => [...prev, { role: 'user', text: userPrompt }]);
    setQuery('');

    await new Promise(r => setTimeout(r, 500));

    let aiReply = "I can help with that. Let me analyze your data...";
    const lowerPrompt = userPrompt.toLowerCase();

    // ── Intelligent Responses ──
    if (lowerPrompt.includes('unpaid') || lowerPrompt.includes('pending') || lowerPrompt.includes("haven't paid") || lowerPrompt.includes('payment')) {
      const pending = (contextData || []).filter(b => b.status === 'Pending Approval');
      if (pending.length > 0) {
        aiReply = `📋 I found **${pending.length} vendor(s)** with pending payments:\n\n`;
        pending.forEach(p => {
          aiReply += `• **${p.brand}** (Booth ${p.boothId}) — ${p.amount.toLocaleString()} EGP\n  Phone: ${p.phone} | Tax Card: ${p.taxCardUploaded ? '✅' : '❌ Missing'}\n\n`;
        });
        aiReply += "💡 **Suggestion:** Send them a WhatsApp reminder with the payment deadline. Would you like me to draft a message?";
      } else {
        aiReply = "✅ Great news! All booked vendors have completed their payments. No pending approvals at this time.";
      }
    } else if (lowerPrompt.includes('waitlist') || lowerPrompt.includes('waiting list') || lowerPrompt.includes('suggest') || lowerPrompt.includes('promote')) {
      const waiting = (waitlistData || []).filter(w => w.status === 'waiting');
      if (waiting.length > 0) {
        aiReply = `📋 You have **${waiting.length} brands** on the waiting list.\n\n`;
        aiReply += `**Top 3 Recommendations for Promotion:**\n\n`;
        waiting.slice(0, 3).forEach((w, i) => {
          aiReply += `${i + 1}. **${w.brand}** — ${w.category}\n   Tax Card: ${w.taxCardUploaded ? '✅' : '❌'} | Preferred: ${w.preferredZone?.replace('_', ' ')}\n   ${w.notes ? `Note: ${w.notes}` : ''}\n\n`;
        });
        aiReply += "💡 **My recommendation:** Promote **" + waiting[0].brand + "** first — they've been waiting the longest and their category would add variety to your floor plan.";
      } else {
        aiReply = "Your waiting list is currently empty. New brands will appear here as they apply through your booking portal.";
      }
    } else if (lowerPrompt.includes('revenue') || lowerPrompt.includes('money') || lowerPrompt.includes('total') || lowerPrompt.includes('income')) {
      const paid = (contextData || []).filter(b => b.status === 'Paid' || b.status === 'Checked In');
      const total = paid.reduce((sum, b) => sum + b.amount, 0);
      const pending = (contextData || []).filter(b => b.status === 'Pending Approval');
      const pendingAmount = pending.reduce((sum, b) => sum + b.amount, 0);
      aiReply = `💰 **Revenue Summary:**\n\n`;
      aiReply += `• Collected: **${total.toLocaleString()} EGP** (${paid.length} vendors)\n`;
      aiReply += `• Pending: **${pendingAmount.toLocaleString()} EGP** (${pending.length} vendors)\n`;
      aiReply += `• Total Potential: **${(total + pendingAmount).toLocaleString()} EGP**\n\n`;
      aiReply += `📊 You still have booths available. If all remaining booths sell at average price, you could reach approximately **1,800,000 EGP** in total revenue.`;
    } else if (lowerPrompt.includes('tax') || lowerPrompt.includes('document') || lowerPrompt.includes('missing')) {
      const missing = (contextData || []).filter(b => !b.taxCardUploaded);
      if (missing.length > 0) {
        aiReply = `📎 **${missing.length} vendor(s)** have not uploaded their tax card:\n\n`;
        missing.forEach(m => {
          aiReply += `• **${m.brand}** (Booth ${m.boothId}) — ${m.phone}\n`;
        });
        aiReply += `\n⚠️ Tax cards are mandatory for all vendors. I suggest sending them a reminder before the deadline.`;
      } else {
        aiReply = "✅ All vendors have uploaded their tax cards. You're all set for compliance!";
      }
    } else if (lowerPrompt.includes('check-in') || lowerPrompt.includes('checkin') || lowerPrompt.includes('qr') || lowerPrompt.includes('scan')) {
      const checkedIn = (contextData || []).filter(b => b.status === 'Checked In');
      const totalScans = (contextData || []).reduce((sum, b) => sum + (b.scanLog?.length || 0), 0);
      aiReply = `📱 **QR Check-in Status:**\n\n`;
      aiReply += `• Total Scans: **${totalScans}**\n`;
      aiReply += `• Vendors Checked In: **${checkedIn.length}**\n`;
      aiReply += `• Pending Check-in: **${(contextData || []).length - checkedIn.length}**\n\n`;
      aiReply += `You can scan QR codes from the "QR Scanner" tab in the sidebar.`;
    } else if (lowerPrompt.includes('category') || lowerPrompt.includes('balance') || lowerPrompt.includes('mix')) {
      const categories = {};
      (contextData || []).forEach(b => {
        categories[b.category] = (categories[b.category] || 0) + 1;
      });
      aiReply = `📊 **Category Distribution:**\n\n`;
      Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        aiReply += `• ${cat}: **${count}** vendors\n`;
      });
      aiReply += `\n💡 **Analysis:** Your bazaar has a strong fashion presence. Consider promoting more Home Essentials and Natural Blends brands from the waitlist to create a more diverse experience.`;
    } else if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      aiReply = "👋 Hello! Here's a quick status of your bazaar:\n\n";
      const paid = (contextData || []).filter(b => b.status === 'Paid' || b.status === 'Checked In');
      const waiting = (waitlistData || []).filter(w => w.status === 'waiting');
      aiReply += `• **${paid.length}** vendors confirmed\n`;
      aiReply += `• **${waiting.length}** brands on waitlist\n`;
      aiReply += `• **${(contextData || []).filter(b => !b.taxCardUploaded).length}** missing tax cards\n\n`;
      aiReply += "What would you like to work on today?";
    } else if (lowerPrompt.includes('export') || lowerPrompt.includes('download') || lowerPrompt.includes('csv') || lowerPrompt.includes('sheet')) {
      aiReply = "📥 You can export your data from the dashboard:\n\n";
      aiReply += "• **Export CSV** — Downloads all vendor bookings as a spreadsheet\n";
      aiReply += "• **Export Waitlist** — Downloads the waiting list separately\n\n";
      aiReply += "Both options are available in the top-right action buttons. The CSV includes booth ID, brand, category, phone, Instagram, amount, status, and tax card status.";
    } else {
      aiReply = "I understand you're asking about \"" + userPrompt + "\". Here are some things I can help with:\n\n";
      aiReply += "• 💰 **Revenue** — Ask about total revenue, pending payments\n";
      aiReply += "• 📋 **Waitlist** — Get suggestions for who to promote next\n";
      aiReply += "• 📎 **Tax Cards** — Check who's missing documents\n";
      aiReply += "• 📊 **Categories** — Analyze vendor mix and balance\n";
      aiReply += "• 📱 **Check-ins** — QR scan status and logs\n";
      aiReply += "• 📥 **Export** — How to download your data\n\n";
      aiReply += "Try asking me something specific!";
    }

    setIsTyping(false);
    setConversation(prev => [...prev, { role: 'ai', text: '' }]);

    const words = aiReply.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 30));
      setConversation(prev => {
        const newConv = [...prev];
        newConv[newConv.length - 1].text += (i === 0 ? '' : ' ') + words[i];
        return newConv;
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim() && !isTyping) {
      simulateAiResponse(query);
    }
  };

  const quickActions = [
    { label: 'Pending payments', icon: '💰' },
    { label: 'Waitlist suggestions', icon: '📋' },
    { label: 'Missing tax cards', icon: '📎' },
    { label: 'Revenue summary', icon: '📊' },
  ];

  return (
    <div
      className="booking-panel-overlay open"
      onClick={handleOverlayClick}
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        className="booking-panel open"
        style={{
          width: '680px', height: '80vh',
          display: 'flex', flexDirection: 'column',
          padding: 0, overflow: 'hidden',
          background: 'rgba(250, 248, 245, 0.9)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.85rem',
            }}>✦</div>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: 500 }}>Grid AI</h3>
              <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="booking-panel-close" style={{ position: 'static' }}>✕</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {conversation.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '82%', display: 'flex', gap: '10px',
            }}>
              {msg.role === 'ai' && (
                <div style={{
                  width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                  background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', flexShrink: 0,
                }}>✦</div>
              )}
              <div style={{
                background: msg.role === 'user' ? 'var(--text-primary)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                fontSize: '0.85rem', lineHeight: 1.6,
                boxShadow: msg.role === 'ai' ? 'var(--shadow-xs)' : 'none',
                border: msg.role === 'ai' ? '1px solid var(--border-color)' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{
                width: 26, height: 26, borderRadius: 'var(--radius-sm)',
                background: 'linear-gradient(135deg, var(--text-primary), var(--color-primary))',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', flexShrink: 0,
              }}>✦</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', animation: 'pulse 1.5s infinite' }}>Analyzing...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {conversation.length <= 2 && (
          <div style={{ padding: '0 24px 8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {quickActions.map((action, i) => (
              <button key={i} onClick={() => simulateAiResponse(action.label)}
                style={{
                  padding: '6px 12px', borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border-color)', background: 'var(--bg-card)',
                  fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-primary)',
                  color: 'var(--text-secondary)', fontWeight: 500,
                  transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.color = 'var(--text-primary)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'var(--border-color)'; e.target.style.color = 'var(--text-secondary)'; }}
              >
                <span>{action.icon}</span> {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
          <div className="search-input" style={{ borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about bookings, waitlist, revenue..."
              disabled={isTyping}
              style={{ fontSize: '0.88rem' }}
            />
            <button
              onClick={() => { if (query.trim() && !isTyping) simulateAiResponse(query); }}
              style={{
                background: query.trim() ? 'var(--color-primary)' : 'var(--border-color)',
                color: '#fff', border: 'none', borderRadius: '50%',
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: query.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
                fontSize: '0.82rem', flexShrink: 0,
              }}
            >↑</button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
            Powered by Gemini & Firebase AI Logic
          </div>
        </div>
      </div>
    </div>
  );
}
