import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Loader2, AlertCircle, CheckCircle, LockKeyhole } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Buscar el access_token tanto en hash como en query params
    const getTokens = () => {
      let tokenValue = null;

      // 1. Intentar desde el hash (#access_token=...)
      const hash = window.location.hash;
      if (hash) {
        // Quitar el '#' de adelante y parsear
        const params = new URLSearchParams(hash.substring(1));
        tokenValue = params.get("access_token");
      }

      // 2. Intentar desde query params (?access_token=...)
      if (!tokenValue) {
        const queryParams = new URLSearchParams(window.location.search);
        tokenValue = queryParams.get("access_token");
      }

      if (tokenValue) {
        setAccessToken(tokenValue);
      } else {
        setError("No se encontró el token de seguridad para restablecer la contraseña. Solicita un nuevo correo.");
      }
    };

    getTokens();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!accessToken) {
      setError("No hay un token de seguridad activo. Por favor vuelve a solicitar el enlace.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          access_token: accessToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al restablecer contraseña");
      }

      setSuccess("¡Contraseña restablecida con éxito! Ya puedes iniciar sesión de forma segura.");
      
      // Auto redirigir en 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo actualizar la contraseña. Podría ser que el enlace ya expiró.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="reset-password-page" className="bg-slate-50 text-slate-900 min-h-screen font-sans flex flex-col justify-center items-center px-4 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] left-[15%] w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-4 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <LockKeyhole size={24} />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">Establecer Nueva Contraseña</h1>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Ingresa y confirma tu nueva contraseña de acceso.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 pt-0">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-xs"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 animate-bounce" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                key="success-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-2xl flex items-start gap-3 text-green-700 text-xs"
              >
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">{success}</p>
                  <p className="text-[10px] text-green-600">Redirigiéndote al portal de inicio de sesión...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && accessToken && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Nueva Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Contraseña (mínimo 6 caracteres)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Confirmar Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all text-slate-800 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Guardando Cambios...
                  </>
                ) : (
                  "Establecer Contraseña"
                )}
              </button>
            </form>
          )}

          {!accessToken && !error && (
            <div className="py-6 flex flex-col items-center justify-center text-slate-400">
              <Loader2 size={24} className="animate-spin text-blue-600 mb-3" />
              <p className="text-xs">Validando token de seguridad...</p>
            </div>
          )}

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <Link to="/login" className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
              Ir a la pantalla de Inicio de Sesión
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
