import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallInterfaceProps {
    status: 'calling' | 'connected' | 'ended' | 'incoming';
    remoteUser?: {
        name: string;
        avatar?: string;
    };
    onEndCall: () => void;
    onAccept?: () => void;
}

const CallInterface = ({ status, remoteUser, onEndCall, onAccept }: CallInterfaceProps) => {
    const [seconds, setSeconds] = useState(0);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        let interval: any;
        if (status === 'connected') {
            interval = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [status]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md"
        >
            <div className="w-full max-w-sm p-8 rounded-3xl bg-card border border-border shadow-2xl text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                    <Avatar className="w-24 h-24 border-4 border-primary/20">
                        <AvatarImage src={remoteUser?.avatar} />
                        <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {remoteUser?.name?.[0] || '?'}
                        </AvatarFallback>
                    </Avatar>
                    {status === 'connected' && (
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-card"
                        />
                    )}
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl font-bold">{remoteUser?.name || 'Support'}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                        {status === 'calling' ? 'Calling...' :
                            status === 'incoming' ? 'Incoming audio call' :
                                status === 'connected' ? formatTime(seconds) : 'Call Ended'}
                    </p>
                </div>

                <div className="flex items-center justify-center gap-6 pt-4">
                    {status === 'incoming' ? (
                        <>
                            <Button
                                size="icon"
                                variant="outline"
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-none shadow-lg"
                                onClick={onEndCall}
                            >
                                <PhoneOff className="w-6 h-6" />
                            </Button>
                            <Button
                                size="icon"
                                className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg"
                                onClick={onAccept}
                            >
                                <Phone className="w-6 h-6" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="icon"
                                variant="ghost"
                                className={`w-12 h-12 rounded-full ${isMuted ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}
                                onClick={() => setIsMuted(!isMuted)}
                            >
                                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </Button>

                            <Button
                                size="icon"
                                variant="outline"
                                className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-none shadow-lg"
                                onClick={onEndCall}
                            >
                                <PhoneOff className="w-6 h-6" />
                            </Button>

                            <Button
                                size="icon"
                                variant="ghost"
                                className="w-12 h-12 rounded-full hover:bg-muted"
                            >
                                <Volume2 className="w-5 h-5" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default CallInterface;
