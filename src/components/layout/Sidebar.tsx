import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Pill,
  Building2,
  FlaskConical,
  CalendarClock,
  FileText,
  Shield,
  ChevronLeft,
  Activity,
  UserCog,

  CreditCard,
  MessageSquare,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", permission: null },
  { icon: Users, label: "Patients", path: "/patients", permission: "patients" },
  { icon: Pill, label: "Medicine", path: "/medicine", permission: "medicine" },
  { icon: Building2, label: "Hospital", path: "/hospital", permission: "hospital" },
  { icon: FlaskConical, label: "Laboratory", path: "/laboratory", permission: "laboratory" },
  { icon: FileText, label: "Note Sheet", path: "/note-sheet", permission: "medicine" },
  { icon: FileText, label: "Reports", path: "/reports", permission: "reports" },
  { icon: Shield, label: "Device Management", path: "/devices", permission: "devices" },
  { icon: Users, label: "Employee Entry", path: "/employee-entry", permission: "medicine" },
  { icon: CreditCard, label: "Medical Card", path: "/medical-card", permission: null },
  { icon: Receipt, label: "Reimbursement", path: "/claims", permission: null },
];

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { isAdmin, componentSettings } = useAuth();

  // Filter menu items based on setting values from DB
  const menuItems = allMenuItems.filter(item => {
    const setting = componentSettings.find(s => s.component_name === item.label);
    return setting ? setting.is_enabled : true;
  });

  return (
    <motion.aside
      initial={false}
      animate={{
        width: collapsed ? 80 : 256,
        x: (window.innerWidth < 1024 && collapsed) ? -80 : 0
      }}
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar z-[60] flex flex-col transition-transform duration-300 lg:translate-x-0",
        collapsed && "translate-x-[-100%] lg:translate-x-0"
      )}
      style={{ background: "var(--gradient-sidebar)" }}
    >
      {/* Overlay for mobile when sidebar is open */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-[-1]"
          onClick={onToggle}
        />
      )}

      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
          <Activity className="w-6 h-6 text-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1"
            >
              <h1 className="font-display font-bold text-lg text-sidebar-foreground">KWSC-Medical</h1>
              <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-tighter">Management System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onToggle();
              }}
              className={cn(
                "sidebar-item",
                isActive && "active"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </Link>
          );
        })}

        {/* Admin Only sections */}
        {isAdmin && (
          <div className="pt-4 mt-4 border-t border-sidebar-border/30">
            {!collapsed && <p className="px-4 mb-2 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Admin Control</p>}

            <Link
              to="/users"
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={cn("sidebar-item", location.pathname === "/users" && "active")}
            >
              <UserCog className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Users</motion.span>}
            </Link>

            <Link
              to="/all-employees"
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={cn("sidebar-item", location.pathname === "/all-employees" && "active")}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Employees</motion.span>}
            </Link>

            <Link
              to="/admin-chat"
              onClick={() => window.innerWidth < 1024 && onToggle()}
              className={cn("sidebar-item", location.pathname === "/admin-chat" && "active")}
            >
              <MessageSquare className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Support</motion.span>}
            </Link>
          </div>
        )}
      </nav>

      {/* Collapse Button - Hidden on mobile as we use hamburger */}
      <div className="p-4 border-t border-sidebar-border hidden lg:block">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={cn("w-5 h-5 transition-transform", collapsed && "rotate-180")} />
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
