import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import VoiceInputButton from '../components/VoiceInputButton';
import ReadAloudButton from '../components/ReadAloudButton';
import { api } from '../lib/api';
import { getAssistantSessionId } from '../lib/sessionStore';
import { useToast } from '../components/ui/Toast';
import { useLanguage } from '../lib/useLanguage';
import { t, getLanguage } from '../lib/i18n';

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const sessionId = useRef(getAssistantSessionId());
  const bottomRef = useRef(null);
  const lang = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    api.assistantHistory(sessionId.current).then((data) => {
      if (data.messages?.length) setMessages(data.messages);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setSending(true);
    try {
      const { reply } = await api.assistantChat(sessionId.current, text, lang);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast(err.message || 'Assistant is unavailable right now', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col" style={{ minHeight: 'calc(100vh - 8rem)' }}>
      <div className="flex items-center gap-2 mb-2 text-trust-blue">
        <Bot className="w-5 h-5" />
        <span className="text-sm font-medium uppercase tracking-wide">Citizen AI Assistant</span>
      </div>
      <h1 className="font-heading text-3xl font-bold text-slate-900 mb-6">Ask SuRakshaAI</h1>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '55vh' }}>
          <ChatBubble role="assistant" content={t(lang, 'assistantWelcome')} lang={lang} />
          {messages.map((m, idx) => (
            <ChatBubble key={idx} role={m.role} content={m.content} lang={lang} />
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-safety-orange/10 text-safety-orange flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-xl px-4 py-2.5 text-sm bg-slate-100 text-slate-400">{t(lang, 'analyzing')}</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4 flex items-center gap-2">
          <VoiceInputButton lang={lang} onResult={(transcript, isFinal) => isFinal && setInput(transcript)} />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={t(lang, 'assistantPlaceholder')}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40 focus:border-trust-blue"
          />
          <Button onClick={() => send()} disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-4 pb-3 text-xs text-slate-400">
          Speaking &amp; replies in {getLanguage(lang).nativeName} - change language from the navbar.
        </div>
      </Card>
    </div>
  );
}

function ChatBubble({ role, content, lang }) {
  const isUser = role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-trust-blue text-white' : 'bg-safety-orange/10 text-safety-orange'}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${isUser ? 'bg-trust-blue text-white' : 'bg-slate-100 text-slate-800'}`}>
          {content}
        </div>
        {!isUser && <ReadAloudButton text={content} lang={lang} className="text-xs" />}
      </div>
    </div>
  );
}
