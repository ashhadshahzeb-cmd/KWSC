import { Bell, Search, User, LogOut, Settings, Menu } from "lucide-react";
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
import { useTheme } from "next-themes";
import { Moon, Sun, CheckCheck, Trash2, Clock } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header = ({ onMenuClick }: HeaderProps) => {
  const { user, role, signOut } = useAuth();
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
    <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-40">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="lg:hidden hover:bg-primary/10 transition-colors"
      >
        <Menu className="h-5 w-5 text-muted-foreground" />
      </Button>

      {/* Search - Hidden on mobile */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search patients, records..."
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      {/* Branding for mobile */}
      <div className="md:hidden flex items-center gap-2 flex-1 justify-center sm:justify-start">
        <h1 className="font-display font-bold text-sm text-primary tracking-tight">KWSC</h1>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Badge - Hidden on small mobile */}
        <Badge variant={role === "admin" ? "default" : "secondary"} className="capitalize hidden sm:flex">
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
                <span className="absolute top-2 right-2 w-4 h-4 bg-destructive text-[10px] text-white flex items-center justify-center rounded-full border-2 border-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 glass-card p-0 border-border/50 overflow-hidden mt-2">
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
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Mark all as read
                </Button>
              )}
            </div>

            <ScrollArea className="h-[350px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center p-4">
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 transition-colors cursor-pointer hover:bg-primary/5 relative ${n.status === 'unread' ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-sm font-semibold">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{n.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-2 border-t border-border/50 bg-muted/20">
              <Button variant="ghost" size="sm" onClick={clearAll} className="h-9 w-full text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-1 sm:px-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-medium truncate max-w-[100px]">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-[10px] text-muted-foreground capitalize leading-none">{role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card !p-1 border-border/50 mt-2">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 rounded-lg m-1" onSelect={() => navigate("/profile")}>
              <User className="mr-3 h-4 w-4 text-primary" /> <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer focus:bg-primary/10 rounded-lg m-1" onSelect={() => navigate("/settings")}>
              <Settings className="mr-3 h-4 w-4 text-primary" /> <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive/10 rounded-lg m-1">
              <LogOut className="mr-3 h-4 w-4" /> <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
