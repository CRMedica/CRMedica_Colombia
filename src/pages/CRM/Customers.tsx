import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Building2, 
  FileText, 
  X, 
  Loader2,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Customer } from "../../types";
import { api } from "../../lib/api";

const DEPARTMENTS = [
  "Bogotá D.C.",
  "Antioquia",
  "Valle del Cauca",
  "Atlántico",
  "Santander",
  "Bolívar",
  "Cundinamarca",
  "Risaralda"
];

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Customer>>({
    name: "",
    document_type: "NIT",
    document_id: "",
    phone: "",
    email: "",
    address: "",
    city: "Bogotá",
    department: "Bogotá D.C.",
    status: "active"
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await api.get("/customers");
      if (data && data.length > 0) {
        setCustomers(data);
      } else {
        throw new Error("Empty customers in database. Fallback to seed.");
      }
    } catch (err) {
      console.log("Setting seed customers...");
      setCustomers([
        {
          id: "c1",
          name: "Fundación Neumológica de Colombia",
          document_type: "NIT",
          document_id: "860.034.908-2",
          phone: "+57 (601) 742-8900",
          email: "compras@neumologica.org",
          address: "Calle 163a # 13-60",
          city: "Bogotá",
          department: "Bogotá D.C.",
          status: "active"
        },
        {
          id: "c2",
          name: "IPS Neumored SAS",
          document_type: "NIT",
          document_id: "901.442.115-4",
          phone: "320 890 1212",
          email: "gerencia@neumored.co",
          address: "Avenida 4N # 23N-50",
          city: "Cali",
          department: "Valle del Cauca",
          status: "active"
        },
        {
          id: "c3",
          name: "Clínica Respirar con Dignidad",
          document_type: "NIT",
          document_id: "800.224.510-1",
          phone: "318 456 2200",
          email: "servicio@respirardignidad.com",
          address: "Carrera 43A # 14-20, El Poblado",
          city: "Medellín",
          department: "Antioquia",
          status: "active"
        },
        {
          id: "c4",
          name: "IPS Oxiseguridad de la Costa",
          document_type: "NIT",
          document_id: "900.512.980-3",
          phone: "301 556 7788",
          email: "mantenimiento@oxiseguridad.com",
          address: "Calle 72 # 53-12",
          city: "Barranquilla",
          department: "Atlántico",
          status: "inactive"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({
      name: "",
      document_type: "NIT",
      document_id: "",
      phone: "",
      email: "",
      address: "",
      city: "Bogotá",
      department: "Bogotá D.C.",
      status: "active"
    });
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de de activar/desactivar o eliminar este cliente?")) return;
    try {
      await api.delete(`/customers/${id}`);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setCustomers(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: String(formData.name || "").trim(),
        document_type: String(formData.document_type || "NIT"),
        document_id: String(formData.document_id || "").trim(),
        phone: String(formData.phone || "").trim(),
        email: String(formData.email || "").trim(),
        address: String(formData.address || "").trim(),
        city: String(formData.city || "Bogotá").trim(),
        department: String(formData.department || "Bogotá D.C."),
        status: formData.status || "active"
      };

      if (editingId) {
        let result;
        try {
          result = await api.put(`/customers/${editingId}`, payload);
        } catch (e) {
          result = { ...payload, id: editingId };
        }
        setCustomers(prev => prev.map(c => c.id === editingId ? { ...c, ...result } : c));
      } else {
        let result;
        try {
          result = await api.post("/customers", payload);
        } catch (e) {
          result = { ...payload, id: "local_" + Date.now() };
        }
        setCustomers(prev => [result, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error al guardar: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
      c.document_id.includes(search) || 
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()));
    
    const matchesDept = selectedDept ? c.department === selectedDept : true;
    return matchesSearch && matchesDept;
  });

  const totalClients = customers.length;
  const activeClients = customers.filter(c => c.status === "active").length;
  const inactiveClients = totalClients - activeClients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Directorio de Clientes IPS/EPS</h1>
          <p className="text-slate-500 text-sm">Registro centralizado para clínicas, deudores de equipos y pacientes domiciliarios.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 self-start sm:self-center"
        >
          <Plus size={18} /> Registrar Cliente
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Clientes</p>
            <p className="text-2xl font-extrabold text-slate-800">{totalClients}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase font-sans">Activos Oficiales</p>
            <p className="text-2xl font-extrabold text-slate-800">{activeClients}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Inactivos / Alerta</p>
            <p className="text-2xl font-extrabold text-slate-800">{inactiveClients}</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por Nombre, NIT, ID, Ciudad..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-sm focus:bg-white focus:border-blue-200 outline-hidden transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200/50 border-transparent border rounded-xl text-xs font-bold text-slate-600 outline-hidden cursor-pointer"
          >
            <option value="">Todos los Departamentos</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-4">Razón Social / Médico</th>
                <th className="px-6 py-4">Identificación</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Contacto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-none">{customer.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{customer.address || 'Sin dirección registrada'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">
                    <span className="font-bold text-slate-400 mr-1">{customer.document_type}:</span>
                    {customer.document_id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-600 font-semibold text-xs">
                      <MapPin size={14} className="text-slate-400" />
                      {customer.city}, {customer.department}
                    </div>
                  </td>
                  <td className="px-6 py-4 space-y-1">
                    {customer.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Phone size={12} className="text-slate-400" />
                        {customer.phone}
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Mail size={12} className="text-slate-400" />
                        {customer.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                      customer.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                      {customer.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(customer)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(customer.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
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

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Actualizar Cliente" : "Registrar Nuevo Cliente"}</h2>
                  <p className="text-xs text-slate-400 font-bold">Información de facturación oficial y canales de correspondencia de soporte.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo o Razón Social (IPS)</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej. Clínica El Country SAS"
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Identificación</label>
                    <select
                      value={formData.document_type || "NIT"}
                      onChange={(e) => setFormData(prev => ({ ...prev, document_type: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      <option value="NIT">NIT (Empresas)</option>
                      <option value="CC">Cédula de Ciudadanía (CC)</option>
                      <option value="CE">Cédula de Extranjería (CE)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número de Identificación (con Dígito de Verificación)</label>
                    <input 
                      type="text" 
                      required
                      value={formData.document_id || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, document_id: e.target.value }))}
                      placeholder="Ej. 901.234.567-8"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número Telefónico</label>
                    <input 
                      type="text" 
                      value={formData.phone || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ej. +57 321 445 6677"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email de Compras/Contacto</label>
                    <input 
                      type="email" 
                      value={formData.email || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="compras@clinica.com"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección de Sede / Envío</label>
                    <input 
                      type="text" 
                      value={formData.address || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Calle 127 # 45-20, Consultorio 301"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ciudad</label>
                    <input 
                      type="text" 
                      value={formData.city || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="Bogotá"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Departamento</label>
                    <select
                      value={formData.department || "Bogotá D.C."}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado de Cuenta</label>
                    <select
                      value={formData.status || "active"}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Customer['status'] }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      <option value="active">Activo / Operacional</option>
                      <option value="inactive">Bloqueado / En Alerta de Cobro</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xs"
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    {editingId ? "Guardar Cambios" : "Guardar Cliente"}
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
