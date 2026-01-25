import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { sqlApi } from "@/lib/api";

const DeviceRegistration = () => {
    const [masterKey, setMasterKey] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await sqlApi.auth.registerDevice(masterKey);

            // Store device token in localStorage
            localStorage.setItem("deviceToken", response.deviceToken);

            toast({
                title: "Device Registered",
                description: "This device is now trusted for secure access.",
                className: "bg-emerald-50 border-emerald-200",
            });

            setTimeout(() => navigate("/auth"), 1000);
        } catch (error: any) {
            toast({
                title: "Access Denied",
                description: error.message || "Invalid Master Key. Authorization failed.",
                variant: "destructive",
            });
            setMasterKey("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md bg-card/50 backdrop-blur-xl border border-destructive/20 p-8 rounded-3xl shadow-2xl"
            >
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center border-4 border-destructive/20 animate-pulse">
                        <Lock className="w-10 h-10 text-destructive" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-display font-bold text-foreground">Device Security Check</h1>
                        <p className="text-muted-foreground">
                            This device is not recognized. Please enter the Master Administration Key to authorize access.
                        </p>
                        <p className="text-xs text-muted-foreground/70 font-mono">
                            Master Key: 8271933
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="w-full space-y-4">
                        <Input
                            type="password"
                            placeholder="Enter Master Key"
                            value={masterKey}
                            onChange={(e) => setMasterKey(e.target.value)}
                            className="text-center font-mono text-lg tracking-widest"
                            autoFocus
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold h-12 rounded-xl"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Authorizing...
                                </>
                            ) : (
                                "Authorize Device"
                            )}
                        </Button>
                    </form>

                    <div className="text-xs text-muted-foreground/50 font-mono">
                        IP: {window.location.hostname} • ID: {Date.now().toString().slice(-6)}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default DeviceRegistration;
