import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import AssistantMessageContent from './AssistantMessageContent';

const QUICK_PROMPTS_STUDENT = [
    'Comment postuler à une offre ?',
    'Rédige un email de remerciement après entretien',
    'Comment utiliser les recommandations IA ?',
];

const QUICK_PROMPTS_COMPANY = [
    'Comment planifier un entretien ?',
    'Rédige un email de convocation entretien',
    'Comment classer les candidats avec l’IA ?',
];

export default function AssistantChat() {
    const { user } = useContext(AuthContext);
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content:
                "Bonjour, je suis l'assistant TalentAI. Je peux vous guider sur la plateforme, les stages, les candidatures et rédiger des brouillons d'e-mails.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    const isCompany = user?.role === 'COMPANY';
    const quickPrompts = isCompany ? QUICK_PROMPTS_COMPANY : QUICK_PROMPTS_STUDENT;

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, open]);

    const sendMessage = async (text) => {
        const trimmed = (text || '').trim();
        if (!trimmed || loading) return;

        const userMsg = { role: 'user', content: trimmed };
        const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-10);

        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await API.post('offers/assistant/chat/', {
                message: trimmed,
                history,
            });
            setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }]);
        } catch (err) {
            const detail = err.response?.data?.detail || 'Assistant indisponible.';
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: detail, isError: true },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className={`fixed bottom-6 right-6 z-[90] flex items-center gap-2 px-5 py-3.5 rounded-2xl shadow-xl transition-all ${
                    open
                        ? 'bg-white text-[#052659] border border-[#C1E8FF]'
                        : 'bg-[#052659] text-white hover:bg-[#7DA0CA]'
                }`}
                aria-label="Assistant TalentAI"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                <span className="text-sm font-semibold">{open ? 'Fermer' : 'Assistant IA'}</span>
            </button>

            {open && (
                <div className="fixed bottom-24 right-6 z-[90] w-[min(100vw-2rem,440px)] h-[min(72vh,580px)] flex flex-col rounded-3xl border border-[#C1E8FF] bg-white shadow-2xl shadow-[#052659]/15 overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#C1E8FF] bg-gradient-to-r from-[#052659] to-[#5488B3] text-white">
                        <p className="font-bold text-sm">Assistant TalentAI</p>
                        <p className="text-xs text-white/75 mt-0.5">
                            {isCompany ? 'Espace recruteur' : 'Espace étudiant'} · Groq
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fbff]">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[92%] rounded-2xl px-4 py-3 ${
                                        msg.role === 'user'
                                            ? 'bg-[#052659] text-white rounded-br-md'
                                            : msg.isError
                                              ? 'bg-rose-50 text-rose-800 border border-rose-100 rounded-bl-md text-sm whitespace-pre-wrap'
                                              : 'bg-white border border-[#C1E8FF] rounded-bl-md shadow-sm'
                                    }`}
                                >
                                    {msg.role === 'user' || msg.isError ? (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {msg.content}
                                        </p>
                                    ) : (
                                        <AssistantMessageContent content={msg.content} />
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-[#C1E8FF] rounded-2xl px-4 py-3 text-xs text-[#7DA0CA]">
                                    Réflexion en cours…
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div className="p-3 border-t border-[#C1E8FF] bg-white">
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {quickPrompts.map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => sendMessage(q)}
                                    disabled={loading}
                                    className="text-[10px] px-2.5 py-1 rounded-full border border-[#C1E8FF] text-[#052659] hover:bg-[#C1E8FF]/40 disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                        <form onSubmit={handleSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Posez votre question…"
                                className="flex-1 text-sm border border-[#C1E8FF] rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7DA0CA]/50"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="px-4 py-2.5 rounded-xl bg-[#052659] text-white text-sm font-semibold hover:bg-[#7DA0CA] disabled:opacity-50"
                            >
                                Envoyer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
