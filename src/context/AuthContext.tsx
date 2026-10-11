import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { SellerProfile } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: SellerProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from("seller_profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Erreur lors du chargement du profil:", error.message);
      return null;
    }
    return data;
  }

  async function refreshProfile() {
    if (user) {
      const p = await fetchProfile(user.id);
      setProfile(p);
    }
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        setIsAdmin(session.user.app_metadata?.role === "admin");
        fetchProfile(session.user.id).then((p) => {
          if (mounted) {
            setProfile(p);
            setLoading(false);
          }
        });
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        (async () => {
          if (!mounted) return;
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newSession?.user) {
            setIsAdmin(newSession.user.app_metadata?.role === "admin");
            const p = await fetchProfile(newSession.user.id);
            if (mounted) setProfile(p);
          } else {
            setProfile(null);
            setIsAdmin(false);
          }
          setLoading(false);
        })();
      }
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, displayName: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        await supabase.from("seller_profiles").insert({
          id: data.user.id,
          display_name: displayName,
        });
      }
      return { error: null };
    } catch (err) {
      return { error: "Une erreur inattendue s'est produite." };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    } catch {
      return { error: "Une erreur inattendue s'est produite." };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isAdmin, loading, signUp, signIn, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return ctx;
}
