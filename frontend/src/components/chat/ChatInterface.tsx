import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { useStore } from '../../stores/useStore';
import { getMessages, sendMessage, Message } from '../../lib/api';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface ChatInterfaceProps {
    matchId: string;
    recipientName: string;
    onBack?: () => void;
}

export function ChatInterface({ matchId, recipientName, onBack }: ChatInterfaceProps) {
    const user = useStore((state) => state.user);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { data, error, mutate } = useSWR(
        user ? ['messages', matchId, user.id] : null,
        ([, mid, uid]) => getMessages(mid, uid),
        {
            refreshInterval: 3000,
            revalidateOnFocus: true
        }
    );

    const messages = data?.messages || [];
    console.log(`[ChatInterface] Match: ${matchId}, Messages: ${messages.length}`, messages, error);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !user || isSending) return;

        const content = newMessage.trim();
        setNewMessage(''); // Optimistic clear
        setIsSending(true);

        try {
            // Optimistic update
            const optimisticMessage: Message = {
                id: 'temp-' + Date.now(),
                matchId,
                senderId: user.id,
                content: content,
                timestamp: new Date().toISOString()
            };

            mutate({
                messages: [...messages, optimisticMessage],
                count: messages.length + 1
            }, false);

            await sendMessage({
                matchId,
                senderId: user.id,
                content
            });

            // Verification fetch
            mutate();
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error('Failed to send message');
            // Revert optimism if needed (mutate calls fetch again)
            mutate();
        } finally {
            setIsSending(false);
        }
    };

    if (!user) return null;

    return (
        <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 -ml-1">
                        <ArrowLeft className="h-5 w-5 text-white" />
                    </Button>
                )}
                <h3 className="text-white font-semibold">Chat with {recipientName}</h3>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-white/30 text-sm">
                        No messages yet. Say hi!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === user.id;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe
                                        ? 'bg-primary text-white rounded-tr-none'
                                        : 'bg-white/10 text-white rounded-tl-none'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <span className="text-[10px] opacity-50 mt-1 block h-3">
                                        {msg.id.startsWith('temp') ? 'Sending...' : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || isSending}
                    className="rounded-xl w-12"
                >
                    {isSending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </Button>
            </form>
        </div>
    );
}
