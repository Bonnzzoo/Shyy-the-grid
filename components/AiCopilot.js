import { useState, useRef, useEffect } from 'react';

export default function AiCopilot({ isOpen, onClose, contextData }) {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([
    { role: 'ai', text: 'Hello Lydia. I am your Grid AI Assistant. How can I help you manage the bazaar today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const simulateAiResponse = async (userPrompt) => {
    setIsTyping(true);
    
    // Add user message
    setConversation(prev => [...prev, { role: 'user', text: userPrompt }]);
    setQuery('');

    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    let aiReply = "I can help with that. Let me analyze your bookings...";
    
    const lowerPrompt = userPrompt.toLowerCase();
    
    // Intelligent Mock Responses based on context
    if (lowerPrompt.includes('unpaid') || lowerPrompt.includes('pending') || lowerPrompt.includes("haven't paid")) {
      const pending = contextData.filter(b => b.status === 'Pending Approval');
      if (pending.length > 0) {
        aiReply = `I found **${pending.length} vendor** waiting for payment approval:\n\n`;
        pending.forEach(p => {
          aiReply += `- **${p.brand}** (Booth ${p.id}): ${p.amount.toLocaleString()} EGP.\nPhone: ${p.phone}\n\n`;
        });
        aiReply += "Would you like me to send them an automated WhatsApp reminder?";
      } else {
        aiReply = "Great news! All of your currently booked vendors have fully paid.";
      }
    } else if (lowerPrompt.includes('waitlist') || lowerPrompt.includes('suggest')) {
      aiReply = "Looking at your current floor plan, you have a heavy concentration of **Beauty Icons**. To maintain a premium curated experience, I suggest approving a **Fashion** or **Handmade** brand next.\n\n**Top Waitlist Suggestion:**\n- **Brand:** Linen & Co.\n- **Category:** Fashion\n- **Budget Match:** Standard Right (4,000 EGP)\n\nShould I draft an approval email to them?";
    } else if (lowerPrompt.includes('revenue') || lowerPrompt.includes('total')) {
      const total = contextData.reduce((sum, b) => sum + b.amount, 0);
      aiReply = `Based on your recent bookings, your total revenue collected so far is **${total.toLocaleString()} EGP**. You still have 27 booths left to sell to hit your maximum target!`;
    }

    // Stream the response to look like real AI
    setIsTyping(false);
    setConversation(prev => [...prev, { role: 'ai', text: '' }]);
    
    const words = aiReply.split(' ');
    for (let i = 0; i < words.length; i++) {
      await new Promise(r => setTimeout(r, 40)); // Typing speed
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

  return (
    <div 
      className="booking-panel-overlay open" 
      onClick={handleOverlayClick} 
      style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div 
        className="booking-panel open" 
        style={{ 
          width: '700px', 
          height: '80vh', 
          display: 'flex', 
          flexDirection: 'column', 
          padding: 0,
          overflow: 'hidden',
          background: 'rgba(250, 248, 245, 0.85)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span>
            <div>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}>Grid AI</h3>
              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Copilot</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {conversation.map((msg, idx) => (
            <div key={idx} style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              gap: '12px'
            }}>
              {msg.role === 'ai' && <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A1A, #4A4A4A)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>✦</div>}
              
              <div style={{ 
                background: msg.role === 'user' ? 'var(--text-primary)' : 'white',
                color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                boxShadow: msg.role === 'ai' ? '0 4px 12px rgba(0,0,0,0.03)' : 'none',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '12px', alignItems: 'center' }}>
               <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #1A1A1A, #4A4A4A)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>✦</div>
               <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
          <div style={{ display: 'flex', gap: '12px', background: 'var(--bg-secondary)', borderRadius: '24px', padding: '8px 16px', border: '1px solid var(--border-color)' }}>
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your bookings or waitlist..."
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '0.95rem', color: 'var(--text-primary)' }}
              disabled={isTyping}
            />
            <button 
              onClick={() => { if(query.trim() && !isTyping) simulateAiResponse(query); }}
              style={{ background: query.trim() ? 'var(--color-primary)' : 'var(--text-muted)', color: 'white', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: query.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
            >
              ↑
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
             Powered by Gemini Nano & Firebase AI Logic
          </div>
        </div>
      </div>
    </div>
  );
}
