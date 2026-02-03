import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Mail, Lock, Eye, EyeOff, Loader2, Phone, CheckCircle2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string().min(5, "Password must be at least 5 characters");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    empNo: "",
    phone: "",
    otpCode: ""
  });
  const [isOTPStep, setIsOTPStep] = useState(false);
  const [isOTPVerified, setIsOTPVerified] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string; phone?: string; otp?: string }>({});

  const validateEmail = (email: string) => {
    try {
      emailSchema.parse(email);
      return null;
    } catch (e) {
      if (e instanceof z.ZodError) return e.errors[0].message;
      return "Invalid email";
    }
  };

  const validatePassword = (password: string) => {
    try {
      passwordSchema.parse(password);
      return null;
    } catch (e) {
      if (e instanceof z.ZodError) return e.errors[0].message;
      return "Invalid password";
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError || undefined, password: passwordError || undefined });
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(formData.email, formData.password, "web-access");
        if (result.success) {
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          window.location.href = "/";
        } else {
          throw new Error(result.error);
        }
      } else {
        if (!isOTPVerified) {
          // Trigger OTP Send if not yet in OTP step
          if (!isOTPStep) {
            if (!formData.email) throw new Error("Email is required");
            await authApi.sendOTP(formData.email);
            setIsOTPStep(true);
            toast({ title: "OTP Sent!", description: "Please check your email (or server console if simulated)" });
            return;
          } else {
            // Verify OTP
            if (!formData.otpCode) throw new Error("Please enter the OTP code");
            await authApi.verifyOTP(formData.email, formData.otpCode);
            setIsOTPVerified(true);
            toast({ title: "Email Verified!", description: "Now creating your account..." });
            // Fallthrough to actual signup below
          }
        }

        const result = await signUp(formData);
        if (result.success) {
          toast({ title: "Account Created!", description: "Please log in now." });
          setIsLogin(true);
          setIsOTPStep(false);
          setIsOTPVerified(false);
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error: any) {
      toast({
        title: isLogin ? "Login Failed" : "Signup Failed",
        description: error.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden" style={{ background: "var(--gradient-sidebar)" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-info rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Activity className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-display font-bold text-sidebar-foreground mb-4">
              KWSC-Medical
            </h1>
            <p className="text-xl text-sidebar-foreground/70 mb-8">
              Medical Management System
            </p>
            <div className="space-y-4 text-left max-w-md">
              <div className="flex items-center gap-3 text-sidebar-foreground/80">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span>Complete Patient Management</span>
              </div>
              <div className="flex items-center gap-3 text-sidebar-foreground/80">
                <div className="w-2 h-2 rounded-full bg-info" />
                <span>Medicine & Pharmacy Tracking</span>
              </div>
              <div className="flex items-center gap-3 text-sidebar-foreground/80">
                <div className="w-2 h-2 rounded-full bg-success" />
                <span>Hospital & Lab Records</span>
              </div>
              <div className="flex items-center gap-3 text-sidebar-foreground/80">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <span>Comprehensive Reporting</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">KWSC-Medical</h1>
              <p className="text-xs text-muted-foreground">Management System</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-display font-bold text-foreground">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-muted-foreground">
                {isLogin ? "Sign in to your account" : "Join KWSC Medical System"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* LOGIN FIELDS */}
              {isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="auth-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="auth-email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auth-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="auth-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* SIGNUP FIELDS - STEP 1 (Details) */}
              {!isLogin && !isOTPStep && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-emp">Employee No (Optional)</Label>
                    <Input
                      id="signup-emp"
                      placeholder="EMP123"
                      value={formData.empNo}
                      onChange={(e) => setFormData({ ...formData, empNo: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* SIGNUP FIELDS - STEP 2 (OTP) */}
              {!isLogin && isOTPStep && !isOTPVerified && (
                <div className="space-y-4 p-4 bg-primary/5 rounded-xl border border-primary/20 animate-in zoom-in-95">
                  <div className="text-center space-y-1">
                    <Label className="text-primary font-bold">Enter 6-Digit OTP</Label>
                    <p className="text-xs text-muted-foreground">Sent to {formData.email}</p>
                  </div>
                  <Input
                    placeholder="123456"
                    value={formData.otpCode}
                    onChange={(e) => setFormData({ ...formData, otpCode: e.target.value })}
                    className="text-center text-2xl tracking-[0.5em] font-bold h-12"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => authApi.sendOTP(formData.email)}
                  >
                    Resend Code
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : (isOTPStep ? "Verifying..." : "Sending OTP...")}
                  </>
                ) : (
                  isLogin ? "Sign In" : (isOTPStep ? "Verify & Register" : "Get OTP & Sign Up")
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>

              {isLogin && (
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, email: "admin@kwsc.com", password: "Admin" })}
                    className="text-xs"
                  >
                    Admin Demo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, email: "user@gmail.com", password: "User123" })}
                    className="text-xs"
                  >
                    User Demo
                  </Button>
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
