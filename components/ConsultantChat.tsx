import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageSquare, User, Bot, Sparkles, Lightbulb } from 'lucide-react';
import { AuditResult, ChatMessage } from '../types';
import { createConsultantChat, sendConsultantMessage } from '../services/geminiService';
import { Chat } from '@google/genai';

interface ConsultantChatProps {
  result: AuditResult;
}

const ConsultantChat: React.FC<ConsultantChatProps> = ({ result }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat when result changes
  useEffect(() => {
    chatSessionRef.current = createConsultantChat(result);
    
    // Initial greeting
    setMessages([
      {
        id: 'init-1',
        role: 'assistant',
        text: `I've analyzed the findings. I noticed ${result.violations.length} violations and a score of ${result.complianceScore}%. How can I help you improve this room's safety?`,
        timestamp: Date.now()
      }
    ]);
  }, [result]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate dynamic suggestions based on findings
  const suggestions = useMemo(() => {
    const list: string[] = [];
    
    // 1. Suggest fixes for specific high-severity violations first
    const highSeverity = result.violations.filter(v => v.severity === 'High');
    highSeverity.slice(0, 2).forEach(v => {
      list.push(`How do I fix the "${v.hazard}"?`);
    });

    // 2. If space permits, add other violations
    if (list.length < 2) {
      const otherViolations = result.violations.filter(v => v.severity !== 'High');
      otherViolations.slice(0, 2 - list.length).forEach(v => {
        list.push(`Remedial action for "${v.hazard}"?`);
      });
    }

    // 3. Add generic professional questions to fill the list
    if (list.length < 3) list.push("Draft a Corrective Action Plan (CAP).");
    if (list.length < 4) list.push("What are the relevant JCI standards?");

    return list.slice(0, 4);
  }, [result]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const responseText = await sendConsultantMessage(chatSessionRef.current, text);
      
      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: responseText,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      // Add error message
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: "I'm sorry, I'm having trouble connecting to the server right now. Please try again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[550px]">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Consultant Chat</h3>
          <p className="text-xs text-slate-500">Ask specific questions about the audit findings</p>
        </div>
        <div className="ml-auto bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Online
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-white border border-slate-200'}`}>
                  {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-blue-600" />}
                </div>
                
                {/* Bubble */}
                <div 
                  className={`p-3 text-sm shadow-sm leading-relaxed ${
                    isUser 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex max-w-[80%] gap-2">
               <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                 <Bot className="h-4 w-4 text-blue-600" />
               </div>
               <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-100 flex flex-col">
        
        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
           <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600 mr-1 flex-shrink-0">
                 <Lightbulb className="h-3 w-3" />
                 <span>Ask:</span>
              </div>
              {suggestions.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => sendMessage(s)}
                  className="flex-shrink-0 text-xs bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap active:scale-95"
                >
                   {s}
                </button>
              ))}
           </div>
        )}

        <div className="p-4 pt-2">
          <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 bg-slate-100 border-0 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors shadow-sm"
            >
              {isLoading ? <Sparkles className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsultantChat;