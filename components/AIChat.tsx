
import React, { useState, useRef, useEffect } from 'react';
import { askAIQuestion } from '../services/geminiService';

interface Message {
  text: string;
  isUser: boolean;
}

const RichTextRenderer: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-4">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        
        if (trimmed.toLowerCase().includes('💡 pro tip')) {
          return (
            <div key={idx} className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-4 my-6 shadow-sm">
              <div className="flex items-center gap-3 font-black text-amber-800 text-xs uppercase tracking-widest mb-1">
                <span>💡</span> Elite Optimization
              </div>
              <p className="text-stone-700 text-sm font-semibold leading-relaxed">
                {renderInline(trimmed.replace(/💡 pro tip:?/gi, '').trim())}
              </p>
            </div>
          );
        }

        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <div key={idx} className="font-black text-stone-900 mt-8 mb-2 flex items-center gap-3 text-sm tracking-tight border-b border-amber-100 pb-1">
              {renderInline(trimmed)}
            </div>
          );
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex gap-4 pl-3 py-1.5 border-l-4 border-amber-200/50 ml-2">
              <span className="text-amber-500 font-black">•</span>
              <span className="text-stone-700 leading-relaxed font-medium text-sm">
                {renderInline(trimmed.substring(2))}
              </span>
            </div>
          );
        }

        return <p key={idx} className="text-stone-600 leading-relaxed font-medium text-sm">{renderInline(line)}</p>;
      })}
    </div>
  );
};

const renderInline = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-stone-950 underline decoration-amber-200/50">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-stone-900 text-amber-400 px-2 py-0.5 rounded-lg font-mono text-[11px] mx-1 border border-stone-800 shadow-inner font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

interface AIChatProps {
  activeContext: string;
  externalMessage?: string | null;
  onMessageHandled?: () => void;
}

type ChatState = 'CLOSED' | 'MENU' | 'CHAT';

const AIChat: React.FC<AIChatProps> = ({ activeContext, externalMessage, onMessageHandled }) => {
  const [state, setState] = useState<ChatState>('CLOSED');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping, state]);

  useEffect(() => {
    if (externalMessage) {
      setState('CHAT');
      if (messages.length === 0) {
        setMessages([{ text: `Protocol activated for **${activeContext}**. \n\nI can assist with installation, updates, or deep architectural questions. \n\nHow may I facilitate your expertise?`, isUser: false }]);
      }
      handleExternalSend(externalMessage);
      onMessageHandled?.();
    }
  }, [externalMessage]);

  const handleExternalSend = async (text: string) => {
    setMessages(prev => [...prev, { text, isUser: true }]);
    setIsTyping(true);
    try {
      const response = await askAIQuestion(activeContext, text);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Protocol error. Intelligence link unstable.", isUser: false }]);
    } finally { setIsTyping(false); }
  };

  const startChat = (initialMessage?: string) => {
    setMessages([{ text: `Protocol activated for **${activeContext}**. \n\nI am standing by to facilitate your mastery. What shall we analyze?`, isUser: false }]);
    setState('CHAT');
    if (initialMessage) {
      handleSend(initialMessage);
    }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isTyping) return;
    
    setInput('');
    setMessages(prev => [...prev, { text: textToSend, isUser: true }]);
    setIsTyping(true);
    try {
      const response = await askAIQuestion(activeContext, textToSend);
      setMessages(prev => [...prev, { text: response, isUser: false }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Intelligence link interrupted.", isUser: false }]);
    } finally { setIsTyping(false); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
      {/* MENU STATE */}
      {state === 'MENU' && (
        <div className="bg-white w-[320px] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(120,53,15,0.4)] border-4 border-amber-50 p-8 mb-6 animate-in slide-in-from-bottom-8 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-stone-900 uppercase text-xs tracking-[0.2em]">Consult Mentor</h3>
            <button onClick={() => setState('CLOSED')} aria-label="Close mentor menu" className="text-2xl text-stone-300 hover:text-stone-900 transition-colors">×</button>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => startChat()}
              className="w-full p-6 bg-stone-900 text-white rounded-[2rem] text-left group hover:bg-amber-500 transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-black text-xs uppercase tracking-widest">Start Conversation</p>
                <p className="text-[10px] text-white/40 group-hover:text-white/60">Direct AI dialogue</p>
              </div>
              <span className="text-xl">💬</span>
            </button>
            <button 
              onClick={() => startChat(`I'm stuck on a step in ${activeContext}. Help!`)}
              className="w-full p-6 bg-amber-50 border-2 border-amber-100 text-stone-900 rounded-[2rem] text-left group hover:border-amber-500 transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-black text-xs uppercase tracking-widest">Troubleshooting</p>
                <p className="text-[10px] text-amber-600/50">Solve errors instantly</p>
              </div>
              <span className="text-xl">🔧</span>
            </button>
            <button 
              onClick={() => startChat(`What are the professional power-user tips for ${activeContext}?`)}
              className="w-full p-6 bg-amber-50 border-2 border-amber-100 text-stone-900 rounded-[2rem] text-left group hover:border-amber-500 transition-all flex items-center justify-between"
            >
              <div>
                <p className="font-black text-xs uppercase tracking-widest">Pro Insight</p>
                <p className="text-[10px] text-amber-600/50">Advanced workflows</p>
              </div>
              <span className="text-xl">🚀</span>
            </button>
          </div>
        </div>
      )}

      {/* CHAT STATE */}
      {state === 'CHAT' && (
        <div className="bg-white w-[350px] sm:w-[450px] h-[600px] max-h-[85vh] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(120,53,15,0.3)] border-4 border-amber-50 overflow-hidden mb-6 animate-in slide-in-from-bottom-12 duration-500 ease-out flex flex-col">
          <div className="bg-stone-900 p-6 text-white relative flex-shrink-0">
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setState('MENU')} aria-label="Back to mentor menu" className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-amber-500 border border-white/5 transition-all">←</button>
                <div className="overflow-hidden">
                  <h3 className="font-black text-lg tracking-tight truncate">Mentor Consult</h3>
                  <p className="text-[9px] text-amber-400 font-black uppercase tracking-[0.3em] truncate">{activeContext}</p>
                </div>
              </div>
              <button onClick={() => setState('CLOSED')} aria-label="Close chat" className="bg-white/5 hover:bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center transition-all group border border-white/10">
                <span className="text-2xl font-light group-hover:rotate-90 transition-transform">×</span>
              </button>
            </div>
          </div>

          {/* aria-live so screen readers announce replies as they arrive —
              without it the whole conversation is silent to assistive tech. */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-label="Conversation with AI mentor"
            className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fffcf9] custom-scrollbar"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-6 py-5 rounded-[2.2rem] shadow-sm leading-relaxed ${
                  m.isUser ? 'bg-amber-500 text-stone-950 rounded-tr-none font-bold border border-amber-400 text-sm' : 'bg-white text-stone-700 border border-amber-50 rounded-tl-none'
                }`}>
                  {m.isUser ? m.text : <RichTextRenderer text={m.text} />}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-amber-50 px-6 py-4 rounded-[1.8rem] rounded-tl-none flex gap-2 items-center shadow-sm">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-amber-50 flex-shrink-0">
            <div className="flex gap-4 p-2 bg-stone-50 rounded-[2.2rem] items-center focus-within:ring-8 focus-within:ring-amber-100/50 transition-all border border-stone-200 shadow-inner">
              <input
                type="text"
                aria-label="Message your mentor"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message your mentor..."
                className="flex-1 bg-transparent border-none px-5 py-3 text-sm font-bold text-stone-900 focus:ring-0 outline-none placeholder:text-stone-400" 
              />
              <button 
                onClick={() => handleSend()} 
                disabled={isTyping} 
                aria-label="Send message"
                className="bg-stone-900 text-amber-500 w-12 h-12 rounded-[1.6rem] flex items-center justify-center hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 text-xl"
              >
                ➜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trigger Button with Hover Label */}
      <div className="flex items-center gap-4 group">
        {state === 'CLOSED' && (
          <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
            <div className="bg-stone-900 text-amber-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl border border-stone-800 flex items-center gap-3">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              Consult AI Mentor
            </div>
          </div>
        )}
        <button 
          onClick={() => setState(state === 'CLOSED' ? 'MENU' : 'CLOSED')} 
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center text-3xl sm:text-4xl shadow-[0_30px_60px_-10px_rgba(120,53,15,0.4)] transition-all hover:scale-110 active:scale-90 relative border-[4px] sm:border-[6px] ${state !== 'CLOSED' ? 'bg-stone-900 text-white border-stone-800' : 'bg-amber-500 text-white border-white'}`}
          aria-label="Toggle AI Mentor Menu"
          title="Consult AI Mentor"
        >
          <div className="absolute -top-3 -right-3 bg-stone-900 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-amber-400 shadow-2xl animate-pulse">VIP</div>
          <span className={`${state !== 'CLOSED' ? '' : 'group-hover:rotate-12'} transition-transform duration-700`}>{state !== 'CLOSED' ? '×' : '🎓'}</span>
        </button>
      </div>
    </div>
  );
};

export default AIChat;
