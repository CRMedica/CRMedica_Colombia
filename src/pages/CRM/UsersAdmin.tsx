import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  ShieldCheck, 
  UserPlus, 
  X, 
  Edit, 
  Trash2, 
  Loader2,
  Users,
  KeyRound,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../../types";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<User & { password?: string }>>({
    name: "",
    email: "",
    role: "sales",
    password: ""
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.get("/users");
      if (data && data.length > 0) {
        setUsers(data);
      } else {
        throw new Error("No users found");
      }
    } catch (err) {
      // Mock seed users representing the default group
      setUsers([
        { id: "u1", name: "Andrés Felipe Mendoza", email: "andres.mendoza@respiracrm.co", role: "admin" },
        { id: "u2", name: "Carlos Mario Rojas", email: "carlos.rojas@respiracrm.co", role: "sales" },
        { id: "u3", name: "Ing. Diego Alejandro", email: "diego.tecnico@respiracrm.co", role: "tech" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      email: "",
      role: "sales",
      password: ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de revocar permisos para este usuario?")) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };

      if (editingId) {
        setUsers(prev => prev.map(u => u.id === editingId ? { ...u, ...payload } : u));
      } else {
        setUsers(prev => [...prev, { ...payload, id: "u_" + Date.now() }]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Administración de Usuarios</h1>
          <p className="text-slate-500 text-sm">Gestiona ingenieros, asesores comerciales y administradores de la organización.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
        >
          <UserPlus size={18} /> Invitar Miembro
        </button>
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por Nombre o Email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-sm focus:bg-white focus:border-blue-200 outline-hidden transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Email Corporativo</th>
                <th className="px-6 py-4">Rol Asignado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{u.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider",
                      u.role === "admin" ? "bg-red-50 text-red-600 border-red-100" :
                      u.role === "tech" ? "bg-indigo-50 text-indigo-600 border-indigo-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {u.role === "admin" ? "ADMINISTRADOR" :
                       u.role === "tech" ? "TÉCNICO / INGENIERO" :
                       "ASESOR COMERCIAL"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Invitar Miembro</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Ing. Juan Gómez"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Corporativo</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="juan.gomez@respiracrm.co"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol Organizacional</label>
                  <select
                    value={formData.role || "sales"}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm"
                  >
                    <option value="sales">Asesor Comercial</option>
                    <option value="tech">Ingeniero / Técnico Biomédico</option>
                    <option value="admin">Administrador del Sistema</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
