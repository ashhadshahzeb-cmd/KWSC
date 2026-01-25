import { Bell, Search, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Moon, Sun, CheckCheck, Trash2, Clock } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, role, signOut, isAdmin } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll
  } = useNotifications();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const getInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const handleNotificationClick = async (n: any) => {
    if (n.status === 'unread') {
      await markAsRead(n.id);
    }

    // Navigate based on type
    switch (n.type) {
      case 'new_user':
      case 'user_login':
        navigate("/users");
        break;
      case 'new_record':
        navigate("/sql-data");
        break;
      case 'new_patient':
        navigate("/patients");
        break;
      default:
        break;
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients, records..."
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize">
          {role || "User"}
        </Badge>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="hover:bg-primary/10 transition-colors"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-primary/10 transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-destructive text-[10px] text-white flex items-center justify-center rounded-full border-2 border-card animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 glass-card p-0 border-border/50 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                  className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" />
                  Mark all as read
                </Button>
              )}
            </div>

            <ScrollArea className="h-[350px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No notifications yet</p>
                  <p className="text-xs text-muted-foreground/70">We'll alert you when something happens.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 transition-colors cursor-pointer hover:bg-primary/5 relative group ${n.status === 'unread' ? 'bg-primary/5' : ''}`}
                    >
                      {n.status === 'unread' && (
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold leading-none ${n.status === 'unread' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className={`text-xs leading-normal pr-4 ${n.status === 'unread' ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-2 border-t border-border/50 bg-muted/20">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={clearAll}
                className="h-9 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Clear All Notifications
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 px-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium truncate max-w-[120px]">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card !p-1 border-border/50">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="cursor-pointer focus:bg-primary/10 rounded-lg m-1"
              onSelect={() => navigate("/profile")}
            >
              <User className="mr-3 h-4 w-4 text-primary" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-primary/10 rounded-lg m-1"
              onSelect={() => navigate("/settings")}
            >
              <Settings className="mr-3 h-4 w-4 text-primary" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive cursor-pointer focus:bg-destructive/10 rounded-lg m-1"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
