import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const recentPatients = [
  { id: "EMP001", name: "Ahmed Hassan", type: "Self", treatment: "General Checkup", time: "2 hours ago", status: "completed" },
  { id: "EMP002", name: "Fatima Ali", type: "Family", treatment: "Dental", time: "3 hours ago", status: "in-progress" },
  { id: "EMP003", name: "Muhammad Khan", type: "Self", treatment: "Cardiology", time: "4 hours ago", status: "completed" },
  { id: "EMP004", name: "Aisha Begum", type: "Family", treatment: "Pediatrics", time: "5 hours ago", status: "pending" },
  { id: "EMP005", name: "Omar Farooq", type: "Self", treatment: "Orthopedics", time: "6 hours ago", status: "completed" },
];

const statusConfig = {
  "completed": {
    class: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
    label: "Completed"
  },
  "in-progress": {
    class: "bg-warning/10 text-warning border-warning/20",
    icon: Loader2,
    label: "In Progress"
  },
  "pending": {
    class: "bg-muted text-muted-foreground border-border",
    icon: Clock,
    label: "Pending"
  },
};

const avatarColors = [
  "bg-primary/10 text-primary",
  "bg-info/10 text-info",
  "bg-success/10 text-success",
  "bg-warning/10 text-warning",
  "bg-destructive/10 text-destructive",
];

const RecentPatients = ({ activities }: { activities?: any[] }) => {
  const { isAdmin } = useAuth();
  const displayData = activities || recentPatients;

  return (
    <div className="h-full flex flex-col p-2">
      <div className="flex items-center justify-between mb-8 px-4">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground tracking-tight">
            {activities ? 'My Recent Visits' : 'Recent Activity'}
          </h3>
          <p className="text-sm text-muted-foreground font-medium">
            {activities ? 'Your latest medical history' : 'Monitoring latest patient flows'}
          </p>
        </div>
        <Link to={isAdmin ? "/patients" : "/medical-card"}>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 shadow-sm">
            {isAdmin ? 'Explore All' : 'View Card'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-hide">
        {displayData.map((item, index) => {
          const status = statusConfig[(item.status || 'completed') as keyof typeof statusConfig];
          const StatusIcon = status.icon;

          return (
            <motion.div
              key={item.id || item.serial_no}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-center gap-5 p-5 rounded-[1.5rem] bg-card hover:bg-muted/50 transition-all duration-500 border border-border/50 hover:border-primary/20 hover:shadow-xl cursor-pointer relative overflow-hidden"
            >
              <Avatar className="w-14 h-14 ring-4 ring-border/30 group-hover:ring-primary/20 transition-all duration-500 transform group-hover:scale-110 shadow-md">
                <AvatarFallback className={`font-bold text-lg ${avatarColors[index % avatarColors.length]}`}>
                  {(item.name || item.patient_name || 'U').split(' ').map((n: any) => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1.5">
                  <p className="font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                    {item.name || item.patient_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <span className="text-primary/70">{item.id || item.emp_no}</span>
                  <span className="w-1 h-1 bg-border rounded-full" />
                  <span className="truncate">{item.treatment || 'Medical Visit'}</span>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <Badge variant="outline" className={cn(
                  "gap-2 px-3 py-1.5 rounded-full font-bold text-xs border shadow-sm",
                  status.class
                )}>
                  <StatusIcon className="w-3.5 h-3.5" />
                  {status.label}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                  <Clock className="w-3 h-3" />
                  {item.time || new Date(item.visit_date).toLocaleDateString()}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentPatients;
