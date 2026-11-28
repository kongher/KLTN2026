import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, ProfileUser, UserRole } from "../types/auth";
import { clearStoredToken, getStoredToken } from "../services/api";
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  registerRequest,
  verifyEmailOtpRequest,
  type RegisterOtpPending,
} from "../services/authService";

type AuthContextValue = {
  user: ProfileUser | AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Promise<RegisterOtpPending>;
  verifyEmailOtp: (payload: { email: string; otp: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: ProfileUser | AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function dashboardPath(role: UserRole) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "STAFF") return "/staff/dashboard";
  return "/customer/dashboard";
}

export function getDashboardPath(role: UserRole) {
  return dashboardPath(role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ProfileUser | AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const stored = getStoredToken();
    if (!stored) {
      setUser(null);
      setToken(null);
      return;
    }

    const profile = await fetchMe();
    setUser(profile);
    setToken(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        if (getStoredToken()) {
          await refreshUser();
        }
      } catch {
        clearStoredToken();
        if (!cancelled) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  useEffect(() => {
    function onUnauthorized() {
      setUser(null);
      setToken(null);
    }

    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await loginRequest(identifier, password);
    setUser(data.user);
    setToken(getStoredToken());
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => registerRequest(payload),
    []
  );

  const verifyEmailOtp = useCallback(async (payload: { email: string; otp: string }) => {
    const data = await verifyEmailOtpRequest(payload);
    setUser(data.user);
    setToken(getStoredToken());
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      verifyEmailOtp,
      logout,
      refreshUser,
      setUser,
    }),
    [user, token, loading, login, register, verifyEmailOtp, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
