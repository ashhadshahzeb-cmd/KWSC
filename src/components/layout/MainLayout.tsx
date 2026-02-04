import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { motion, AnimatePresence } from "framer-motion";
import ChatWidget from "../chat/ChatWidget";
import { useAuth } from "@/contexts/AuthContext";
import Peer from "peerjs";
import CallInterface from "../chat/CallInterface";
import { apiCall } from "@/lib/api";
import VoiceAssistant from "../chat/VoiceAssistant";
import { cn } from "@/lib/utils";

const MainLayout = () => {
  const { user, isAdmin } = useAuth();

  // Default to collapsed on mobile, open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < 1024);
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Call States
  const [callStatus, setCallStatus] = useState<'idle' | 'incoming' | 'connected' | 'ended'>('idle');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callerName, setCallerName] = useState('User');
  const localStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isAdmin && user && !peer) {
      const newPeer = new Peer('admin-support');
      setPeer(newPeer);

      newPeer.on('call', (call) => {
        setCallerName(call.peer.replace('user-', 'User #'));
        setCurrentCall(call);
        setCallStatus('incoming');
      });

      return () => newPeer.destroy();
    }
  }, [isAdmin, user]);

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
    if (!currentCall || !user?.id) return;
    const userId = currentCall.peer.replace('user-', '');
    try {
      await apiCall('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          senderId: user.id,
          receiverId: userId,
          message: `🎤 [Call Transcript]: ${text}`,
          isAdminMessage: true
        })
      });
    } catch (error) {
      console.error('Error sending transcript:', error);
    }
  };

  const acceptCall = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Your browser does not support audio calling or it is blocked due to an insecure connection.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      currentCall.answer(stream);
      setCallStatus('connected');

      currentCall.on('stream', (remoteStream: MediaStream) => {
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play();
      });

      currentCall.on('close', () => endCall());
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

  return (
    <div className="min-h-screen flex w-full bg-background overflow-x-hidden relative">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 min-w-0 min-h-screen",
        "ml-0 lg:ml-64",
        sidebarCollapsed && "lg:ml-20"
      )}>
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-3 sm:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <ChatWidget />
      <VoiceAssistant />

      <AnimatePresence>
        {callStatus !== 'idle' && (
          <CallInterface
            status={callStatus}
            onEndCall={endCall}
            onAccept={acceptCall}
            remoteUser={{ name: callerName }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
