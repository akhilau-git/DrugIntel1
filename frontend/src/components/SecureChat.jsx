import React, { useState, useEffect, useRef } from 'react';

// Using the same URL logic as axios, but with ws:// instead of http://
const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws');

export default function SecureChat({ userProfile, recipientName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(`${WS_URL}/ws/chat`);

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !ws.current) return;
    
    const messagePayload = {
      id: Date.now(),
      sender_id: userProfile?.id || 'unknown',
      sender_name: userProfile?.full_name || 'User',
      sender_role: userProfile?.role || 'patient',
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    ws.current.send(JSON.stringify(messagePayload));
    setInput('');
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 350, height: 500,
      background: '#FFF', borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #E2E8F0', zIndex: 100
    }}>
      {/* Header */}
      <div style={{ background: userProfile?.role === 'doctor' ? '#1E293B' : '#2563EB', color: '#FFF', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isConnected ? '#10B981' : '#EF4444' }}></span>
            {recipientName || 'Clinical Coordinator'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>HIPAA-Ready Secure Channel</div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 13, marginTop: 'auto', marginBottom: 'auto' }}>
            {isConnected ? 'Connection established. Waiting for messages...' : 'Connecting to secure server...'}
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender_id === (userProfile?.id || 'unknown');
            return (
              <div key={msg.id || i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                {!isMe && <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4, marginLeft: 4 }}>{msg.sender_name}</div>}
                <div style={{
                  background: isMe ? '#2563EB' : '#FFF',
                  color: isMe ? '#FFF' : '#0F172A',
                  padding: '10px 14px',
                  borderRadius: 12,
                  borderBottomRightRadius: isMe ? 2 : 12,
                  borderBottomLeftRadius: !isMe ? 2 : 12,
                  border: isMe ? 'none' : '1px solid #E2E8F0',
                  fontSize: 14,
                  lineHeight: 1.4
                }}>
                  {msg.text}
                </div>
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: isMe ? 'right' : 'left' }}>{msg.timestamp}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ padding: 16, background: '#FFF', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12 }}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type secure message..."
          style={{ flex: 1, padding: '10px 14px', borderRadius: 20, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
        />
        <button 
          onClick={handleSend}
          disabled={!isConnected || !input.trim()}
          style={{ 
            background: (!isConnected || !input.trim()) ? '#E2E8F0' : '#2563EB', 
            color: '#FFF', border: 'none', borderRadius: '50%', width: 40, height: 40, 
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!isConnected || !input.trim()) ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s'
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2 }}><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
