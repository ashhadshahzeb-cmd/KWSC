import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type UserRole = "admin" | "user";

interface User {
  id: number | string;
  email: string;
  name: string;
  role: UserRole;
  empNo?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: UserRole | null;
  permissions: string[];
  customFields: any[];
  componentSettings: any[];
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  signOut: () => void;
  signUp: (userData: any) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string, deviceToken?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUserData: () => Promise<void>;
  toggleComponent: (name: string, enabled: boolean) => Promise<void>;
  addFieldLocally: (field: any) => void;
  deleteFieldLocally: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<any[]>(() => {
    const saved = localStorage.getItem("custom_fields");
    return saved ? JSON.parse(saved) : [];
  });
  const [componentSettings, setComponentSettings] = useState<any[]>(() => {
    const saved = localStorage.getItem("component_settings");
    return saved ? JSON.parse(saved) : [
      { component_name: "Patients", is_enabled: true },
      { component_name: "Medicine", is_enabled: true },
      { component_name: "Hospital", is_enabled: true },
      { component_name: "Laboratory", is_enabled: true },
      { component_name: "Monthly Cycle", is_enabled: true },
      { component_name: "Reports", is_enabled: true },
      { component_name: "Device Management", is_enabled: true }
    ];
  });

  const toggleComponent = async (name: string, enabled: boolean) => {
    const newSettings = componentSettings.map(s =>
      s.component_name === name ? { ...s, is_enabled: enabled } : s
    );
    if (!newSettings.find(s => s.component_name === name)) {
      newSettings.push({ component_name: name, is_enabled: enabled });
    }
    setComponentSettings(newSettings);
    localStorage.setItem("component_settings", JSON.stringify(newSettings));
  };

  const addFieldLocally = (field: any) => {
    const newFields = [...customFields, { ...field, id: Math.random().toString(36).substr(2, 9) }];
    setCustomFields(newFields);
    localStorage.setItem("custom_fields", JSON.stringify(newFields));
  };

  const deleteFieldLocally = (id: string) => {
    const newFields = customFields.filter(f => f.id !== id);
    setCustomFields(newFields);
    localStorage.setItem("custom_fields", JSON.stringify(newFields));
  };

  const refreshUserData = async () => {
    // Check localStorage for user
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRole(userData.role);

        // Set all permissions for admin
        if (userData.role === 'admin') {
          setPermissions(['patients', 'medicine', 'hospital', 'laboratory', 'monthly_cycle', 'reports', 'devices']);
        } else {
          setPermissions(['patients', 'medicine', 'hospital', 'laboratory']);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  };

  useEffect(() => {
    // Check for user in localStorage on mount
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setRole(userData.role);

        // Set permissions based on role
        if (userData.role === 'admin') {
          setPermissions(['patients', 'medicine', 'hospital', 'laboratory', 'monthly_cycle', 'reports', 'devices']);
        } else {
          setPermissions(['patients', 'medicine', 'hospital', 'laboratory']);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }

    setLoading(false);
  }, []);

  const signOut = () => {
    localStorage.removeItem("user");
    setUser(null);
    setRole(null);
    setPermissions([]);
  };

  const signUp = async (userData: any) => {
    try {
      const { sqlApi } = await import("@/lib/api");
      const result = await sqlApi.auth.signup(userData);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const login = async (email: string, password: string, deviceToken?: string) => {
    try {
      const { sqlApi } = await import("@/lib/api");
      const result = await sqlApi.auth.login(email, password, deviceToken);
      if (result.success) {
        localStorage.setItem("user", JSON.stringify(result.user));
        setUser(result.user);
        setRole(result.user.role);
        return { success: true };
      }
      return { success: false, error: "Invalid credentials" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const isAdmin = role === "admin";

  const hasPermission = (permission: string) => {
    if (isAdmin) return true;
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role,
        permissions,
        customFields,
        componentSettings,
        isAdmin,
        hasPermission,
        signOut,
        signUp,
        login,
        refreshUserData,
        toggleComponent,
        addFieldLocally,
        deleteFieldLocally,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
