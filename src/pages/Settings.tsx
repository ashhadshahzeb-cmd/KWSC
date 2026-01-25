import { motion } from "framer-motion";
import { Settings as SettingsIcon, Bell, Palette, Globe, Shield, Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Settings = () => {
    const { theme, setTheme } = useTheme();
    const { isAdmin, componentSettings, toggleComponent } = useAuth();

    const handleSave = () => {
        toast.success("Settings saved successfully", {
            description: "Your preferences have been updated."
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage your application preferences and configuration.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Appearance */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <Card className="glass-card h-full border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="w-5 h-5 text-primary" />
                                Appearance
                            </CardTitle>
                            <CardDescription>Customize the look and feel of the system</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Theme Mode</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div
                                        onClick={() => setTheme("light")}
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-full aspect-video rounded-lg border-2 flex items-center justify-center transition-all",
                                            theme === "light" ? "border-primary bg-background shadow-lg scale-105" : "border-transparent bg-muted/30 hover:border-border"
                                        )}>
                                            <Sun className={cn("w-5 h-5", theme === "light" ? "text-warning" : "text-muted-foreground")} />
                                        </div>
                                        <span className={cn("text-xs font-bold", theme === "light" ? "text-foreground" : "text-muted-foreground")}>Light</span>
                                    </div>
                                    <div
                                        onClick={() => setTheme("dark")}
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-full aspect-video rounded-lg border-2 flex items-center justify-center transition-all",
                                            theme === "dark" ? "border-primary bg-slate-900 shadow-lg scale-105" : "border-transparent bg-slate-900/50 hover:border-border"
                                        )}>
                                            <Moon className={cn("w-5 h-5", theme === "dark" ? "text-blue-400" : "text-muted-foreground")} />
                                        </div>
                                        <span className={cn("text-xs font-bold", theme === "dark" ? "text-foreground" : "text-muted-foreground")}>Dark</span>
                                    </div>
                                    <div
                                        onClick={() => setTheme("system")}
                                        className="flex flex-col items-center gap-2 group cursor-pointer"
                                    >
                                        <div className={cn(
                                            "w-full aspect-video rounded-lg border-2 flex items-center justify-center transition-all",
                                            theme === "system" ? "border-primary bg-gradient-to-br from-background to-slate-900 shadow-lg scale-105" : "border-transparent bg-gradient-to-br from-background/50 to-slate-900/50 hover:border-border"
                                        )}>
                                            <Monitor className={cn("w-5 h-5", theme === "system" ? "text-primary" : "text-muted-foreground")} />
                                        </div>
                                        <span className={cn("text-xs font-bold", theme === "system" ? "text-foreground" : "text-muted-foreground")}>System</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">Compact Mode</Label>
                                    <p className="text-xs text-muted-foreground">Reduce spacing in tables and lists</p>
                                </div>
                                <Switch />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Notifications */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                >
                    <Card className="glass-card h-full border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="w-5 h-5 text-success" />
                                Notifications
                            </CardTitle>
                            <CardDescription>Control how you receive alerts</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                {[
                                    { id: "email", label: "Email Alerts", desc: "Receive daily summaries via email", default: true },
                                    { id: "desktop", label: "Desktop Notifications", desc: "Real-time browser notifications", default: true },
                                    { id: "new_patient", label: "New Patient Alerts", desc: "Notify when a new patient arrives", default: false }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                        <div className="space-y-0.5">
                                            <Label className="text-base font-bold text-sm sm:text-base">{item.label}</Label>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch id={item.id} defaultChecked={item.default} />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* System Settings */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                >
                    <Card className="glass-card h-full border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-info" />
                                Language & Region
                            </CardTitle>
                            <CardDescription>Select your preferred language and time zone</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Language</Label>
                                <Select defaultValue="en">
                                    <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-border/50">
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English (US)</SelectItem>
                                        <SelectItem value="urdu">Urdu (Pakistan)</SelectItem>
                                        <SelectItem value="ar">Arabic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Time Zone</Label>
                                <Select defaultValue="pk">
                                    <SelectTrigger className="rounded-xl h-12 bg-muted/30 border-border/50">
                                        <SelectValue placeholder="Select Time Zone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pk">Islamabad (GMT+5)</SelectItem>
                                        <SelectItem value="uk">London (GMT+0)</SelectItem>
                                        <SelectItem value="us">New York (GMT-5)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Module Management (Admin Only) */}
                {isAdmin && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="md:col-span-2"
                    >
                        <Card className="glass-card h-full border-none shadow-xl border-t-4 border-t-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <SettingsIcon className="w-5 h-5 text-primary" />
                                    Module Management
                                </CardTitle>
                                <CardDescription>Enable or disable application components (Admins only)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {["Patients", "Medicine", "Hospital", "Laboratory", "Monthly Cycle", "Reports", "Device Management"].map((module) => {
                                        const setting = componentSettings.find(s => s.component_name === module);
                                        const isEnabled = setting ? setting.is_enabled : true;
                                        return (
                                            <div key={module} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                <Label className="font-bold">{module}</Label>
                                                <Switch
                                                    checked={isEnabled}
                                                    onCheckedChange={(checked) => toggleComponent(module, checked)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>

            <div className="flex justify-end pt-4 pb-12">
                <Button
                    onClick={handleSave}
                    className="px-10 py-6 rounded-2xl shadow-xl hover:scale-105 transition-all text-lg font-bold"
                >
                    Save Changes
                </Button>
            </div>
        </div>
    );
};

export default Settings;
