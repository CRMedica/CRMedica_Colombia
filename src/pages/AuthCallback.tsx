import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

interface AuthCallbackProps {
  onLogin: (token: string, user: any) => void;
}

export default function AuthCallback({ onLogin }: AuthCallbackProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        if (!supabase) {
          throw new Error("Supabase client is not initialized. Please check your environment variables.");
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!session) {
          console.log("No session found in callback, redirecting to login");
          navigate("/login");
          return;
        }

        const user = session.user;
        
        // Exchange Supabase session for our platform custom JWT
        const res = await fetch("/api/auth/oauth-exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email: user.email, 
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0], 
            role: "sales" 
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al sincronizar sesión");

        onLogin(data.token, data.user);
        navigate("/dashboard");
      } catch (err) {
        console.error("Auth Callback Error:", err);
        navigate("/login?error=auth_failed");
      }
    };

    handleAuth();
  }, [navigate, onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Autenticando...</h2>
        <p className="text-slate-500">Estamos verificando tus credenciales con Google</p>
      </div>
    </div>
  );
}
