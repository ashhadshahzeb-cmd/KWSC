import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Command, X, Navigation, Search as SearchIcon, Save, Trash2, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTreatment } from '@/contexts/TreatmentContext';
import { useAuth } from '@/contexts/AuthContext'; // Added import for useAuth

const VoiceAssistant = () => {
    const { user } = useAuth(); // Added useAuth hook
    const [isListening, setIsListening] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [lastAction, setLastAction] = useState<string | null>(null);
    const [language, setLanguage] = useState<'en-US' | 'ur-PK' | 'hi-IN'>('en-US'); // Changed default to English
    const recognitionRef = useRef<any>(null);
    const hasGreeted = useRef(false); // Added hasGreeted ref
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const { clearSession } = useTreatment();

    // Text to Speech with Voice Selection
    const speak = (text: string, lang?: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = lang || language;
        utterance.lang = targetLang;

        // Try to find a native voice for the target language
        const voices = window.speechSynthesis.getVoices();

        // Priority: 1. Google Urdu, 2. Google Hindi, 3. Any Urdu, 4. Any Hindi, 5. English
        const bestVoice =
            voices.find(v => v.name.includes('Google') && v.lang.includes('ur')) ||
            voices.find(v => v.name.includes('Google') && v.lang.includes('hi')) ||
            voices.find(v => v.lang.startsWith('ur')) ||
            voices.find(v => v.lang.startsWith('hi')) ||
            voices.find(v => v.name.includes('Google') && v.lang.includes('en')) ||
            voices.find(v => v.lang.startsWith('en'));

        if (bestVoice) {
            console.log('[VoiceAssistant] Selected Voice:', bestVoice.name, bestVoice.lang);
            utterance.voice = bestVoice;
        }

        utterance.rate = 1.0; // Normal rate
        utterance.pitch = 1.1; // Slightly higher pitch for clarity
        window.speechSynthesis.speak(utterance);
    };

    // Preload voices
    useEffect(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => {
                window.speechSynthesis.getVoices();
            };
        }
    }, []);

    // Auto-Greeting
    useEffect(() => {
        if (user && !hasGreeted.current) {
            const name = user.name || 'Friend';
            const hour = new Date().getHours();
            let greeting = '';

            if (hour < 12) greeting = `Good morning ${name}`;
            else if (hour < 18) greeting = `Good afternoon ${name}`;
            else greeting = `Good evening ${name}`;

            setTimeout(() => {
                speak(`${greeting}, I am KWSC AI. How can I help you today?`);
                setLastAction(`Greeting: ${greeting}`);
                hasGreeted.current = true;
            }, 1000);
        }
    }, [user]);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error('Speech Recognition not supported in this browser');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
            const current = event.results[event.results.length - 1];
            const text = current[0].transcript.toLowerCase();
            setTranscript(text);

            if (current.isFinal) {
                setIsThinking(true);
                // Artificial delay to make it feel like "Thinking"
                setTimeout(() => {
                    processCommand(text);
                    setIsThinking(false);
                }, 500);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                toast({
                    title: "Microphone Access Denied",
                    description: "Please enable microphone access in your browser settings to use the AI Assistant.",
                    variant: "destructive",
                });
                setIsListening(false);
            } else if (event.error === 'network') {
                toast({
                    title: "Network Error",
                    description: "Speech recognition requires an internet connection.",
                    variant: "destructive",
                });
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Only restart if we are still supposed to be listening
            if (isListening) {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Failed to restart recognition:', e);
                }
            }
        };

        recognitionRef.current = recognition;

        // Start/Stop based on state
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }

        return () => {
            recognition.onend = null; // Prevent restart loop on cleanup
            try {
                recognition.stop();
            } catch (e) { }
        };
    }, [isListening, language]);

    const processCommand = (command: string) => {
        console.log('Voice Command:', command);

        // Language Switching
        if (command.includes('urdu bol') || command.includes('speak urdu') || command.includes('اردو بولو')) {
            setLanguage('ur-PK');
            speak('Theek hai, ab mein Urdu mein baat karungi.', 'ur-PK');
            return;
        }
        if (command.includes('hindi bol') || command.includes('speak hindi') || command.includes('हिंदी बोलो')) {
            setLanguage('hi-IN');
            speak('Thik hai, ab mein Hindi mein baat karungi.', 'hi-IN');
            return;
        }
        if (command.includes('speak english')) {
            setLanguage('en-US');
            speak('Okay, switching back to English.');
            return;
        }

        // 1. Small Talk & Greetings
        if (command.includes('how are you') || command.includes('kese ho') || command.includes('kaise ho') || command.includes('کیسے ہو') || command.includes('کیسے ہیں')) {
            const resp = language === 'ur-PK' ? 'Mein bilkul theek hun, bohat shukriya! Aap ka din kaisa guzar raha hai?' :
                language === 'hi-IN' ? 'Mein bilkul theek hun! Aap kaise hain?' :
                    "I'm doing great, thank you for asking! How's your day going?";
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        if (command.includes('thank you') || command.includes('shukriya') || command.includes('thanks') || command.includes('شکریہ') || command.includes('مہربانی')) {
            const resp = language === 'ur-PK' ? 'Aap ka bohat bohat shukriya! Mujhse baat kar ke acha laga.' :
                "You're very welcome! I'm here whenever you need help.";
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        if (command.includes('who are you') || command.includes('tum kaun ho') || command.includes('کون ہو') || command.includes('کون ہیں')) {
            const resp = language === 'ur-PK' ? 'Mein KWSC AI Assistant hun, aap ka digital medical helper.' :
                language === 'hi-IN' ? 'Mein KWSC AI Assistant hun.' :
                    "I am KWSC AI, your dedicated medical assistant.";
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        if (command.includes('assalam o alaikum') || command.includes('asalamualaikum') || command.includes('salam') || command.includes('سلام') || command.includes('اسلام علیکم')) {
            const resp = language === 'ur-PK' ? 'Walaikum Assalam! Mein aap ki kia madad kar sakti hun?' : 'Walaikum Assalam!';
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        if (command.includes('project') || command.includes('is bare me') || command.includes('kya hai') || command.includes('about') || command.includes('پروجیکٹ') || command.includes('کے بارے میں') || command.includes('کیا ہے')) {
            const resp = language === 'ur-PK'
                ? 'KWSC aik advanced medical management system hai jo clinic aur hospital ke operations ko digitalize karta hai. Is mein OPD, Pharmacy, Lab aur NoteSheets ke modules shamil hain, aur ab is mein AI calling aur voice assistant bhi hai.'
                : language === 'hi-IN'
                    ? 'KWSC ek advanced medical management system hai jo clinic aur hospital ke operations ko digitalize karta hai. Is mein OPD, Pharmacy, Lab aur NoteSheets ke modules shamil hain, aur ab is mein AI calling aur voice assistant bhi hai.'
                    : "KWSC is an advanced medical management system designed to digitalize clinic and hospital operations. It features modules for OPD, Pharmacy, Lab, and NoteSheets, now enhanced with AI calling and a voice assistant.";
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        if (command.includes('what can you do') || command.includes('tum kya kar sakte') || command.includes('kaise madad') || command.includes('کیا کر سکتے ہو') || command.includes('مدد')) {
            const resp = language === 'ur-PK'
                ? 'Mein aap ke liye pages khol sakti hun, patients ko search kar sakti hun, aur records save kar sakti hun. Bas mujhse kahein "Open Medicine" ya "Search for Patient".'
                : "I can help you navigate the portal, search for patients, clear forms, and save records. Just say 'Go to Dashboard' or 'Search for EMP001'.";
            speak(resp);
            executeAction(null, resp, <Cpu />);
            return;
        }

        // Navigation Commands
        if (command.includes('go to') || command.includes('open') || command.includes('kholo') || command.includes('کھولو') || command.includes('چلو')) {
            if (command.includes('dashboard') || command.includes('ڈیش بورڈ')) {
                speak('Opening Dashboard');
                executeAction('/', 'Navigating to Dashboard', <Navigation />);
            }
            else if (command.includes('medicine') || command.includes('میڈیسن') || command.includes('دوائی')) {
                speak('Opening Medicine');
                executeAction('/medicine', 'Opening Medicine Entry', <Navigation />);
            }
            else if (command.includes('hospital') || command.includes('ہسپتال')) {
                speak('Opening Hospital');
                executeAction('/hospital', 'Opening Hospital Entry', <Navigation />);
            }
            else if (command.includes('laboratory') || command.includes('lab') || command.includes('لیبارٹری')) {
                speak('Opening Lab');
                executeAction('/laboratory', 'Opening Laboratory', <Navigation />);
            }
            else if (command.includes('note sheet') || command.includes('نوٹ شیٹ')) {
                speak('Opening Note Sheet');
                executeAction('/note-sheet', 'Opening Note Sheet', <Navigation />);
            }
            else if (command.includes('patients') || command.includes('مریض')) {
                speak('Opening Patients');
                executeAction('/patients', 'Opening Patients List', <Navigation />);
            }
            else if (command.includes('employees') || command.includes('ملازم')) {
                speak('Opening Employees');
                executeAction('/employees', 'Opening Employees List', <Navigation />);
            }
            else if (command.includes('settings') || command.includes('سیٹنگ')) {
                speak('Opening Settings');
                executeAction('/settings', 'Opening Settings', <Navigation />);
            }
            else if (command.includes('virtual card') || command.includes('ورچوئل کارڈ')) {
                speak('Opening Virtual Card');
                executeAction('/virtual-card', 'Opening Virtual Card', <Navigation />);
            }
        }

        // Search Commands
        else if (command.includes('search for') || command.includes('find') || command.includes('dhundo') || command.includes('تلاش') || command.includes('ڈھونڈو')) {
            const query = command.replace('search for', '').replace('find', '').replace('dhundo', '').replace('تلاش', '').replace('کریں', '').replace('ڈھونڈو', '').trim();
            speak(`Searching for ${query}`);
            executeAction(null, `Searching for: ${query}`, <SearchIcon />);
            // Dispatch a custom event that pages can listen to
            window.dispatchEvent(new CustomEvent('voice-search', { detail: query }));
        }

        // Data Entry Patterns (English & Urdu)
        // Patterns like "Medicine 1 Panadol" or "Medicine 1 ko Panadol kar do"
        const dataMatch = command.match(/(medicine|میڈیسن)\s*(\d+)\s*(.+)/i);
        if (dataMatch) {
            const index = parseInt(dataMatch[2]) - 1;
            let value = dataMatch[3].replace(/ko|کو|kar do|کردو|set|to/gi, '').trim();
            if (index >= 0 && index < 10) {
                speak(`Setting Medicine ${index + 1} to ${value}`);
                executeAction(null, `Medicine ${index + 1} = ${value}`, <Cpu />);
                window.dispatchEvent(new CustomEvent('voice-data-entry', {
                    detail: { field: `medicine${index + 1}`, value }
                }));
                return;
            }
        }

        // Patterns like "Quantity 1 50" or "Quantity 1 ko 50 kar do"
        const qtyMatch = command.match(/(quantity|qty|مقدار)\s*(\d+)\s*(.+)/i);
        if (qtyMatch) {
            const index = parseInt(qtyMatch[2]) - 1;
            let value = qtyMatch[3].replace(/ko|کو|kar do|کردو|set|to/gi, '').trim();
            if (index >= 0 && index < 10) {
                speak(`Setting Quantity ${index + 1} to ${value}`);
                executeAction(null, `Quantity ${index + 1} = ${value}`, <Cpu />);
                window.dispatchEvent(new CustomEvent('voice-data-entry', {
                    detail: { field: `quantity${index + 1}`, value }
                }));
                return;
            }
        }

        // Patterns for other fields (Emp No, Invoice, Amount)
        if (command.includes('employee number') || command.includes('ایمپلائی نمبر')) {
            const val = command.split(/number|نمبر/i)[1]?.trim();
            if (val) {
                speak(`Setting Employee Number to ${val}`);
                executeAction(null, `Emp No = ${val}`, <Cpu />);
                window.dispatchEvent(new CustomEvent('voice-data-entry', { detail: { field: 'empNo', value: val } }));
                return;
            }
        }

        if (command.includes('invoice') || command.includes('انوس')) {
            const val = command.split(/number|نمبر|invoice|انوس/i).pop()?.trim();
            if (val) {
                speak(`Setting Invoice to ${val}`);
                executeAction(null, `Invoice = ${val}`, <Cpu />);
                window.dispatchEvent(new CustomEvent('voice-data-entry', { detail: { field: 'invoiceNo', value: val } }));
                return;
            }
        }

        if (command.includes('amount') || command.includes('رقم')) {
            const val = command.split(/amount|رقم/i).pop()?.trim().match(/\d+/)?.[0];
            if (val) {
                speak(`Setting Amount to ${val}`);
                executeAction(null, `Amount = ${val}`, <Cpu />);
                window.dispatchEvent(new CustomEvent('voice-data-entry', { detail: { field: 'amount', value: val } }));
                return;
            }
        }

        // Action Commands
        else if (command.includes('clear') || command.includes('reset') || command.includes('saaf karo') || command.includes('صاف') || command.includes('مٹاؤ')) {
            clearSession?.();
            speak('Form cleared');
            executeAction(null, 'Form cleared', <Trash2 />);
        }
        else if (command.includes('save') || command.includes('submit') || command.includes('سیو') || command.includes('محفوظ')) {
            speak('Saving the record');
            executeAction(null, 'Attempting to save...', <Save />);
            window.dispatchEvent(new CustomEvent('voice-save'));
        }

        // Fallback
        else {
            const resp = language === 'ur-PK' ? 'Maaf kijie ga, mujhe samajh nahi aaya.' : "I didn't quite catch that. Could you repeat?";
            speak(resp);
            setLastAction('Command not recognized');
            setTimeout(() => setLastAction(null), 3000);
        }
    };

    const executeAction = (path: string | null, message: string, icon: React.ReactNode) => {
        if (path) navigate(path);
        setLastAction(message);
        toast({
            title: "Voice Action",
            description: message,
            duration: 3000,
        });
        setTimeout(() => {
            setLastAction(null);
            setTranscript('');
        }, 3000);
    };

    const toggleListening = () => {
        if (isListening) {
            setIsListening(false);
            setTranscript('');
        } else {
            setIsListening(true);
            setTranscript('');
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-4">
            <AnimatePresence>
                {isListening && (
                    <motion.div
                        initial={{ opacity: 0, x: -20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.9 }}
                        className="bg-card/80 backdrop-blur-xl border border-primary/20 p-4 rounded-2xl shadow-2xl w-64 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                <Cpu className="w-4 h-4 animate-pulse" />
                                KWSC AI
                            </div>
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"></span>
                            </div>
                        </div>

                        <div className="min-h-[40px] text-xs text-muted-foreground italic">
                            {isThinking ? (
                                <span className="text-primary font-medium flex items-center gap-2">
                                    <Cpu className="w-3 h-3 animate-spin" />
                                    Thinking...
                                </span>
                            ) : (
                                transcript || (language === 'ur-PK' ? "Kuch bolein... jaise 'Medicine kholo'" : "Try: 'Open Medicine' or 'Clear form'")
                            )}
                        </div>

                        {lastAction && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-xs font-bold text-primary flex items-center gap-2 border-t border-primary/10 pt-2"
                            >
                                <Command className="w-3 h-3" />
                                {lastAction}
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                size="icon"
                className={`w-14 h-14 rounded-full shadow-2xl border-4 ${isListening
                    ? 'bg-red-500 hover:bg-red-600 border-red-500/20'
                    : 'bg-primary hover:bg-primary/90 border-primary/20'
                    } transition-all duration-300 group relative`}
                onClick={toggleListening}
            >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}

                {/* Pulse wave effect when listening */}
                {isListening && (
                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></span>
                )}

                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-foreground text-background text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {isListening ? 'Stop AI' : 'Start AI Assistant'}
                </span>
            </Button>
        </div>
    );
};

export default VoiceAssistant;
