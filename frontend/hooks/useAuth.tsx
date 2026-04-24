import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  hasAccessToken,
  me,
  signIn as apiSignIn,
  signOut as apiSignOut,
  signUp as apiSignUp,
  type AuthUser,
  type Profile,
} from "@/services/backendApi";

interface AuthContextType {
  user: AuthUser | null;
  session: { access_token: string } | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<{ access_token: string } | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
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
    const data = await apiSignIn(email, password);
    setUser(data.user);
    setProfile(data.profile);
    setSession({ access_token: data.access_token });
  };

  const signOut = async () => {
    await apiSignOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
