import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: LucideIcon;
  color: "primary" | "info" | "success" | "warning";
  description?: string;
}

const colorClasses = {
  primary: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)]",
    ring: "ring-primary/20",
  },
  info: {
    bg: "bg-info/10",
    text: "text-info",
    border: "border-info/20",
    gradient: "from-info/20 via-info/10 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_hsl(var(--info)/0.25)]",
    ring: "ring-info/20",
  },
  success: {
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/20",
    gradient: "from-success/20 via-success/10 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_hsl(var(--success)/0.25)]",
    ring: "ring-success/20",
  },
  warning: {
    bg: "bg-warning/10",
    text: "text-warning",
    border: "border-warning/20",
    gradient: "from-warning/20 via-warning/10 to-transparent",
    glow: "group-hover:shadow-[0_0_40px_hsl(var(--warning)/0.25)]",
    ring: "ring-warning/20",
  },
};

const StatsCard = ({ title, value, change, icon: Icon, color, description }: StatsCardProps) => {
  const isPositive = change.startsWith("+");
  const colorStyle = colorClasses[color];

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative overflow-hidden rounded-[2rem] bg-card border p-8 transition-all duration-500",
        colorStyle.border,
        colorStyle.glow
      )}
    >
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

      {/* Floating Sparkle Elements */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-700 transform group-hover:rotate-12">
        <div className={cn("w-20 h-20 rounded-full blur-3xl", colorStyle.bg)} />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-8">
          {/* Icon with Glowing Ring */}
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center ring-8 transition-all duration-300 shadow-lg",
              colorStyle.bg,
              colorStyle.ring
            )}
          >
            <Icon className={cn("w-8 h-8", colorStyle.text)} />
          </motion.div>

          {/* Change Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border backdrop-blur-md",
              isPositive
                ? "bg-success/10 text-success border-success/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
          >
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </motion.div>
        </div>

        <div className="mt-auto space-y-2">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.1em]">{title}</p>
          <div className="flex items-baseline gap-2">
            <motion.p
              className="text-5xl font-display font-extrabold text-foreground tracking-tighter"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {value}
            </motion.p>
          </div>
          {description && (
            <p className="text-xs text-muted-foreground/60 font-medium border-t border-border/50 pt-3 mt-4">
              {description}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
