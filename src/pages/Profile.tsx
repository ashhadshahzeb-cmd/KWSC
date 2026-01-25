import { motion } from "framer-motion";
import { User, Mail, Shield, Calendar, Camera, Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const Profile = () => {
    const { user, role } = useAuth();

    const getInitials = () => {
        if (!user?.email) return "U";
        return user.email.charAt(0).toUpperCase();
    };

    const handleEdit = () => {
        toast.message("Profile editing coming soon!", {
            description: "Database update functionality will be added in the next update."
        });
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto py-8">
            {/* Hero Profile Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card overflow-hidden"
            >
                <div className="h-48 bg-gradient-to-r from-primary/20 via-info/20 to-success/20 relative">
                    <div className="absolute inset-0 bg-grid-white/10" />
                </div>
                <div className="px-8 pb-8 -mt-24 relative z-10">
                    <div className="flex flex-col md:flex-row items-end gap-6">
                        <div className="relative group">
                            <Avatar className="w-40 h-40 border-8 border-card shadow-2xl">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-5xl font-bold font-display">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                            <Button size="icon" className="absolute bottom-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 space-y-2 mb-4 text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-4">
                                <h1 className="text-4xl font-display font-bold tracking-tight">
                                    {user?.email?.split("@")[0] || "User"}
                                </h1>
                                <Badge variant={role === "admin" ? "default" : "secondary"} className="text-sm font-bold px-3 py-1 uppercase tracking-wider">
                                    {role}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                <Mail className="w-4 h-4" />
                                {user?.email}
                            </p>
                        </div>
                        <Button
                            onClick={handleEdit}
                            className="mb-4 gap-2 px-6 py-6 rounded-2xl shadow-lg ring-offset-background transition-all hover:scale-105 active:scale-95"
                        >
                            <Edit2 className="w-4 h-4" />
                            Edit Profile
                        </Button>
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Account Details */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 space-y-6"
                >
                    <Card className="glass-card border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-display flex items-center gap-2">
                                <User className="w-5 h-5 text-primary" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Full Name</p>
                                <p className="font-semibold text-lg">{user?.email?.split("@")[0] || "User"}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Role</p>
                                <p className="font-semibold text-lg capitalize">{role}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Join Date</p>
                                <p className="font-semibold text-lg">January 2024</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Account Status</p>
                                <Badge className="bg-success/20 text-success border-success/30 px-3 py-1">Active</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Quick Stats/Activities */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    <Card className="glass-card border-none shadow-xl">
                        <CardHeader>
                            <CardTitle className="font-display flex items-center gap-2">
                                <Shield className="w-5 h-5 text-warning" />
                                Security
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                <p className="text-sm font-bold">Two-Factor Auth</p>
                                <p className="text-xs text-muted-foreground mb-3">Add an extra layer of security</p>
                                <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={() => toast.info("2FA Settings coming soon")}>Enable</Button>
                            </div>
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                                <p className="text-sm font-bold">Last Login</p>
                                <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Just now
                                </p>
                                <Button variant="outline" size="sm" className="w-full rounded-lg" onClick={() => toast.info("Login logs coming soon")}>View Logs</Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
