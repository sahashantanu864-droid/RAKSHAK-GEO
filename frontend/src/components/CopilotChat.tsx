import React, { useState, useRef, useEffect } from 'react';
import { sendCopilotMessage } from '../lib/api';

export default function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([
    { role: 'model', content: 'Hello! I am your RAKSHAK-GEO AI Copilot. How can I assist you with the flood response operation today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const newMessages = [...messages, { role: 'user', content: input.trim() }];
    setMessages(newMessages as { role: 'user' | 'model'; content: string }[]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await sendCopilotMessage(newMessages, 'general');
      setMessages((prev) => [...prev, { role: 'model', content: response.response }]);
    } catch (error) {
      console.error("Copilot error:", error);
      setMessages((prev) => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Open Copilot"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <path d="M12 7v0"></path>
            <path d="M16 11v0"></path>
            <path d="M8 11v0"></path>
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-[#111] border border-gray-800 rounded-lg shadow-2xl w-[380px] h-[550px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-[#1a1a1a] border-b border-gray-800 p-4 flex justify-between items-center">
            <div className="flex items-center gap-2 text-white font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                <path d="M12 2a10 10 0 1 0 10 10H12V2Z"></path>
                <path d="M12 12 2.1 7.1"></path>
                <path d="m12 12 7.1 7.1"></path>
              </svg>
              RAKSHAK Copilot
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-[#222] text-gray-200 border border-gray-800 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#222] border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-[#161616] border-t border-gray-800">
            <div className="relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Copilot..."
                className="w-full bg-[#0a0a0a] border border-gray-800 text-white text-sm rounded-lg pl-3 pr-10 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 text-blue-500 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed p-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div className="text-center mt-2 text-[10px] text-gray-500">
              AI Copilot can make mistakes. Verify critical actions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
