import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Target, 
  User as UserIcon, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle,
  X,
  Loader2,
  KanbanSquare,
  List as ListIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Prospect } from "../../types";
import { api } from "../../lib/api";
import { formatCurrency, cn } from "../../lib/utils";

const SECTIONS: { status: Prospect['status']; label: string; color: string }[] = [
  { status: 'new', label: 'Nuevo', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { status: 'contacted', label: 'Contactado', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { status: 'qualified', label: 'Calificado', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { status: 'proposal', label: 'Propuesta', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { status: 'won', label: 'Ganado', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { status: 'lost', label: 'Perdido', color: 'bg-rose-50 text-rose-600 border-rose-100' }
];

export default function Prospects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<'pipeline' | 'table'>('pipeline');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Prospect>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    city: "Bogotá",
    source: "Recomendación Médica",
    product_of_interest: "",
    budget: 0,
    status: "new",
    notes: "",
    next_follow_up: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProspects();
  }, []);

  const fetchProspects = async () => {
    try {
      const data = await api.get("/prospects");
      if (data && data.length > 0) {
        setProspects(data);
      } else {
        throw new Error("No prospects found in database, creating mock data.");
      }
    } catch (err) {
      console.log("Using seed prospects...");
      setProspects([
        {
          id: "p1",
          name: "Dr. Felipe Restrepo - Neumólogo",
          company: "IPS CardioRespiratoria del Sur",
          email: "felipe.restrepo@ipsrespirar.com",
          phone: "312 456 7890",
          city: "Medellín",
          source: "Congreso de Neumología 2024",
          product_of_interest: "Concentrador de Oxígeno 10L",
          budget: 12000000,
          status: "qualified",
          assigned_to: "",
          next_follow_up: "2026-05-22",
          notes: "Interesado en adquirir 3 unidades de alta capacidad para la sede norte."
        },
        {
          id: "p2",
          name: "Dra. Liliana Gómez",
          company: "Clínica de la Sabana",
          email: "lili.gomez@clinicasabana.co",
          phone: "315 789 1234",
          city: "Chía",
          source: "Página Web",
          product_of_interest: "CPAP Autoset AirSense 11",
          budget: 4500000,
          status: "new",
          assigned_to: "",
          next_follow_up: "2026-05-21",
          notes: "Pidió cotización formal de equipo y mascarilla nasal."
        },
        {
          id: "p3",
          name: "Ing. Alejandro Patiño",
          company: "IPS Salud Respirar Colombia",
          email: "apatino@saludrespirar.com.co",
          phone: "300 223 4455",
          city: "Cali",
          source: "Llamada Fría",
          product_of_interest: "BiPAP de Apoyo Tecnológico",
          budget: 28000000,
          status: "proposal",
          assigned_to: "",
          next_follow_up: "2026-05-24",
          notes: "Enviado propuesta por 4 equipos con mantenimiento integral incluido."
        },
        {
          id: "p4",
          name: "Dra. Amalia Beltrán",
          company: "Fundación Neumológica Colombiana",
          email: "amalia.beltran@fnc.org",
          phone: "318 902 4455",
          city: "Bogotá",
          source: "Referenciado",
          product_of_interest: "Concentrador de Oxígeno Portátil SimplyGo",
          budget: 9500000,
          status: "won",
          assigned_to: "",
          next_follow_up: "2026-05-18",
          notes: "Venta cerrada con orden de compra aprobada. Pendiente de facturar."
        },
        {
          id: "p5",
          name: "Dr. Santiago Restrepo",
          company: "Neumocuidado SAS",
          email: "santiago.restrepo@neumocuidado.com",
          phone: "311 889 0291",
          city: "Barranquilla",
          source: "Congreso de Neumología 2024",
          product_of_interest: "CPAP Autoset AirSense 11",
          budget: 11400000,
          status: "new",
          assigned_to: "",
          next_follow_up: "2026-05-25",
          notes: "Busca comprar lote de 3 unidades para renta y seguimiento residencial."
        },
        {
          id: "p6",
          name: "Enfermera Pilar Ruiz",
          company: "Hogar de Paso Santa Clara",
          email: "pilar.ruiz@santaclara.org.co",
          phone: "315 220 9011",
          city: "Bucaramanga",
          source: "Página Web",
          product_of_interest: "Concentrador de Oxígeno EverFlo 5L",
          budget: 4200000,
          status: "contacted",
          assigned_to: "",
          next_follow_up: "2026-05-20",
          notes: "Requiere equipo lo antes posible para paciente geriátrico de alta complejidad."
        },
        {
          id: "p7",
          name: "Dr. Camilo Echeverry",
          company: "Unidad de Sueño del Country",
          email: "camilo.echeverry@clinicaelcountry.com",
          phone: "320 440 2211",
          city: "Bogotá",
          source: "Llamada Fría",
          product_of_interest: "BiPAP AirCurve 10 VAuto Tripack",
          budget: 34500000,
          status: "proposal",
          assigned_to: "",
          next_follow_up: "2026-05-26",
          notes: "Presentada oferta formal por 5 unidades con Kit de filtros de repuesto."
        },
        {
          id: "p8",
          name: "Directora Gloria Alzate",
          company: "IPS Neumovida SAS",
          email: "galzate@neumovida.com",
          phone: "310 500 4010",
          city: "Pereira",
          source: "Referenciado",
          product_of_interest: "Concentrador de Oxígeno Millennium M10 10L",
          budget: 15600000,
          status: "contacted",
          assigned_to: "",
          next_follow_up: "2026-05-23",
          notes: "Solicitó registros INVIMA de equipos estacionarios de alto flujo."
        },
        {
          id: "p9",
          name: "Dr. Ernesto Sabogal",
          company: "Fundación Hospitalaria San Vicente",
          email: "ernesto.sabogal@sanvicente.org",
          phone: "312 900 8110",
          city: "Medellín",
          source: "Página Web",
          product_of_interest: "Máscara Facio-Nasal AirFit F20",
          budget: 6800000,
          status: "won",
          assigned_to: "",
          next_follow_up: "2026-05-19",
          notes: "Aprobada orden de compra por 10 unidades de máscaras de silicona."
        },
        {
          id: "p10",
          name: "Lic. Claudia Rojas",
          company: "IPS Respirar Sano",
          email: "claudia.rojas@respirarsano.co",
          phone: "301 772 1010",
          city: "Cúcuta",
          source: "Referenciado",
          product_of_interest: "Oxímetro de Pulso Digital Nonin Onyx",
          budget: 2900000,
          status: "lost",
          assigned_to: "",
          next_follow_up: "2026-05-15",
          notes: "Decidió comprar oxímetros genéricos rápidos importados de menor durabilidad."
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
      company: "",
      email: "",
      phone: "",
      city: "Bogotá",
      source: "Referenciado",
      product_of_interest: "Concentrador de Oxígeno 5L",
      budget: 5000000,
      status: "new",
      notes: "",
      next_follow_up: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingId(prospect.id);
    setFormData(prospect);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este prospecto?")) return;
    try {
      await api.delete(`/prospects/${id}`);
      setProspects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      // Offline fallback
      setProspects(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Prospect['status']) => {
    const original = prospects.find(p => p.id === id);
    if (!original) return;

    // Optimistic UI update
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));

    try {
      await api.put(`/prospects/${id}`, { ...original, status: newStatus });
    } catch (err) {
      console.warn("DB update failed, kept in local state", err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        budget: Number(formData.budget || 0)
      };

      if (editingId) {
        let result;
        try {
          result = await api.put(`/prospects/${editingId}`, payload);
        } catch (e) {
          result = { ...payload, id: editingId };
        }
        setProspects(prev => prev.map(p => p.id === editingId ? { ...p, ...result } : p));
      } else {
        let result;
        try {
          result = await api.post("/prospects", payload);
        } catch (e) {
          result = { ...payload, id: "local_" + Date.now() };
        }
        setProspects(prev => [result, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = prospects.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.company && p.company.toLowerCase().includes(search.toLowerCase())) || 
    (p.product_of_interest && p.product_of_interest.toLowerCase().includes(search.toLowerCase()))
  );

  // Computations
  const totalLeads = prospects.length;
  const wonLeads = prospects.filter(p => p.status === 'won').length;
  const proposalLeads = prospects.filter(p => p.status === 'proposal').length;
  const pipelineValue = prospects
    .filter(p => p.status !== 'won' && p.status !== 'lost')
    .reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Embudo de Ventas & Prospectos</h1>
          <p className="text-slate-500 text-sm">Monitorea y promueve tus leads de equipos médicos respiratorios.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button 
              onClick={() => setActiveView('pipeline')}
              className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm", activeView === 'pipeline' ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-500")}
            >
              <KanbanSquare size={16} /> Pipeline
            </button>
            <button 
              onClick={() => setActiveView('table')}
              className={cn("p-2 rounded-lg transition-colors flex items-center gap-2 text-sm", activeView === 'table' ? "bg-white text-blue-600 font-bold shadow-xs" : "text-slate-500")}
            >
              <ListIcon size={16} /> Tabla
            </button>
          </div>
          <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} /> Nuevo Prospecto
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Target size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Leads</p>
            <p className="text-xl font-extrabold text-slate-800">{totalLeads}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Briefcase size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">En Propuesta</p>
            <p className="text-xl font-extrabold text-slate-800">{proposalLeads}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Cerrados (Won)</p>
            <p className="text-xl font-extrabold text-slate-800">{wonLeads}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
            <DollarSign size={22} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Valor Embudo</p>
            <p className="text-xl font-extrabold text-slate-800">{formatCurrency(pipelineValue)}</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar prospectos por nombre, clínica, producto..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-100 bg-slate-50 rounded-xl text-sm focus:bg-white focus:border-blue-200 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Pipeline View */}
      {activeView === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {SECTIONS.map((section) => {
            const sectionLeads = filtered.filter(p => p.status === section.status);
            const sectionTotalBudget = sectionLeads.reduce((acc, current) => acc + (current.budget || 0), 0);

            return (
              <div key={section.status} className="bg-slate-50/70 p-3 rounded-2xl border border-slate-100 min-w-[200px] flex flex-col h-[700px]">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("px-3 py-1 font-bold text-xs uppercase rounded-full border", section.color)}>
                    {section.label}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-200/50 h-5 w-5 rounded-full flex items-center justify-center">
                    {sectionLeads.length}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 mb-4">{formatCurrency(sectionTotalBudget)}</p>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                  {sectionLeads.length === 0 ? (
                    <div className="h-24 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 select-none">
                      Vacío
                    </div>
                  ) : (
                    sectionLeads.map((p) => (
                      <motion.div 
                        key={p.id}
                        layoutId={p.id}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs hover:shadow-md cursor-pointer group hover:border-slate-200 transition-all flex flex-col gap-2 relative"
                        onClick={() => handleEdit(p)}
                      >
                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{p.name}</h4>
                        {p.company && (
                          <p className="text-xs text-slate-500 font-semibold truncate flex items-center gap-1">
                            <Users size={12} className="text-slate-400" />
                            {p.company}
                          </p>
                        )}
                        <p className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md self-start">
                          {formatCurrency(p.budget || 0)}
                        </p>
                        <div className="border-t border-slate-50 pt-2 flex items-center justify-between mt-1 grid-cols-2">
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[55%] flex items-center gap-1">
                            <MapPin size={10} />
                            {p.city}
                          </p>
                          <select
                            onClick={(e) => e.stopPropagation()}
                            value={p.status}
                            onChange={(e) => handleUpdateStatus(p.id, e.target.value as Prospect['status'])}
                            className="text-[10px] bg-slate-50 border-slate-200 text-slate-600 rounded p-1 outline-hidden"
                          >
                            {SECTIONS.map(s => (
                              <option key={s.status} value={s.status}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {activeView === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Clínica/IPS</th>
                  <th className="px-6 py-4">Equipo Interés</th>
                  <th className="px-6 py-4">Presupuesto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Siguiente Seguimiento</th>
                  <th className="px-6 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const sect = SECTIONS.find(s => s.status === p.status);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors text-sm">
                      <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{p.company || 'Personal'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{p.product_of_interest || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{formatCurrency(p.budget || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2.5 py-1 text-xs font-bold rounded-full border uppercase tracking-wider", sect?.color)}>
                          {sect?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Calendar size={12} />
                        {p.next_follow_up || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail/CRUD Modal */}
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
                  <h2 className="text-xl font-bold text-slate-800">{editingId ? "Editar Prospecto" : "Nuevo Prospecto Comercial"}</h2>
                  <p className="text-xs text-slate-400 font-medium">Registro de prospecto IPS, clínica o médico especialista.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo del Contacto</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej. Dr. Mario Alzate"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa / IPS / Clínica</label>
                    <input 
                      type="text"
                      value={formData.company || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="Ej. IPS RespiraSano SAS"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo Electrónico</label>
                    <input 
                      type="email" 
                      value={formData.email || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="ejemplo@ips.com"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número de Celular</label>
                    <input 
                      type="text" 
                      value={formData.phone || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="310 123 4567"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Origen de Lead</label>
                    <select
                      value={formData.source || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      <option value="Congreso">Congreso Médico</option>
                      <option value="Página Web">Página Web / Orgánico</option>
                      <option value="Referenciado">Referenciado de IPS</option>
                      <option value="Llamada Fría">Llamada/Contacto Frío</option>
                      <option value="Feria Salud">Feria de la Salud</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado en Embudo</label>
                    <select
                      value={formData.status || "new"}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Prospect['status'] }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    >
                      {SECTIONS.map(s => (
                        <option key={s.status} value={s.status}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Equipo / Solución de Interés</label>
                    <input 
                      type="text" 
                      value={formData.product_of_interest || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, product_of_interest: e.target.value }))}
                      placeholder="Ej. Concentrador EverFlo 5L"
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto Estimado (COP)</label>
                    <input 
                      type="number" 
                      value={formData.budget || 0}
                      onChange={(e) => setFormData(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Siguiente Seguimiento</label>
                  <input 
                    type="date" 
                    value={formData.next_follow_up?.split('T')[0] || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_follow_up: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observaciones / Historial</label>
                  <textarea 
                    value={formData.notes || ""}
                    rows={3}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Detalles sobre las patologías respiratorias que atiende, marcas que prefiere..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-hidden focus:border-blue-500"
                  />
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
                    {editingId ? "Actualizar" : "Crear Prospecto"}
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
