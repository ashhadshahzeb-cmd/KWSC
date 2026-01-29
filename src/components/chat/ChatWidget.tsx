import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiCall } from '@/lib/api';
import Peer from 'peerjs';
import CallInterface from './CallInterface';

const ChatWidget = () => {
    const { user, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Calling States
    const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
    const [peer, setPeer] = useState<Peer | null>(null);
    const [currentCall, setCurrentCall] = useState<any>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (user && !isAdmin && !peer) {
            const newPeer = new Peer(`user-${user.id}`);
            setPeer(newPeer);
            return () => newPeer.destroy();
        }
    }, [user]);

    // Handle Transcription
    useEffect(() => {
        if (callStatus === 'connected') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    const transcript = event.results[event.results.length - 1][0].transcript;
                    if (transcript.trim()) {
                        sendTranscript(transcript);
                    }
                };

                recognition.start();
                recognitionRef.current = recognition;
            }
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        }
    }, [callStatus]);

    const sendTranscript = async (text: string) => {
        if (!user?.id) return;
        try {
            await apiCall('/chat/send', {
                method: 'POST',
                body: JSON.stringify({
                    senderId: user.id,
                    receiverId: null,
                    message: `🎤 [Call Transcript]: ${text}`,
                    isAdminMessage: false
                })
            });
            fetchMessages();
        } catch (error) {
            console.error('Error sending transcript:', error);
        }
    };

    // Don't show for admin
    if (isAdmin || !user) return null;

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000); // Poll every 5s
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = async () => {
        if (!user?.id) return;
        try {
            const data = await apiCall(`/chat/history/${user.id}`);
            if (Array.isArray(data)) {
                setMessages(data);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const startCall = async () => {
        if (!peer) return;

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Your browser does not support audio calling or it is blocked due to an insecure connection (Non-HTTPS). Please use localhost or HTTPS for testing.');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            const call = peer.call('admin-support', stream);
            setCallStatus('calling');
            setCurrentCall(call);

            call.on('stream', (remoteStream) => {
                setCallStatus('connected');
                const audio = new Audio();
                audio.srcObject = remoteStream;
                audio.play();
            });

            call.on('close', () => endCall());
        } catch (err) {
            console.error('Failed to get local stream', err);
            alert('Could not access microphone');
        }
    };

    const endCall = () => {
        if (currentCall) currentCall.close();
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        setCallStatus('ended');
        setTimeout(() => setCallStatus('idle'), 2000);
        setCurrentCall(null);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user?.id) return;

        setLoading(true);
        try {
            await apiCall('/chat/send', {
                method: 'POST',
                body: JSON.stringify({
                    senderId: user.id,
                    receiverId: null, // Admin
                    message: newMessage,
                    isAdminMessage: false
                })
            });

            setNewMessage('');
            fetchMessages(); // Refresh immediately
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
                {callStatus !== 'idle' && (
                    <CallInterface
                        status={callStatus === 'ended' ? 'ended' : callStatus === 'calling' ? 'calling' : 'connected'}
                        onEndCall={endCall}
                        remoteUser={{ name: 'Admin Support' }}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 w-[350px] shadow-2xl"
                    >
                        <Card className="border-primary/20 overflow-hidden glass-card">
                            <CardHeader className="bg-primary/10 p-4 flex flex-row items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4" />
                                        Admin Support
                                    </CardTitle>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
                                        onClick={startCall}
                                        title="Start Call"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="h-[300px] overflow-y-auto p-4 space-y-4 bg-background/50">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-muted-foreground text-xs mt-10">
                                            Start a conversation with support.
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${msg.sender_id === user.id
                                                        ? 'bg-primary text-primary-foreground rounded-br-none'
                                                        : 'bg-muted text-foreground rounded-bl-none'
                                                        }`}
                                                >
                                                    {msg.message}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 bg-background/80 backdrop-blur">
                                    <Input
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="text-xs h-9"
                                    />
                                    <Button type="submit" size="icon" disabled={loading} className="h-9 w-9 shrink-0">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
                >
                    <MessageCircle className="w-7 h-7" />
                </motion.button>
            )}
        </div>
    );
};

export default ChatWidget;
