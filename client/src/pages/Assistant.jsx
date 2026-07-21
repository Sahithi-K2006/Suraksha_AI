import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User, Mic, MicOff } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import { getAssistantSessionId } from '../lib/sessionStore';
import { useToast } from '../components/ui/Toast';

const WELCOME = {
  role: 'assistant',
  content: "Hi, I'm SuRakshaAI's Citizen Assistant. Paste a suspicious message, ask about a currency note or QR code, or ask how to report fraud - I'm here to help.",
};

export default function Assistant() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const sessionId = useRef(getAssistantSessionId());
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    api.assistantHistory(sessionId.current).then((data) => {
      if (data.messages?.length) setMessages([WELCOME, ...data.messages]);
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
      const { reply } = await api.assistantChat(sessionId.current, text);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      toast(err.message || 'Assistant is unavailable right now', 'error');
    } finally {
      setSending(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast('Voice input is not supported in this browser.', 'error');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
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
          {messages.map((m, idx) => (
            <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-trust-blue text-white' : 'bg-safety-orange/10 text-safety-orange'}`}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`rounded-xl px-4 py-2.5 text-sm max-w-[80%] whitespace-pre-wrap ${m.role === 'user' ? 'bg-trust-blue text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-safety-orange/10 text-safety-orange flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="rounded-xl px-4 py-2.5 text-sm bg-slate-100 text-slate-400">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-4 flex items-center gap-2">
          <button
            onClick={toggleVoice}
            className={`p-2.5 rounded-lg border transition-colors ${listening ? 'bg-risk-red text-white border-risk-red' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}
            title="Voice input"
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about a message, currency note, or QR code..."
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-trust-blue/40 focus:border-trust-blue"
          />
          <Button onClick={() => send()} disabled={!input.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
