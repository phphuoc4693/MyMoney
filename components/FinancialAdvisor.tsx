
import React, { useState, useEffect, useRef } from 'react';
import { Transaction, ChatMessage, Asset } from '../types';
import { createFinancialChat } from '../services/geminiService';
import { Sparkles, Send, Bot, User, RefreshCw, X, MessageCircle } from 'lucide-react';

interface Props {
  transactions: Transaction[];
  budget: number;
  currentMonth: string;
  assets: Asset[];
}

const FinancialAdvisor: React.FC<Props> = ({ transactions, budget, currentMonth, assets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasUnread, setHasUnread] = useState(false);

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  // Initialize chat session
  useEffect(() => {
    const initChat = async () => {
      const session = createFinancialChat(transactions, {
        limit: budget,
        spent: totalExpense,
        month: currentMonth
      }, assets);
      setChatSession(session);
      
      // Initial greeting only if no messages exist
      if (messages.length === 0) {
          setLoading(true);
          try {
            const response = await session.sendMessage({ 
                message: "Hãy chào tôi ngắn gọn và đưa ra 1 nhận xét quan trọng nhất về tài chính tháng này." 
            });
            setMessages([{ role: 'model', text: response.text, timestamp: Date.now() }]);
            if (!isOpen) setHasUnread(true);
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
      }
    };

    initChat();
  }, [transactions.length, budget, currentMonth, assets]); 

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, loading, isOpen]);

  useEffect(() => {
      if (isOpen) setHasUnread(false);
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userMsg.text });
      const modelMsg: ChatMessage = { role: 'model', text: result.text, timestamp: Date.now() };
      setMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Xin lỗi, kết nối đến chuyên gia bị gián đoạn. Vui lòng thử lại.', timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
      setInput(prompt);
  }

  // --- RENDER: CLOSED STATE (FLOATING BUTTON) ---
  if (!isOpen) {
      return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 md:bottom-28 md:right-10 z-40 w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-transform group"
        >
            <div className="relative">
                <Sparkles size={24} className="animate-pulse" />
                {hasUnread && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
            </div>
            <div className="absolute right-full mr-3 bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                CFO AI Riêng
            </div>
        </button>
      );
  }

  // --- RENDER: OPEN STATE (CHAT WINDOW) ---
  return (
    <div className="fixed bottom-24 right-4 md:bottom-28 md:right-10 z-50 w-[90vw] max-w-[360px] h-[550px] max-h-[70vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 animate-fade-in-up overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 text-white">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">CFO AI Riêng</h3>
            <p className="text-[10px] text-indigo-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span> Trực tuyến</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
            <button 
            onClick={() => setMessages([])} 
            className="text-indigo-200 hover:text-white p-1.5 hover:bg-white/10 rounded-full transition-colors"
            title="Xóa đoạn chat"
            >
            <RefreshCw size={16} />
            </button>
            <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/80 scroll-smooth">
        {messages.length === 0 && !loading && (
            <div className="text-center text-gray-400 text-xs mt-10">
                <Bot size={32} className="mx-auto mb-2 opacity-50" />
                <p>AI đang phân tích ví tiền của bạn...</p>
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${msg.role === 'model' ? 'bg-white text-indigo-600 border border-indigo-100' : 'bg-indigo-600 text-white'}`}>
              {msg.role === 'model' ? <Sparkles size={12} /> : <User size={12} />}
            </div>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
            }`}>
              {msg.text.split('\n').map((line, i) => (
                <p key={i} className={`min-h-[1rem] ${i > 0 ? 'mt-1' : ''}`}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-2">
             <div className="w-6 h-6 rounded-full bg-white border border-gray-100 text-indigo-600 flex items-center justify-center shadow-sm mt-1">
              <Sparkles size={12} />
            </div>
            <div className="bg-white px-3 py-2 rounded-2xl rounded-tl-none border border-gray-100 flex gap-1 items-center shadow-sm w-fit">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length > 0 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
            {['Tôi tiêu quá tay?', 'Cách tiết kiệm?', 'Dự báo cuối tháng'].map((hint) => (
                <button 
                    key={hint}
                    onClick={() => handleQuickAction(hint)}
                    className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full whitespace-nowrap hover:bg-indigo-100 transition-colors border border-indigo-100"
                >
                    {hint}
                </button>
            ))}
          </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Hỏi CFO..."
          className="flex-1 bg-gray-100 border-0 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all outline-none text-sm"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default FinancialAdvisor;
