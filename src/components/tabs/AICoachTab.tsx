import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Lightbulb,
  BookOpen,
  Volume2,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';
import { Student, AppSettings, ChatMessage } from '../../types';

interface AICoachTabProps {
  students: Student[];
  settings: AppSettings;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => Promise<void>;
  onClearChat: () => Promise<void>;
}

export const AICoachTab: React.FC<AICoachTabProps> = ({
  students,
  settings,
  chatHistory,
  onSendMessage,
  onClearChat
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'اقترح خطة علاجية وتيسيرية لطالب ضعيف الحفظ وسريع النسيان',
    'ما هي أفضل منهجية لتثبيت ومراجعة جزء عم وجزء تبارك؟',
    'أفكار لمسابقات قرآنية تحفيزية لطلاب الحلقة لزيادة التنافس',
    'كيف أتعامل تربوياً مع الطالب كثير الغياب أو المتردد في التسميع؟'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `chat_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setInputText('');
    await onSendMessage(userMsg);
    setIsLoading(true);

    try {
      const context = {
        studentsCount: students.length,
        studentsSummary: students.map(s => ({
          name: s.name,
          level: s.level,
          currentSurah: s.currentSurahName,
          dailyTarget: s.dailyNewTarget
        })),
        settings
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.slice(-6),
          context
        })
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `chat_ai_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'أهلاً بك يا شيخنا، أنا في خدمتك دائماً.',
        timestamp: new Date().toISOString()
      };

      await onSendMessage(assistantMsg);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMsg: ChatMessage = {
        id: `chat_ai_${Date.now()}`,
        sender: 'assistant',
        text: 'حدث خطأ في الاتصال بالمستشار الذكي، يرجى المحاولة مرة أخرى.',
        timestamp: new Date().toISOString()
      };
      await onSendMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-heading text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#fbbf24]" />
            <span>مستشار عمران القرآني الذكي</span>
          </h2>
          <p className="text-xs text-[#86efac]/90 mt-1">
            استشر الذكاء الاصطناعي في المنهجيات القرآنية، وضبط خطط الطلاب، والحلول التربوية للحلقة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {chatHistory.length > 0 && (
            <button
              onClick={onClearChat}
              className="px-4 py-2 rounded-2xl bg-[#022c22] hover:bg-red-500/15 border border-[#065f46] text-[#86efac] hover:text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح المحادثة</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-[#064e3b]/60 border border-[#065f46] rounded-[32px] overflow-hidden flex flex-col h-[600px] shadow-2xl backdrop-blur-md">
        {/* Messages List Area */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-[24px] bg-[#022c22] border border-[#fbbf24]/40 text-[#fbbf24] flex items-center justify-center shadow-lg">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-heading">
                  السلام عليكم ورحمة الله وبركاته يا شيخنا 🌿
                </h3>
                <p className="text-xs text-[#86efac]/80 mt-1 max-w-md">
                  أنا مستشارك القرآني المساعد. يمكنك سؤالي عن خطط طلاب الحلقة، وتذليل صعوبات الحفظ، واقتراح وسائل التثبيت والمراجعة.
                </p>
              </div>

              {/* Quick Prompts */}
              <div className="w-full max-w-lg space-y-2 pt-2">
                <span className="text-[11px] font-bold text-[#86efac] block text-right">
                  أسئلة واستشارات مقترحة:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q)}
                      className="p-3 rounded-2xl bg-[#022c22] hover:bg-[#065f46]/80 border border-[#065f46] text-[#f0f9f6] text-xs text-right font-medium transition-all flex items-start gap-2 cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-[#fbbf24] shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-9 h-9 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-[24px] p-4 sm:p-5 text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-[#fbbf24] text-[#064e3b] font-medium rounded-br-none shadow-md'
                      : 'bg-[#022c22] border border-[#065f46] text-[#f0f9f6] rounded-bl-none shadow-md'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-9 h-9 rounded-2xl bg-[#022c22] border border-[#065f46] text-[#86efac] flex items-center justify-center shrink-0 mt-1 shadow-md">
                    <User className="w-5 h-5" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-9 h-9 rounded-2xl bg-[#fbbf24] text-[#064e3b] flex items-center justify-center shrink-0 animate-pulse shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-[#022c22] border border-[#065f46] text-[#86efac] rounded-2xl p-4 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#fbbf24] animate-spin" />
                <span>المستشار الذكي يحلل بيانات الحلقة ويصيغ الرد...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-[#022c22]/90 border-t border-[#065f46]">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2.5"
          >
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder="اكتب استشارتك التربوية أو القرآنية هنا..."
              className="flex-1 bg-[#064e3b]/50 border border-[#065f46] focus:border-[#fbbf24] rounded-2xl py-3 px-4 text-xs sm:text-sm text-[#f0f9f6] placeholder-[#86efac]/40 outline-none"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] disabled:opacity-50 text-[#064e3b] shadow-lg transition-all cursor-pointer font-black"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
