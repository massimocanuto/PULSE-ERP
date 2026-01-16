import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: string;
  department: string | null;
  status: string;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("pulse_erp_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("pulse_erp_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Heartbeat to track online users
  useEffect(() => {
    if (!user) return;
    
    const sendHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    };
    
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        localStorage.setItem("pulse_erp_user", JSON.stringify(data.user));
        return { success: true };
      }

      return { success: false, error: data.error || "Login failed" };
    } catch (error) {
      return { success: false, error: "Connection error" };
    }
  };

  const logout = async () => {
    // Notifica il server per rimuovere l'utente dalla lista online
    if (user?.id) {
      try {
        await fetch("/api/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch {}
    }
    setUser(null);
    localStorage.removeItem("pulse_erp_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser() {
  const { user, ...rest } = useAuth();
  const setUser = (newUser: any) => {
    localStorage.setItem("pulse_erp_user", JSON.stringify(newUser));
    window.location.reload();
  };
  return { user, setUser, ...rest };
}
