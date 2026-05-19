import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  hasAccessToken,
  changePassword as apiChangePassword,
  me,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  type AuthUser,
  type Profile,
  type SignInResponse,
} from "@/services/backendApi";

const PASSWORD_CHANGE_TOKEN_KEY = "appraisal360_password_change_token";

function getPasswordChangeToken(): string | null {
  return sessionStorage.getItem(PASSWORD_CHANGE_TOKEN_KEY);
}

function setPasswordChangeToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(PASSWORD_CHANGE_TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(PASSWORD_CHANGE_TOKEN_KEY);
  }
}

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  loading: boolean;
  mustChangePassword: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const pendingToken = getPasswordChangeToken();
      if (pendingToken) {
        setMustChangePassword(true);
        setLoading(false);
        return;
      }

      if (!hasAccessToken()) {
        setLoading(false);
        return;
      }

      try {
        const data = await me();
        setUser(data.user);
        setProfile(data.profile);
        setSession({ access_token: "present" });
      } catch {
        setUser(null);
        setProfile(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    const data = await apiSignUp(email, password, displayName);
    setUser(data.user);
    setProfile(data.profile);
    setSession({ access_token: data.access_token });
  };

  const signIn = async (email: string, password: string) => {
    const data: SignInResponse = await apiSignIn(email, password);
    if (data.must_change_password && data.password_change_token) {
      setPasswordChangeToken(data.password_change_token);
      setMustChangePassword(true);
      setUser(null);
      setProfile(null);
      setSession(null);
      return;
    }

    if (data.access_token) {
      setUser(data.user);
      setProfile(data.profile);
      setSession({ access_token: data.access_token });
      setMustChangePassword(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    const token = getPasswordChangeToken();
    if (!token) throw new Error("Missing password change token");

    const data = await apiChangePassword(token, newPassword);
    setPasswordChangeToken(null);
    setMustChangePassword(false);
    setUser(data.user);
    setProfile(data.profile);
    setSession({ access_token: data.access_token });
  };

  const signOut = async () => {
    await apiSignOut();
    setPasswordChangeToken(null);
    setMustChangePassword(false);
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, mustChangePassword, signUp, signIn, changePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
