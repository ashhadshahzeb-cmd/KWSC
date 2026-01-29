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

const MainLayout = () => {
  const { user, isAdmin } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Call States
  const [callStatus, setCallStatus] = useState<'idle' | 'incoming' | 'connected' | 'ended'>('idle');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [callerName, setCallerName] = useState('User');
  const localStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isAdmin && user && !peer) {
      // Use a fixed ID for the admin support
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
    if (!currentCall || !user?.id) return;
    const userId = currentCall.peer.replace('user-', '');
    try {
      await apiCall('/chat/send', {
        method: 'POST',
        body: JSON.stringify({
          senderId: user.id, // Admin ID
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
      alert('Your browser does not support audio calling or it is blocked due to an insecure connection (Non-HTTPS). Please use localhost or HTTPS for testing.');
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
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 p-6 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3, ease: "easeOut" }}
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
