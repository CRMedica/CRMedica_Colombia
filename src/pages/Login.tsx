import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TrendingUp, Mail, Lock, Loader2, AlertCircle, User, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LoginProps {
  onLogin: (token: string, user: any) => void;
}

type Mode = "login" | "register" | "forgot";

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<Mode>("login");

  // ── Estado login ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Estado registro ──
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  // ── Estado recuperar contraseña ──
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const resetMessages = () => { setError(""); setSuccess(""); };

  const switchMode = (m: Mode) => { resetMessages(); setForgotSent(false); setMode(m); };

  // ── LOGIN ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al iniciar sesión");
      onLogin(data.token, data.user);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTRO ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (regPassword !== regPassword2) { setError("Las contraseñas no coinciden."); return; }
    if (regPassword.length < 8) { setError("La contraseña debe tener mínimo 8 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail, password: regPassword, full_name: regName, role: "sales" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear la cuenta");
      setSuccess("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.");
      setEmail(regEmail);
      setMode("login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── RECUPERAR CONTRASEÑA ──
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true); 
    } catch {
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  // ── OAUTH Popup Logic ──
  const handleOAuth = async (provider: string) => {
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch(`/api/auth/oauth-url?provider=${provider}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al obtener URL de autenticación");

      const authWindow = window.open(data.url, "oauth_popup", "width=600,height=700");
      if (!authWindow) {
        throw new Error("El navegador bloqueó la ventana emergente. Por favor actívalas.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleLoginSuccess = (data: any) => {
      if (data.type === "OAUTH_AUTH_SUCCESS") {
        const { payload } = data;
        if (payload.error) {
          setError(payload.error);
          setLoading(false);
        } else if (payload.token) {
          onLogin(payload.token, payload.user);
          navigate("/dashboard");
        }
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith(".run.app") && !event.origin.includes("localhost")) return;
      handleLoginSuccess(event.data);
    };

    // Listen for cross-window messages via BroadcastChannel
    const bc = new BroadcastChannel('oauth_channel');
    bc.onmessage = (event) => {
      handleLoginSuccess(event.data);
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      bc.close();
    };
  }, [navigate, onLogin]);

  const titles: Record<Mode, { title: string; subtitle: string }> = {
    login:    { title: "Bienvenido de nuevo",  subtitle: "Accede al CRM de RespiraCRM Colombia" },
    register: { title: "Crear cuenta",          subtitle: "Únete a RespiraCRM Colombia" },
    forgot:   { title: "Recuperar contraseña",  subtitle: "Te enviaremos un enlace a tu correo" },
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
            <TrendingUp size={24} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="text-2xl font-bold text-slate-800">{titles[mode].title}</h2>
              <p className="text-slate-500 text-sm mt-2">{titles[mode].subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 space-y-5">
          {/* Mensajes error / éxito */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm"
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl flex items-center gap-3 text-sm"
              >
                <CheckCircle size={18} /> {success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════ LOGIN ══════════════ */}
          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.form
                key="login"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Iniciar Sesión"}
                </button>

                <div className="text-center space-y-4">
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="text-sm text-slate-500 hover:text-blue-600 font-medium"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-slate-400">O ingresa con</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button" 
                      onClick={() => handleOAuth("google")}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-4 h-4" /> Google
                    </button>
                    <button
                      type="button" 
                      onClick={() => handleOAuth("azure")}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <img src="https://www.microsoft.com/favicon.ico" className="w-4 h-4" /> Microsoft
                    </button>
                  </div>
                </div>
              </motion.form>
            )}

            {/* ══════════════ REGISTRO ══════════════ */}
            {mode === "register" && (
              <motion.form
                key="register"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="Juan Pérez" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ejemplo@empresa.com" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 ml-1">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password" value={regPassword2} onChange={(e) => setRegPassword2(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Crear cuenta"}
                </button>
              </motion.form>
            )}

            {/* ══════════════ RECUPERAR CONTRASEÑA ══════════════ */}
            {mode === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                {forgotSent ? (
                  <div className="text-center space-y-3 py-6">
                    <CheckCircle className="mx-auto text-green-500" size={48} />
                    <p className="font-semibold text-slate-800">¡Correo enviado!</p>
                    <p className="text-sm text-slate-500">
                      Si <strong>{forgotEmail}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">Tu correo registrado</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="ejemplo@empresa.com" required
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    <button
                      type="submit" disabled={loading}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : "Enviar enlace de recuperación"}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ══════════════ NAVEGACIÓN ENTRE MODOS ══════════════ */}
          <div className="text-center text-sm text-slate-500 pt-2">
            {mode === "login" && (
              <p>¿No tienes cuenta?{" "}
                <button onClick={() => switchMode("register")} className="text-blue-600 font-semibold hover:underline">
                  Crear cuenta
                </button>
              </p>
            )}
            {mode === "register" && (
              <p>¿Ya tienes cuenta?{" "}
                <button onClick={() => switchMode("login")} className="text-blue-600 font-semibold hover:underline">
                  Iniciar sesión
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => switchMode("login")} className="text-blue-600 font-semibold hover:underline">
                ← Volver al inicio de sesión
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Al ingresar, aceptas nuestros{" "}
            <Link to="/legal/terms" className="underline">Términos y Condiciones</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
